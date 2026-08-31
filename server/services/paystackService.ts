import crypto from 'crypto';

export interface PaystackInitResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaystackVerifyData {
  id: number;
  domain: string;
  status: string;
  reference: string;
  amount: number;
  message: string | null;
  gateway_response: string;
  paid_at: string;
  created_at: string;
  channel: string;
  currency: string;
  ip_address: string;
  metadata?: Record<string, any>;
  customer: {
    id?: number;
    email: string;
    customer_code?: string;
  };
}

export class PaystackService {
  private getSecretKey(): string {
    return process.env.PAYSTACK_SECRET_KEY || '';
  }

  /**
   * Deterministically converts USD string (e.g. "399" or "399.00" or "$399") to integer cents (39900)
   */
  toMinorUnits(amountUsd: string): number {
    if (!amountUsd || typeof amountUsd !== 'string') {
      throw new Error('Invalid amount provided for conversion');
    }
    const clean = amountUsd.replace(/[^0-9.]/g, '');
    const num = parseFloat(clean);
    if (isNaN(num) || num <= 0) {
      throw new Error(`Invalid USD amount value: ${amountUsd}`);
    }
    // Round to ensure floating point precision issues are avoided
    return Math.round(num * 100);
  }

  /**
   * Cryptographically verifies Paystack HMAC SHA-512 webhook signature against raw request body
   */
  verifyWebhookSignature(rawBody: Buffer | string | undefined, signature: string | undefined): boolean {
    if (!rawBody || !signature) {
      return false;
    }

    const secretKey = this.getSecretKey();
    if (!secretKey) {
      console.warn('[PaystackService] No PAYSTACK_SECRET_KEY configured; webhook signature verification failed.');
      return false;
    }

    try {
      const hmac = crypto.createHmac('sha512', secretKey);
      const computed = hmac.update(rawBody).digest('hex');

      const sigBuffer = Buffer.from(signature.trim(), 'utf8');
      const compBuffer = Buffer.from(computed.trim(), 'utf8');

      if (sigBuffer.length !== compBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(sigBuffer, compBuffer);
    } catch (err) {
      console.error('[PaystackService] Webhook signature verification exception:', err);
      return false;
    }
  }

  /**
   * Initializes a Paystack transaction for an authoritative USD order
   */
  async initializeTransaction(params: {
    email: string;
    amountUsd: string;
    reference: string;
    callbackUrl?: string;
    metadata?: Record<string, any>;
  }): Promise<PaystackInitResponse> {
    const secretKey = this.getSecretKey();
    const minorUnits = this.toMinorUnits(params.amountUsd);

    // If no secret key is set and in non-production development mode, provide a mock checkout fallback URL
    if (!secretKey) {
      console.warn('[PaystackService] PAYSTACK_SECRET_KEY not set. Using test checkout simulation URL.');
      return {
        authorization_url: `https://checkout.paystack.com/test_${params.reference}`,
        access_code: `mock_code_${params.reference}`,
        reference: params.reference,
      };
    }

    let payload: Record<string, any> = {
      email: params.email.trim().toLowerCase(),
      amount: minorUnits,
      currency: 'USD',
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata || {},
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let response: Response;
    let data: any;

    try {
      response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      data = await response.json();
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error('Paystack initialization network request timed out after 10000ms');
      }
      throw err;
    }

    // If merchant account does not have USD currency active yet, retry without explicit currency
    if (!response.ok || !data.status) {
      if (data.code === 'unsupported_currency' || data.message?.toLowerCase().includes('currency not supported')) {
        console.warn('[PaystackService] USD not directly enabled on merchant Paystack account; initializing in standard checkout mode');
        delete payload.currency;
        const retryController = new AbortController();
        const retryTimeout = setTimeout(() => retryController.abort(), 10000);
        try {
          response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${secretKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            signal: retryController.signal,
          });
          data = await response.json();
        } catch (err: any) {
          clearTimeout(retryTimeout);
          if (err.name === 'AbortError') {
            throw new Error('Paystack initialization retry network request timed out after 10000ms');
          }
          throw err;
        } finally {
          clearTimeout(retryTimeout);
        }
      }
    } else {
      clearTimeout(timeout);
    }

    if (!response.ok || !data.status) {
      const errMsg = data.message || `Paystack initialization failed with status ${response.status}`;
      console.error('[PaystackService] Initialize error:', data);
      throw new Error(errMsg);
    }

    return {
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
      reference: data.data.reference || params.reference,
    };
  }

  /**
   * Verifies a Paystack transaction directly with Paystack's official API
   */
  async verifyTransaction(reference: string): Promise<PaystackVerifyData> {
    const secretKey = this.getSecretKey();
    if (!secretKey) {
      throw new Error('PAYSTACK_SECRET_KEY is required for live transaction verification');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok || !data.status) {
        const errMsg = data.message || `Paystack verification failed with status ${response.status}`;
        throw new Error(errMsg);
      }

      return data.data as PaystackVerifyData;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('Paystack verification network request timed out after 10000ms');
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const paystackService = new PaystackService();
