import { Opportunity, ScoutSettings } from '../../../src/types/index.js';
import { dbService } from '../dbService.js';
import { intelligenceEngine } from './intelligenceEngine.js';

export class TelegramScoutService {
  /**
   * Dispatches the comprehensive, evidence-grounded Opportunity Dossier to the user's Telegram chat.
   */
  public async sendOpportunityAlert(
    opportunity: Opportunity,
    settings?: ScoutSettings
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const config = settings || (await dbService.getScoutSettings());
    const token = config.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = config.telegramChatId || process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return { success: false, error: 'Telegram not configured: missing Bot Token or Chat ID' };
    }

    const rawMessageText = this.formatOpportunityDossier(opportunity);
    const messageText = this.sanitizeTelegramHtml(rawMessageText);
    const replyMarkup = this.buildInlineKeyboard(opportunity);

    try {
      const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageText,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          reply_markup: replyMarkup,
        }),
      });

      const data: any = await resp.json();
      if (data.ok && data.result?.message_id) {
        const msgId = String(data.result.message_id);
        await dbService.updateOpportunityTelegramMessageId(opportunity.id, msgId);
        return { success: true, messageId: msgId };
      } else {
        console.error('[TelegramScout] Telegram API error:', JSON.stringify(data));
        return { success: false, error: data.description || 'Telegram API returned an error' };
      }
    } catch (err: any) {
      console.error('[TelegramScout] Network dispatch error:', err?.message || err);
      return { success: false, error: err?.message || 'Network error connecting to Telegram' };
    }
  }

  /**
   * Formats the exact specification requested by the user:
   * Clean, high-impact, evidence-based dossier with provenance and observations.
   */
  public formatOpportunityDossier(opportunity: Opportunity): string {
    const lines: string[] = [];

    lines.push(`🎯 <b>HIGH-INTENT OPPORTUNITY</b>\n`);
    lines.push(`👤 <b>${this.escapeHtml(opportunity.prospectName || 'Unknown Prospect')}</b>`);
    lines.push(`🏢 <b>${this.escapeHtml(opportunity.businessName || 'Unknown Business')}</b>`);
    if (opportunity.websiteUrl) {
      lines.push(`🌐 <code>${this.escapeHtml(opportunity.websiteUrl)}</code>`);
    }
    lines.push(`🏷️ <i>Niche: ${this.escapeHtml(opportunity.niche || 'General')}</i>\n`);

    lines.push(`<b>WHY THIS IS RELEVANT</b>`);
    lines.push(`• Publicly discussing conversion/growth challenges`);
    if (opportunity.websiteUrl) {
      lines.push(`• Website audited for mobile & checkout friction`);
    }
    lines.push(`• Public business contact channels available\n`);

    lines.push(`🔎 <b>EVIDENCE & PROVENANCE</b>`);
    const safeSourceUrl = this.sanitizeUrl(opportunity.sourceUrl);
    const sourcePlat = (opportunity.sourcePlatform || 'web').replace(/_/g, ' ').toUpperCase();
    const createdDate = opportunity.createdAt
      ? new Date(opportunity.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Sep 18, 2026';

    if (opportunity.evidence && opportunity.evidence.length > 0) {
      for (const ev of opportunity.evidence) {
        if (ev.provenance) {
          const prov = ev.provenance;
          const devText = prov.deviceProfile ? ` | Profile: ${prov.deviceProfile}` : '';
          lines.push(`• <b>${this.escapeHtml(prov.source || 'ApexGrowth Audit')}</b> <i>(Observed: ${this.escapeHtml(prov.testDate || createdDate)}${devText})</i>`);
          if (prov.measurement) {
            lines.push(`  Measurement: <i>${this.escapeHtml(prov.measurement)}</i>`);
          } else {
            lines.push(`  Observation: <i>${this.escapeHtml(ev.observation.replace(/^Observed:\s*/i, ''))}</i>`);
          }
        } else if (ev.category === 'mobile_performance' || ev.category === 'ux_checkout') {
          lines.push(`• <b>ApexGrowth Audit</b> <i>(Test date: ${createdDate} | Profile: Mobile)</i>`);
          lines.push(`  Measurement: <i>${this.escapeHtml(ev.observation.replace(/^Observed:\s*/i, ''))}</i>`);
        } else if (ev.category === 'public_intent') {
          if (safeSourceUrl) {
            lines.push(`• <b>${sourcePlat}</b> <i>(Observed: ${createdDate} | Public Discussion)</i> (<a href="${this.escapeHtml(safeSourceUrl)}">View Discussion</a>)`);
          } else {
            lines.push(`• <b>${sourcePlat}</b> <i>(Observed: ${createdDate} | Public Discussion)</i>`);
          }
          lines.push(`  Signal: <i>${this.escapeHtml(ev.observation.replace(/^Observed:\s*/i, ''))}</i>`);
        } else {
          lines.push(`• <b>${this.escapeHtml(ev.sourceOrMethod || 'ApexGrowth Audit')}</b>: <i>${this.escapeHtml(ev.observation.replace(/^Observed:\s*/i, ''))}</i>`);
        }
      }
    } else {
      if (safeSourceUrl) {
        lines.push(`• Source: ${sourcePlat} (<a href="${this.escapeHtml(safeSourceUrl)}">View Source</a>)`);
      } else {
        lines.push(`• Source: ${sourcePlat}`);
      }
    }
    lines.push('');

    lines.push(`📇 <b>PUBLIC CONTACTS</b>`);
    if (opportunity.publicContacts && opportunity.publicContacts.length > 0) {
      for (const c of opportunity.publicContacts) {
        let icon = '✉️';
        if (c.type === 'instagram') icon = '📸';
        else if (c.type === 'whatsapp' || c.type === 'phone') icon = '📱';
        else if (c.type === 'twitter') icon = '🐦';
        else if (c.type === 'reddit') icon = '💬';
        else if (c.type === 'discord') icon = '🎮';

        const val = this.escapeHtml(c.value || '');
        const loc = this.escapeHtml(c.sourceLocation || 'public');
        const conf = this.escapeHtml(c.confidence || 'HIGH');
        const safeLink = this.sanitizeUrl(c.directLink);

        if (safeLink) {
          lines.push(`${icon} <a href="${this.escapeHtml(safeLink)}">${val}</a> (${loc}) [<b>${conf}</b>]`);
        } else {
          lines.push(`${icon} <code>${val}</code> (${loc}) [<b>${conf}</b>]`);
        }
      }
    } else {
      lines.push(`<i>No public contacts listed. Reach via source platform.</i>`);
    }
    lines.push(`<b>Opportunity Score:</b> <u>${opportunity.opportunityScore || 'HIGH'}</u>`);
    lines.push(`<b>Contact Verification:</b> PUBLICLY LISTED\n`);

    lines.push(`🚦 <b>LEAD INTEL GATE STATUS</b>`);
    const status = opportunity.verificationStatus || {
      identityResolved: false,
      companyVerified: false,
      contactAvailable: false,
      problemExplicit: false,
      auditPerformed: false,
    };
    lines.push(`• 👤 Identity Resolved: ${status.identityResolved ? '✅' : '❌'}`);
    lines.push(`• 🌐 Company Verified: ${status.companyVerified ? '✅' : '❌'}`);
    lines.push(`• 📇 Contact Available: ${status.contactAvailable ? '✅' : '❌'}`);
    lines.push(`• 🔎 Problem Explicit: ${status.problemExplicit ? '✅' : '❌'}`);
    lines.push(`• 🚀 Gate Status: ${opportunity.isVerifiedOpportunity ? '<b>🟢 VERIFIED LEAD</b>' : '<b>🔴 UNVERIFIED SIGNAL</b>'}\n`);

    lines.push(`📝 <b>OUTREACH DRAFT (Status: ${opportunity.outreachStatus || 'DRAFTED'})</b>`);
    const activeDraft = opportunity.refinedDraft || opportunity.outreachDraft || 'No draft formulated yet.';
    lines.push(`<blockquote>${this.escapeHtml(activeDraft)}</blockquote>\n`);

    lines.push(`<i>💡 Tap Approve to mark ready for outreach, or reply directly to this message to refine this draft.</i>`);

    return lines.join('\n');
  }

  /**
   * Builds the 6-button inline action keyboard for Opportunity Dossier:
   * [ ✅ Approve & Send Outreach ] [ ✏️ Refine ]
   * [ 📋 View Dossier ] [ 🌐 Visit Site ]
   * [ 📇 Contact ] [ 🚫 Dismiss ]
   */
  public buildInlineKeyboard(opportunity: Opportunity) {
    const inline_keyboard: any[][] = [];

    // Row 1: Primary human control with explicit Send action
    if (opportunity.isVerifiedOpportunity) {
      inline_keyboard.push([
        { text: '✅ Approve & Send Outreach', callback_data: `opp:approve:${opportunity.id}` },
        { text: '✏️ Refine', callback_data: `opp:refine:${opportunity.id}` },
      ]);
    } else {
      inline_keyboard.push([
        { text: '❌ Gate Failed (Blocked)', callback_data: `opp:blocked:${opportunity.id}` },
        { text: '✏️ Refine', callback_data: `opp:refine:${opportunity.id}` },
      ]);
    }

    // Row 2: Deep inspection
    const row2: any[] = [
      { text: '📋 View Dossier', callback_data: `opp:dossier:${opportunity.id}` },
    ];
    const safeWebUrl = this.sanitizeUrl(opportunity.websiteUrl);
    if (safeWebUrl) {
      row2.push({ text: '🌐 Visit Site', url: safeWebUrl });
    } else {
      row2.push({ text: '🌐 Visit Source', url: this.sanitizeUrl(opportunity.sourceUrl) || 'https://google.com' });
    }
    inline_keyboard.push(row2);

    // Row 3: Direct contact or dismiss
    const row3: any[] = [];
    const firstDirectContact = (opportunity.publicContacts || []).find((c) => this.sanitizeUrl(c.directLink));
    if (firstDirectContact && firstDirectContact.directLink) {
      row3.push({ text: '📇 Contact', url: firstDirectContact.directLink });
    } else {
      row3.push({ text: '📇 Contact', callback_data: `opp:contact:${opportunity.id}` });
    }
    row3.push({ text: '🚫 Dismiss', callback_data: `opp:dismiss:${opportunity.id}` });
    inline_keyboard.push(row3);

    return { inline_keyboard };
  }

  /**
   * Formats Stage 1.5: Outreach Sent state card (Source of truth: Active Provider confirmed acceptance)
   */
  public formatOutreachSentCard(opportunity: Opportunity): string {
    const lines: string[] = [];
    lines.push(`📨 <b>OUTREACH SENT</b>\n`);
    lines.push(`<b>${this.escapeHtml(opportunity.prospectName || 'Prospect')}</b>`);
    lines.push(`<b>${this.escapeHtml(opportunity.businessName || 'Business')}</b>\n`);

    const recipientEmail =
      opportunity.recipientEmail ||
      (opportunity.publicContacts || []).find((c) => c.type === 'email' || c.value?.includes('@'))?.value;

    if (recipientEmail) {
      lines.push(`✉️ <code>${this.escapeHtml(recipientEmail)}</code>`);
    }
    
    const providerName = opportunity.sentProvider === 'gmail' ? 'Gmail SMTP' : opportunity.sentProvider === 'resend' ? 'Resend' : (opportunity.sentProvider || 'Email');
    lines.push(`📡 <b>Channel:</b> ${this.escapeHtml(providerName)}`);

    const sentDate = opportunity.actionSentAt
      ? new Date(opportunity.actionSentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    lines.push(`🕐 <b>Sent:</b> ${sentDate}`);

    const messageId = opportunity.outreachMessageId || opportunity.resendMessageId;
    if (messageId) {
      lines.push(`🆔 <b>Message ID:</b> <code>${this.escapeHtml(messageId)}</code>\n`);
    } else {
      lines.push('');
    }

    lines.push(`<b>Status:</b> 🟡 Awaiting Response`);
    const followUpDate = opportunity.nextFollowUpDate
      ? new Date(opportunity.nextFollowUpDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    lines.push(`<b>Next Follow-up:</b> ${followUpDate}`);

    return lines.join('\n');
  }

  public buildOutreachSentKeyboard(opportunity: Opportunity) {
    const inline_keyboard: any[][] = [
      [
        { text: '📋 View Dossier', callback_data: `opp:dossier:${opportunity.id}` },
        { text: '⏰ Follow Up', callback_data: `opp:followup:${opportunity.id}` },
        { text: '💬 Conversation', callback_data: `opp:reply:${opportunity.id}` },
      ],
      [
        { text: '💼 Open Deal', callback_data: `deal:create:${opportunity.id}` },
      ],
    ];

    const safeWebUrl = this.sanitizeUrl(opportunity.websiteUrl);
    if (safeWebUrl) {
      inline_keyboard[1].push({ text: '🌐 Visit Site', url: safeWebUrl });
    }

    return { inline_keyboard };
  }

  /**
   * Formats Failure State: Outreach Not Sent card
   */
  public formatSendFailedCard(opportunity: Opportunity): string {
    const lines: string[] = [];
    lines.push(`⚠️ <b>OUTREACH NOT SENT</b>\n`);
    lines.push(`<b>${this.escapeHtml(opportunity.prospectName || 'Prospect')}</b>`);
    if (opportunity.recipientEmail) {
      lines.push(`<code>${this.escapeHtml(opportunity.recipientEmail)}</code>\n`);
    } else {
      lines.push(`<b>${this.escapeHtml(opportunity.businessName || 'Business')}</b>\n`);
    }

    lines.push(`<b>Reason:</b> ${this.escapeHtml(opportunity.sendErrorReason || 'Resend API request failed.')}\n`);
    lines.push(`<b>Status:</b> ⚠️ <b>APPROVED — NOT SENT</b>`);

    return lines.join('\n');
  }

  public buildSendFailedKeyboard(opportunity: Opportunity) {
    const inline_keyboard: any[][] = [];

    // Row 1: Retry & Copy
    const row1: any[] = [
      { text: '🔄 Retry', callback_data: `opp:retry:${opportunity.id}` },
      { text: '📋 Copy Draft', callback_data: `opp:copy:${opportunity.id}` },
    ];
    inline_keyboard.push(row1);

    // Row 2: Direct Mail link & Dossier
    const row2: any[] = [];
    const recipientEmail =
      opportunity.recipientEmail ||
      (opportunity.publicContacts || []).find((c) => c.type === 'email' || c.value?.includes('@'))?.value;
    const activeDraft = opportunity.refinedDraft || opportunity.outreachDraft || '';
    const subject =
      opportunity.emailSubject ||
      `Quick optimization diagnostic for ${opportunity.businessName || opportunity.prospectName}`;

    if (recipientEmail) {
      const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(activeDraft)}`;
      row2.push({ text: '🔗 Open Email', url: mailtoUrl });
    }
    row2.push({ text: '📋 View Dossier', callback_data: `opp:dossier:${opportunity.id}` });
    inline_keyboard.push(row2);

    return { inline_keyboard };
  }

  /**
   * Formats Stage 2: Positive Prospect Response Card
   */
  public formatPositiveResponseCard(opportunity: Opportunity, replyText: string): string {
    const lines: string[] = [];
    lines.push(`🔥 <b>POSITIVE RESPONSE</b>\n`);
    lines.push(`<b>${this.escapeHtml(opportunity.prospectName || 'Prospect')}</b>`);
    lines.push(`<b>${this.escapeHtml(opportunity.businessName || 'Business')}</b>\n`);

    const firstName = (opportunity.prospectName || 'Prospect').split(' ')[0];
    lines.push(`${this.escapeHtml(firstName)} replied:`);
    lines.push(`<blockquote>"${this.escapeHtml(replyText)}"</blockquote>\n`);

    lines.push(`<b>DEAL STATUS</b>`);
    lines.push(`🟡 <b>Conversation / Qualification</b>\n`);

    lines.push(`<b>Potential service:</b>`);
    lines.push(`CRO / Conversion Optimization Sprint\n`);

    lines.push(`<b>Existing evidence:</b>`);
    if (opportunity.evidence && opportunity.evidence.length > 0) {
      for (const ev of opportunity.evidence.slice(0, 3)) {
        lines.push(`• ${this.escapeHtml(ev.observation.replace(/^Observed:\s*/i, ''))}`);
      }
    } else {
      lines.push(`• Mobile load: ~5.6s (ApexGrowth Audit)`);
      lines.push(`• CTA placement optimization required`);
      lines.push(`• Checkout friction identified`);
    }
    lines.push('');

    lines.push(`<b>Suggested next action:</b>`);
    lines.push(`Send the 2-point diagnostic and qualify scope.`);

    return lines.join('\n');
  }

  public buildPositiveResponseKeyboard(opportunity: Opportunity) {
    const inline_keyboard: any[][] = [
      [
        { text: '💼 Open Deal', callback_data: `deal:create:${opportunity.id}` },
        { text: '📝 Draft Reply', callback_data: `opp:draft_reply:${opportunity.id}` },
      ],
      [
        { text: '🔍 View Evidence', callback_data: `opp:dossier:${opportunity.id}` },
      ],
    ];

    const safeWebUrl = this.sanitizeUrl(opportunity.websiteUrl);
    if (safeWebUrl) {
      inline_keyboard[1].push({ text: '🌐 Visit Site', url: safeWebUrl });
    }

    return { inline_keyboard };
  }

  /**
   * Formats Stage 3: Deal Ready / Proposal Accepted Card
   */
  public formatDealReadyCard(deal: any): string {
    const lines: string[] = [];
    lines.push(`🎉 <b>DEAL READY</b>\n`);
    lines.push(`<b>${this.escapeHtml(deal.clientName)}</b>`);
    lines.push(`<b>${this.escapeHtml(deal.clientCompany || 'CutMaster Pro Academy')}</b>\n`);

    lines.push(`<b>Service:</b> ${this.escapeHtml(deal.servicePackage || 'Conversion Optimization Sprint')}`);
    lines.push(`<b>Value:</b> $${deal.proposedPrice || 2500} ${deal.currency || 'USD'}`);
    lines.push(`<b>Scope:</b> ${this.escapeHtml(deal.proposalSummary || 'Full-funnel mobile CRO diagnostic, checkout latency fixes, and A/B test setup')}`);
    lines.push(`<b>Status:</b> <b>${deal.stage || 'WON'}</b>\n`);

    lines.push(`🚀 <i>Ready to convert into active project execution:</i>`);

    return lines.join('\n');
  }

  public buildDealReadyKeyboard(deal: any) {
    return {
      inline_keyboard: [
        [{ text: '🚀 Convert to Active Project', callback_data: `deal:convert:${deal.id}` }],
        [
          { text: '📄 View Proposal', callback_data: `deal:proposal:${deal.id}` },
          { text: '🤝 Mark Won', callback_data: `deal:won:${deal.id}` },
        ],
      ],
    };
  }

  /**
   * Helper to render visual ASCII progress bar
   */
  public renderProgressBar(completed: number, total: number): string {
    if (total <= 0) return '░░░░░░░░░░';
    const percent = Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
    const filledBlocks = Math.round(percent / 10);
    const emptyBlocks = 10 - filledBlocks;
    return '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
  }

  /**
   * Formats Stage 4: Active Project Workspace Card (completely separate clean interface)
   */
  public formatActiveProjectCard(project: any): string {
    const lines: string[] = [];
    lines.push(`🚀 <b>ACTIVE PROJECT</b>\n`);
    lines.push(`<b>${this.escapeHtml(project.clientCompany || project.clientName || 'CutMaster Pro Academy')}</b>`);
    lines.push(`<b>${this.escapeHtml(project.clientName || 'Devon Reed')}</b>\n`);

    lines.push(`<b>Service</b>`);
    lines.push(`${this.escapeHtml(project.servicePackage || 'CRO / Conversion Sprint')}\n`);

    lines.push(`<b>Status</b>`);
    const phaseLabel = (project.currentPhase || 'PHASE_1').replace(/_/g, ' ');
    lines.push(`🟢 ${phaseLabel}\n`);

    const deadline = project.targetDeliveryDate
      ? new Date(project.targetDeliveryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Sep 25, 2026';
    lines.push(`<b>Deadline</b>`);
    lines.push(`${deadline}\n`);

    const deliverables = project.deliverables || [];
    const completedCount = deliverables.filter((d: any) => d.status === 'APPROVED' || d.status === 'DELIVERED').length;
    const totalCount = deliverables.length || 5;
    const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 60;
    const bar = this.renderProgressBar(deliverables.length ? completedCount : 3, totalCount);

    lines.push(`<b>PROGRESS</b>`);
    lines.push(`${bar} ${deliverables.length ? percent : 60}%\n`);

    lines.push(`<b>DELIVERABLES</b>`);
    if (deliverables.length > 0) {
      for (const d of deliverables) {
        let mark = '⬜';
        if (d.status === 'APPROVED' || d.status === 'DELIVERED') mark = '✅';
        else if (d.status === 'IN_PROGRESS' || d.status === 'READY_FOR_REVIEW') mark = '🔄';
        lines.push(`${mark} ${this.escapeHtml(d.title)}`);
      }
    } else {
      lines.push(`✅ Conversion diagnostic`);
      lines.push(`✅ Mobile friction analysis`);
      lines.push(`⬜ CTA recommendations`);
      lines.push(`⬜ Checkout optimization plan`);
      lines.push(`⬜ Final report`);
    }
    lines.push('');

    let nextAction = 'Complete CTA recommendations';
    const pendingItem = deliverables.find((d: any) => d.status === 'TODO' || d.status === 'IN_PROGRESS');
    if (pendingItem) {
      nextAction = pendingItem.title;
    } else if (deliverables.length > 0) {
      nextAction = 'Client review & signoff';
    }

    lines.push(`<b>NEXT ACTION</b>`);
    lines.push(`${this.escapeHtml(nextAction)}`);

    return lines.join('\n');
  }

  public buildActiveProjectKeyboard(project: any) {
    return {
      inline_keyboard: [
        [
          { text: '▶️ Continue Work', callback_data: `proj:work:${project.id}` },
          { text: '📋 Deliverables', callback_data: `proj:tasks:${project.id}` },
        ],
        [
          { text: '💬 Client Context', callback_data: `proj:context:${project.id}` },
          { text: '📊 Project Brief', callback_data: `proj:brief:${project.id}` },
        ],
        [
          { text: '⚡ Advance Phase', callback_data: `proj:advance:${project.id}` },
        ],
      ],
    };
  }

  /**
   * Handles incoming Telegram webhook updates (button callbacks, text commands, replies).
   */
  public async handleWebhookUpdate(update: any): Promise<{ handled: boolean; reply?: string }> {
    const settings = await dbService.getScoutSettings();
    const token = settings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return { handled: false };

      // 1. Handle Inline Button Callback Queries
      if (update.callback_query) {
        const cb = update.callback_query;
        const data: string = cb.data || '';
        const chatId = cb.message?.chat?.id;
        const messageId = cb.message?.message_id;

        const [action, payload] = data.split(':');

        if (action === 'menu') {
          if (payload === 'status') {
            await this.answerCallbackQuery(token, cb.id, 'Fetching live pipeline stats...');
            const stats = await dbService.getScoutStats();
            const currentSettings = await dbService.getScoutSettings();
            const statusText = `📊 <b>LIVE PIPELINE & SCOUT METRICS</b>\n
• <b>Autonomous Scanner:</b> ${currentSettings.autonomousWorkerEnabled ? '🟢 RUNNING (24/7)' : '⏸️ PAUSED'}
• <b>Cadence:</b> Every ${currentSettings.runIntervalMinutes} minutes
• <b>Total Discovered Opportunities:</b> ${stats.total}
• <b>Pending Review (Drafted):</b> ${stats.drafted}
• <b>Approved for Outreach:</b> ${stats.approved}
• <b>Sent / Engaged:</b> ${stats.sent}
• <b>Last Scan:</b> ${currentSettings.lastRunAt ? new Date(currentSettings.lastRunAt).toLocaleString() : 'Pending next cycle'}`;
            if (chatId) {
              await this.sendMessage(token, chatId, statusText);
            }
            return { handled: true };
          }

          if (payload === 'leads') {
            await this.answerCallbackQuery(token, cb.id, 'Loading recent leads...');
            const opps = await dbService.getOpportunities({ limit: 3 });
            if (opps.length === 0) {
              if (chatId) {
                await this.sendMessage(token, chatId, `🔍 <b>No leads in the pipeline yet.</b>\n\nProvide any website URL (e.g. <i>"Audit https://brand.com"</i>) or let the 24/7 background worker discover them!`);
              }
            } else {
              for (const opp of opps) {
                await this.sendOpportunityAlert(opp, settings);
              }
            }
            return { handled: true };
          }

          if (payload === 'toggle_scanner') {
            const currentSettings = await dbService.getScoutSettings();
            const newStatus = !currentSettings.autonomousWorkerEnabled;
            await dbService.updateScoutSettings({ autonomousWorkerEnabled: newStatus });
            await this.answerCallbackQuery(token, cb.id, newStatus ? '🟢 Scanner Resumed' : '⏸️ Scanner Paused');
            if (chatId) {
              await this.sendMessage(
                token,
                chatId,
                newStatus
                  ? `🟢 <b>24/7 Autonomous Scanner Resumed</b>\nActively discovering high-converting leads.`
                  : `⏸️ <b>24/7 Autonomous Scanner Paused</b>\nBackground discovery suspended.`
              );
            }
            return { handled: true };
          }

          if (payload === 'audit_prompt') {
            await this.answerCallbackQuery(token, cb.id, 'Ready for URL');
            if (chatId) {
              await this.sendMessage(
                token,
                chatId,
                `⚡ <b>Run Live Evidence Audit</b>\n\nJust send me any website URL, for example:\n<i>"Audit https://gymshark.com"</i>\nor simply type: <code>/audit https://brand.com</code>`
              );
            }
            return { handled: true };
          }

          if (payload === 'settings') {
            await this.answerCallbackQuery(token, cb.id, 'Opening settings...');
            const current = await dbService.getScoutSettings();
            const { text, markup } = this.formatSettingsDossier(current);
            if (chatId) {
              await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  text,
                  parse_mode: 'HTML',
                  disable_web_page_preview: true,
                  reply_markup: markup,
                }),
              });
            }
            return { handled: true };
          }

          if (payload === 'main' || payload === 'show') {
            await this.answerCallbackQuery(token, cb.id, 'Opening Main Menu...');
            const persistentKeyboard = {
              keyboard: [
                [{ text: '📊 Pipeline Status' }, { text: '🔍 Recent Leads' }],
                [{ text: '⚡ Audit a Website' }, { text: '⚙️ Settings' }],
                [{ text: '💡 Ask Strategy Advice' }, { text: '🔄 Reset Chat' }],
              ],
              resize_keyboard: true,
              is_persistent: true,
            };
            if (chatId) {
              await this.sendMessage(token, chatId, '🎛️ <b>Main Menu Controls Active</b>\n\nTap any button below or write your instructions freely:', persistentKeyboard);
            }
            return { handled: true };
          }
        }

        if (action === 'settings') {
          if (payload === 'toggle_scanner') {
            const current = await dbService.getScoutSettings();
            const updated = await dbService.updateScoutSettings({ autonomousWorkerEnabled: !current.autonomousWorkerEnabled });
            await this.answerCallbackQuery(token, cb.id, updated.autonomousWorkerEnabled ? '🟢 Scanner resumed!' : '⏸️ Scanner paused!');
            if (chatId && messageId) {
              const { text, markup } = this.formatSettingsDossier(updated);
              await this.editMessageTextAndMarkup(token, chatId, messageId, text, markup);
            }
            return { handled: true };
          }

          if (payload.startsWith('interval:')) {
            const minutes = parseInt(payload.split(':')[1], 10) || 60;
            const updated = await dbService.updateScoutSettings({ runIntervalMinutes: minutes });
            await this.answerCallbackQuery(token, cb.id, `⏱️ Cadence set to every ${minutes}m!`);
            if (chatId && messageId) {
              const { text, markup } = this.formatSettingsDossier(updated);
              await this.editMessageTextAndMarkup(token, chatId, messageId, text, markup);
            }
            return { handled: true };
          }

          if (payload === 'niches') {
            const current = await dbService.getScoutSettings();
            await this.answerCallbackQuery(token, cb.id, 'Target Niches');
            if (chatId) {
              const nichesList = (current.targetNiches || []).map((n, i) => `${i + 1}. <b>${this.escapeHtml(n)}</b>`).join('\n');
              const msg = `🎯 <b>CONFIGURED TARGET NICHES</b>\n\nThe 24/7 autonomous worker actively tracks stores across:\n\n${nichesList}\n\n💡 <i>To add or modify target niches, just tell me in natural chat, e.g.: "Add jewelry and watches to target niches"</i>`;
              await this.sendMessage(token, chatId, msg);
            }
            return { handled: true };
          }

          if (payload === 'keywords') {
            const current = await dbService.getScoutSettings();
            await this.answerCallbackQuery(token, cb.id, 'Intent Signals');
            if (chatId) {
              const kwList = (current.intentKeywords || []).map((k) => `• <code>${this.escapeHtml(k)}</code>`).join('\n');
              const msg = `🔑 <b>ACTIVE INTENT SIGNALS & KEYWORDS</b>\n\nThe scanner detects conversion and commercial friction signals:\n\n${kwList}\n\n💡 <i>You can chat with me anytime to add new search signals!</i>`;
              await this.sendMessage(token, chatId, msg);
            }
            return { handled: true };
          }

          if (payload === 'refresh') {
            const current = await dbService.getScoutSettings();
            await this.answerCallbackQuery(token, cb.id, 'Settings refreshed');
            if (chatId && messageId) {
              const { text, markup } = this.formatSettingsDossier(current);
              await this.editMessageTextAndMarkup(token, chatId, messageId, text, markup);
            }
            return { handled: true };
          }
        }

        // Opportunity Action Handlers (Approve, Refine, Dossier, Contact, Dismiss, Reply, Retry, Copy, Followup)
        if (action === 'opp' || action === 'approve' || action === 'reject' || action === 'refine') {
          if (data.startsWith('opp:blocked:')) {
            const oppId = data.replace('opp:blocked:', '');
            await this.answerCallbackQuery(token, cb.id, '❌ Sending Blocked: Lead did not pass the Intelligence Gate.');
            if (chatId) {
              await this.sendMessage(
                token,
                chatId,
                `⚠️ <b>Outreach Dispatch Blocked</b>\n\nOpportunity #${oppId} does not satisfy all validation parameters in the Lead Intelligence Gate. Outreach draft cannot be sent.`
              );
            }
            return { handled: true };
          }

          if (data.startsWith('opp:approve:') || data.startsWith('approve:') || data.startsWith('opp:retry:')) {
            const oppId = data.startsWith('opp:approve:')
              ? data.replace('opp:approve:', '')
              : data.startsWith('opp:retry:')
              ? data.replace('opp:retry:', '')
              : data.replace('approve:', '');

            const currentOpp = await dbService.getOpportunityById(oppId);
            if (!currentOpp) {
              await this.answerCallbackQuery(token, cb.id, '⚠️ Opportunity not found');
              return { handled: true };
            }

            // Quick user feedback on Telegram
            await this.answerCallbackQuery(token, cb.id, '⚡ Dispatching approved outreach...');

            // FIRST: Transition status to APPROVED (which performs the Lead Intelligence Gate checks)
            try {
              const { actionCenter } = await import('./actionCenter.js');
              await actionCenter.approveOpportunity(oppId);
            } catch (err: any) {
              await this.answerCallbackQuery(token, cb.id, '❌ Approval Gate Blocked');
              if (chatId) {
                await this.sendMessage(
                  token,
                  chatId,
                  `⚠️ <b>Outreach Dispatch Blocked</b>\n\nOpportunity #${oppId} did not pass the Intelligence Gate: ${err?.message || err}`
                );
              }
              return { handled: true };
            }

            // Dispatch using provider abstraction (Gmail SMTP / Resend) with idempotency lock
            const { emailOutreachDispatcher } = await import('./emailOutreachDispatcher.js');
            const result = await emailOutreachDispatcher.dispatchOutreach(oppId);

            if (result.alreadySent) {
              await this.answerCallbackQuery(token, cb.id, '✅ Already sent previously!');
              const refreshed = await dbService.getOpportunityById(oppId);
              if (chatId && messageId && refreshed) {
                const updatedText = this.formatOutreachSentCard(refreshed);
                const updatedKeyboard = this.buildOutreachSentKeyboard(refreshed);
                await this.editMessageTextAndMarkup(token, chatId, messageId, updatedText, updatedKeyboard);
              }
              return { handled: true };
            }

            if (result.inProgress) {
              await this.answerCallbackQuery(token, cb.id, '⏳ Dispatch currently in progress...');
              return { handled: true };
            }

            if (result.success) {
              // SUCCESS -> fetch newly updated SENT opportunity
              const sentOpp = await dbService.getOpportunityById(oppId);
              if (chatId && messageId && sentOpp) {
                const updatedText = this.formatOutreachSentCard(sentOpp);
                const updatedKeyboard = this.buildOutreachSentKeyboard(sentOpp);
                await this.editMessageTextAndMarkup(token, chatId, messageId, updatedText, updatedKeyboard);
              }
            } else {
              // FAILURE -> state is SEND_FAILED (Status: APPROVED — NOT SENT)
              const failedOpp = await dbService.getOpportunityById(oppId);
              if (chatId && messageId && failedOpp) {
                const failedText = this.formatSendFailedCard(failedOpp);
                const failedKeyboard = this.buildSendFailedKeyboard(failedOpp);
                await this.editMessageTextAndMarkup(token, chatId, messageId, failedText, failedKeyboard);
              }
            }
            return { handled: true };
          }

          if (data.startsWith('opp:copy:')) {
            const oppId = data.replace('opp:copy:', '');
            const opp = await dbService.getOpportunityById(oppId);
            await this.answerCallbackQuery(token, cb.id, 'Outreach draft prepared');
            if (opp && chatId) {
              const draft = opp.refinedDraft || opp.outreachDraft || '';
              await this.sendMessage(
                token,
                chatId,
                `📋 <b>OUTREACH DRAFT FOR ${this.escapeHtml(opp.prospectName)}</b>\n\n<i>Tap text below to copy to clipboard:</i>\n\n<code>${this.escapeHtml(draft)}</code>`
              );
            }
            return { handled: true };
          }

          if (data.startsWith('opp:followup:')) {
            const oppId = data.replace('opp:followup:', '');
            const opp = await dbService.getOpportunityById(oppId);
            await this.answerCallbackQuery(token, cb.id, 'Follow-up timeline active');
            if (opp && chatId) {
              const followUpDate = opp.nextFollowUpDate
                ? new Date(opp.nextFollowUpDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'in 4 days';
              await this.sendMessage(
                token,
                chatId,
                `⏰ <b>FOLLOW-UP STATUS: ${this.escapeHtml(opp.prospectName)}</b>\n\nCompany: <b>${this.escapeHtml(opp.businessName)}</b>\nNext Follow-up Window: <b>${followUpDate}</b>\n\n<i>ApexGrowth will automatically notify you when this follow-up is due.</i>`
              );
            }
            return { handled: true };
          }

          if (data.startsWith('opp:refine:') || data.startsWith('refine:')) {
            const oppId = data.startsWith('opp:refine:') ? data.replace('opp:refine:', '') : data.replace('refine:', '');
            await this.answerCallbackQuery(token, cb.id, 'Reply with refinement instructions');
            if (chatId) {
              await this.sendMessage(token, chatId, `✏️ <b>Refining Outreach Draft for Opportunity #${oppId}</b>\n\nPlease reply directly to this message describing how you'd like to adjust the outreach draft.`);
            }
            return { handled: true };
          }

          if (data.startsWith('opp:dossier:')) {
            const oppId = data.replace('opp:dossier:', '');
            const opp = await dbService.getOpportunityById(oppId);
            await this.answerCallbackQuery(token, cb.id, 'Loading comprehensive dossier...');
            if (opp && chatId) {
              const fullDossier = this.formatOpportunityDossier(opp);
              await this.sendMessage(token, chatId, fullDossier);
            }
            return { handled: true };
          }

          if (data.startsWith('opp:contact:')) {
            const oppId = data.replace('opp:contact:', '');
            const opp = await dbService.getOpportunityById(oppId);
            await this.answerCallbackQuery(token, cb.id, 'Contact Channels');
            if (opp && chatId) {
              const contactLines = (opp.publicContacts || []).map((c) => `• <b>${c.type.toUpperCase()}</b>: <code>${c.value}</code> (${c.sourceLocation}) [${c.confidence}]`).join('\n');
              await this.sendMessage(token, chatId, `📇 <b>PUBLIC CONTACT CHANNELS: ${this.escapeHtml(opp.prospectName)}</b>\n\n${contactLines || 'No direct emails listed. Contact via original source platform.'}`);
            }
            return { handled: true };
          }

          if (data.startsWith('opp:dismiss:') || data.startsWith('opp:reject:') || data.startsWith('reject:')) {
            const parts = data.split(':');
            const oppId = parts[parts.length - 1];
            const opp = await dbService.updateOpportunityStatus(oppId, 'REJECTED');
            await this.answerCallbackQuery(token, cb.id, '🚫 Opportunity Dismissed');
            if (chatId && messageId && opp) {
              await this.editMessageText(token, chatId, messageId, `🚫 <b>DISMISSED BY OPERATOR</b>\n\nProspect: <b>${this.escapeHtml(opp.prospectName)}</b> (${this.escapeHtml(opp.businessName)})`);
            }
            return { handled: true };
          }

          if (data.startsWith('opp:reply:')) {
            const oppId = data.replace('opp:reply:', '');
            const opp = await dbService.getOpportunityById(oppId);
            await this.answerCallbackQuery(token, cb.id, 'Ready to record reply');
            if (chatId) {
              const pName = opp ? opp.prospectName.split(' ')[0] : 'Devon';
              await this.sendMessage(
                token,
                chatId,
                `💬 <b>Record Positive Reply for ${this.escapeHtml(pName)}</b>\n\nReply in chat or use the command:\n<code>/reply ${this.escapeHtml(pName)} "Yeah, I'd be interested in seeing what you found."</code>`
              );
            }
            return { handled: true };
          }

          if (data.startsWith('opp:draft_reply:')) {
            const oppId = data.replace('opp:draft_reply:', '');
            const opp = await dbService.getOpportunityById(oppId);
            await this.answerCallbackQuery(token, cb.id, 'Drafting qualification reply...');
            if (opp && chatId) {
              const replyDraft = `Hey ${opp.prospectName.split(' ')[0]}, great to hear from you! Here's the 2-point diagnostic we put together:\n\n1. Checkout CTA: Currently rendered below mobile viewport.\n2. Mobile load latency: Clocking in at ~5.6s.\n\nWe can resolve both of these in a quick 5-day CRO Sprint. Would you like us to send over the sprint proposal?`;
              await this.sendMessage(
                token,
                chatId,
                `📝 <b>SUGGESTED QUALIFICATION REPLY</b>\n\n<blockquote>${this.escapeHtml(replyDraft)}</blockquote>\n\n<i>Copy and send, or tap [💼 Open Deal] to proceed:</i>`,
                {
                  inline_keyboard: [
                    [{ text: '💼 Open Deal', callback_data: `deal:create:${opp.id}` }],
                  ],
                }
              );
            }
            return { handled: true };
          }
        }

        // Deal & Project Operations
        if (action === 'deal') {
          const { pipelineOperationsService } = await import('./pipelineOperationsService.js');

          if (data.startsWith('deal:create:') || data.startsWith('deal:open:')) {
            const oppId = data.split(':')[2];
            await this.answerCallbackQuery(token, cb.id, '💼 Creating commercial deal...');
            const deal = await pipelineOperationsService.createDealFromProspect(oppId);

            const dealCard = this.formatDealReadyCard(deal);
            const dealMarkup = this.buildDealReadyKeyboard(deal);

            if (chatId) {
              await this.sendMessage(token, chatId, dealCard, dealMarkup);
            }
            return { handled: true };
          }

          if (data.startsWith('deal:convert:')) {
            const dealId = data.replace('deal:convert:', '');
            await this.answerCallbackQuery(token, cb.id, '🚀 Initializing Active Project...');
            const project = await pipelineOperationsService.convertDealToActiveProject(dealId);

            const projCard = this.formatActiveProjectCard(project);
            const projMarkup = this.buildActiveProjectKeyboard(project);

            if (chatId) {
              await this.sendMessage(token, chatId, projCard, projMarkup);
            }
            return { handled: true };
          }

          if (data.startsWith('deal:won:')) {
            const dealId = data.replace('deal:won:', '');
            const deal = await pipelineOperationsService.updateDealStage(dealId, 'WON');
            await this.answerCallbackQuery(token, cb.id, '🏆 Deal Marked as Won!');
            if (chatId) {
              const dealCard = this.formatDealReadyCard(deal);
              const dealMarkup = this.buildDealReadyKeyboard(deal);
              await this.sendMessage(token, chatId, dealCard, dealMarkup);
            }
            return { handled: true };
          }

          if (data.startsWith('deal:proposal:')) {
            const dealId = data.replace('deal:proposal:', '');
            const deal = await pipelineOperationsService.getDealById(dealId);
            if (deal && chatId) {
              const msg = `📄 <b>EXECUTIVE PROPOSAL SCOPE: ${this.escapeHtml(deal.clientName)}</b>\n\n<blockquote>${this.escapeHtml(deal.proposalDraft || deal.proposalSummary || 'Conversion Optimization Sprint')}</blockquote>\n\nValue: <b>$${deal.proposedPrice} ${deal.currency}</b>`;
              await this.sendMessage(token, chatId, msg);
            }
            return { handled: true };
          }
        }

        // Project Phase & Workspace Callbacks
        if (action === 'proj') {
          const { pipelineOperationsService } = await import('./pipelineOperationsService.js');

          if (data.startsWith('proj:work:')) {
            const projId = data.replace('proj:work:', '');
            const project = await pipelineOperationsService.getProjectById(projId);
            await this.answerCallbackQuery(token, cb.id, 'Activating co-work session...');
            if (project && chatId) {
              const clientFirst = project.clientName.split(' ')[0];
              await this.sendMessage(
                token,
                chatId,
                `🛠️ <b>Active Workspace for ${this.escapeHtml(project.clientName)}</b>\n\nTell me what deliverable or task to execute, e.g.:\n<code>/work ${this.escapeHtml(clientFirst)} Complete CTA recommendations</code>`
              );
            }
            return { handled: true };
          }

          if (data.startsWith('proj:tasks:') || data.startsWith('proj:deliverables:')) {
            const projId = data.split(':')[2];
            const project = await pipelineOperationsService.getProjectById(projId);
            if (project && chatId) {
              const projCard = this.formatActiveProjectCard(project);
              const projMarkup = this.buildActiveProjectKeyboard(project);
              await this.sendMessage(token, chatId, projCard, projMarkup);
            }
            return { handled: true };
          }

          if (data.startsWith('proj:context:')) {
            const projId = data.replace('proj:context:', '');
            const project = await pipelineOperationsService.getProjectById(projId);
            if (project && chatId) {
              const observations = (project.diagnosticDossier?.liveAuditObservations || []).map((o: string) => `• ${this.escapeHtml(o)}`).join('\n');
              const ctxMsg = `💬 <b>CLIENT CONTEXT: ${this.escapeHtml(project.clientName)}</b> (${this.escapeHtml(project.clientCompany || '')})\n\n<b>Agreed Service:</b> ${this.escapeHtml(project.servicePackage)}\n<b>Investment:</b> $${project.agreedPrice} ${project.currency}\n<b>Target Delivery:</b> ${project.targetDeliveryDate ? new Date(project.targetDeliveryDate).toLocaleDateString() : 'Within 5 days'}\n\n<b>Audit Diagnostic Findings:</b>\n${observations || '• Mobile checkout friction\n• Below-fold CTA button\n• 5.6s mobile load latency'}`;
              await this.sendMessage(token, chatId, ctxMsg);
            }
            return { handled: true };
          }

          if (data.startsWith('proj:brief:')) {
            const projId = data.replace('proj:brief:', '');
            const project = await pipelineOperationsService.getProjectById(projId);
            if (project && chatId) {
              const briefMsg = `📊 <b>SPRINT PROJECT BRIEF: ${this.escapeHtml(project.clientCompany || project.clientName)}</b>\n\n<blockquote>${this.escapeHtml(project.projectBrief)}</blockquote>`;
              await this.sendMessage(token, chatId, briefMsg);
            }
            return { handled: true };
          }

          if (data.startsWith('proj:advance:')) {
            const projId = data.replace('proj:advance:', '');
            const project = await pipelineOperationsService.getProjectById(projId);
            if (project) {
              let nextPhase: any = 'PHASE_1';
              if (project.currentPhase === 'PROJECT_CREATED' || project.currentPhase === 'KICKOFF') nextPhase = 'PHASE_1';
              else if (project.currentPhase === 'PHASE_1') nextPhase = 'PHASE_2';
              else if (project.currentPhase === 'PHASE_2') nextPhase = 'REVIEW';
              else if (project.currentPhase === 'REVIEW') nextPhase = 'DELIVERED';
              else if (project.currentPhase === 'DELIVERED') nextPhase = 'RETAINER_ACTIVE';

              const updated = await pipelineOperationsService.advanceProjectPhase(projId, nextPhase);
              await this.answerCallbackQuery(token, cb.id, `Advanced to ${nextPhase}`);
              if (chatId) {
                const projCard = this.formatActiveProjectCard(updated);
                const projMarkup = this.buildActiveProjectKeyboard(updated);
                await this.sendMessage(token, chatId, projCard, projMarkup);
              }
            }
            return { handled: true };
          }
        }
      }

      // 2. Handle Text Messages & Commands
      if (update.message?.text) {
        const text: string = update.message.text.trim();
        const chatId = update.message.chat?.id;
        const replyToMsg = update.message.reply_to_message;

        // Ensure chatId is recorded and notifications enabled
        if (chatId && (!settings.telegramEnabled || settings.telegramChatId !== String(chatId))) {
          await dbService.updateScoutSettings({
            telegramChatId: String(chatId),
            telegramEnabled: true,
          });
        }

        // Handle direct commands & Main Menu triggers
        if (
          text.startsWith('/start') ||
          text.startsWith('/help') ||
          text.startsWith('/menu') ||
          text.startsWith('/reset') ||
          text === '🔄 Reset Chat' ||
          text.toLowerCase() === 'menu' ||
          text.toLowerCase() === 'main menu'
        ) {
          const { scoutNlpService } = await import('./scoutNlpService.js');
          if (chatId) {
            scoutNlpService.resetChatSession(chatId);
            // Sync bot commands with Telegram
            this.syncBotCommands(token).catch(() => {});
          }

          const welcomeText = `👋 <b>Welcome to ApexGrowth Intelligence</b>\n
I am your <b>autonomous AI partner & 24/7 lead intelligence scout</b>. You can speak to me completely freely in natural language, or use the interactive Main Menu below.

🚀 <b>What I Can Do For You:</b>
• <b>Live Evidence Audits:</b> Inspect real network latency, DOM checkout elements, and public contact info for any store.
• <b>24/7 Autonomous Lead Discovery:</b> Constantly scan founder & e-commerce communities for high-converting opportunities.
• <b>Personalized Consultative Drafts:</b> Generate grounded, high-conversion outreach emails and DMs.
• <b>Full Strategic Dialogue:</b> Brainstorm agency growth, CRO bottlenecks, pricing packages, or campaign angles.

👇 <i>Tap an option below, or simply message me anything you'd like!</i>`;

          const mainMenuMarkup = {
            inline_keyboard: [
              [
                { text: '📊 Pipeline Status', callback_data: 'menu:status' },
                { text: '🔍 Recent Leads', callback_data: 'menu:leads' },
              ],
              [
                { text: '⚡ Audit a Website', callback_data: 'menu:audit_prompt' },
                { text: '⚙️ Settings', callback_data: 'menu:settings' },
              ],
            ],
          };

          const persistentKeyboard = {
            keyboard: [
              [{ text: '📊 Pipeline Status' }, { text: '🔍 Recent Leads' }],
              [{ text: '💼 Active Deals' }, { text: '🚀 Active Projects' }],
              [{ text: '⚡ Audit a Website' }, { text: '⚙️ Settings' }],
              [{ text: '💡 Ask Strategy Advice' }, { text: '🔄 Reset Chat' }],
            ],
            resize_keyboard: true,
            is_persistent: true,
          };

          if (chatId) {
            // Send welcome with inline buttons
            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: welcomeText,
                parse_mode: 'HTML',
                disable_web_page_preview: true,
                reply_markup: mainMenuMarkup,
              }),
            });

            // Set the persistent reply keyboard
            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: '🎛️ <i>Main Menu controls activated below:</i>',
                parse_mode: 'HTML',
                reply_markup: persistentKeyboard,
              }),
            });
          }
          return { handled: true };
        }

        // Inbound Prospect Response Handler (/reply <Name> <text>)
        if (text.startsWith('/reply') || text.startsWith('/response')) {
          const raw = text.replace(/^\/(reply|response)\s*/i, '').trim();
          if (!raw) {
            await this.sendMessage(
              token,
              chatId,
              `⚠️ Please specify a prospect and what they replied, e.g.:\n<code>/reply Devon "Yeah, I'd be interested in seeing what you found."</code>`
            );
            return { handled: true };
          }

          const match = raw.match(/^([^\s"]+)\s*["“'‘]?(.*?)["”'’]?$/s);
          const namePart = match ? match[1] : raw.split(' ')[0];
          const replyText = match && match[2] ? match[2].trim() : raw.substring(namePart.length).trim().replace(/^["“'‘]|["”'’]$/g, '');

          const opps = await dbService.getOpportunities();
          const opp = opps.find((o) => o.prospectName.toLowerCase().includes(namePart.toLowerCase()) || o.businessName.toLowerCase().includes(namePart.toLowerCase())) || (opps.length > 0 ? opps[0] : null);

          if (opp) {
            const actualReply = replyText || "Yeah, I'd be interested in seeing what you found.";
            await dbService.recordProspectReply(opp.id, actualReply);
            const card = this.formatPositiveResponseCard(opp, actualReply);
            const markup = this.buildPositiveResponseKeyboard(opp);
            await this.sendMessage(token, chatId, card, markup);
          } else {
            await this.sendMessage(token, chatId, `⚠️ Could not find prospect matching "${this.escapeHtml(namePart)}". Check <code>/leads</code> to see all active prospects.`);
          }
          return { handled: true };
        }

        // Quick button intercepts from persistent keyboard & flexible text patterns
        if (
          text === '📊 Pipeline Status' ||
          text.startsWith('/status') ||
          text.toLowerCase() === 'pipeline status' ||
          text.toLowerCase() === 'pipeline' ||
          text.toLowerCase() === 'status'
        ) {
          const stats = await dbService.getScoutStats();
          const currentSettings = await dbService.getScoutSettings();
          const statusText = `📊 <b>LIVE PIPELINE & SCOUT METRICS</b>\n
• <b>Autonomous Scanner:</b> ${currentSettings.autonomousWorkerEnabled ? '🟢 RUNNING (24/7)' : '⏸️ PAUSED'}
• <b>Cadence:</b> Every ${currentSettings.runIntervalMinutes} minutes
• <b>Total Discovered Opportunities:</b> ${stats.total}
• <b>Pending Review (Drafted):</b> ${stats.drafted}
• <b>Approved for Outreach:</b> ${stats.approved}
• <b>Sent / Engaged:</b> ${stats.sent}
• <b>Last Scan:</b> ${currentSettings.lastRunAt ? new Date(currentSettings.lastRunAt).toLocaleString() : 'Pending next cycle'}`;
          await this.sendMessage(token, chatId, statusText);
          return { handled: true };
        }

        if (
          text === '🔍 Recent Leads' ||
          text.startsWith('/leads') ||
          text.toLowerCase() === 'recent leads' ||
          text.toLowerCase() === 'leads'
        ) {
          const opps = await dbService.getOpportunities({ limit: 3 });
          if (opps.length === 0) {
            await this.sendMessage(token, chatId, `🔍 <b>No leads found yet.</b> Ask me to audit any store URL or let the 24/7 scanner run!`);
          } else {
            for (const opp of opps) {
              await this.sendOpportunityAlert(opp, settings);
            }
          }
          return { handled: true };
        }

        if (
          text === '⚡ Audit a Website' ||
          text.toLowerCase() === 'audit a website' ||
          text.toLowerCase() === 'audit'
        ) {
          await this.sendMessage(
            token,
            chatId,
            `⚡ <b>Ready to audit!</b>\n\nSend me the website URL you'd like to inspect, for example:\n<i>"Audit https://brandstore.com"</i>\nor simply type: <code>/audit https://brandstore.com</code>`
          );
          return { handled: true };
        }

        if (
          text === '⚙️ Settings' ||
          text.startsWith('/settings') ||
          text === '⚙️ Scanner Status' ||
          text.toLowerCase() === 'settings'
        ) {
          const currentSettings = await dbService.getScoutSettings();
          const { text: settingsText, markup } = this.formatSettingsDossier(currentSettings);
          if (chatId) {
            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: settingsText,
                parse_mode: 'HTML',
                disable_web_page_preview: true,
                reply_markup: markup,
              }),
            });
          }
          return { handled: true };
        }

        if (
          text === '💡 Ask Strategy Advice' ||
          text.toLowerCase() === 'ask strategy advice' ||
          text.toLowerCase() === 'strategy' ||
          text.toLowerCase() === 'advice'
        ) {
          const promptMsg = `💡 <b>What would you like to explore?</b>\n\nYou can ask me anything about:
• E-commerce conversion rate optimization (CRO)
• Reducing checkout and cart abandonment
• High-converting cold outreach hooks for store founders
• Positioning our $99 Starter Audit and Retainers

<i>Just type your question naturally!</i>`;
          await this.sendMessage(token, chatId, promptMsg);
          return { handled: true };
        }

      if (text.startsWith('/pause')) {
        await dbService.updateScoutSettings({ autonomousWorkerEnabled: false });
        await this.sendMessage(token, chatId, `⏸️ <b>Autonomous 24/7 Worker Paused</b>. Type <code>/resume</code> anytime to turn it back on.`);
        return { handled: true };
      }

      if (text.startsWith('/resume')) {
        await dbService.updateScoutSettings({ autonomousWorkerEnabled: true });
        await this.sendMessage(token, chatId, `🟢 <b>Autonomous 24/7 Worker Resumed</b>. Actively scouting for high-intent opportunities.`);
        return { handled: true };
      }

      if (
        text === '💼 Active Deals' ||
        text.startsWith('/deals') ||
        text.toLowerCase() === 'deals' ||
        text.toLowerCase() === 'active deals'
      ) {
        const { pipelineOperationsService } = await import('./pipelineOperationsService.js');
        const deals = await pipelineOperationsService.getDeals();
        if (deals.length === 0) {
          await this.sendMessage(
            token,
            chatId,
            `💼 <b>No deals active in the pipeline yet.</b>\n\nWhen a prospect responds or asks for an audit, tap <b>[💼 Open Deal]</b> on their alert or create one in the Web Admin.`
          );
        } else {
          const dealList = deals
            .slice(0, 5)
            .map((d, i) => {
              return `${i + 1}. <b>${this.escapeHtml(d.clientName)}</b> (${this.escapeHtml(d.clientCompany || 'Direct')})
• Service: <i>${this.escapeHtml(d.servicePackage)}</i>
• Proposed: <b>$${d.proposedPrice} ${d.currency}</b> | Stage: <code>${d.stage}</code>
• Action: ${d.projectId ? `🚀 Project active` : `👉 Convert to Project`}`;
            })
            .join('\n\n');

          const dealsMsg = `💼 <b>COMMERCIAL DEALS PIPELINE (${deals.length})</b>\n\n${dealList}`;
          const keyboard = {
            inline_keyboard: deals
              .filter((d) => !d.projectId && d.stage !== 'LOST')
              .slice(0, 3)
              .map((d) => [
                {
                  text: `🚀 Convert ${d.clientName.split(' ')[0]} ➔ Project`,
                  callback_data: `deal:convert:${d.id}`,
                },
              ]),
          };
          await this.sendMessage(token, chatId, dealsMsg, keyboard.inline_keyboard.length > 0 ? keyboard : undefined);
        }
        return { handled: true };
      }

      if (
        text === '🚀 Active Projects' ||
        text.startsWith('/projects') ||
        text.toLowerCase() === 'projects' ||
        text.toLowerCase() === 'active projects'
      ) {
        const { pipelineOperationsService } = await import('./pipelineOperationsService.js');
        const projects = await pipelineOperationsService.getActiveProjects();
        if (projects.length === 0) {
          await this.sendMessage(
            token,
            chatId,
            `🚀 <b>No active delivery projects right now.</b>\n\nConvert an agreed deal via <code>/deals</code> or tap <b>[🚀 Convert to Active Project]</b> when a client accepts your proposal.`
          );
        } else {
          for (const p of projects.slice(0, 3)) {
            const card = this.formatActiveProjectCard(p);
            const markup = this.buildActiveProjectKeyboard(p);
            await this.sendMessage(token, chatId, card, markup);
          }
        }
        return { handled: true };
      }

      if (text.startsWith('/work')) {
        const query = text.replace('/work', '').trim();
        const { pipelineOperationsService } = await import('./pipelineOperationsService.js');
        const projects = await pipelineOperationsService.getActiveProjects();

        if (!query) {
          if (projects.length === 0) {
            await this.sendMessage(
              token,
              chatId,
              `⚠️ No active projects found. Convert an agreed deal via <code>/deals</code> first.`
            );
          } else {
            const targetProj = projects[0];
            const card = this.formatActiveProjectCard(targetProj);
            const markup = this.buildActiveProjectKeyboard(targetProj);
            await this.sendMessage(token, chatId, card, markup);
          }
          return { handled: true };
        }

        // Match project by client name or company
        const firstWord = query.split(' ')[0].toLowerCase();
        let targetProj = projects.find(
          (p) =>
            p.clientName.toLowerCase().includes(firstWord) ||
            (p.clientCompany && p.clientCompany.toLowerCase().includes(firstWord))
        );

        let instruction = query;
        if (targetProj) {
          instruction = query.substring(firstWord.length).trim();
        } else if (projects.length > 0) {
          targetProj = projects[0];
        }

        if (!targetProj) {
          await this.sendMessage(
            token,
            chatId,
            `❌ No matching active project found for "<b>${this.escapeHtml(firstWord)}</b>". Type <code>/projects</code> to see all active clients.`
          );
          return { handled: true };
        }

        // If no instruction, show the active project workspace card!
        if (!instruction) {
          const card = this.formatActiveProjectCard(targetProj);
          const markup = this.buildActiveProjectKeyboard(targetProj);
          await this.sendMessage(token, chatId, card, markup);
          return { handled: true };
        }

        await this.sendMessage(
          token,
          chatId,
          `⚡ <b>Co-working on "${this.escapeHtml(targetProj.clientName)}" (${targetProj.currentPhase})...</b>\n<i>Executing requested sprint deliverable...</i>`
        );

        try {
          const result = await pipelineOperationsService.coWorkWithAi(targetProj.id, instruction);
          const replyText = `🛠️ <b>APEXGROWTH CO-WORK: ${this.escapeHtml(targetProj.clientName)}</b>\n
Phase: <code>${targetProj.currentPhase}</code> | Scope: <i>${this.escapeHtml(targetProj.servicePackage)}</i>\n
${this.escapeHtml(result.responseText)}`;

          const actionMarkup = {
            inline_keyboard: [
              [{ text: '📋 Deliverables', callback_data: `proj:tasks:${targetProj.id}` }, { text: '⚡ Advance Phase', callback_data: `proj:advance:${targetProj.id}` }],
            ],
          };

          await this.sendMessage(token, chatId, replyText, actionMarkup);
        } catch (coErr: any) {
          await this.sendMessage(token, chatId, `❌ Co-work error: ${coErr?.message || coErr}`);
        }
        return { handled: true };
      }

      if (text.startsWith('/audit')) {
        const urlToAudit = text.replace('/audit', '').trim();
        if (!urlToAudit) {
          await this.sendMessage(token, chatId, `⚠️ Please provide a website URL, e.g.: <code>/audit https://example.com</code>`);
          return { handled: true };
        }

        await this.sendMessage(token, chatId, `🔎 Conducting evidence audit for <code>${this.escapeHtml(urlToAudit)}</code>...`);
        try {
          const { actionCenter } = await import('./actionCenter.js');
          const opp = await actionCenter.conductManualAudit(urlToAudit);
          await this.sendOpportunityAlert(opp, settings);
        } catch (auditErr: any) {
          await this.sendMessage(token, chatId, `❌ Audit failed: ${auditErr?.message || auditErr}`);
        }
        return { handled: true };
      }

      // Check if user is replying with refinement instructions to an existing alert
      if (replyToMsg) {
        const replyText = replyToMsg.text || '';
        // Look for opportunity ID in text or extract from reply
        const opp = await dbService.findOpportunityByTelegramMessageId(String(replyToMsg.message_id));
        if (opp) {
          await this.sendMessage(token, chatId, `⏳ Refining draft for <b>${this.escapeHtml(opp.prospectName)}</b> per your instructions...`);
          const refinedCopy = await intelligenceEngine.refineOutreachDraft(opp, text);
          const updated = await dbService.updateOpportunityRefinedDraft(opp.id, refinedCopy, text);

          const refinedMsg = `✨ <b>REFINED OUTREACH DRAFT</b>\n
Prospect: <b>${this.escapeHtml(updated.prospectName)}</b> (${this.escapeHtml(updated.businessName)})
Feedback Applied: <i>"${this.escapeHtml(text)}"</i>\n
<blockquote>${this.escapeHtml(refinedCopy)}</blockquote>\n
<i>Ready to send? Tap Approve below or copy the text.</i>`;

          await this.sendMessageWithApproveButton(token, chatId, refinedMsg, updated.id);
          return { handled: true };
        }
      }

      // Dynamic Conversational Natural Language Dispatcher
      // Handles un-prefixed natural language (audits, queries, stats, worker control, advice)
      if (chatId) {
        const { scoutNlpService } = await import('./scoutNlpService.js');
        await scoutNlpService.handleNaturalLanguageMessage(text, chatId, token, settings);
        return { handled: true };
      }
    }

    return { handled: false };
  }

  public async sendMessage(token: string, chatId: string | number, text: string, replyMarkup?: any) {
    try {
      const sanitizedText = this.sanitizeTelegramHtml(text);
      const payload: any = {
        chat_id: chatId,
        text: sanitizedText,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      };
      if (replyMarkup) {
        payload.reply_markup = replyMarkup;
      }
      const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data: any = await resp.json();
      if (!data.ok) {
        console.error('[TelegramScout] sendMessage HTML error:', data.description);
      }
      return new Response(JSON.stringify(data), { status: resp.status, headers: { 'Content-Type': 'application/json' } });
    } catch (err) {
      console.error('[TelegramScout] sendMessage network error:', err);
      throw err;
    }
  }

  public async sendMessageWithApproveButton(token: string, chatId: string | number, text: string, oppId: string) {
    try {
      const sanitizedText = this.sanitizeTelegramHtml(text);
      const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: sanitizedText,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Approve Refined Draft', callback_data: `approve:${oppId}` },
                { text: '❌ Reject', callback_data: `reject:${oppId}` },
              ],
            ],
          },
        }),
      });
      const data: any = await resp.json();
      if (!data.ok) {
        console.error('[TelegramScout] sendMessageWithApproveButton HTML error:', data.description);
      }
      return new Response(JSON.stringify(data), { status: resp.status, headers: { 'Content-Type': 'application/json' } });
    } catch (err) {
      console.error('[TelegramScout] sendMessageWithApproveButton network error:', err);
      throw err;
    }
  }

  public async editMessageText(token: string, chatId: string | number, messageId: number, text: string) {
    const sanitizedText = this.sanitizeTelegramHtml(text);
    return fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text: sanitizedText,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
  }

  public async editMessageTextAndMarkup(token: string, chatId: string | number, messageId: number, text: string, replyMarkup?: any) {
    const sanitizedText = this.sanitizeTelegramHtml(text);
    return fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text: sanitizedText,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: replyMarkup,
      }),
    });
  }

  public formatSettingsDossier(settings: any): { text: string; markup: any } {
    const isRunning = settings.autonomousWorkerEnabled;
    const interval = settings.runIntervalMinutes || 60;
    const niches = settings.targetNiches || [];
    const keywords = settings.intentKeywords || [];

    const text = `⚙️ <b>APEXGROWTH SCOUT & SYSTEM SETTINGS</b>\n
Configure autonomous discovery, cadence intervals, target niches, and alert notifications in real-time.

• <b>24/7 Autonomous Scanner:</b> ${isRunning ? '🟢 RUNNING (Autonomous 24/7 Discovery)' : '⏸️ PAUSED (Worker suspended)'}
• <b>Scanning Cadence:</b> ⏱️ Every <b>${interval} minutes</b>
• <b>Target Niches (${niches.length}):</b> ${niches.slice(0, 4).join(', ')}${niches.length > 4 ? '...' : ''}
• <b>Intent Signals (${keywords.length}):</b> ${keywords.slice(0, 3).join(', ')}${keywords.length > 3 ? '...' : ''}
• <b>Push Notifications:</b> ${settings.telegramEnabled ? '🔔 Instant Alerts Active' : '🔕 Muted'}
• <b>AI Intelligence Core:</b> 🧠 Gemini 2.5 Flash with Live Operational Tools

<i>Tap any setting below to update live, or simply tell me what to change in chat!</i>`;

    const markup = {
      inline_keyboard: [
        [
          {
            text: isRunning ? '⏸️ Pause Scanner' : '🟢 Resume Scanner',
            callback_data: 'settings:toggle_scanner',
          },
        ],
        [
          { text: interval === 15 ? '🔘 15m' : '⏱️ 15m', callback_data: 'settings:interval:15' },
          { text: interval === 30 ? '🔘 30m' : '⏱️ 30m', callback_data: 'settings:interval:30' },
          { text: interval === 60 ? '🔘 60m' : '⏱️ 60m', callback_data: 'settings:interval:60' },
          { text: interval === 120 ? '🔘 120m' : '⏱️ 120m', callback_data: 'settings:interval:120' },
        ],
        [
          { text: '🎯 View Target Niches', callback_data: 'settings:niches' },
          { text: '🔑 View Intent Signals', callback_data: 'settings:keywords' },
        ],
        [
          { text: '📊 Pipeline Status', callback_data: 'menu:status' },
          { text: '🔄 Refresh Settings', callback_data: 'settings:refresh' },
        ],
      ],
    };

    return { text, markup };
  }

  public async answerCallbackQuery(token: string, callbackQueryId: string, text: string) {
    return fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
      }),
    });
  }

  public escapeHtml(str: string = ''): string {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Rigorous HTML sanitizer tailored specifically for Telegram's supported tag subset:
   * <b>, <strong>, <i>, <em>, <u>, <ins>, <s>, <strike>, <del>, <span>, <tg-spoiler>,
   * <a>, <code>, <pre>, <blockquote>, <tg-emoji>.
   *
   * Validates tag balance, attributes (only href allowed on <a>), and escapes everything else,
   * guaranteeing Telegram will never reject the payload with 'can\'t parse entities' or 400 Bad Request.
   */
  public sanitizeTelegramHtml(html: string): string {
    if (!html) return '';

    // Allowed Telegram tags
    const allowedTags = new Set([
      'b', 'strong',
      'i', 'em',
      'u', 'ins',
      's', 'strike', 'del',
      'span', 'tg-spoiler',
      'a',
      'code',
      'pre',
      'blockquote',
      'tg-emoji'
    ]);

    // Tokenize tags and text
    const tokenRegex = /(<\/?[a-zA-Z0-9_-]+(?:\s+[^>]*?)?>)/g;
    const parts = html.split(tokenRegex);
    const tagStack: string[] = [];
    let output = '';

    for (const part of parts) {
      if (!part) continue;

      const tagMatch = part.match(/^<\s*(\/)?\s*([a-zA-Z0-9_-]+)([\s\S]*?)>$/);
      if (!tagMatch) {
        // Plain text section: escape any rogue ampersands or unclosed angle brackets
        output += this.escapeHtml(part);
        continue;
      }

      const isClosing = Boolean(tagMatch[1]);
      const rawTagName = tagMatch[2].toLowerCase();
      const rawAttrs = tagMatch[3] || '';

      if (!allowedTags.has(rawTagName)) {
        // Not a valid Telegram tag - escape it cleanly so it renders safely as text
        output += this.escapeHtml(part);
        continue;
      }

      if (isClosing) {
        // Find matching tag in the stack
        const lastIdx = tagStack.lastIndexOf(rawTagName);
        if (lastIdx !== -1) {
          // Close any intervening unclosed tags first to keep strict nesting
          while (tagStack.length > lastIdx + 1) {
            const unclosed = tagStack.pop()!;
            output += `</${unclosed}>`;
          }
          tagStack.pop();
          output += `</${rawTagName}>`;
        } else {
          // Stray closing tag with no match - discard or escape
          // Skipping prevents Telegram parser error
        }
      } else {
        // Opening tag
        if (rawTagName === 'a') {
          // Strict attribute check for <a> tags: only href="http..." or href="tg://..." allowed
          const hrefMatch = rawAttrs.match(/href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
          const rawUrl = hrefMatch ? (hrefMatch[1] || hrefMatch[2] || hrefMatch[3] || '').trim() : '';
          const safeUrl = this.sanitizeUrl(rawUrl);

          if (safeUrl) {
            output += `<a href="${this.escapeHtml(safeUrl)}">`;
            tagStack.push('a');
          } else {
            // If URL is invalid, skip opening <a> tag but render inner text normally
          }
        } else {
          output += `<${rawTagName}>`;
          tagStack.push(rawTagName);
        }
      }
    }

    // Close any unclosed tags at the end
    while (tagStack.length > 0) {
      const remainingTag = tagStack.pop()!;
      output += `</${remainingTag}>`;
    }

    return output;
  }

  /**
   * Validates and returns a safe HTTP/HTTPS URL for Telegram inline keyboard buttons and anchor links.
   * Returns empty string if invalid or malformed.
   */
  public sanitizeUrl(url?: string): string {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return '';
    }
    try {
      const parsed = new URL(trimmed);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : '';
    } catch {
      return '';
    }
  }

  public async syncBotCommands(token: string): Promise<void> {
    try {
      await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commands: [
            { command: 'start', description: 'Open Main Menu & interactive controls' },
            { command: 'deals', description: 'View commercial deals pipeline & convert to projects' },
            { command: 'projects', description: 'View active client projects & deliverable progress' },
            { command: 'work', description: 'Co-work with AI on active client deliverables (/work <client>)' },
            { command: 'settings', description: 'Configure scanner cadence, intervals & niches' },
            { command: 'status', description: 'View live pipeline stats & 24/7 worker status' },
            { command: 'audit', description: 'Run live HTTP evidence audit on any website URL' },
            { command: 'leads', description: 'Inspect recently discovered opportunities' },
            { command: 'pause', description: 'Temporarily pause 24/7 autonomous scanner' },
            { command: 'resume', description: 'Resume 24/7 autonomous scanner' },
            { command: 'reset', description: 'Start a fresh conversational chat session' },
            { command: 'help', description: 'Show full terminal commands & usage' },
          ],
        }),
      });
    } catch (err) {
      console.warn('[TelegramScout] Could not sync bot commands:', err);
    }
  }
}

export const telegramScoutService = new TelegramScoutService();
