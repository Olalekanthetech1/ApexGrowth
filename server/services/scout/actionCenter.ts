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
    let telegramAlertsDispatched = 0;

    for (const candidate of candidates) {
      try {
        // 1. Analyze and verify evidence & contact provenance
        const opportunity = await intelligenceEngine.analyzeAndVerify(candidate);

        // 2. Persist to database
        const saved = await dbService.createOpportunity(opportunity);
        opportunitiesCreated++;

        // 3. Dispatch to Telegram interface if credentials exist
        const token = settings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
        const chatId = settings.telegramChatId || process.env.TELEGRAM_CHAT_ID;
        const isEnabled = settings.telegramEnabled !== false; // deliver by default if token/chatId exist

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
      skippedDuplicates: 0,
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

    const opportunity = await intelligenceEngine.analyzeAndVerify(candidate);
    const saved = await dbService.createOpportunity(opportunity);

    return saved;
  }

  /**
   * Approves an opportunity for outreach.
   * Notice: Human-in-the-loop approval boundary — approves the draft, does NOT auto-send.
   */
  public async approveOpportunity(id: string): Promise<Opportunity> {
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
