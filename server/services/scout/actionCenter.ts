import { discoveryEngine } from './discoveryEngine.js';
import { intelligenceEngine } from './intelligenceEngine.js';
import { telegramScoutService } from './telegramScoutService.js';
import { dbService } from '../dbService.js';
import { Opportunity } from '../../../src/types/index.js';
import { RawOpportunityCandidate, ScoutRunResult } from './types.js';

export class ActionCenter {
  /**
   * Executes a complete discovery cycle:
   * 1. Discovers raw candidates across configured target niches & keywords.
   * 2. Runs evidence & provenance verification via IntelligenceEngine.
   * 3. Persists new opportunities to the database with DRAFTED status.
   * 4. Dispatches dossiers to Telegram for human review and approval.
   */
  public async runDiscoveryCycle(): Promise<ScoutRunResult> {
    const runId = `run_${Date.now()}`;
    const timestamp = new Date().toISOString();
    const errors: string[] = [];

    const settings = await dbService.getScoutSettings();
    const candidates = await discoveryEngine.discoverCandidates(settings.targetNiches, settings.intentKeywords);

    let opportunitiesCreated = 0;
    let opportunitiesMerged = 0;
    let telegramAlertsDispatched = 0;

    for (const candidate of candidates) {
      try {
        const oppFingerprint = intelligenceEngine.calculateOpportunityFingerprint(candidate.sourcePlatform, candidate.sourceUrl);
        const entFingerprint = intelligenceEngine.calculateEntityFingerprint(candidate.prospectName, candidate.businessName, candidate.websiteUrl);

        // 1. Direct Signal Deduplication (Source-level) via separate signals table & opportunity_fingerprint column
        const existingSignal = await dbService.getOpportunitySignalByFingerprint(oppFingerprint);
        const existingOppByFingerprint = await dbService.getOpportunityByOpportunityFingerprint(oppFingerprint);
        if (existingSignal || existingOppByFingerprint) {
          console.log(`[ActionCenter] Skipping direct duplicate signal for fingerprint: ${oppFingerprint}`);
          continue;
        }

        // 2. Entity Deduplication (Entity-level)
        const existingEntity = await dbService.getOpportunityByEntityFingerprint(entFingerprint);

        // 3. Process signal and calculate stats/observations
        const opportunity = await intelligenceEngine.analyzeAndVerify(candidate);

        let saved: Opportunity;

        if (existingEntity) {
          console.log(`[ActionCenter] Entity duplicate found for ${candidate.businessName} (${entFingerprint}). Merging signals.`);
          saved = await dbService.mergeOpportunitySignal(
            existingEntity.id,
            candidate,
            opportunity.evidence,
            opportunity.publicContacts,
            opportunity.verificationStatus,
            opportunity.confidenceScores,
            opportunity.isVerifiedOpportunity
          );
          opportunitiesMerged++;
        } else {
          // Store new unique entity
          saved = await dbService.createOpportunity(opportunity);
          opportunitiesCreated++;
        }

        // Always register the signal record for proper source-level retention & future deduplication
        await dbService.createOpportunitySignal({
          id: `sig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          opportunityId: saved.id,
          sourcePlatform: candidate.sourcePlatform,
          sourceUrl: candidate.sourceUrl,
          sourceFingerprint: oppFingerprint,
          rawExcerpt: candidate.sourcePostExcerpt || undefined,
        });

        // 4. Dispatch alert to Telegram
        const token = settings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
        const chatId = settings.telegramChatId || process.env.TELEGRAM_CHAT_ID;
        const isEnabled = settings.telegramEnabled !== false;

        if (isEnabled && token && chatId) {
          const alertResult = await telegramScoutService.sendOpportunityAlert(saved, settings);
          if (alertResult.success) {
            telegramAlertsDispatched++;
          } else if (alertResult.error) {
            console.warn(`[ActionCenter] Telegram alert notice for ${saved.id}: ${alertResult.error}`);
            errors.push(`Telegram alert error for ${saved.id}: ${alertResult.error}`);
          }
        }
      } catch (err: any) {
        errors.push(`Processing candidate ${candidate.title}: ${err?.message || err}`);
      }
    }

    // Update settings last run timestamp & counters
    await dbService.updateScoutSettings({
      lastRunAt: timestamp,
      totalScoutedCount: settings.totalScoutedCount + opportunitiesCreated,
    });

    return {
      runId,
      timestamp,
      candidatesDiscovered: candidates.length,
      opportunitiesCreated,
      telegramAlertsDispatched,
      skippedDuplicates: candidates.length - (opportunitiesCreated + opportunitiesMerged),
      errors,
    };
  }

  /**
   * Conducts an on-demand audit for any given URL (triggered via Telegram /audit or Admin UI).
   */
  public async conductManualAudit(websiteUrl: string, prospectName = 'Store Founder'): Promise<Opportunity> {
    let cleanUrl = websiteUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    let domain = cleanUrl;
    try {
      domain = new URL(cleanUrl).hostname.replace(/^www\./, '');
    } catch {
      // fallback
    }

    const businessName = domain.split('.')[0].toUpperCase() + ' Direct';

    const candidate: RawOpportunityCandidate = {
      title: `Live Website Audit: ${domain}`,
      prospectName,
      businessName,
      websiteUrl: cleanUrl,
      niche: 'E-commerce Brands',
      sourcePlatform: 'manual_audit',
      sourceUrl: cleanUrl,
      sourcePostExcerpt: `Operator triggered live on-demand conversion and mobile performance audit for ${cleanUrl}`,
      detectedPainPoints: [
        'Live conversion and checkout audit requested by operator',
        'Mobile responsiveness, payload weight, and checkout funnel assessment',
      ],
      publicFoundContacts: [],
      timestamp: new Date().toISOString(),
    };

    const entFingerprint = intelligenceEngine.calculateEntityFingerprint(prospectName, businessName, cleanUrl);
    const existingEntity = await dbService.getOpportunityByEntityFingerprint(entFingerprint);

    const opportunity = await intelligenceEngine.analyzeAndVerify(candidate);
    let saved: Opportunity;

    if (existingEntity) {
      console.log(`[ActionCenter] Manual audit matched existing entity fingerprint: ${entFingerprint}. Merging.`);
      saved = await dbService.mergeOpportunitySignal(
        existingEntity.id,
        candidate,
        opportunity.evidence,
        opportunity.publicContacts,
        opportunity.verificationStatus,
        opportunity.confidenceScores,
        opportunity.isVerifiedOpportunity
      );
    } else {
      saved = await dbService.createOpportunity(opportunity);
    }

    // Always register the manual audit source signal
    const oppFingerprint = intelligenceEngine.calculateOpportunityFingerprint(candidate.sourcePlatform, candidate.sourceUrl);
    await dbService.createOpportunitySignal({
      id: `sig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      opportunityId: saved.id,
      sourcePlatform: candidate.sourcePlatform,
      sourceUrl: candidate.sourceUrl,
      sourceFingerprint: oppFingerprint,
      rawExcerpt: candidate.sourcePostExcerpt || undefined,
    });

    return saved;
  }

  /**
   * Approves an opportunity for outreach.
   * Notice: Human-in-the-loop approval boundary — approves the draft, does NOT auto-send.
   */
  public async approveOpportunity(id: string): Promise<Opportunity> {
    const opp = await dbService.getOpportunityById(id);
    if (!opp) {
      throw new Error(`Opportunity #${id} not found`);
    }
    if (!opp.isVerifiedOpportunity) {
      throw new Error(`STRICT GATE BLOCKED: Opportunity #${id} did not pass the Lead Intelligence Gate and cannot be approved.`);
    }
    return dbService.updateOpportunityStatus(id, 'APPROVED');
  }

  /**
   * Rejects an opportunity.
   */
  public async rejectOpportunity(id: string): Promise<Opportunity> {
    return dbService.updateOpportunityStatus(id, 'REJECTED');
  }

  /**
   * Marks an approved opportunity as SENT after human operator dispatches the message.
   */
  public async markSent(id: string): Promise<Opportunity> {
    return dbService.updateOpportunityStatus(id, 'SENT');
  }

  /**
   * Refines the outreach draft using the intelligence engine.
   */
  public async refineOpportunity(id: string, feedback: string): Promise<Opportunity> {
    const opp = await dbService.getOpportunityById(id);
    if (!opp) {
      throw new Error(`Opportunity #${id} not found`);
    }

    const refinedDraft = await intelligenceEngine.refineOutreachDraft(opp, feedback);
    return dbService.updateOpportunityRefinedDraft(id, refinedDraft, feedback);
  }
}

export const actionCenter = new ActionCenter();
