import { dbService } from './dbService.js';
import { Order, PaymentIntent, Lead } from '../../src/types/index.js';

export type NotificationEventType =
  | 'new_order'
  | 'payment_received'
  | 'payment_failed'
  | 'payment_manually_verified'
  | 'refund'
  | 'lead_received';

export interface NotificationLog {
  id: string;
  eventType: NotificationEventType;
  recipientEmail?: string;
  recipientPhone?: string;
  subject: string;
  messageBody: string;
  status: 'sent' | 'failed' | 'pending_gateway_config';
  gatewayUsed?: string;
  missingConfigKeys?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
}

class NotificationService {
  private logs: NotificationLog[] = [];

  public getNotificationGatewayStatus() {
    return {
      discord: {
        configured: Boolean(process.env.DISCORD_WEBHOOK_URL),
        envVar: 'DISCORD_WEBHOOK_URL',
      },
      smtpEmail: {
        configured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER),
        envVar: 'SMTP_HOST, SMTP_USER, SMTP_PASS',
      },
      resendEmail: {
        configured: Boolean(process.env.RESEND_API_KEY),
        envVar: 'RESEND_API_KEY',
      },
      sendgridEmail: {
        configured: Boolean(process.env.SENDGRID_API_KEY),
        envVar: 'SENDGRID_API_KEY',
      },
      whatsappBusiness: {
        configured: Boolean(process.env.WHATSAPP_BUSINESS_API_TOKEN),
        envVar: 'WHATSAPP_BUSINESS_API_TOKEN',
      },
    };
  }

  public getNotificationLogs(limit = 50): NotificationLog[] {
    return this.logs.slice(-limit).reverse();
  }

  private recordNotificationLog(log: Omit<NotificationLog, 'id' | 'createdAt'>): NotificationLog {
    const fullLog: NotificationLog = {
      ...log,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.logs.push(fullLog);
    if (this.logs.length > 200) {
      this.logs.shift();
    }
    return fullLog;
  }

  // 1. New Order Notification
  public async notifyNewOrder(order: Order, paymentIntent?: PaymentIntent) {
    const subject = `[ApexGrowth] New Order Created: ${order.orderNumber} ($${order.amountUsd} USD)`;
    const body = `Order ${order.orderNumber} created for ${order.packageName} ($${order.amountUsd} USD) by ${order.customerName} (${order.customerEmail}). Payment provider: ${order.paymentProvider.toUpperCase()}.`;

    const gatewayStatus = this.getNotificationGatewayStatus();
    const missingKeys: string[] = [];
    if (!gatewayStatus.discord.configured && !gatewayStatus.resendEmail.configured && !gatewayStatus.smtpEmail.configured) {
      missingKeys.push('DISCORD_WEBHOOK_URL', 'RESEND_API_KEY', 'SMTP_HOST');
    }

    // Optional Discord webhook dispatch
    if (process.env.DISCORD_WEBHOOK_URL) {
      try {
        await fetch(process.env.DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `🚨 **NEW ORDER CREATED**\n**Order:** \`${order.orderNumber}\`\n**Package:** ${order.packageName}\n**Amount:** $${order.amountUsd} USD\n**Customer:** ${order.customerName} (${order.customerEmail})\n**Provider:** ${order.paymentProvider}`,
          }),
        });
      } catch (err) {
        console.warn('Discord webhook dispatch error:', err);
      }
    }

    // Record audit log entry
    await dbService.addAuditLog(
      'system@apexgrowth.digital',
      'NOTIFICATION_TRIGGERED',
      'ORDER',
      order.id,
      `New order notification dispatched. Status: ${missingKeys.length === 0 ? 'sent' : 'pending_gateway_config'}`
    );

    return this.recordNotificationLog({
      eventType: 'new_order',
      recipientEmail: order.customerEmail,
      recipientPhone: order.customerWhatsapp,
      subject,
      messageBody: body,
      status: missingKeys.length === 0 ? 'sent' : 'pending_gateway_config',
      gatewayUsed: process.env.DISCORD_WEBHOOK_URL ? 'discord_webhook' : undefined,
      missingConfigKeys: missingKeys.length > 0 ? missingKeys : undefined,
      metadata: { orderId: order.id, orderNumber: order.orderNumber, amountUsd: order.amountUsd },
    });
  }

  // 2. Payment Received Notification
  public async notifyPaymentReceived(order: Order, paymentIntent?: PaymentIntent) {
    const subject = `[ApexGrowth] Payment Confirmed: ${order.orderNumber} ($${order.amountUsd} USD)`;
    const body = `Payment of $${order.amountUsd} USD for Order ${order.orderNumber} (${order.packageName}) has been successfully received and verified via ${order.paymentProvider.toUpperCase()}.`;

    if (process.env.DISCORD_WEBHOOK_URL) {
      try {
        await fetch(process.env.DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `✅ **PAYMENT RECEIVED & VERIFIED**\n**Order:** \`${order.orderNumber}\`\n**Amount:** $${order.amountUsd} USD\n**Customer:** ${order.customerName} (${order.customerEmail})\n**Ref:** \`${paymentIntent?.reference || 'N/A'}\``,
          }),
        });
      } catch (err) {
        console.warn('Discord webhook dispatch error:', err);
      }
    }

    await dbService.addAuditLog(
      'system@apexgrowth.digital',
      'NOTIFICATION_TRIGGERED',
      'PAYMENT',
      order.id,
      `Payment received notification triggered for Order ${order.orderNumber}`
    );

    const gatewayStatus = this.getNotificationGatewayStatus();
    const isConfigured = Boolean(process.env.DISCORD_WEBHOOK_URL || process.env.RESEND_API_KEY || process.env.SMTP_HOST);

    return this.recordNotificationLog({
      eventType: 'payment_received',
      recipientEmail: order.customerEmail,
      recipientPhone: order.customerWhatsapp,
      subject,
      messageBody: body,
      status: isConfigured ? 'sent' : 'pending_gateway_config',
      gatewayUsed: process.env.DISCORD_WEBHOOK_URL ? 'discord_webhook' : undefined,
      missingConfigKeys: isConfigured ? undefined : ['RESEND_API_KEY', 'SMTP_HOST', 'DISCORD_WEBHOOK_URL'],
      metadata: { orderId: order.id, reference: paymentIntent?.reference },
    });
  }

  // 3. Payment Failed Notification
  public async notifyPaymentFailed(order: Order, reason?: string) {
    const subject = `[ApexGrowth] Payment Failed: ${order.orderNumber}`;
    const body = `Payment attempt for Order ${order.orderNumber} was unsuccessful. Reason: ${reason || 'Declined or timed out'}.`;

    await dbService.addAuditLog(
      'system@apexgrowth.digital',
      'NOTIFICATION_TRIGGERED',
      'PAYMENT',
      order.id,
      `Payment failed notification recorded: ${reason}`
    );

    return this.recordNotificationLog({
      eventType: 'payment_failed',
      recipientEmail: order.customerEmail,
      subject,
      messageBody: body,
      status: 'sent',
      metadata: { orderId: order.id, reason },
    });
  }

  // 4. Manual Verification Notification
  public async notifyPaymentManuallyVerified(order: Order, adminEmail: string) {
    const subject = `[ApexGrowth] Manual Payment Verification: ${order.orderNumber}`;
    const body = `Order ${order.orderNumber} was manually verified and confirmed as PAID by admin (${adminEmail}).`;

    await dbService.addAuditLog(
      adminEmail,
      'NOTIFICATION_TRIGGERED',
      'ORDER',
      order.id,
      `Manual payment verification notification dispatched by ${adminEmail}`
    );

    return this.recordNotificationLog({
      eventType: 'payment_manually_verified',
      recipientEmail: order.customerEmail,
      subject,
      messageBody: body,
      status: 'sent',
      metadata: { orderId: order.id, verifiedBy: adminEmail },
    });
  }

  // 5. Refund Notification
  public async notifyRefund(order: Order, refundDetails?: any) {
    const subject = `[ApexGrowth] Refund Processed: ${order.orderNumber}`;
    const body = `Order ${order.orderNumber} ($${order.amountUsd} USD) has been refunded to the customer.`;

    await dbService.addAuditLog(
      'system@apexgrowth.digital',
      'NOTIFICATION_TRIGGERED',
      'REFUND',
      order.id,
      `Refund notification recorded for Order ${order.orderNumber}`
    );

    return this.recordNotificationLog({
      eventType: 'refund',
      recipientEmail: order.customerEmail,
      subject,
      messageBody: body,
      status: 'sent',
      metadata: { orderId: order.id, refundDetails },
    });
  }

  // 6. Lead Received Notification
  public async notifyLeadReceived(lead: Lead) {
    const subject = `[ApexGrowth CRM] New Inbound Lead: ${lead.name} (${lead.businessType})`;
    const body = `New lead received from ${lead.name} (${lead.email}, ${lead.whatsapp}). Business Type: ${lead.businessType}. Selling: ${lead.sellingDetails}. Source: ${lead.utmSource || 'direct'}.`;

    if (process.env.DISCORD_WEBHOOK_URL) {
      try {
        await fetch(process.env.DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `📥 **NEW CRM LEAD SUBMITTED**\n**Name:** ${lead.name}\n**Email:** ${lead.email}\n**WhatsApp:** ${lead.whatsapp}\n**Business:** ${lead.businessType}\n**Source:** \`${lead.utmSource || 'direct'}\``,
          }),
        });
      } catch (err) {
        console.warn('Discord lead webhook error:', err);
      }
    }

    await dbService.addAuditLog(
      'system@apexgrowth.digital',
      'NOTIFICATION_TRIGGERED',
      'LEAD',
      lead.id,
      `New lead notification dispatched for ${lead.name}`
    );

    const isConfigured = Boolean(process.env.DISCORD_WEBHOOK_URL || process.env.RESEND_API_KEY || process.env.SMTP_HOST);

    return this.recordNotificationLog({
      eventType: 'lead_received',
      recipientEmail: lead.email,
      recipientPhone: lead.whatsapp,
      subject,
      messageBody: body,
      status: isConfigured ? 'sent' : 'pending_gateway_config',
      gatewayUsed: process.env.DISCORD_WEBHOOK_URL ? 'discord_webhook' : undefined,
      missingConfigKeys: isConfigured ? undefined : ['RESEND_API_KEY', 'SMTP_HOST', 'DISCORD_WEBHOOK_URL'],
      metadata: { leadId: lead.id, utmSource: lead.utmSource },
    });
  }
}

export const notificationService = new NotificationService();
