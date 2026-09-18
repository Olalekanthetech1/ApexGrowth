import { Opportunity } from '../../../src/types/index.js';

export interface ResendDispatchResult {
  success: boolean;
  resendId?: string;
  recipientEmail?: string;
  subject?: string;
  provider: string;
  sentAt?: string;
  error?: string;
}

export class ResendDispatchService {
  /**
   * Validates whether an opportunity is eligible for direct email dispatch.
   */
  public validateOpportunityForSending(opportunity: Opportunity): {
    valid: boolean;
    recipientEmail?: string;
    draft?: string;
    error?: string;
  } {
    // 1. Validate recipient email
    let email = '';
    const emailContact = (opportunity.publicContacts || []).find(
      (c) => c.type === 'email' && c.value && c.value.includes('@')
    );
    if (emailContact && emailContact.value) {
      email = emailContact.value.trim();
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
        error: 'No public email address found in prospect contacts.',
      };
    }

    // 2. Validate outreach draft
    const draft = (opportunity.refinedDraft || opportunity.outreachDraft || '').trim();
    if (!draft) {
      return {
        valid: false,
        recipientEmail: email,
        error: 'Outreach draft is empty.',
      };
    }

    return {
      valid: true,
      recipientEmail: email,
      draft,
    };
  }

  /**
   * Dispatches the outreach email directly to the prospect via Resend API.
   * STRICT: Never returns simulated success. Single source of truth is Resend API response.
   */
  public async dispatchOutreachEmail(opportunity: Opportunity): Promise<ResendDispatchResult> {
    const validation = this.validateOpportunityForSending(opportunity);
    if (!validation.valid || !validation.recipientEmail || !validation.draft) {
      return {
        success: false,
        recipientEmail: validation.recipientEmail,
        provider: 'Resend',
        error: validation.error || 'Validation failed before sending.',
      };
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      return {
        success: false,
        recipientEmail: validation.recipientEmail,
        provider: 'Resend',
        error: 'RESEND_API_KEY is not configured in environment secrets.',
      };
    }

    const recipientEmail = validation.recipientEmail;
    const draft = validation.draft;
    const subject =
      opportunity.emailSubject ||
      `Quick optimization diagnostic for ${opportunity.businessName || opportunity.prospectName}`;
    const fromAddress =
      process.env.RESEND_FROM_EMAIL || 'ApexGrowth Growth Team <onboarding@resend.dev>';

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [recipientEmail],
          subject,
          text: draft,
          html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
            <p style="white-space: pre-line;">${draft.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="font-size: 12px; color: #64748b;">Dispatched via ApexGrowth Assistant • Verified Commercial Outreach</p>
          </div>`,
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as { id: string };
        return {
          success: true,
          resendId: data.id,
          recipientEmail,
          subject,
          provider: 'Resend',
          sentAt: new Date().toISOString(),
        };
      }

      let errDetail = '';
      try {
        const errJson = (await response.json()) as any;
        errDetail = errJson.message || errJson.error || JSON.stringify(errJson);
      } catch {
        errDetail = await response.text();
      }

      return {
        success: false,
        recipientEmail,
        subject,
        provider: 'Resend',
        error: `Resend API error (${response.status}): ${errDetail}`,
      };
    } catch (err: any) {
      return {
        success: false,
        recipientEmail,
        subject,
        provider: 'Resend',
        error: `Network dispatch failure: ${err?.message || 'Unknown network error'}`,
      };
    }
  }
}

export const resendDispatchService = new ResendDispatchService();
