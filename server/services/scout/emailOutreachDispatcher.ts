import nodemailer from 'nodemailer';
import { Opportunity, ScoutSettings } from '../../../src/types/index.js';
import { dbService } from '../dbService.js';

export interface EmailDispatchResult {
  success: boolean;
  provider: 'gmail' | 'resend';
  messageId?: string;
  recipientEmail?: string;
  subject?: string;
  sentAt?: string;
  error?: string;
  alreadySent?: boolean;
  inProgress?: boolean;
}

export interface EmailProviderConfig {
  activeProvider: 'gmail' | 'resend';
  gmail: {
    user: string;
    appPassword: string; // Google App Password (16 chars)
    configured: boolean;
  };
  resend: {
    apiKey: string;
    fromEmail: string;
    configured: boolean;
  };
}

export class EmailOutreachDispatcher {
  /**
   * Retrieves current email provider configurations from DB settings or environment fallback.
   */
  public async getProviderConfig(): Promise<EmailProviderConfig> {
    const settings = await dbService.getScoutSettings();

    const gmailUser = (settings.gmailUser || process.env.GMAIL_USER || process.env.SMTP_USER || '').trim();
    const gmailAppPassword = (settings.gmailAppPassword || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '').trim();
    const resendApiKey = (settings.resendApiKey || process.env.RESEND_API_KEY || '').trim();
    const resendFromEmail = (settings.resendFromEmail || process.env.RESEND_FROM_EMAIL || 'ApexGrowth Growth Team <onboarding@resend.dev>').trim();

    // Determine active provider: explicit setting -> env var -> fallback to gmail if gmail configured -> resend
    let activeProvider: 'gmail' | 'resend' = 'gmail';
    if (settings.emailProvider === 'resend' || (!settings.emailProvider && process.env.EMAIL_OUTREACH_PROVIDER === 'resend')) {
      activeProvider = 'resend';
    } else if (settings.emailProvider === 'gmail' || process.env.EMAIL_OUTREACH_PROVIDER === 'gmail') {
      activeProvider = 'gmail';
    } else if (resendApiKey && !gmailUser) {
      activeProvider = 'resend';
    } else {
      activeProvider = 'gmail';
    }

    return {
      activeProvider,
      gmail: {
        user: gmailUser,
        appPassword: gmailAppPassword,
        configured: Boolean(gmailUser && gmailAppPassword),
      },
      resend: {
        apiKey: resendApiKey,
        fromEmail: resendFromEmail,
        configured: Boolean(resendApiKey),
      },
    };
  }

  /**
   * Tests connection to the specified email provider.
   */
  public async testConnection(
    provider: 'gmail' | 'resend',
    customConfig?: { gmailUser?: string; gmailAppPassword?: string; resendApiKey?: string }
  ): Promise<{ success: boolean; message: string; details?: any }> {
    const fullConfig = await this.getProviderConfig();

    if (provider === 'gmail') {
      const user = customConfig?.gmailUser || fullConfig.gmail.user;
      const pass = customConfig?.gmailAppPassword || fullConfig.gmail.appPassword;

      if (!user || !pass) {
        return {
          success: false,
          message: 'Gmail User or Google App Password is not provided.',
        };
      }

      try {
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: { user, pass },
          connectionTimeout: 10000,
        });

        await transporter.verify();
        return {
          success: true,
          message: `Successfully connected to Gmail SMTP (${user}). Credentials verified.`,
        };
      } catch (err: any) {
        return {
          success: false,
          message: `Gmail SMTP Verification Failed: ${err?.message || 'Invalid credentials or connection timeout'}. Ensure 2-Step Verification is enabled and a Google App Password is used.`,
        };
      }
    } else {
      const apiKey = customConfig?.resendApiKey || fullConfig.resend.apiKey;

      if (!apiKey) {
        return {
          success: false,
          message: 'Resend API Key is not provided.',
        };
      }

      try {
        const response = await fetch('https://api.resend.com/api-keys', {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (response.ok) {
          return {
            success: true,
            message: 'Successfully authenticated with Resend API.',
          };
        }

        const errText = await response.text();
        return {
          success: false,
          message: `Resend API Error (${response.status}): ${errText || 'Invalid API Key'}`,
        };
      } catch (err: any) {
        return {
          success: false,
          message: `Resend Connection Failure: ${err?.message || 'Network unreachable'}`,
        };
      }
    }
  }

  /**
   * Validates prospect details before attempting to send.
   */
  public validateOpportunity(opportunity: Opportunity): {
    valid: boolean;
    recipientEmail?: string;
    draft?: string;
    subject?: string;
    error?: string;
  } {
    // 1. Recipient email extraction
    let email = '';
    const directEmail = (opportunity.publicContacts || []).find(
      (c) => c.type === 'email' && c.value && c.value.includes('@')
    );
    if (directEmail && directEmail.value) {
      email = directEmail.value.trim();
    } else {
      const anyEmail = (opportunity.publicContacts || []).find(
        (c) => c.value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.value.trim())
      );
      if (anyEmail && anyEmail.value) {
        email = anyEmail.value.trim();
      }
    }

    if (!email) {
      return {
        valid: false,
        error: 'No public/verified email address found in prospect contacts.',
      };
    }

    // 2. Draft non-empty validation
    const draft = (opportunity.refinedDraft || opportunity.outreachDraft || '').trim();
    if (!draft) {
      return {
        valid: false,
        recipientEmail: email,
        error: 'Outreach draft is empty.',
      };
    }

    const subject =
      opportunity.emailSubject ||
      `Quick optimization diagnostic for ${opportunity.businessName || opportunity.prospectName}`;

    return {
      valid: true,
      recipientEmail: email,
      draft,
      subject,
    };
  }

  /**
   * Dispatches the approved outreach email using the active email provider.
   * STRICT: Enforces Idempotency, separate APPROVED -> DISPATCHING -> SENT lifecycle,
   * and uses live provider submission as the sole source of truth.
   */
  public async dispatchOutreach(opportunityId: string): Promise<EmailDispatchResult> {
    const opp = await dbService.getOpportunityById(opportunityId);
    if (!opp) {
      return {
        success: false,
        provider: 'gmail',
        error: `Opportunity #${opportunityId} was not found.`,
      };
    }

    // STRICT ENFORCEMENT: Block dispatching if the opportunity is unverified
    if (!opp.isVerifiedOpportunity) {
      return {
        success: false,
        provider: 'gmail',
        error: `STRICT GATE BLOCKED: Opportunity #${opportunityId} has not passed the Lead Intelligence Gate and cannot be dispatched.`,
      };
    }

    // 1. Idempotency & Duplicate Send Protection
    if (opp.outreachStatus === 'SENT') {
      return {
        success: false,
        provider: (opp.sentProvider as any) || 'gmail',
        messageId: opp.outreachMessageId || opp.resendMessageId,
        recipientEmail: opp.recipientEmail,
        alreadySent: true,
        error: 'Outreach email was already successfully dispatched to this prospect.',
      };
    }

    if (opp.outreachStatus === 'DISPATCHING') {
      const lockAge = opp.dispatchAttemptAt ? Date.now() - new Date(opp.dispatchAttemptAt).getTime() : 0;
      // If dispatch started less than 30 seconds ago, reject duplicate trigger
      if (lockAge < 30000) {
        return {
          success: false,
          provider: (opp.sentProvider as any) || 'gmail',
          inProgress: true,
          error: 'Dispatch is currently in progress for this prospect. Please wait.',
        };
      }
    }

    // 2. Pre-Send Validation
    const validation = this.validateOpportunity(opp);
    if (!validation.valid || !validation.recipientEmail || !validation.draft || !validation.subject) {
      // Mark as send failed if validation fails
      await dbService.markOpportunitySendFailed(
        opportunityId,
        validation.error || 'Validation failed before sending.',
        validation.recipientEmail
      );
      return {
        success: false,
        provider: 'gmail',
        recipientEmail: validation.recipientEmail,
        error: validation.error || 'Validation failed before sending.',
      };
    }

    const { recipientEmail, draft, subject } = validation;

    // 3. Mark state as APPROVED and transition into DISPATCHING
    const dispatchAttemptId = `disp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await dbService.markOpportunityApproved(opportunityId);
    await dbService.markOpportunityDispatching(opportunityId, dispatchAttemptId, recipientEmail);

    const providerConfig = await this.getProviderConfig();
    const activeProvider = providerConfig.activeProvider;

    // 4. Execute Dispatch via Active Provider
    if (activeProvider === 'gmail') {
      return this.dispatchViaGmail(opp, recipientEmail, subject, draft, providerConfig);
    } else {
      return this.dispatchViaResend(opp, recipientEmail, subject, draft, providerConfig);
    }
  }

  /**
   * Dispatches via Gmail SMTP using Google App Password.
   */
  private async dispatchViaGmail(
    opp: Opportunity,
    recipientEmail: string,
    subject: string,
    draft: string,
    config: EmailProviderConfig
  ): Promise<EmailDispatchResult> {
    if (!config.gmail.configured) {
      const errorMsg = 'Gmail SMTP is not configured. Please add your Gmail User and Google App Password in the Admin Dashboard.';
      await dbService.markOpportunitySendFailed(opp.id, errorMsg, recipientEmail);
      return {
        success: false,
        provider: 'gmail',
        recipientEmail,
        subject,
        error: errorMsg,
      };
    }

    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: config.gmail.user,
          pass: config.gmail.appPassword,
        },
        connectionTimeout: 15000,
      });

      const formattedHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
          <p style="white-space: pre-line; margin-bottom: 20px;">${draft.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #64748b; line-height: 1.4;">
            ApexGrowth Growth Advisory • Strategic CRO & Funnel Diagnostics<br />
            Sent directly via verified sender <code>${config.gmail.user}</code>
          </p>
        </div>
      `;

      const info = await transporter.sendMail({
        from: `ApexGrowth Growth Team <${config.gmail.user}>`,
        to: recipientEmail,
        subject,
        text: draft,
        html: formattedHtml,
      });

      const messageId = info.messageId || `gmail_${Date.now()}`;
      const sentAt = new Date().toISOString();

      // STRICT STATE: mark as SENT only after SMTP confirms acceptance
      await dbService.markOpportunitySent(opp.id, {
        messageId,
        provider: 'gmail',
        recipientEmail,
        subject,
        channel: 'Gmail SMTP',
      });

      return {
        success: true,
        provider: 'gmail',
        messageId,
        recipientEmail,
        subject,
        sentAt,
      };
    } catch (err: any) {
      const errorDetail = `Gmail SMTP Error: ${err?.message || 'Failed to deliver message via Gmail SMTP'}`;
      await dbService.markOpportunitySendFailed(opp.id, errorDetail, recipientEmail);
      return {
        success: false,
        provider: 'gmail',
        recipientEmail,
        subject,
        error: errorDetail,
      };
    }
  }

  /**
   * Dispatches via Resend REST API.
   */
  private async dispatchViaResend(
    opp: Opportunity,
    recipientEmail: string,
    subject: string,
    draft: string,
    config: EmailProviderConfig
  ): Promise<EmailDispatchResult> {
    if (!config.resend.configured) {
      const errorMsg = 'Resend API Key is not configured. Please add your RESEND_API_KEY in the Admin Dashboard.';
      await dbService.markOpportunitySendFailed(opp.id, errorMsg, recipientEmail);
      return {
        success: false,
        provider: 'resend',
        recipientEmail,
        subject,
        error: errorMsg,
      };
    }

    try {
      const formattedHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
          <p style="white-space: pre-line; margin-bottom: 20px;">${draft.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #64748b; line-height: 1.4;">
            ApexGrowth Growth Advisory • Strategic CRO & Funnel Diagnostics<br />
            Dispatched via Resend Gateway
          </p>
        </div>
      `;

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.resend.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: config.resend.fromEmail,
          to: [recipientEmail],
          subject,
          text: draft,
          html: formattedHtml,
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as { id: string };
        const messageId = data.id;
        const sentAt = new Date().toISOString();

        // STRICT STATE: mark as SENT only after Resend confirms acceptance
        await dbService.markOpportunitySent(opp.id, {
          messageId,
          resendId: messageId,
          provider: 'resend',
          recipientEmail,
          subject,
          channel: 'Resend',
        });

        return {
          success: true,
          provider: 'resend',
          messageId,
          recipientEmail,
          subject,
          sentAt,
        };
      }

      let errDetail = '';
      try {
        const errJson = (await response.json()) as any;
        errDetail = errJson.message || errJson.error || JSON.stringify(errJson);
      } catch {
        errDetail = await response.text();
      }

      const errorMsg = `Resend API Error (${response.status}): ${errDetail}`;
      await dbService.markOpportunitySendFailed(opp.id, errorMsg, recipientEmail);
      return {
        success: false,
        provider: 'resend',
        recipientEmail,
        subject,
        error: errorMsg,
      };
    } catch (err: any) {
      const errorMsg = `Network dispatch failure: ${err?.message || 'Unknown network error'}`;
      await dbService.markOpportunitySendFailed(opp.id, errorMsg, recipientEmail);
      return {
        success: false,
        provider: 'resend',
        recipientEmail,
        subject,
        error: errorMsg,
      };
    }
  }
}

export const emailOutreachDispatcher = new EmailOutreachDispatcher();
