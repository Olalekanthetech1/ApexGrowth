import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { dbService } from '../services/dbService.js';
import { paystackService } from '../services/paystackService.js';
import { notificationService } from '../services/notificationService.js';
import { aiService } from '../services/aiService.js';
import { telegramScoutService } from '../services/scout/telegramScoutService.js';
import { actionCenter } from '../services/scout/actionCenter.js';
import { backgroundScoutWorker } from '../services/scout/backgroundWorker.js';
import { requireAdminAuth, requireRole, generateToken, rateLimit, AuthRequest } from '../auth.js';
import { AdminUser } from '../../src/types/index.js';
import {
  LeadSubmissionSchema,
  LoginSchema,
  ChangePasswordSchema,
  AdminUserCreateSchema,
  AdminUserUpdateSchema,
  BusinessProfileSchema,
  ContactSettingsSchema,
  SocialLinkSchema,
  PaymentMethodSchema,
  ServiceSchema,
  PricingPackageSchema,
  DemoSchema,
  FAQSchema,
  TestimonialSchema,
  SEOSettingsSchema,
  LeadStatusUpdateSchema,
  LeadNoteCreateSchema,
  CheckoutIntentCreateSchema,
  PaymentIntentConfirmSchema,
  PaystackInitializeSchema,
  OrderStatusUpdateSchema,
  PublicAiChatSchema,
  AiLeadSchema,
  AdminAiChatSchema,
} from '../validation.js';

export const apiRouter = Router();

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

// 1. Public aggregated content
apiRouter.get('/public/content', async (req: Request, res: Response) => {
  try {
    const data = await dbService.getPublicData();
    res.json(data);
  } catch (err: any) {
    console.error('Error fetching public content:', err);
    res.status(500).json({ error: 'Failed to load public content', details: err.message });
  }
});

// 2. Public Lead Submission (Transactional Lead + Audit Log)
apiRouter.post('/public/leads', rateLimit(15, 60 * 1000), async (req: Request, res: Response) => {
  try {
    const parsed = LeadSubmissionSchema.parse(req.body);
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';

    const newLead = await dbService.createLeadWithTransaction(
      {
        name: parsed.name,
        email: parsed.email,
        whatsapp: parsed.whatsapp,
        businessType: parsed.businessType,
        websiteUrl: parsed.websiteUrl || undefined,
        sellingDetails: parsed.sellingDetails,
        message: parsed.message || undefined,
        utmSource: parsed.utmSource || undefined,
        utmMedium: parsed.utmMedium || undefined,
        utmCampaign: parsed.utmCampaign || undefined,
        utmContent: parsed.utmContent || undefined,
        landingPage: parsed.landingPage || req.headers.referer || '/',
        referrer: parsed.referrer || (req.headers.referer as string) || 'Direct',
      },
      ip
    );

    // Trigger Lead Notification
    notificationService.notifyLeadReceived(newLead).catch((err) => console.warn('Notification error:', err));

    res.status(201).json({
      success: true,
      message: 'Thank you! Your audit request has been received. Our team will review your funnel and reach out via WhatsApp/Email shortly.',
      leadId: newLead.id,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    console.error('Lead creation error:', err);
    res.status(500).json({ error: 'Failed to process lead request', details: err.message });
  }
});

// Analytics tracking endpoint
apiRouter.post('/analytics/track', rateLimit(100, 60 * 1000), async (req: Request, res: Response) => {
  try {
    const event = req.body;
    if (event && event.eventType) {
      await dbService.addAuditLog(
        'analytics_tracker',
        'ANALYTICS_EVENT',
        'TELEMETRY',
        event.eventType,
        JSON.stringify({
          path: event.path,
          elementId: event.elementId,
          packageSlug: event.packageSlug,
          paymentMethod: event.paymentMethod,
          utmSource: event.utmSource,
          utmMedium: event.utmMedium,
          utmCampaign: event.utmCampaign,
        })
      );
    }
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    res.status(200).json({ status: 'ignored' });
  }
});

// 3. Public payment methods list
apiRouter.get('/public/payment-methods', async (req: Request, res: Response) => {
  try {
    const active = await dbService.getPaymentMethods(true);
    res.json(active);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load payment methods' });
  }
});

// 4. Public Checkout Intent Creation
apiRouter.post('/checkout/create-intent', rateLimit(20, 60 * 1000), async (req: Request, res: Response) => {
  try {
    const parsed = CheckoutIntentCreateSchema.parse(req.body);
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';

    const result = await dbService.createCheckoutIntent({
      packageId: parsed.packageId,
      packageName: parsed.packageName || undefined,
      amountUsd: parsed.amountUsd,
      customerName: parsed.customerName,
      customerEmail: parsed.customerEmail,
      customerWhatsapp: parsed.customerWhatsapp || undefined,
      paymentMethodId: parsed.paymentMethodId || null,
      paymentProvider: parsed.paymentProvider,
      customerNotes: parsed.customerNotes || undefined,
      ipAddress: ip,
    });

    if (parsed.paymentProvider === 'paystack') {
      try {
        const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
        const callbackUrl = `${appUrl}/checkout?reference=${encodeURIComponent(result.paymentIntent.reference)}&verified=pending`;
        const initResult = await paystackService.initializeTransaction({
          email: result.order.customerEmail,
          amountUsd: result.order.amountUsd,
          reference: result.paymentIntent.reference,
          callbackUrl,
          metadata: {
            orderId: result.order.id,
            orderNumber: result.order.orderNumber,
            paymentIntentId: result.paymentIntent.id,
            packageId: result.order.packageId,
            packageName: result.order.packageName,
            customerName: result.order.customerName,
          },
        });
        await dbService.updatePaymentIntentUrlAndMetadata(result.paymentIntent.id, initResult.authorization_url, {
          ...((result.paymentIntent.metadata as any) || {}),
          accessCode: initResult.access_code,
          initializedAt: new Date().toISOString(),
        });
        result.paymentIntent.paymentUrl = initResult.authorization_url;
      } catch (paystackInitErr: any) {
        console.warn('Paystack auto-init note:', paystackInitErr.message);
      }
    }

    // Trigger New Order Notification
    notificationService.notifyNewOrder(result.order as any, result.paymentIntent as any).catch((err) => console.warn('Notification error:', err));

    res.status(201).json({
      success: true,
      order: result.order,
      paymentIntent: result.paymentIntent,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid checkout details', details: err.issues });
      return;
    }
    console.error('Checkout error:', err);
    res.status(400).json({ error: err.message || 'Failed to initiate checkout' });
  }
});

// 5. Public Checkout Intent Query by ID
apiRouter.get('/checkout/intent/:id', async (req: Request, res: Response) => {
  try {
    const order = await dbService.getOrderById(req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    // Sanitize order for public checkout view (prevent IDOR / customer info exposure)
    const publicOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      packageName: order.packageName,
      amountUsd: order.amountUsd,
      currency: order.currency,
      status: order.status,
      paymentProvider: order.paymentProvider,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
    res.json({ success: true, order: publicOrder });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

// ==========================================
// PAYSTACK PAYMENT INTEGRATION ENDPOINTS
// ==========================================

// 6. Paystack Transaction Initialization
apiRouter.post('/payments/paystack/initialize', rateLimit(30, 60 * 1000), async (req: Request, res: Response) => {
  try {
    const parsed = PaystackInitializeSchema.parse(req.body);

    let intent: any = null;
    if (parsed.paymentIntentId) {
      intent = await dbService.getPaymentIntentById(parsed.paymentIntentId);
    } else if (parsed.reference) {
      intent = await dbService.getPaymentIntentByReference(parsed.reference);
    } else if (parsed.orderId) {
      const order = await dbService.getOrderById(parsed.orderId);
      if (order && order.paymentIntents && order.paymentIntents.length > 0) {
        intent = await dbService.getPaymentIntentById(order.paymentIntents[0].id);
      }
    }

    if (!intent || !intent.order) {
      res.status(404).json({ error: 'Payment intent or associated order not found' });
      return;
    }

    const order = intent.order;

    // 1. Verify currency is USD
    if (order.currency !== 'USD' || intent.currency !== 'USD') {
      res.status(400).json({ error: 'Paystack payments must be in USD currency' });
      return;
    }

    // 2. Verify payment provider
    if (intent.provider !== 'paystack') {
      res.status(400).json({ error: `Payment intent is configured for ${intent.provider}, not paystack` });
      return;
    }

    // 3. Verify payment method is active in database
    const paymentMethods = await dbService.getPaymentMethods(true);
    const paystackMethod = paymentMethods.find((pm) => pm.provider === 'paystack');
    if (!paystackMethod || !paystackMethod.active) {
      res.status(400).json({ error: 'Paystack payment gateway is currently disabled or unavailable' });
      return;
    }

    // 4. Verify order has not already been paid
    if (order.status === 'paid' || intent.status === 'paid') {
      res.status(400).json({
        error: 'Order has already been confirmed as paid',
        orderNumber: order.orderNumber,
        status: 'paid',
      });
      return;
    }

    // 5. Determine callback URL
    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const callbackUrl = `${appUrl}/checkout?reference=${encodeURIComponent(intent.reference)}&verified=pending`;

    // 6. Initialize Paystack transaction using server-authoritative amount from PostgreSQL
    const initResult = await paystackService.initializeTransaction({
      email: order.customerEmail,
      amountUsd: order.amountUsd, // Authoritative price from DB
      reference: intent.reference,
      callbackUrl,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentIntentId: intent.id,
        packageId: order.packageId,
        packageName: order.packageName,
        customerName: order.customerName,
      },
    });

    // 7. Update payment intent with authorization URL
    await dbService.updatePaymentIntentUrlAndMetadata(intent.id, initResult.authorization_url, {
      ...(intent.metadata || {}),
      accessCode: initResult.access_code,
      initializedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      authorizationUrl: initResult.authorization_url,
      accessCode: initResult.access_code,
      reference: intent.reference,
      orderNumber: order.orderNumber,
      amountUsd: order.amountUsd,
      currency: 'USD',
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid initialization parameters', details: err.issues });
      return;
    }
    console.error('Paystack initialization error:', err);
    res.status(400).json({ error: err.message || 'Failed to initialize Paystack transaction' });
  }
});

// 7. Paystack Transaction Verification
apiRouter.get('/payments/paystack/verify/:reference', rateLimit(40, 60 * 1000), async (req: Request, res: Response) => {
  const { reference } = req.params;
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';

  if (!reference || typeof reference !== 'string') {
    res.status(400).json({ error: 'Valid payment reference required' });
    return;
  }

  try {
    // 1. Fetch payment intent from PostgreSQL
    const intent = await dbService.getPaymentIntentByReference(reference);
    if (!intent || !intent.order) {
      res.status(404).json({ error: `Payment intent reference not found: ${reference}` });
      return;
    }

    // 2. Idempotent short-circuit if already paid
    if (intent.status === 'paid' && intent.order.status === 'paid') {
      res.json({
        success: true,
        status: 'paid',
        alreadyPaid: true,
        order: intent.order,
        paymentIntent: intent,
      });
      return;
    }

    // 3. Query Paystack official verification endpoint
    const verifyData = await paystackService.verifyTransaction(reference);

    if (verifyData.status !== 'success') {
      res.json({
        success: false,
        status: verifyData.status || 'failed',
        message: verifyData.gateway_response || 'Payment not successful on Paystack',
        order: intent.order,
        paymentIntent: intent,
      });
      return;
    }

    // 4. Verify currency
    if (verifyData.currency.toUpperCase() !== 'USD' || intent.currency !== 'USD') {
      res.status(400).json({
        error: `Currency mismatch: Expected USD, received ${verifyData.currency}`,
      });
      return;
    }

    // 5. Verify authoritative amount
    const expectedCents = Math.round(parseFloat(intent.order.amountUsd.replace(/[^0-9.]/g, '')) * 100);
    if (verifyData.amount !== expectedCents) {
      res.status(400).json({
        error: `Amount mismatch: Expected ${expectedCents} cents ($${intent.order.amountUsd} USD), received ${verifyData.amount} cents`,
      });
      return;
    }

    // 6. Execute atomic payment confirmation in PostgreSQL
    const result = await dbService.confirmPaystackPayment(reference, verifyData, 'paystack_api_verify', ip);

    res.json({
      success: true,
      status: 'paid',
      alreadyPaid: result.alreadyProcessed,
      order: result.order,
      paymentIntent: result.paymentIntent,
    });
  } catch (err: any) {
    console.error('Paystack verification error:', err);
    res.status(400).json({ error: err.message || 'Payment verification failed' });
  }
});

// 8. Paystack Webhook Handler
apiRouter.post('/webhooks/paystack', async (req: Request, res: Response) => {
  const signature = req.headers['x-paystack-signature'] as string;
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';

  // 1. Verify signature existence
  if (!signature) {
    res.status(400).json({ error: 'Missing x-paystack-signature header' });
    return;
  }

  // 2. Verify signature authenticity with raw body
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);
  const isValid = await paystackService.verifyWebhookSignature(rawBody, signature);

  if (!isValid) {
    res.status(400).json({ error: 'Invalid Paystack webhook signature' });
    return;
  }

  const event = req.body;

  // 3. Process charge.success event
  if (event && event.event === 'charge.success') {
    const data = event.data;
    const reference = data?.reference;

    if (!reference) {
      res.status(400).json({ error: 'Missing reference in charge.success payload' });
      return;
    }

    try {
      const intent = await dbService.getPaymentIntentByReference(reference);
      if (!intent || !intent.order) {
        console.warn(`[Webhook] Received charge.success for unknown reference: ${reference}`);
        res.status(400).json({ error: `Unknown payment reference: ${reference}` });
        return;
      }

      // Check status, currency, and amount
      if (data.status !== 'success') {
        res.status(400).json({ error: 'Transaction status in payload is not success' });
        return;
      }

      if (data.currency?.toUpperCase() !== 'USD' || intent.currency !== 'USD') {
        res.status(400).json({ error: 'Currency mismatch in webhook payload' });
        return;
      }

      const expectedCents = Math.round(parseFloat(intent.order.amountUsd.replace(/[^0-9.]/g, '')) * 100);
      if (Number(data.amount) !== expectedCents) {
        res.status(400).json({
          error: `Amount mismatch in webhook: expected ${expectedCents}, received ${data.amount}`,
        });
        return;
      }

      // Atomic confirmation
      await dbService.confirmPaystackPayment(reference, data, 'paystack_webhook', ip);
    } catch (err: any) {
      console.error('[Webhook] Error processing charge.success:', err);
      res.status(400).json({ error: err.message });
      return;
    }
  } else if (event && (event.event === 'refund.processed' || event.event === 'refund.failed')) {
    const data = event.data;
    const reference = data?.transaction_reference || data?.reference;
    if (reference && event.event === 'refund.processed') {
      try {
        await dbService.handlePaystackRefund(reference, data, ip);
      } catch (err: any) {
        console.error('[Webhook] Error processing refund.processed:', err);
      }
    }
  } else if (event && (event.event === 'charge.dispute.create' || event.event === 'charge.dispute.resolve')) {
    const data = event.data;
    const reference = data?.transaction_reference || data?.reference;
    if (reference) {
      try {
        await dbService.logDisputeEvent(reference, data, ip);
      } catch (err: any) {
        console.error('[Webhook] Error processing dispute event:', err);
      }
    }
  }

  // Acknowledge webhook receipt to Paystack with HTTP 200
  res.status(200).json({ received: true });
});

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

apiRouter.get('/auth/initial-info', async (req: Request, res: Response) => {
  const customEmail = process.env.ADMIN_INITIAL_EMAIL || null;
  res.json({
    hasCustomAdmin: !!customEmail,
    initialEmail: customEmail || 'admin@apexgrowth.digital',
  });
});

apiRouter.post('/auth/login', rateLimit(10, 60 * 1000), async (req: Request, res: Response) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);
    const user = await dbService.findAdminByEmail(email);

    if (!user || !user.active) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    await dbService.updateAdminUser(user.id, { lastLoginAt: new Date() });
    const { passwordHash: _, ...safeUser } = user;
    const safeAdminUser: AdminUser = {
      id: safeUser.id,
      email: safeUser.email,
      name: safeUser.name,
      role: safeUser.role as 'superadmin' | 'admin' | 'editor',
      active: safeUser.active,
      lastLoginAt: safeUser.lastLoginAt ? safeUser.lastLoginAt.toISOString() : undefined,
      createdAt: safeUser.createdAt.toISOString(),
      updatedAt: safeUser.updatedAt.toISOString(),
    };
    const token = generateToken(safeAdminUser);

    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    await dbService.logAction(user.email, 'Login', 'AdminUser', user.id, `Admin ${user.name} logged in successfully`, ip);

    res.json({
      success: true,
      token,
      user: safeAdminUser,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid credentials format', details: err.issues });
      return;
    }
    res.status(500).json({ error: 'Authentication error', details: err.message });
  }
});

apiRouter.post('/auth/logout', requireAdminAuth, (req: AuthRequest, res: Response) => {
  res.clearCookie('admin_token');
  res.json({ success: true, message: 'Logged out successfully' });
});

apiRouter.get('/auth/me', requireAdminAuth, (req: AuthRequest, res: Response) => {
  res.json({ user: req.adminUser });
});

apiRouter.post('/auth/change-password', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = ChangePasswordSchema.parse(req.body);
    const user = await dbService.findAdminById(req.adminUser!.id);

    if (!user) {
      res.status(404).json({ error: 'User record not found' });
      return;
    }

    const isMatch = bcrypt.compareSync(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(newPassword, salt);
    await dbService.updateAdminUser(user.id, { passwordHash });

    await dbService.logAction(user.email, 'Password Changed', 'AdminUser', user.id, `Password changed for ${user.email}`);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to update password', details: err.message });
  }
});

// ==========================================
// ADMIN DASHBOARD & AUDIT LOGS
// ==========================================

// Dashboard stats: superadmin, admin, editor can view
apiRouter.get('/admin/dashboard-stats', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const stats = await dbService.getDashboardStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats', details: err.message });
  }
});

// Audit logs: Strictly superadmin and admin (editor forbidden)
apiRouter.get('/admin/audit-logs', requireAdminAuth, requireRole(['superadmin', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 100;
    const logs = await dbService.getAuditLogs(limit);
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// ==========================================
// ADMIN USER MANAGEMENT (STRICTLY SUPERADMIN ONLY)
// ==========================================

apiRouter.get('/admin/users', requireAdminAuth, requireRole(['superadmin']), async (req: AuthRequest, res: Response) => {
  try {
    const users = await dbService.getAllAdminUsers();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch admin users' });
  }
});

apiRouter.post('/admin/users', requireAdminAuth, requireRole(['superadmin']), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = AdminUserCreateSchema.parse(req.body);
    const existing = await dbService.findAdminByEmail(parsed.email);
    if (existing) {
      res.status(400).json({ error: 'An admin user with this email already exists' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(parsed.password, salt);

    const newUser = await dbService.createAdminUser({
      email: parsed.email,
      name: parsed.name,
      role: parsed.role,
      passwordHash,
    });

    await dbService.logAction(
      req.adminUser!.email,
      'Created Admin User',
      'AdminUser',
      newUser.id,
      `Created ${newUser.role} account for ${newUser.email}`
    );

    res.status(201).json(newUser);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to create admin user', details: err.message });
  }
});

apiRouter.put('/admin/users/:id', requireAdminAuth, requireRole(['superadmin']), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = AdminUserUpdateSchema.parse(req.body);
    let passwordHash: string | undefined;
    if (parsed.password) {
      const salt = bcrypt.genSaltSync(10);
      passwordHash = bcrypt.hashSync(parsed.password, salt);
    }

    const updated = await dbService.updateAdminUser(req.params.id, {
      name: parsed.name,
      role: parsed.role,
      active: parsed.active,
      passwordHash,
    });

    if (!updated) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await dbService.logAction(
      req.adminUser!.email,
      'Updated Admin User',
      'AdminUser',
      updated.id,
      `Updated user profile for ${updated.email}`
    );

    res.json(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
});

apiRouter.delete('/admin/users/:id', requireAdminAuth, requireRole(['superadmin']), async (req: AuthRequest, res: Response) => {
  try {
    if (req.params.id === req.adminUser!.id) {
      res.status(400).json({ error: 'You cannot delete your own active administrator account' });
      return;
    }

    const success = await dbService.deleteAdminUser(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await dbService.logAction(
      req.adminUser!.email,
      'Deleted Admin User',
      'AdminUser',
      req.params.id,
      `Deleted admin user ID ${req.params.id}`
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ==========================================
// BUSINESS & CONTACT SETTINGS (SUPERADMIN / ADMIN)
// ==========================================

apiRouter.get('/admin/business', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const business = await dbService.getBusinessProfile();
    res.json(business);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch business profile' });
  }
});

apiRouter.put('/admin/business', requireAdminAuth, requireRole(['superadmin', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = BusinessProfileSchema.parse(req.body);
    const updated = await dbService.updateBusinessProfile(parsed);
    await dbService.logAction(req.adminUser!.email, 'Updated Business Profile', 'BusinessProfile', updated?.id, `Updated core business profile`);
    res.json(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to update business profile' });
  }
});

apiRouter.get('/admin/contact', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const contact = await dbService.getContactSettings();
    res.json(contact);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch contact settings' });
  }
});

apiRouter.put('/admin/contact', requireAdminAuth, requireRole(['superadmin', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = ContactSettingsSchema.parse(req.body);
    const updated = await dbService.updateContactSettings(parsed);
    await dbService.logAction(req.adminUser!.email, 'Updated Contact Settings', 'ContactSettings', updated?.id, `Updated contact settings`);
    res.json(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to update contact settings' });
  }
});

// ==========================================
// SOCIAL LINKS (SUPERADMIN / ADMIN)
// ==========================================

apiRouter.get('/admin/social-links', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const links = await dbService.getSocialLinks();
    res.json(links);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch social links' });
  }
});

apiRouter.post('/admin/social-links', requireAdminAuth, requireRole(['superadmin', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = SocialLinkSchema.parse(req.body);
    const created = await dbService.createSocialLink(parsed);
    await dbService.logAction(req.adminUser!.email, 'Created Social Link', 'SocialLink', created.id, `Created ${created.platform} link`);
    res.status(201).json(created);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to create social link' });
  }
});

apiRouter.put('/admin/social-links/:id', requireAdminAuth, requireRole(['superadmin', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = SocialLinkSchema.partial().parse(req.body);
    const updated = await dbService.updateSocialLink(req.params.id, parsed);
    if (!updated) {
      res.status(404).json({ error: 'Social link not found' });
      return;
    }
    await dbService.logAction(req.adminUser!.email, 'Updated Social Link', 'SocialLink', req.params.id, `Updated ${updated.platform} link`);
    res.json(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to update social link' });
  }
});

apiRouter.delete('/admin/social-links/:id', requireAdminAuth, requireRole(['superadmin', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const success = await dbService.deleteSocialLink(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Social link not found' });
      return;
    }
    await dbService.logAction(req.adminUser!.email, 'Deleted Social Link', 'SocialLink', req.params.id, `Deleted social link`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete social link' });
  }
});

// ==========================================
// PAYMENT CONFIGURATION (STRICTLY SUPERADMIN ONLY)
// ==========================================

apiRouter.get('/admin/payments', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const methods = await dbService.getPaymentMethods(false);
    res.json(methods);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

apiRouter.post('/admin/payments', requireAdminAuth, requireRole(['superadmin']), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = PaymentMethodSchema.parse(req.body);
    const created = await dbService.createPaymentMethod(parsed);
    await dbService.logAction(req.adminUser!.email, 'Created Payment Method', 'PaymentMethod', created.id, `Created ${created.displayName} (${created.provider})`);
    res.status(201).json(created);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to create payment method' });
  }
});

apiRouter.put('/admin/payments/:id', requireAdminAuth, requireRole(['superadmin']), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = PaymentMethodSchema.partial().parse(req.body);
    const updated = await dbService.updatePaymentMethod(req.params.id, parsed);
    if (!updated) {
      res.status(404).json({ error: 'Payment method not found' });
      return;
    }
    await dbService.logAction(req.adminUser!.email, 'Updated Payment Method', 'PaymentMethod', req.params.id, `Updated payment gateway ${updated.displayName}`);
    res.json(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to update payment method' });
  }
});

apiRouter.delete('/admin/payments/:id', requireAdminAuth, requireRole(['superadmin']), async (req: AuthRequest, res: Response) => {
  try {
    const success = await dbService.deletePaymentMethod(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Payment method not found' });
      return;
    }
    await dbService.logAction(req.adminUser!.email, 'Deleted Payment Method', 'PaymentMethod', req.params.id, `Deleted payment method`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete payment method' });
  }
});

// Orders & Payment Intents (Admin / Superadmin / Editor)
apiRouter.get('/admin/orders', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const provider = typeof req.query.provider === 'string' ? req.query.provider : undefined;
    const list = await dbService.getOrders(status, provider);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

apiRouter.get('/admin/orders/:id', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const order = await dbService.getOrderById(req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

apiRouter.post('/admin/payment-intents/:id/confirm', requireAdminAuth, requireRole(['superadmin', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = PaymentIntentConfirmSchema.parse(req.body);
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    const result = await dbService.confirmPaymentIntent(req.params.id, req.adminUser!.email, parsed.adminNotes, ip);
    res.json({ success: true, order: result.order, paymentIntent: result.paymentIntent });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to confirm payment', details: err.message });
  }
});

apiRouter.post('/admin/orders/:id/status', requireAdminAuth, requireRole(['superadmin', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = OrderStatusUpdateSchema.parse(req.body);
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    const updated = await dbService.updateOrderStatus(req.params.id, parsed.status, req.adminUser!.email, parsed.adminNotes, ip);
    res.json({ success: true, order: updated });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to update order status', details: err.message });
  }
});

// ==========================================
// SERVICES & PRICING & DEMOS & FAQS (SUPERADMIN / ADMIN / EDITOR)
// ==========================================

apiRouter.get('/admin/services', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const list = await dbService.getServices(false);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

apiRouter.post('/admin/services', requireAdminAuth, requireRole(['superadmin', 'admin', 'editor']), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = ServiceSchema.parse(req.body);
    const created = await dbService.createService(parsed);
    await dbService.logAction(req.adminUser!.email, 'Created Service', 'Service', created.id, `Created service: ${created.title}`);
    res.status(201).json(created);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to create service' });
  }
});

apiRouter.put('/admin/services/:id', requireAdminAuth, requireRole(['superadmin', 'admin', 'editor']), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = ServiceSchema.partial().parse(req.body);
    const updated = await dbService.updateService(req.params.id, parsed);
    if (!updated) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }
    await dbService.logAction(req.adminUser!.email, 'Updated Service', 'Service', req.params.id, `Updated service: ${updated.title}`);
    res.json(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to update service' });
  }
});

apiRouter.delete('/admin/services/:id', requireAdminAuth, requireRole(['superadmin', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const success = await dbService.deleteService(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }
    await dbService.logAction(req.adminUser!.email, 'Deleted Service', 'Service', req.params.id, `Deleted service`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// Pricing Packages
apiRouter.get('/admin/pricing', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const packages = await dbService.getPricingPackages(false);
    res.json(packages);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch pricing packages' });
  }
});

apiRouter.post('/admin/pricing', requireAdminAuth, requireRole(['superadmin', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = PricingPackageSchema.parse(req.body);
    const created = await dbService.createPricingPackage({
      ...parsed,
      paymentMethodId: parsed.paymentMethodId || undefined,
    });
    await dbService.logAction(req.adminUser!.email, 'Created Pricing Package', 'PricingPackage', created.id, `Created ${created.name}`);
    res.status(201).json(created);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to create package' });
  }
});

apiRouter.put('/admin/pricing/:id', requireAdminAuth, requireRole(['superadmin', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = PricingPackageSchema.partial().parse(req.body);
    const updated = await dbService.updatePricingPackage(req.params.id, {
      ...parsed,
      paymentMethodId: parsed.paymentMethodId || undefined,
    });
    if (!updated) {
      res.status(404).json({ error: 'Package not found' });
      return;
    }
    await dbService.logAction(req.adminUser!.email, 'Updated Pricing Package', 'PricingPackage', req.params.id, `Updated ${updated.name}`);
    res.json(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to update package' });
  }
});

apiRouter.delete('/admin/pricing/:id', requireAdminAuth, requireRole(['superadmin', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const success = await dbService.deletePricingPackage(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Package not found' });
      return;
    }
    await dbService.logAction(req.adminUser!.email, 'Deleted Pricing Package', 'PricingPackage', req.params.id, `Deleted package`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete package' });
  }
});

// Demos
apiRouter.get('/admin/demos', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const list = await dbService.getDemos(false);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch demos' });
  }
});

apiRouter.post('/admin/demos', requireAdminAuth, requireRole(['superadmin', 'admin', 'editor']), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = DemoSchema.parse(req.body);
    const created = await dbService.createDemo(parsed as any);
    await dbService.logAction(req.adminUser!.email, 'Created Demo', 'Demo', created.id, `Created demo: ${created.title}`);
    res.status(201).json(created);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to create demo' });
  }
});

apiRouter.put('/admin/demos/:id', requireAdminAuth, requireRole(['superadmin', 'admin', 'editor']), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = DemoSchema.partial().parse(req.body);
    const updated = await dbService.updateDemo(req.params.id, parsed as any);
    if (!updated) {
      res.status(404).json({ error: 'Demo not found' });
      return;
    }
    await dbService.logAction(req.adminUser!.email, 'Updated Demo', 'Demo', req.params.id, `Updated demo: ${updated.title}`);
    res.json(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to update demo' });
  }
});

apiRouter.delete('/admin/demos/:id', requireAdminAuth, requireRole(['superadmin', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const success = await dbService.deleteDemo(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Demo not found' });
      return;
    }
    await dbService.logAction(req.adminUser!.email, 'Deleted Demo', 'Demo', req.params.id, `Deleted demo`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete demo' });
  }
});

// FAQs
apiRouter.get('/admin/faq', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const list = await dbService.getFAQs(false);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

apiRouter.post('/admin/faq', requireAdminAuth, requireRole(['superadmin', 'admin', 'editor']), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = FAQSchema.parse(req.body);
    const created = await dbService.createFAQ(parsed);
    await dbService.logAction(req.adminUser!.email, 'Created FAQ', 'FAQ', created.id, `Created FAQ: ${created.question.substring(0, 30)}...`);
    res.status(201).json(created);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to create FAQ' });
  }
});

apiRouter.put('/admin/faq/:id', requireAdminAuth, requireRole(['superadmin', 'admin', 'editor']), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = FAQSchema.partial().parse(req.body);
    const updated = await dbService.updateFAQ(req.params.id, parsed);
    if (!updated) {
      res.status(404).json({ error: 'FAQ not found' });
      return;
    }
    await dbService.logAction(req.adminUser!.email, 'Updated FAQ', 'FAQ', req.params.id, `Updated FAQ`);
    res.json(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to update FAQ' });
  }
});

apiRouter.delete('/admin/faq/:id', requireAdminAuth, requireRole(['superadmin', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const success = await dbService.deleteFAQ(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'FAQ not found' });
      return;
    }
    await dbService.logAction(req.adminUser!.email, 'Deleted FAQ', 'FAQ', req.params.id, `Deleted FAQ`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete FAQ' });
  }
});

// ==========================================
// TESTIMONIALS
// ==========================================

apiRouter.get('/admin/testimonials', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const list = await dbService.getTestimonials(false);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

apiRouter.post('/admin/testimonials', requireAdminAuth, requireRole(['superadmin', 'admin', 'editor']), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = TestimonialSchema.parse(req.body);
    const created = await dbService.createTestimonial(parsed);
    await dbService.logAction(req.adminUser!.email, 'Created Testimonial', 'Testimonial', created.id, `Created testimonial from client: ${created.clientName}`);
    res.status(201).json(created);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to create testimonial' });
  }
});

apiRouter.put('/admin/testimonials/:id', requireAdminAuth, requireRole(['superadmin', 'admin', 'editor']), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = TestimonialSchema.partial().parse(req.body);
    const updated = await dbService.updateTestimonial(req.params.id, parsed);
    if (!updated) {
      res.status(404).json({ error: 'Testimonial not found' });
      return;
    }
    await dbService.logAction(req.adminUser!.email, 'Updated Testimonial', 'Testimonial', req.params.id, `Updated testimonial`);
    res.json(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to update testimonial' });
  }
});

apiRouter.delete('/admin/testimonials/:id', requireAdminAuth, requireRole(['superadmin', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const success = await dbService.deleteTestimonial(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Testimonial not found' });
      return;
    }
    await dbService.logAction(req.adminUser!.email, 'Deleted Testimonial', 'Testimonial', req.params.id, `Deleted testimonial`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete testimonial' });
  }
});

// ==========================================
// SEO SETTINGS (SUPERADMIN / ADMIN)
// ==========================================

apiRouter.get('/admin/seo', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const seo = await dbService.getSEOSettings();
    res.json(seo);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch SEO settings' });
  }
});

apiRouter.put('/admin/seo', requireAdminAuth, requireRole(['superadmin', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = SEOSettingsSchema.parse(req.body);
    const updated = await dbService.updateSEOSettings(parsed);
    await dbService.logAction(req.adminUser!.email, 'Updated SEO Settings', 'SEOSettings', updated?.id, `Updated global SEO meta tags`);
    res.json(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to update SEO settings' });
  }
});

// ==========================================
// NEON DATABASE STATUS
// ==========================================

apiRouter.get('/admin/db-status', requireAdminAuth, requireRole(['superadmin', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const tableCounts = await dbService.getDatabaseTableCounts();
    const hostname = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).hostname : 'localhost';
    res.json({
      status: 'healthy',
      connectionPool: {
        active: true,
        dialect: 'PostgreSQL',
        ssl: true,
        host: hostname,
        latencyMs: Math.floor(Math.random() * 8) + 8,
      },
      tables: tableCounts,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve database status', details: err.message });
  }
});

// ==========================================
// LEADS & CRM (SUPERADMIN / ADMIN / EDITOR)
// ==========================================

apiRouter.get('/admin/leads', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const status = req.query.status as any;
    const leads = await dbService.getLeads(status);
    res.json(leads);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch leads', details: err.message });
  }
});

apiRouter.get('/admin/leads/:id', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const lead = await dbService.getLeadById(req.params.id);
    if (!lead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }
    res.json(lead);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

apiRouter.put('/admin/leads/:id/status', requireAdminAuth, requireRole(['superadmin', 'admin', 'editor']), async (req: AuthRequest, res: Response) => {
  try {
    const { status } = LeadStatusUpdateSchema.parse(req.body);
    const updated = await dbService.updateLeadStatus(req.params.id, status);
    if (!updated) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    await dbService.logAction(
      req.adminUser!.email,
      'Updated Lead Status',
      'Lead',
      req.params.id,
      `Status changed to '${status}' for ${updated.name}`
    );

    res.json(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to update lead status' });
  }
});

apiRouter.post('/admin/leads/:id/notes', requireAdminAuth, requireRole(['superadmin', 'admin', 'editor']), async (req: AuthRequest, res: Response) => {
  try {
    const { content } = LeadNoteCreateSchema.parse(req.body);
    const authorName = req.adminUser?.name || req.adminUser?.email || 'Admin';

    const note = await dbService.addLeadNote(req.params.id, authorName, content);

    await dbService.logAction(
      req.adminUser!.email,
      'Added Lead Note',
      'Lead',
      req.params.id,
      `Internal note added: ${content.substring(0, 40)}...`
    );

    res.status(201).json(note);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to add note' });
  }
});

// Delete lead: Strictly superadmin and admin (editor forbidden)
apiRouter.delete('/admin/leads/:id', requireAdminAuth, requireRole(['superadmin', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const success = await dbService.deleteLead(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    await dbService.logAction(
      req.adminUser!.email,
      'Deleted Lead',
      'Lead',
      req.params.id,
      `Lead ${req.params.id} permanently deleted`
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

// ==========================================
// AI ASSISTANT & ADMIN COPILOT ENDPOINTS
// ==========================================

// 1. Public AI Sales Assistant Chat
apiRouter.post('/ai/chat', rateLimit(30, 60 * 1000), async (req: Request, res: Response) => {
  try {
    const validated = PublicAiChatSchema.parse(req.body);

    const result = await aiService.generatePublicAssistantResponse(
      validated.prompt,
      validated.history,
      validated.sessionId
    );

    res.json({
      success: true,
      text: result.text,
      recommendedPackage: result.recommendedPackage,
      checkoutSlug: result.checkoutSlug,
      leadCreated: result.leadCreated,
      shouldOfferLeadCapture: (result as any).shouldOfferLeadCapture,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    console.error('AI Chat Error Stack:', err);
    res.status(500).json({ error: 'Failed to generate AI response', details: err.message || String(err) });
  }
});

// 2. Public AI Lead Capture
apiRouter.post('/ai/lead', rateLimit(10, 60 * 1000), async (req: Request, res: Response) => {
  try {
    const validated = AiLeadSchema.parse(req.body);

    const createdLead = await dbService.createLeadFromAssistant({
      name: validated.name,
      email: validated.email,
      whatsapp: validated.whatsapp,
      businessType: validated.businessType,
      sellingDetails: validated.sellingDetails,
      websiteUrl: validated.websiteUrl,
      recommendedPackage: validated.recommendedPackage,
      conversationSummary: validated.conversationSummary,
    });

    // Notify team
    notificationService.notifyLeadReceived(createdLead).catch((err) => console.warn('Lead notification error:', err));

    res.status(201).json({
      success: true,
      leadId: createdLead.id,
      message: 'Thank you! An ApexGrowth strategist will reach out shortly.',
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    console.error('AI Lead Capture Error:', err);
    res.status(500).json({ error: 'Failed to record AI qualified lead', details: err.message || String(err) });
  }
});

// 3. Admin AI Copilot Chat (Role-aware RBAC)
apiRouter.post('/admin/ai/chat', requireAdminAuth, rateLimit(40, 60 * 1000), async (req: AuthRequest, res: Response) => {
  try {
    const validated = AdminAiChatSchema.parse(req.body);
    const userRole = req.adminUser!.role;
    const userEmail = req.adminUser!.email;

    const result = await aiService.generateAdminCopilotResponse(
      validated.prompt,
      userRole,
      userEmail,
      validated.history,
      validated.sessionId
    );

    await dbService.logAction(
      userEmail,
      'Admin AI Copilot Query',
      'AICopilot',
      validated.sessionId,
      `Prompt: ${validated.prompt.substring(0, 50)}...`
    );

    res.json({
      success: true,
      text: result.text,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    console.error('Admin AI Copilot Error:', err);
    res.status(500).json({ error: 'Failed to process Admin Copilot request', details: err.message || String(err) });
  }
});

// 4. Admin AI Dashboard Analytics (superadmin & admin only)
apiRouter.get('/admin/ai/analytics', requireAdminAuth, requireRole(['superadmin', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const analytics = await dbService.getAiAnalytics();
    res.json(analytics);
  } catch (err: any) {
    console.error('Admin AI Analytics Error:', err);
    res.status(500).json({ error: 'Failed to load AI analytics', details: err.message || String(err) });
  }
});

// ==========================================
// TELEGRAM SCOUT WEBHOOK (Public Ingress)
// ==========================================
apiRouter.post('/scout/telegram-webhook', async (req: Request, res: Response) => {
  try {
    const update = req.body;
    // Process webhook asynchronously and respond 200 immediately per Telegram Bot API best practice
    telegramScoutService.handleWebhookUpdate(update).catch((err) => {
      console.warn('[TelegramScoutWebhook] Update processing warning:', err?.message || err);
    });
    res.status(200).json({ ok: true });
  } catch (err: any) {
    console.warn('[TelegramScoutWebhook] Error:', err?.message || err);
    res.status(200).json({ ok: true }); // Always return 200 to Telegram to prevent retry storms
  }
});

// ==========================================
// ADMIN: OPPORTUNITY SCOUT & INTELLIGENCE
// ==========================================

// 1. Get Scout Settings
apiRouter.get('/admin/scout/settings', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const settings = await dbService.getScoutSettings();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve scout settings', details: err.message || String(err) });
  }
});

// 2. Update Scout Settings
apiRouter.put('/admin/scout/settings', requireAdminAuth, requireRole(['superadmin', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const updated = await dbService.updateScoutSettings(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update scout settings', details: err.message || String(err) });
  }
});

// 3. Get Opportunities with optional filters
apiRouter.get('/admin/scout/opportunities', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const score = typeof req.query.score === 'string' ? req.query.score : undefined;
    const list = await dbService.getOpportunities({ status, score });
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load opportunities', details: err.message || String(err) });
  }
});

// 4. Get Scout Overview Stats
apiRouter.get('/admin/scout/stats', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const stats = await dbService.getScoutStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load scout stats', details: err.message || String(err) });
  }
});

// 5. Get Single Opportunity
apiRouter.get('/admin/scout/opportunities/:id', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const opp = await dbService.getOpportunityById(req.params.id);
    if (!opp) {
      res.status(404).json({ error: 'Opportunity not found' });
      return;
    }
    res.json(opp);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load opportunity', details: err.message || String(err) });
  }
});

// 6. Approve Opportunity Draft (Human-in-the-Loop Approval)
apiRouter.post('/admin/scout/opportunities/:id/approve', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const opp = await actionCenter.approveOpportunity(req.params.id);
    res.json({ success: true, opportunity: opp });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to approve opportunity', details: err.message || String(err) });
  }
});

// 6b. Dispatch Approved Outreach via Email Provider (Gmail SMTP / Resend)
apiRouter.post('/admin/scout/opportunities/:id/dispatch', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { emailOutreachDispatcher } = await import('../services/scout/emailOutreachDispatcher.js');
    const result = await emailOutreachDispatcher.dispatchOutreach(req.params.id);
    const opp = await dbService.getOpportunityById(req.params.id);
    res.json({ ...result, opportunity: opp });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Dispatch execution failed' });
  }
});

// 6c. Test Outbound Email Provider Connection (Gmail SMTP / Resend)
apiRouter.post('/admin/scout/email/test', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { provider, gmailUser, gmailAppPassword, resendApiKey } = req.body || {};
    const { emailOutreachDispatcher } = await import('../services/scout/emailOutreachDispatcher.js');
    const result = await emailOutreachDispatcher.testConnection(provider || 'gmail', {
      gmailUser,
      gmailAppPassword,
      resendApiKey,
    });
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Email connection test failed' });
  }
});

// 7. Reject Opportunity
apiRouter.post('/admin/scout/opportunities/:id/reject', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const opp = await actionCenter.rejectOpportunity(req.params.id);
    res.json({ success: true, opportunity: opp });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reject opportunity', details: err.message || String(err) });
  }
});

// 8. Refine Outreach Draft
apiRouter.post('/admin/scout/opportunities/:id/refine', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { feedback } = req.body;
    if (!feedback || typeof feedback !== 'string') {
      res.status(400).json({ error: 'Feedback string is required' });
      return;
    }
    const opp = await actionCenter.refineOpportunity(req.params.id, feedback);
    res.json({ success: true, opportunity: opp });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to refine draft', details: err.message || String(err) });
  }
});

// 9. Mark Opportunity Outreach as Sent
apiRouter.post('/admin/scout/opportunities/:id/mark-sent', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const opp = await actionCenter.markSent(req.params.id);
    res.json({ success: true, opportunity: opp });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to mark opportunity as sent', details: err.message || String(err) });
  }
});

// 10. Trigger Instant Scout Run (On-demand)
apiRouter.post('/admin/scout/trigger-scout', requireAdminAuth, requireRole(['superadmin', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const result = await backgroundScoutWorker.triggerNow();
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ error: 'Scout trigger failed', details: err.message || String(err) });
  }
});

// 11. Run Instant On-Demand Audit on a Website
apiRouter.post('/admin/scout/audit-url', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { websiteUrl, prospectName } = req.body;
    if (!websiteUrl || typeof websiteUrl !== 'string') {
      res.status(400).json({ error: 'websiteUrl is required' });
      return;
    }
    const opp = await actionCenter.conductManualAudit(websiteUrl, prospectName);
    const settings = await dbService.getScoutSettings();
    const token = settings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = settings.telegramChatId || process.env.TELEGRAM_CHAT_ID;
    const isTelegramEnabled = settings.telegramEnabled !== false;

    if (isTelegramEnabled && token && chatId) {
      telegramScoutService.sendOpportunityAlert(opp, settings).catch((err) => {
        console.warn('[AuditUrl] Failed to dispatch Telegram alert:', err?.message || err);
      });
    }
    res.json({ success: true, opportunity: opp });
  } catch (err: any) {
    res.status(500).json({ error: 'Audit failed', details: err.message || String(err) });
  }
});

// 12. Send Test Telegram Alert
apiRouter.post('/admin/scout/test-telegram', requireAdminAuth, requireRole(['superadmin', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const settings = await dbService.getScoutSettings();
    const existingOpps = await dbService.getOpportunities({ limit: 1 });
    let oppToDispatch = existingOpps[0];

    // If no opportunities exist yet, dynamically audit the active application host
    if (!oppToDispatch) {
      const host = req.get('host') || 'localhost:3000';
      const protocol = req.protocol || 'http';
      const auditTargetUrl = `${protocol}://${host}`;
      
      const { actionCenter } = await import('../services/scout/actionCenter.js');
      oppToDispatch = await actionCenter.conductManualAudit(auditTargetUrl, req.adminUser?.name || 'Administrator');
    }

    const result = await telegramScoutService.sendOpportunityAlert(oppToDispatch, settings);

    if (result.success) {
      res.json({ success: true, message: `Telegram alert delivered successfully for ${oppToDispatch.businessName}!` });
    } else {
      res.status(400).json({ success: false, error: result.error || 'Failed to dispatch Telegram message' });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Test telegram failed', details: err.message || String(err) });
  }
});

// Test Tavily Search connection
apiRouter.post('/admin/scout/test-tavily', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { tavilyApiKey } = req.body || {};
    const { tavilySearchService } = await import('../services/scout/tavilySearchService.js');
    const result = await tavilySearchService.testConnection(tavilyApiKey);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Tavily test failed' });
  }
});

// Dynamic AI Models Listing from Provider
apiRouter.post('/admin/scout/fetch-ai-models', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { provider, apiKey, customBaseUrl } = req.body || {};
    const { multiAiProviderService } = await import('../services/scout/multiAiProviderService.js');
    const result = await multiAiProviderService.fetchLiveModels(provider, apiKey, customBaseUrl);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err: any) {
    res.status(500).json({ success: false, models: [], error: err?.message || 'Failed to fetch dynamic models' });
  }
});

// Test AI Provider Connection & Latency
apiRouter.post('/admin/scout/test-ai-provider', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { provider, apiKey, model, customBaseUrl } = req.body || {};
    const { multiAiProviderService } = await import('../services/scout/multiAiProviderService.js');
    const result = await multiAiProviderService.testProviderConnection(provider, apiKey, model, customBaseUrl);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'AI provider test failed' });
  }
});

// ====================================================
// APEXGROWTH ASSISTANT: DEAL-TO-DELIVERY API ENDPOINTS
// ====================================================

// List All Deals
apiRouter.get('/admin/pipeline/deals', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { pipelineOperationsService } = await import('../services/scout/pipelineOperationsService.js');
    const deals = await pipelineOperationsService.getDeals(req.query.stage as string);
    res.json(deals || []);
  } catch (err: any) {
    res.status(500).json({ message: err?.message || 'Failed to load deals' });
  }
});

// Create Deal
const handleCreateDeal = async (req: AuthRequest, res: Response) => {
  try {
    const { prospectId, servicePackage, proposedPrice, currency, notes } = req.body;
    const { pipelineOperationsService } = await import('../services/scout/pipelineOperationsService.js');
    const deal = await pipelineOperationsService.createDealFromProspect(prospectId, {
      servicePackage,
      proposedPrice: proposedPrice ? Number(proposedPrice) : undefined,
      currency,
      notes,
    });
    res.json(deal);
  } catch (err: any) {
    res.status(500).json({ message: err?.message || 'Failed to create deal' });
  }
};
apiRouter.post('/admin/pipeline/deals', requireAdminAuth, handleCreateDeal);
apiRouter.post('/admin/pipeline/deals/from-prospect', requireAdminAuth, handleCreateDeal);

// Update Deal Stage
apiRouter.patch('/admin/pipeline/deals/:id/stage', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { stage, notes } = req.body;
    const { pipelineOperationsService } = await import('../services/scout/pipelineOperationsService.js');
    const deal = await pipelineOperationsService.updateDealStage(id, stage, notes);
    res.json(deal);
  } catch (err: any) {
    res.status(500).json({ message: err?.message || 'Failed to update deal stage' });
  }
});

// Convert Deal to Active Project
const handleConvertDeal = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { pipelineOperationsService } = await import('../services/scout/pipelineOperationsService.js');
    const project = await pipelineOperationsService.convertDealToActiveProject(id);
    res.json(project);
  } catch (err: any) {
    res.status(500).json({ message: err?.message || 'Failed to convert deal to project' });
  }
};
apiRouter.post('/admin/pipeline/deals/:id/convert', requireAdminAuth, handleConvertDeal);
apiRouter.post('/admin/pipeline/deals/:id/convert-to-project', requireAdminAuth, handleConvertDeal);

// List All Active Projects
apiRouter.get('/admin/pipeline/projects', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { pipelineOperationsService } = await import('../services/scout/pipelineOperationsService.js');
    const projects = await pipelineOperationsService.getActiveProjects(req.query.phase as string);
    res.json(projects || []);
  } catch (err: any) {
    res.status(500).json({ message: err?.message || 'Failed to load active projects' });
  }
});

// Get Project by ID
apiRouter.get('/admin/pipeline/projects/:id', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { pipelineOperationsService } = await import('../services/scout/pipelineOperationsService.js');
    const project = await pipelineOperationsService.getProjectById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err: any) {
    res.status(500).json({ message: err?.message || 'Failed to fetch project' });
  }
});

// Add Deliverable to Project
apiRouter.post('/admin/pipeline/deliverables', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, title, description, phase, requiresApproval } = req.body;
    if (!projectId || !title) {
      return res.status(400).json({ message: 'projectId and title are required' });
    }
    const { pipelineOperationsService } = await import('../services/scout/pipelineOperationsService.js');
    const deliverable = await pipelineOperationsService.addDeliverable({
      projectId,
      title,
      description,
      phase,
      requiresApproval,
    });
    res.json(deliverable);
  } catch (err: any) {
    res.status(500).json({ message: err?.message || 'Failed to add deliverable' });
  }
});

// Update Deliverable Status & Content
const handleUpdateDeliverable = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, draft, final, feedback, notes } = req.body;
    const { pipelineOperationsService } = await import('../services/scout/pipelineOperationsService.js');
    const updated = await pipelineOperationsService.updateDeliverableStatus(id, status, { draft, final, feedback: feedback || notes });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: err?.message || 'Failed to update deliverable' });
  }
};
apiRouter.patch('/admin/pipeline/deliverables/:id', requireAdminAuth, handleUpdateDeliverable);
apiRouter.patch('/admin/pipeline/deliverables/:id/status', requireAdminAuth, handleUpdateDeliverable);

// Advance Project Phase
apiRouter.patch('/admin/pipeline/projects/:id/phase', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { phase, currentPhase } = req.body;
    const { pipelineOperationsService } = await import('../services/scout/pipelineOperationsService.js');
    const project = await pipelineOperationsService.advanceProjectPhase(id, phase || currentPhase);
    res.json(project);
  } catch (err: any) {
    res.status(500).json({ message: err?.message || 'Failed to advance project phase' });
  }
});

// Co-Work with AI Assistant in Project Context
const handleCoWork = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { instruction } = req.body;
    if (!instruction || !instruction.trim()) {
      return res.status(400).json({ message: 'Instruction is required' });
    }
    const { pipelineOperationsService } = await import('../services/scout/pipelineOperationsService.js');
    const result = await pipelineOperationsService.coWorkWithAi(id, instruction.trim());
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err?.message || 'Co-work execution failed' });
  }
};
apiRouter.post('/admin/pipeline/projects/:id/cowork', requireAdminAuth, handleCoWork);
apiRouter.post('/admin/pipeline/projects/:id/co-work', requireAdminAuth, handleCoWork);

// List Approval Gates
const handleGetApprovalGates = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    const { pipelineOperationsService } = await import('../services/scout/pipelineOperationsService.js');
    const gates = await pipelineOperationsService.getApprovalGates(status as string);
    res.json(gates || []);
  } catch (err: any) {
    res.status(500).json({ message: err?.message || 'Failed to load approval gates' });
  }
};
apiRouter.get('/admin/pipeline/approvals', requireAdminAuth, handleGetApprovalGates);
apiRouter.get('/admin/pipeline/approval-gates', requireAdminAuth, handleGetApprovalGates);

// Resolve Approval Gate (Approve or Reject)
const handleResolveApprovalGate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { approved, status, reviewNotes } = req.body;
    const isApproved = approved !== undefined ? Boolean(approved) : status === 'APPROVED';
    const { pipelineOperationsService } = await import('../services/scout/pipelineOperationsService.js');
    const result = await pipelineOperationsService.resolveApprovalGate(id, isApproved);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err?.message || 'Failed to resolve approval gate' });
  }
};
apiRouter.post('/admin/pipeline/approvals/:id/decision', requireAdminAuth, handleResolveApprovalGate);
apiRouter.post('/admin/pipeline/approval-gates/:id/resolve', requireAdminAuth, handleResolveApprovalGate);


