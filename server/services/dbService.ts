import { db } from '../../src/db/index.js';
import * as schema from '../../src/db/schema.js';
import { eq, desc, sql, or } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import {
  AdminUser,
  BusinessProfile,
  ContactSettings,
  SocialLink,
  PaymentMethod,
  Service,
  PricingPackage,
  DemoItem,
  FAQ,
  Testimonial,
  Lead,
  LeadNote,
  SEOSettings,
  AuditLog,
  PublicAppData,
  DashboardStats,
  LeadStatus,
  AiConversation,
  AiMessage,
  AiEvent,
  AiAnalytics,
  Opportunity,
  ScoutSettings,
} from '../../src/types/index.js';

export const ALLOWED_ORDER_TRANSITIONS: Record<string, string[]> = {
  pending: ['awaiting_payment', 'processing', 'paid', 'failed', 'cancelled', 'expired'],
  awaiting_payment: ['paid', 'processing', 'failed', 'cancelled', 'expired'],
  processing: ['paid', 'completed', 'failed', 'cancelled', 'refunded'],
  paid: ['processing', 'completed', 'refunded', 'cancelled'],
  completed: ['refunded'],
  failed: ['pending', 'awaiting_payment', 'cancelled'],
  cancelled: [], // Terminal state
  refunded: [],  // Terminal state
  expired: ['pending', 'awaiting_payment', 'cancelled'],
};

export function validateOrderStateTransition(currentStatus: string, targetStatus: string): { allowed: boolean; reason?: string } {
  if (currentStatus === targetStatus) {
    return { allowed: true };
  }
  const allowedTargets = ALLOWED_ORDER_TRANSITIONS[currentStatus] || [];
  if (!allowedTargets.includes(targetStatus)) {
    return {
      allowed: false,
      reason: `Forbidden state transition: Order in '${currentStatus}' status cannot transition to '${targetStatus}'. Allowed target statuses: [${allowedTargets.join(', ')}]`,
    };
  }
  return { allowed: true };
}

export class DatabaseService {
  // ==========================================
  // AUTH & ADMIN USERS
  // ==========================================
  async bootstrapInitialAdmin() {
    const email = (process.env.ADMIN_INITIAL_EMAIL || 'admin@apexgrowth.digital').toLowerCase().trim();
    const password = process.env.ADMIN_INITIAL_PASSWORD || 'ApexGrowthAdmin2026!';
    const name = process.env.ADMIN_INITIAL_NAME || 'Lead Director';

    try {
      const existing = await this.findAdminByEmail(email);
      if (existing) {
        console.log(`[BOOTSTRAP] Initial admin user already exists in PostgreSQL: ${email}`);
        return;
      }

      // If they explicitly configured a custom admin email in the environment,
      // we MUST create it regardless of whether other admins exist!
      const isCustomConfig = !!process.env.ADMIN_INITIAL_EMAIL;

      if (!isCustomConfig) {
        // Check if there are any admins at all.
        const allAdmins = await db.select().from(schema.adminUsers).limit(1);
        if (allAdmins.length > 0) {
          console.log('[BOOTSTRAP] Database already contains admin users. Skipping automatic superadmin seed.');
          return;
        }
      }

      console.log(`[BOOTSTRAP] Creating superadmin account: ${email}...`);
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);

      await this.createAdminUser({
        email,
        name,
        role: 'superadmin',
        passwordHash,
      });
      console.log(`[BOOTSTRAP] Initial superadmin created successfully with email: ${email}`);
    } catch (err: any) {
      console.error('[BOOTSTRAP] Failed to bootstrap initial admin user:', err.message);
    }
  }

  async bootstrapPaymentMethods() {
    try {
      const existing = await db.select().from(schema.paymentMethods);
      const providers = existing.map(pm => pm.provider);

      if (!providers.includes('paystack')) {
        await db.insert(schema.paymentMethods).values({
          id: 'pay_paystack',
          provider: 'paystack',
          displayName: 'Paystack Card Gateway',
          type: 'api_integration',
          paymentUrl: 'https://checkout.paystack.com',
          currency: 'USD',
          description: 'Secure multi-currency credit/debit card and bank transfer checkout.',
          instructions: 'Pay instantly using Mastercard, Visa, Verve, or Direct Bank Transfer.',
          active: true,
          displayOrder: 1,
          isDirectLink: false,
          configMetadata: { publicKey: '', secretKey: '', testMode: true }
        });
        console.log('[BOOTSTRAP] Seeded Paystack Payment Gateway');
      }

      if (!providers.includes('bybit')) {
        await db.insert(schema.paymentMethods).values({
          id: 'pay_bybit',
          provider: 'bybit',
          displayName: 'Bybit Multi-Currency Crypto Gateway',
          type: 'api_integration',
          paymentUrl: '',
          currency: 'USD',
          description: 'Automated USDT, BTC, and multi-chain crypto checkout with live rate calculation.',
          instructions: 'Transfer the exact crypto amount to the generated deposit address on the specified network.',
          active: true,
          displayOrder: 2,
          isDirectLink: false,
          configMetadata: { apiKey: '', apiSecret: '', testMode: true, addresses: {} }
        });
        console.log('[BOOTSTRAP] Seeded Bybit Crypto Gateway');
      }

      if (!providers.includes('grey')) {
        await db.insert(schema.paymentMethods).values({
          id: 'pay_grey',
          provider: 'grey',
          displayName: 'Grey Bank Wire Gateway',
          type: 'bank_transfer',
          paymentUrl: '',
          currency: 'USD',
          description: 'Direct local and international USD, GBP, and EUR receiving accounts.',
          instructions: 'Initiate a bank transfer or wire to the receiving account matching your currency.',
          active: true,
          displayOrder: 3,
          isDirectLink: false,
          configMetadata: {
            usd: { beneficiary: '', bankName: '', accountNumber: '', accountType: 'Checking', routingNumber: '', bankAddress: '' },
            gbp: { beneficiary: '', bankName: '', accountNumber: '', accountType: '', routingNumber: '', bankAddress: '' },
            eur: { beneficiary: '', bankName: '', accountNumber: '', accountType: '', routingNumber: '', bankAddress: '' },
            enabled: true
          }
        });
        console.log('[BOOTSTRAP] Seeded Grey Bank Wire Gateway');
      }
    } catch (err: any) {
      console.error('[BOOTSTRAP] Failed to bootstrap payment methods:', err.message);
    }
  }

  async findAdminByEmail(email: string) {
    const rows = await db
      .select()
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.email, email.toLowerCase().trim()))
      .limit(1);
    return rows[0] || null;
  }

  async findAdminById(id: string) {
    const rows = await db
      .select()
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.id, id))
      .limit(1);
    return rows[0] || null;
  }

  async getAllAdminUsers() {
    const rows = await db.select().from(schema.adminUsers).orderBy(schema.adminUsers.createdAt);
    return rows.map(({ passwordHash: _, ...safeUser }) => ({
      ...safeUser,
      role: safeUser.role as 'superadmin' | 'admin' | 'editor',
      createdAt: safeUser.createdAt.toISOString(),
      updatedAt: safeUser.updatedAt.toISOString(),
      lastLoginAt: safeUser.lastLoginAt ? safeUser.lastLoginAt.toISOString() : undefined,
    }));
  }

  async createAdminUser(data: { email: string; name: string; role: 'superadmin' | 'admin' | 'editor'; passwordHash: string }) {
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();
    const [inserted] = await db
      .insert(schema.adminUsers)
      .values({
        id,
        email: data.email.toLowerCase().trim(),
        name: data.name,
        role: data.role,
        active: true,
        passwordHash: data.passwordHash,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const { passwordHash: _, ...safe } = inserted;
    return {
      ...safe,
      role: safe.role as 'superadmin' | 'admin' | 'editor',
      createdAt: safe.createdAt.toISOString(),
      updatedAt: safe.updatedAt.toISOString(),
    };
  }

  async updateAdminUser(id: string, updates: Partial<{ name: string; role: 'superadmin' | 'admin' | 'editor'; active: boolean; passwordHash: string; lastLoginAt: Date }>) {
    const [updated] = await db
      .update(schema.adminUsers)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(schema.adminUsers.id, id))
      .returning();

    if (!updated) return null;
    const { passwordHash: _, ...safe } = updated;
    return {
      ...safe,
      role: safe.role as 'superadmin' | 'admin' | 'editor',
      createdAt: safe.createdAt.toISOString(),
      updatedAt: safe.updatedAt.toISOString(),
      lastLoginAt: safe.lastLoginAt ? safe.lastLoginAt.toISOString() : undefined,
    };
  }

  async deleteAdminUser(id: string) {
    const result = await db.delete(schema.adminUsers).where(eq(schema.adminUsers.id, id)).returning();
    return result.length > 0;
  }

  // ==========================================
  // PUBLIC AGGREGATOR
  // ==========================================
  async getPublicData(): Promise<PublicAppData> {
    const [bpRows, csRows, slRows, sRows, pkgRows, dRows, faqRows, pmRows, seoRows, testimonialRows] = await Promise.all([
      db.select().from(schema.businessProfile).limit(1),
      db.select().from(schema.contactSettings).limit(1),
      db.select().from(schema.socialLinks).where(eq(schema.socialLinks.enabled, true)).orderBy(schema.socialLinks.displayOrder),
      db.select().from(schema.services).where(eq(schema.services.published, true)).orderBy(schema.services.displayOrder),
      db.select().from(schema.pricingPackages).where(eq(schema.pricingPackages.active, true)).orderBy(schema.pricingPackages.displayOrder),
      db.select().from(schema.demos).where(eq(schema.demos.active, true)).orderBy(schema.demos.displayOrder),
      db.select().from(schema.faqs).where(eq(schema.faqs.published, true)).orderBy(schema.faqs.displayOrder),
      db.select().from(schema.paymentMethods).where(eq(schema.paymentMethods.active, true)).orderBy(schema.paymentMethods.displayOrder),
      db.select().from(schema.seoSettings).limit(1),
      db.select().from(schema.testimonials).where(eq(schema.testimonials.published, true)).orderBy(schema.testimonials.displayOrder),
    ]);

    const business = bpRows[0] || {
      id: 'biz_01',
      businessName: 'ApexGrowth Digital',
      tagline: 'High-Converting Funnels & Video Ad Scripts',
      description: 'We build conversion-focused sales funnels, payment experiences, and direct-response video ad scripts.',
      email: '',
      supportEmail: '',
      phone: '',
      whatsappNumber: '',
      businessHours: 'Mon - Fri: 9:00 AM - 6:00 PM',
      logoUrl: '',
      faviconUrl: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const contact = csRows[0] || {
      id: 'contact_01',
      businessEmail: '',
      supportEmail: '',
      phone: '',
      whatsappNumber: '',
      whatsappUrl: '',
      whatsappPrefilledMessage: "Hi, I'd like to discuss a project with ApexGrowth Digital.",
      whatsappButtonText: 'Chat on WhatsApp',
      floatingWhatsappEnabled: false,
      heroCtaEnabled: true,
      pricingCtaEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const seo = seoRows[0] || {
      id: 'seo_main',
      pageTitle: 'ApexGrowth Digital | High-Converting Funnels & Video Ad Scripts',
      metaDescription: 'Scalable funnels, seamless multi-currency payment links, and high-converting video ad scripts.',
      ogTitle: 'ApexGrowth Digital',
      ogDescription: 'Conversion-Focused Funnels & Direct Response Ad Scripts',
      ogImage: '',
      favicon: '',
      canonicalUrl: '',
      robotsConfig: 'index, follow',
      keywords: ['sales funnel', 'video ad scripts', 'conversion optimization', 'paystack payments'],
      updatedAt: new Date(),
    };

    return {
      business: {
        ...business,
        phone: business.phone || '',
        businessHours: business.businessHours || '',
        logoUrl: business.logoUrl || undefined,
        faviconUrl: business.faviconUrl || undefined,
        createdAt: business.createdAt instanceof Date ? business.createdAt.toISOString() : String(business.createdAt),
        updatedAt: business.updatedAt instanceof Date ? business.updatedAt.toISOString() : String(business.updatedAt),
      },
      contact: {
        ...contact,
        phone: contact.phone || '',
        createdAt: contact.createdAt instanceof Date ? contact.createdAt.toISOString() : String(contact.createdAt),
        updatedAt: contact.updatedAt instanceof Date ? contact.updatedAt.toISOString() : String(contact.updatedAt),
      },
      socialLinks: slRows.map((s) => ({
        ...s,
        platform: s.platform as any,
        username: s.username || undefined,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
      services: sRows.map((s) => ({
        ...s,
        features: s.features as string[],
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
      pricing: pkgRows.map((p) => ({
        ...p,
        features: p.features as string[],
        badgeText: p.badgeText || undefined,
        paymentMethodId: p.paymentMethodId || undefined,
        ctaAction: p.ctaAction as any,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      demos: dRows.map((d) => ({
        ...d,
        type: d.type as any,
        config: d.config as any,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      })),
      faqs: faqRows.map((f) => ({
        ...f,
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString(),
      })),
      testimonials: testimonialRows.map((t) => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
      paymentMethods: pmRows.map((pm) => ({
        ...pm,
        provider: pm.provider as any,
        type: pm.type as any,
        instructions: pm.instructions || undefined,
        configMetadata: (pm.configMetadata as any) || undefined,
        createdAt: pm.createdAt.toISOString(),
        updatedAt: pm.updatedAt.toISOString(),
      })),
      seo: {
        ...seo,
        ogImage: seo.ogImage || '',
        favicon: seo.favicon || '',
        canonicalUrl: seo.canonicalUrl || '',
        keywords: seo.keywords as string[],
        updatedAt: seo.updatedAt instanceof Date ? seo.updatedAt.toISOString() : String(seo.updatedAt),
      },
    };
  }

  // ==========================================
  // BUSINESS & CONTACT
  // ==========================================
  async getBusinessProfile() {
    const rows = await db.select().from(schema.businessProfile).limit(1);
    return rows[0] || null;
  }

  async updateBusinessProfile(updates: Partial<Omit<BusinessProfile, 'id' | 'createdAt' | 'updatedAt'>>) {
    const [existing] = await db.select().from(schema.businessProfile).limit(1);
    const id = existing?.id || 'biz_01';

    const [updated] = await db
      .insert(schema.businessProfile)
      .values({
        id,
        businessName: updates.businessName || existing?.businessName || 'ApexGrowth Digital',
        tagline: updates.tagline || existing?.tagline || '',
        description: updates.description || existing?.description || '',
        email: updates.email || existing?.email || '',
        supportEmail: updates.supportEmail || existing?.supportEmail || '',
        phone: updates.phone || existing?.phone || '',
        whatsappNumber: updates.whatsappNumber || existing?.whatsappNumber || '',
        businessHours: updates.businessHours || existing?.businessHours || '',
        logoUrl: updates.logoUrl ?? existing?.logoUrl,
        faviconUrl: updates.faviconUrl ?? existing?.faviconUrl,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.businessProfile.id,
        set: {
          ...updates,
          updatedAt: new Date(),
        },
      })
      .returning();

    return updated;
  }

  async getContactSettings() {
    const rows = await db.select().from(schema.contactSettings).limit(1);
    if (rows.length === 0) {
      const defaultContact = {
        id: 'contact_01',
        businessEmail: 'info@apexgrowth.digital',
        supportEmail: 'support@apexgrowth.digital',
        phone: '+15550192834',
        whatsappNumber: '+15550192834',
        whatsappUrl: 'https://wa.me/15550192834',
        whatsappPrefilledMessage: 'Hello ApexGrowth, I would like to inquire about your digital growth services.',
        whatsappButtonText: 'Chat on WhatsApp',
        floatingWhatsappEnabled: true,
        heroCtaEnabled: true,
        pricingCtaEnabled: true,
      };
      try {
        const [inserted] = await db.insert(schema.contactSettings).values(defaultContact).returning();
        return inserted;
      } catch (err: any) {
        console.error('[DB] Failed to auto-seed default contact settings, returning in-memory:', err.message);
        return {
          ...defaultContact,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
    }
    return rows[0];
  }

  async updateContactSettings(updates: Partial<Omit<ContactSettings, 'id' | 'createdAt' | 'updatedAt'>>) {
    const [existing] = await db.select().from(schema.contactSettings).limit(1);
    const id = existing?.id || 'contact_01';

    const [updated] = await db
      .insert(schema.contactSettings)
      .values({
        id,
        businessEmail: updates.businessEmail || existing?.businessEmail || '',
        supportEmail: updates.supportEmail || existing?.supportEmail || '',
        phone: updates.phone || existing?.phone || '',
        whatsappNumber: updates.whatsappNumber || existing?.whatsappNumber || '',
        whatsappUrl: updates.whatsappUrl || existing?.whatsappUrl || '',
        whatsappPrefilledMessage: updates.whatsappPrefilledMessage || existing?.whatsappPrefilledMessage || '',
        whatsappButtonText: updates.whatsappButtonText || existing?.whatsappButtonText || 'Chat on WhatsApp',
        floatingWhatsappEnabled: updates.floatingWhatsappEnabled ?? existing?.floatingWhatsappEnabled ?? true,
        heroCtaEnabled: updates.heroCtaEnabled ?? existing?.heroCtaEnabled ?? true,
        pricingCtaEnabled: updates.pricingCtaEnabled ?? existing?.pricingCtaEnabled ?? true,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.contactSettings.id,
        set: {
          ...updates,
          updatedAt: new Date(),
        },
      })
      .returning();

    return updated;
  }

  // ==========================================
  // SOCIAL LINKS
  // ==========================================
  async getSocialLinks() {
    return await db.select().from(schema.socialLinks).orderBy(schema.socialLinks.displayOrder);
  }

  async createSocialLink(link: { platform: string; label: string; url: string; username?: string; enabled: boolean; displayOrder?: number }) {
    const id = `soc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const [inserted] = await db
      .insert(schema.socialLinks)
      .values({
        id,
        platform: link.platform,
        label: link.label,
        url: link.url,
        username: link.username,
        enabled: link.enabled ?? true,
        displayOrder: link.displayOrder ?? 0,
      })
      .returning();
    return inserted;
  }

  async updateSocialLink(id: string, updates: Partial<Omit<SocialLink, 'id' | 'createdAt' | 'updatedAt'>>) {
    const [updated] = await db
      .update(schema.socialLinks)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(schema.socialLinks.id, id))
      .returning();
    return updated || null;
  }

  async deleteSocialLink(id: string) {
    const res = await db.delete(schema.socialLinks).where(eq(schema.socialLinks.id, id)).returning();
    return res.length > 0;
  }

  // ==========================================
  // PAYMENT METHODS
  // ==========================================
  async getPaymentMethods(activeOnly = false) {
    if (activeOnly) {
      return await db
        .select()
        .from(schema.paymentMethods)
        .where(eq(schema.paymentMethods.active, true))
        .orderBy(schema.paymentMethods.displayOrder);
    }
    return await db.select().from(schema.paymentMethods).orderBy(schema.paymentMethods.displayOrder);
  }

  async createPaymentMethod(data: {
    provider: string;
    displayName: string;
    type?: string;
    paymentUrl?: string;
    currency?: string;
    description?: string;
    instructions?: string;
    active?: boolean;
    displayOrder?: number;
    isDirectLink?: boolean;
    configMetadata?: any;
  }) {
    const id = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const [inserted] = await db
      .insert(schema.paymentMethods)
      .values({
        id,
        provider: data.provider,
        displayName: data.displayName,
        type: data.type || 'payment_link',
        paymentUrl: data.paymentUrl || '',
        currency: data.currency || 'USD',
        description: data.description || '',
        instructions: data.instructions,
        active: data.active ?? true,
        displayOrder: data.displayOrder ?? 0,
        isDirectLink: data.isDirectLink ?? true,
        configMetadata: data.configMetadata,
      })
      .returning();
    return inserted;
  }

  async updatePaymentMethod(id: string, updates: Partial<Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>>) {
    const [updated] = await db
      .update(schema.paymentMethods)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(schema.paymentMethods.id, id))
      .returning();
    return updated || null;
  }

  async deletePaymentMethod(id: string) {
    const res = await db.delete(schema.paymentMethods).where(eq(schema.paymentMethods.id, id)).returning();
    return res.length > 0;
  }

  // ==========================================
  // SERVICES
  // ==========================================
  async getServices(publishedOnly = false) {
    if (publishedOnly) {
      return await db.select().from(schema.services).where(eq(schema.services.published, true)).orderBy(schema.services.displayOrder);
    }
    return await db.select().from(schema.services).orderBy(schema.services.displayOrder);
  }

  async createService(data: { slug: string; title: string; description: string; iconName?: string; features?: string[]; published: boolean; displayOrder?: number }) {
    const id = `srv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const [inserted] = await db
      .insert(schema.services)
      .values({
        id,
        slug: data.slug,
        title: data.title,
        description: data.description,
        iconName: data.iconName || 'Zap',
        features: data.features || [],
        published: data.published ?? true,
        displayOrder: data.displayOrder ?? 0,
      })
      .returning();
    return inserted;
  }

  async updateService(id: string, updates: Partial<Omit<Service, 'id' | 'createdAt' | 'updatedAt'>>) {
    const [updated] = await db
      .update(schema.services)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(schema.services.id, id))
      .returning();
    return updated || null;
  }

  async deleteService(id: string) {
    const res = await db.delete(schema.services).where(eq(schema.services.id, id)).returning();
    return res.length > 0;
  }

  // ==========================================
  // PRICING PACKAGES (USD-FIRST)
  // ==========================================
  async getPricingPackages(activeOnly = false) {
    if (activeOnly) {
      return await db
        .select()
        .from(schema.pricingPackages)
        .where(eq(schema.pricingPackages.active, true))
        .orderBy(schema.pricingPackages.displayOrder);
    }
    return await db.select().from(schema.pricingPackages).orderBy(schema.pricingPackages.displayOrder);
  }

  async createPricingPackage(data: {
    slug?: string;
    name: string;
    description: string;
    priceUsd: string;
    promoPriceUsd?: string;
    currency?: string;
    priceNaira?: string;
    features?: string[];
    isFeatured: boolean;
    badgeText?: string;
    ctaText?: string;
    ctaAction?: string;
    paymentMethodId?: string | null;
    active: boolean;
    displayOrder?: number;
  }) {
    const id = `pkg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const [inserted] = await db
      .insert(schema.pricingPackages)
      .values({
        id,
        slug: data.slug || '',
        name: data.name,
        description: data.description,
        priceUsd: data.priceUsd,
        promoPriceUsd: data.promoPriceUsd || null,
        currency: data.currency || 'USD',
        priceNaira: data.priceNaira || '',
        features: data.features || [],
        isFeatured: data.isFeatured ?? false,
        badgeText: data.badgeText,
        ctaText: data.ctaText || 'Get Started Now',
        ctaAction: data.ctaAction || 'contact',
        paymentMethodId: data.paymentMethodId || null,
        active: data.active ?? true,
        displayOrder: data.displayOrder ?? 0,
      })
      .returning();
    return inserted;
  }

  async updatePricingPackage(id: string, updates: Partial<Omit<PricingPackage, 'id' | 'createdAt' | 'updatedAt'>>) {
    const [updated] = await db
      .update(schema.pricingPackages)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(schema.pricingPackages.id, id))
      .returning();
    return updated || null;
  }

  async deletePricingPackage(id: string) {
    const res = await db.delete(schema.pricingPackages).where(eq(schema.pricingPackages.id, id)).returning();
    return res.length > 0;
  }

  // ==========================================
  // DEMOS & FAQS
  // ==========================================
  async getDemos(activeOnly = false) {
    const rows = await db.select().from(schema.demos).orderBy(schema.demos.displayOrder);
    if (rows.length === 0) {
      const defaultDemos = [
        {
          id: 'demo_video_01',
          type: 'video_ad_script',
          title: 'Interactive Video Ad Script Preview',
          subtitle: 'Direct-Response Script Architecture Breakdown',
          description: 'Experience how direct-response hook mechanics, problem amplification, and CTA structuring turn passive viewers into active buyers.',
          active: true,
          displayOrder: 1,
          config: {
            scenes: [
              {
                timestamp: '0:00 – 0:03',
                title: 'Hook',
                script: '"Stop using standard moisturizer if your skin still looks dull by noon."',
                visualDirection: 'Split-screen comparison: Left side showing dull midday skin vs. right side glowing hydrated finish with subtle kinetic typography overlay.',
                type: 'hook',
              },
              {
                timestamp: '0:04 – 0:15',
                title: 'Problem & Agitation',
                script: '"Most formulas lose their effect quickly because they don\'t properly support the skin\'s moisture barrier."',
                visualDirection: 'Macro close-up texture shot showing skin surface dehydration simulation and moisture-loss 3D layer graphic.',
                type: 'problem',
              },
              {
                timestamp: '0:16 – 0:30',
                title: 'Solution & CTA',
                script: '"This serum is designed to help lock in hydration for longer. Tap Shop Now to discover the formula."',
                visualDirection: 'Clean product application dropper shot, radiant skin close-up, premium product packaging hero shot with animated "Shop Now" pulse button.',
                type: 'solution',
              },
            ],
          },
        },
        {
          id: 'demo_checkout_01',
          type: 'checkout_sim',
          title: 'Interactive Checkout Simulation',
          subtitle: 'DEMO — NO REAL PAYMENT',
          description: 'Test the friction-free customer checkout experience across card, regional bank transfers, and multi-network crypto.',
          active: true,
          displayOrder: 2,
          config: {
            productTitle: 'Conversion Launchpad Demo',
            productPrice: 249,
            currencySymbol: '$',
            supportedTabs: ['Paystack Demo', 'Crypto Demo'],
          },
        }
      ];

      try {
        const insertedList = [];
        for (const d of defaultDemos) {
          const [inserted] = await db.insert(schema.demos).values(d).returning();
          insertedList.push(inserted);
        }
        if (activeOnly) {
          return insertedList.filter(d => d.active);
        }
        return insertedList;
      } catch (err: any) {
        console.error('[DB] Failed to auto-seed default demos, returning in-memory:', err.message);
        const memoryDemos = defaultDemos.map(d => ({
          ...d,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        if (activeOnly) {
          return memoryDemos.filter(d => d.active);
        }
        return memoryDemos;
      }
    }

    if (activeOnly) {
      return rows.filter(d => d.active);
    }
    return rows;
  }

  async createDemo(data: { type: string; title: string; subtitle?: string; description: string; active: boolean; displayOrder?: number; config?: any }) {
    const id = `demo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const [inserted] = await db
      .insert(schema.demos)
      .values({
        id,
        type: data.type,
        title: data.title,
        subtitle: data.subtitle || '',
        description: data.description,
        active: data.active ?? true,
        displayOrder: data.displayOrder ?? 0,
        config: data.config || {},
      })
      .returning();
    return inserted;
  }

  async updateDemo(id: string, updates: Partial<Omit<DemoItem, 'id' | 'createdAt' | 'updatedAt'>>) {
    const [updated] = await db
      .update(schema.demos)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(schema.demos.id, id))
      .returning();
    return updated || null;
  }

  async deleteDemo(id: string) {
    const res = await db.delete(schema.demos).where(eq(schema.demos.id, id)).returning();
    return res.length > 0;
  }

  async getFAQs(publishedOnly = false) {
    if (publishedOnly) {
      return await db.select().from(schema.faqs).where(eq(schema.faqs.published, true)).orderBy(schema.faqs.displayOrder);
    }
    return await db.select().from(schema.faqs).orderBy(schema.faqs.displayOrder);
  }

  async createFAQ(data: { question: string; answer: string; published: boolean; displayOrder?: number }) {
    const id = `faq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const [inserted] = await db
      .insert(schema.faqs)
      .values({
        id,
        question: data.question,
        answer: data.answer,
        published: data.published ?? true,
        displayOrder: data.displayOrder ?? 0,
      })
      .returning();
    return inserted;
  }

  async updateFAQ(id: string, updates: Partial<Omit<FAQ, 'id' | 'createdAt' | 'updatedAt'>>) {
    const [updated] = await db
      .update(schema.faqs)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(schema.faqs.id, id))
      .returning();
    return updated || null;
  }

  async deleteFAQ(id: string) {
    const res = await db.delete(schema.faqs).where(eq(schema.faqs.id, id)).returning();
    return res.length > 0;
  }

  // ==========================================
  // TESTIMONIALS
  // ==========================================
  async getTestimonials(publishedOnly = false) {
    if (publishedOnly) {
      return await db.select().from(schema.testimonials).where(eq(schema.testimonials.published, true)).orderBy(schema.testimonials.displayOrder);
    }
    return await db.select().from(schema.testimonials).orderBy(schema.testimonials.displayOrder);
  }

  async createTestimonial(data: {
    clientName: string;
    clientRole: string;
    companyName?: string;
    avatarUrl?: string;
    rating?: number;
    content: string;
    published: boolean;
    displayOrder?: number;
  }) {
    const id = `test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const [inserted] = await db
      .insert(schema.testimonials)
      .values({
        id,
        clientName: data.clientName,
        clientRole: data.clientRole,
        companyName: data.companyName || null,
        avatarUrl: data.avatarUrl || null,
        rating: data.rating ?? 5,
        content: data.content,
        published: data.published ?? true,
        displayOrder: data.displayOrder ?? 0,
      })
      .returning();
    return inserted;
  }

  async updateTestimonial(id: string, updates: Partial<Omit<Testimonial, 'id' | 'createdAt' | 'updatedAt'>>) {
    const [updated] = await db
      .update(schema.testimonials)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(schema.testimonials.id, id))
      .returning();
    return updated || null;
  }

  async deleteTestimonial(id: string) {
    const res = await db.delete(schema.testimonials).where(eq(schema.testimonials.id, id)).returning();
    return res.length > 0;
  }

  // ==========================================
  // LEADS & CRM (WITH TRANSACTIONS)
  // ==========================================
  async getLeads(status?: LeadStatus) {
    const leadsList = status
      ? await db.select().from(schema.leads).where(eq(schema.leads.status, status)).orderBy(desc(schema.leads.createdAt))
      : await db.select().from(schema.leads).orderBy(desc(schema.leads.createdAt));

    const notesList = await db.select().from(schema.leadNotes).orderBy(schema.leadNotes.createdAt);
    const notesByLead = new Map<string, LeadNote[]>();

    for (const n of notesList) {
      if (!notesByLead.has(n.leadId)) {
        notesByLead.set(n.leadId, []);
      }
      notesByLead.get(n.leadId)!.push({
        id: n.id,
        leadId: n.leadId,
        authorName: n.authorName,
        content: n.content,
        createdAt: n.createdAt.toISOString(),
      });
    }

    return leadsList.map((l) => ({
      ...l,
      status: l.status as LeadStatus,
      websiteUrl: l.websiteUrl || undefined,
      message: l.message || undefined,
      utmSource: l.utmSource || undefined,
      utmMedium: l.utmMedium || undefined,
      utmCampaign: l.utmCampaign || undefined,
      utmContent: l.utmContent || undefined,
      landingPage: l.landingPage || undefined,
      referrer: l.referrer || undefined,
      notes: notesByLead.get(l.id) || [],
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    }));
  }

  async getLeadById(id: string) {
    const rows = await db.select().from(schema.leads).where(eq(schema.leads.id, id)).limit(1);
    if (!rows[0]) return null;
    const l = rows[0];
    const notes = await db.select().from(schema.leadNotes).where(eq(schema.leadNotes.leadId, id)).orderBy(schema.leadNotes.createdAt);

    return {
      ...l,
      status: l.status as LeadStatus,
      websiteUrl: l.websiteUrl || undefined,
      message: l.message || undefined,
      utmSource: l.utmSource || undefined,
      utmMedium: l.utmMedium || undefined,
      utmCampaign: l.utmCampaign || undefined,
      utmContent: l.utmContent || undefined,
      landingPage: l.landingPage || undefined,
      referrer: l.referrer || undefined,
      notes: notes.map((n) => ({
        id: n.id,
        leadId: n.leadId,
        authorName: n.authorName,
        content: n.content,
        createdAt: n.createdAt.toISOString(),
      })),
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    };
  }

  /**
   * Atomic Lead Capture with Transaction
   * Creates lead record and writes audit log in a single atomic transaction.
   */
  async createLeadWithTransaction(leadData: Omit<Lead, 'id' | 'status' | 'notes' | 'createdAt' | 'updatedAt'>, ipAddress: string) {
    const id = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();

    return await db.transaction(async (tx) => {
      const [insertedLead] = await tx
        .insert(schema.leads)
        .values({
          id,
          name: leadData.name,
          email: leadData.email,
          whatsapp: leadData.whatsapp,
          businessType: leadData.businessType,
          websiteUrl: leadData.websiteUrl,
          sellingDetails: leadData.sellingDetails,
          message: leadData.message,
          utmSource: leadData.utmSource,
          utmMedium: leadData.utmMedium,
          utmCampaign: leadData.utmCampaign,
          utmContent: leadData.utmContent,
          landingPage: leadData.landingPage,
          referrer: leadData.referrer,
          status: 'new',
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await tx.insert(schema.auditLogs).values({
        id: logId,
        adminEmail: 'system',
        action: 'Lead Captured',
        entityType: 'Lead',
        entityId: id,
        details: `Inbound lead from ${leadData.name} (${leadData.email}) - Source: ${leadData.utmSource || 'Direct'}`,
        ipAddress: ipAddress || 'unknown',
        timestamp: now,
      });

      return {
        ...insertedLead,
        status: insertedLead.status as LeadStatus,
        notes: [],
        createdAt: insertedLead.createdAt.toISOString(),
        updatedAt: insertedLead.updatedAt.toISOString(),
      };
    });
  }

  async updateLeadStatus(id: string, status: LeadStatus) {
    const [updated] = await db
      .update(schema.leads)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(schema.leads.id, id))
      .returning();

    if (!updated) return null;
    return await this.getLeadById(id);
  }

  async addLeadNote(leadId: string, authorName: string, content: string) {
    const id = `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const [inserted] = await db
      .insert(schema.leadNotes)
      .values({
        id,
        leadId,
        authorName,
        content,
        createdAt: new Date(),
      })
      .returning();

    return {
      ...inserted,
      createdAt: inserted.createdAt.toISOString(),
    };
  }

  async deleteLead(id: string) {
    // Foreign key CASCADE deletes associated notes automatically
    const res = await db.delete(schema.leads).where(eq(schema.leads.id, id)).returning();
    return res.length > 0;
  }

  // ==========================================
  // SEO SETTINGS
  // ==========================================
  async getSEOSettings() {
    const rows = await db.select().from(schema.seoSettings).limit(1);
    return rows[0] || null;
  }

  async updateSEOSettings(updates: Partial<Omit<SEOSettings, 'id' | 'updatedAt'>>) {
    const [existing] = await db.select().from(schema.seoSettings).limit(1);
    const id = existing?.id || 'seo_main';

    const [updated] = await db
      .insert(schema.seoSettings)
      .values({
        id,
        pageTitle: updates.pageTitle || existing?.pageTitle || 'ApexGrowth Digital',
        metaDescription: updates.metaDescription || existing?.metaDescription || '',
        ogTitle: updates.ogTitle || existing?.ogTitle || '',
        ogDescription: updates.ogDescription || existing?.ogDescription || '',
        ogImage: updates.ogImage || existing?.ogImage || '',
        favicon: updates.favicon || existing?.favicon || '',
        canonicalUrl: updates.canonicalUrl || existing?.canonicalUrl || '',
        robotsConfig: updates.robotsConfig || existing?.robotsConfig || 'index, follow',
        keywords: updates.keywords || (existing?.keywords as string[]) || [],
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.seoSettings.id,
        set: {
          ...updates,
          updatedAt: new Date(),
        },
      })
      .returning();

    return updated;
  }

  // ==========================================
  // AUDIT LOGS (APPEND-ONLY)
  // ==========================================
  async logAction(adminEmail: string, action: string, entityType: string, entityId?: string, details = '', ipAddress?: string) {
    const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const [inserted] = await db
      .insert(schema.auditLogs)
      .values({
        id,
        adminEmail,
        action,
        entityType,
        entityId,
        details,
        ipAddress,
        timestamp: new Date(),
      })
      .returning();

    return inserted;
  }

  async getAuditLogs(limit = 100) {
    const rows = await db.select().from(schema.auditLogs).orderBy(desc(schema.auditLogs.timestamp)).limit(limit);
    return rows.map((l) => ({
      ...l,
      entityId: l.entityId || undefined,
      ipAddress: l.ipAddress || undefined,
      timestamp: l.timestamp.toISOString(),
    }));
  }

  // ==========================================
  // ORDERS & PAYMENT INTENTS (CHECKOUT ARCHITECTURE)
  // ==========================================
  async createCheckoutIntent(params: {
    packageId: string;
    packageName?: string;
    amountUsd?: string; // Explicitly ignored - authoritative price is queried from PostgreSQL
    customerName: string;
    customerEmail: string;
    customerWhatsapp?: string;
    paymentMethodId?: string | null;
    paymentProvider: 'paystack' | 'bybit' | 'grey' | 'custom';
    customerNotes?: string;
    ipAddress?: string;
  }) {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderNumber = `ORD-${dateStr}-${randSuffix}`;
    const reference = `APX-${params.paymentProvider.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-6)}-${randSuffix}`;

    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const intentId = `pi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    return await db.transaction(async (tx) => {
      // 1. Query pricing package directly from PostgreSQL
      const cleanPkgId = params.packageId ? params.packageId.trim() : '';
      if (!cleanPkgId) {
        throw new Error('Valid package selection is required for checkout');
      }

      const pkgRows = await tx
        .select()
        .from(schema.pricingPackages)
        .where(
          or(
            eq(schema.pricingPackages.id, cleanPkgId),
            eq(schema.pricingPackages.slug, cleanPkgId)
          )
        )
        .limit(1);

      const pkg = pkgRows[0];
      if (!pkg || pkg.active === false) {
        throw new Error('Selected pricing package does not exist or is currently inactive');
      }

      // 2. Authoritatively determine USD price exclusively from database
      let authoritativePrice: string | null = null;
      if (pkg.promoPriceUsd && pkg.promoPriceUsd.trim()) {
        const cleanedPromo = pkg.promoPriceUsd.replace(/[^0-9.]/g, '');
        const num = parseFloat(cleanedPromo);
        if (!isNaN(num) && num > 0) {
          authoritativePrice = cleanedPromo;
        }
      }

      if (!authoritativePrice && pkg.priceUsd && pkg.priceUsd.trim()) {
        const cleanedPrice = pkg.priceUsd.replace(/[^0-9.]/g, '');
        const num = parseFloat(cleanedPrice);
        if (!isNaN(num) && num > 0) {
          authoritativePrice = cleanedPrice;
        }
      }

      if (!authoritativePrice) {
        throw new Error('Selected package does not have a valid active price configured in database');
      }

      const authoritativePackageName = pkg.name;
      const authoritativePackageId = pkg.id;

      // 3. Query and validate Payment Method from database
      let pm: typeof schema.paymentMethods.$inferSelect | null = null;
      if (params.paymentMethodId && params.paymentMethodId.trim()) {
        const pmRows = await tx
          .select()
          .from(schema.paymentMethods)
          .where(eq(schema.paymentMethods.id, params.paymentMethodId.trim()))
          .limit(1);
        pm = pmRows[0] || null;
      } else {
        const pmRows = await tx
          .select()
          .from(schema.paymentMethods)
          .where(eq(schema.paymentMethods.provider, params.paymentProvider))
          .limit(1);
        pm = pmRows[0] || null;
      }

      if (!pm || pm.active === false) {
        throw new Error(`The selected payment method (${params.paymentProvider}) is disabled or unavailable`);
      }

      // 4. Construct provider-specific instructions using authoritative data
      let paymentType: 'card' | 'crypto' | 'bank_transfer' = 'card';
      let paymentUrl: string | undefined = undefined;
      let transferInstructions: string | undefined = undefined;
      let cryptoAddress: string | undefined = undefined;
      let cryptoNetwork: string | undefined = undefined;
      let initialStatus = 'pending';

      if (params.paymentProvider === 'paystack') {
        paymentType = 'card';
        paymentUrl = pm?.paymentUrl || '';
        initialStatus = 'pending';
      } else if (params.paymentProvider === 'bybit') {
        paymentType = 'crypto';
        paymentUrl = pm?.paymentUrl || '';
        const meta = (pm?.configMetadata as any) || {};
        const addresses = meta.addresses || {};
        const usdt = addresses.usdt;
        cryptoAddress = typeof usdt === 'object' ? usdt.address : (usdt || meta.depositAddressTRC20 || '');
        cryptoNetwork = (typeof usdt === 'object' && usdt.network) ? usdt.network : 'USDT (TRC20)';
        initialStatus = 'awaiting_payment';
      } else if (params.paymentProvider === 'grey') {
        paymentType = 'bank_transfer';
        const meta = (pm?.configMetadata as any) || {};
        const usdConfig = meta.usd || {};
        const bankName = usdConfig.bankName || meta.bankName || '';
        const beneficiary = usdConfig.beneficiary || meta.accountName || '';
        const accountNumber = usdConfig.accountNumber || meta.accountNumber || '';
        const routingNumber = usdConfig.routingNumber || meta.routingNumber || '';

        if (bankName || accountNumber) {
          transferInstructions =
            `Please transfer $${authoritativePrice} USD via International Wire or ACH to:\n` +
            (bankName ? `• Bank Name: ${bankName}\n` : '') +
            (beneficiary ? `• Beneficiary / Account Name: ${beneficiary}\n` : '') +
            (accountNumber ? `• Account Number: ${accountNumber}\n` : '') +
            (routingNumber ? `• Routing Number: ${routingNumber}\n` : '') +
            `• Payment Reference: ${reference}\n\n` +
            `IMPORTANT: Include the Payment Reference "${reference}" in your transfer description so our billing team can verify and confirm your order promptly.`;
        } else {
          transferInstructions = `Please contact billing or complete transfer with Payment Reference "${reference}".`;
        }
        initialStatus = 'awaiting_payment';
      } else {
        paymentType = 'card';
        paymentUrl = pm?.paymentUrl || '';
        initialStatus = 'pending';
      }

      // 5. Insert Order record with authoritative pricing and USD currency
      const [insertedOrder] = await tx
        .insert(schema.orders)
        .values({
          id: orderId,
          orderNumber,
          customerName: params.customerName.trim(),
          customerEmail: params.customerEmail.toLowerCase().trim(),
          customerWhatsapp: params.customerWhatsapp?.trim() || null,
          packageId: authoritativePackageId,
          packageName: authoritativePackageName,
          amountUsd: authoritativePrice,
          currency: 'USD',
          status: initialStatus,
          paymentMethodId: pm?.id || null,
          paymentProvider: params.paymentProvider,
          customerNotes: params.customerNotes?.trim() || null,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      // 6. Insert Payment Intent record with matching authoritative pricing
      const [insertedIntent] = await tx
        .insert(schema.paymentIntents)
        .values({
          id: intentId,
          orderId,
          provider: params.paymentProvider,
          paymentType,
          amountUsd: authoritativePrice,
          currency: 'USD',
          status: initialStatus,
          reference,
          paymentUrl: paymentUrl || null,
          transferInstructions: transferInstructions || null,
          cryptoAddress: cryptoAddress || null,
          cryptoNetwork: cryptoNetwork || null,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      // 7. Append-only Audit Log
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await tx.insert(schema.auditLogs).values({
        id: logId,
        adminEmail: 'checkout_system',
        action: 'Checkout Intent Created',
        entityType: 'Order',
        entityId: orderId,
        details: `Order ${orderNumber} created for ${params.customerName} (${params.customerEmail}) - $${authoritativePrice} USD via ${params.paymentProvider.toUpperCase()} [Ref: ${reference}] (Authoritative DB price applied)`,
        ipAddress: params.ipAddress || 'unknown',
        timestamp: now,
      });

      return {
        order: {
          ...insertedOrder,
          createdAt: insertedOrder.createdAt.toISOString(),
          updatedAt: insertedOrder.updatedAt.toISOString(),
        },
        paymentIntent: {
          ...insertedIntent,
          createdAt: insertedIntent.createdAt.toISOString(),
          updatedAt: insertedIntent.updatedAt.toISOString(),
        },
      };
    });
  }

  async getOrders(status?: string, provider?: string) {
    const ordersList = await db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt));
    const intentsList = await db.select().from(schema.paymentIntents).orderBy(desc(schema.paymentIntents.createdAt));

    const intentsByOrder = new Map<string, any[]>();
    for (const pi of intentsList) {
      if (!intentsByOrder.has(pi.orderId)) {
        intentsByOrder.set(pi.orderId, []);
      }
      intentsByOrder.get(pi.orderId)!.push({
        ...pi,
        createdAt: pi.createdAt.toISOString(),
        updatedAt: pi.updatedAt.toISOString(),
        confirmedAt: pi.confirmedAt ? pi.confirmedAt.toISOString() : undefined,
      });
    }

    let filtered = ordersList;
    if (status) {
      filtered = filtered.filter((o) => o.status === status);
    }
    if (provider) {
      filtered = filtered.filter((o) => o.paymentProvider === provider);
    }

    return filtered.map((o) => ({
      ...o,
      paymentIntents: intentsByOrder.get(o.id) || [],
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    }));
  }

  async getOrderById(id: string) {
    const rows = await db.select().from(schema.orders).where(eq(schema.orders.id, id)).limit(1);
    if (!rows[0]) return null;
    const order = rows[0];

    const intents = await db.select().from(schema.paymentIntents).where(eq(schema.paymentIntents.orderId, id)).orderBy(desc(schema.paymentIntents.createdAt));

    return {
      ...order,
      paymentIntents: intents.map((pi) => ({
        ...pi,
        createdAt: pi.createdAt.toISOString(),
        updatedAt: pi.updatedAt.toISOString(),
        confirmedAt: pi.confirmedAt ? pi.confirmedAt.toISOString() : undefined,
      })),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }

  async confirmPaymentIntent(intentId: string, adminEmail: string, adminNotes?: string, ipAddress?: string) {
    const now = new Date();
    return await db.transaction(async (tx) => {
      const intents = await tx
        .select()
        .from(schema.paymentIntents)
        .where(eq(schema.paymentIntents.id, intentId))
        .limit(1);
      const existingIntent = intents[0];
      if (!existingIntent) {
        throw new Error('Payment intent not found');
      }

      const orderRows = await tx
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, existingIntent.orderId))
        .limit(1);
      const order = orderRows[0];
      if (!order) {
        throw new Error('Associated order not found');
      }

      if (order.status === 'cancelled' || order.status === 'refunded') {
        throw new Error(`Cannot confirm payment: Order is in '${order.status}' status.`);
      }

      const transitionCheck = validateOrderStateTransition(order.status, 'paid');
      if (!transitionCheck.allowed) {
        throw new Error(transitionCheck.reason);
      }

      const [updatedIntent] = await tx
        .update(schema.paymentIntents)
        .set({
          status: 'paid',
          confirmedBy: adminEmail,
          confirmedAt: now,
          adminNotes: adminNotes || 'Confirmed by admin',
          updatedAt: now,
        })
        .where(eq(schema.paymentIntents.id, intentId))
        .returning();

      const [updatedOrder] = await tx
        .update(schema.orders)
        .set({
          status: 'paid',
          updatedAt: now,
        })
        .where(eq(schema.orders.id, existingIntent.orderId))
        .returning();

      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await tx.insert(schema.auditLogs).values({
        id: logId,
        adminEmail,
        action: 'Payment Confirmed',
        entityType: 'PaymentIntent',
        entityId: intentId,
        details: `Payment reference ${updatedIntent.reference} for Order ${updatedOrder?.orderNumber} confirmed as PAID by ${adminEmail}. Notes: ${adminNotes || 'None'}`,
        ipAddress: ipAddress || 'unknown',
        timestamp: now,
      });

      return {
        order: updatedOrder,
        paymentIntent: updatedIntent,
      };
    });
  }

  async updateOrderStatus(orderId: string, status: string, adminEmail: string, adminNotes?: string, ipAddress?: string) {
    const now = new Date();
    return await db.transaction(async (tx) => {
      const orderRows = await tx
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, orderId))
        .limit(1);
      const existingOrder = orderRows[0];

      if (!existingOrder) {
        throw new Error('Order not found');
      }

      const transitionCheck = validateOrderStateTransition(existingOrder.status, status);
      if (!transitionCheck.allowed) {
        throw new Error(transitionCheck.reason);
      }

      const [updatedOrder] = await tx
        .update(schema.orders)
        .set({
          status,
          updatedAt: now,
        })
        .where(eq(schema.orders.id, orderId))
        .returning();

      await tx
        .update(schema.paymentIntents)
        .set({
          status: status as any,
          adminNotes: adminNotes || undefined,
          updatedAt: now,
        })
        .where(eq(schema.paymentIntents.orderId, orderId));

      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await tx.insert(schema.auditLogs).values({
        id: logId,
        adminEmail,
        action: 'Order Status Changed',
        entityType: 'Order',
        entityId: orderId,
        details: `Order ${updatedOrder.orderNumber} status updated from "${existingOrder.status}" to "${status}" by ${adminEmail}. Notes: ${adminNotes || 'None'}`,
        ipAddress: ipAddress || 'unknown',
        timestamp: now,
      });

      return updatedOrder;
    });
  }

  async getPaymentIntentByReference(reference: string) {
    const rows = await db
      .select()
      .from(schema.paymentIntents)
      .where(eq(schema.paymentIntents.reference, reference))
      .limit(1);
    if (!rows[0]) return null;
    const intent = rows[0];

    const orderRows = await db.select().from(schema.orders).where(eq(schema.orders.id, intent.orderId)).limit(1);

    return {
      ...intent,
      order: orderRows[0] || null,
      createdAt: intent.createdAt.toISOString(),
      updatedAt: intent.updatedAt.toISOString(),
      confirmedAt: intent.confirmedAt ? intent.confirmedAt.toISOString() : undefined,
    };
  }

  async getPaymentIntentById(id: string) {
    const rows = await db
      .select()
      .from(schema.paymentIntents)
      .where(eq(schema.paymentIntents.id, id))
      .limit(1);
    if (!rows[0]) return null;
    const intent = rows[0];

    const orderRows = await db.select().from(schema.orders).where(eq(schema.orders.id, intent.orderId)).limit(1);

    return {
      ...intent,
      order: orderRows[0] || null,
      createdAt: intent.createdAt.toISOString(),
      updatedAt: intent.updatedAt.toISOString(),
      confirmedAt: intent.confirmedAt ? intent.confirmedAt.toISOString() : undefined,
    };
  }

  async updatePaymentIntentUrlAndMetadata(intentId: string, paymentUrl: string, metadata?: Record<string, any>) {
    const now = new Date();
    const rows = await db
      .update(schema.paymentIntents)
      .set({
        paymentUrl,
        metadata: metadata || undefined,
        updatedAt: now,
      })
      .where(eq(schema.paymentIntents.id, intentId))
      .returning();
    return rows[0] || null;
  }

  /**
   * Atomic PostgreSQL transaction to confirm Paystack payment with strict idempotency and validation
   */
  async confirmPaystackPayment(
    reference: string,
    paystackData: any,
    source: 'paystack_api_verify' | 'paystack_webhook',
    ipAddress?: string
  ) {
    return await db.transaction(async (tx) => {
      // 1. Lock/fetch payment intent by reference
      const intents = await tx
        .select()
        .from(schema.paymentIntents)
        .where(eq(schema.paymentIntents.reference, reference))
        .limit(1);
      const intent = intents[0];

      if (!intent) {
        throw new Error(`Payment intent reference not found in PostgreSQL: ${reference}`);
      }

      // 2. Fetch associated order
      const orderRows = await tx
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, intent.orderId))
        .limit(1);
      const order = orderRows[0];

      if (!order) {
        throw new Error(`Associated order ${intent.orderId} not found for payment intent`);
      }

      // 3. Idempotency check: If already paid, safely return without re-mutating or duplicating audit entries
      if ((intent.status === 'paid' || intent.status === 'completed') && (order.status === 'paid' || order.status === 'completed')) {
        return {
          order: {
            ...order,
            createdAt: order.createdAt.toISOString(),
            updatedAt: order.updatedAt.toISOString(),
          },
          paymentIntent: {
            ...intent,
            createdAt: intent.createdAt.toISOString(),
            updatedAt: intent.updatedAt.toISOString(),
            confirmedAt: intent.confirmedAt ? intent.confirmedAt.toISOString() : undefined,
          },
          alreadyProcessed: true,
        };
      }

      // Check state machine transition
      if (order.status === 'cancelled' || order.status === 'refunded') {
        throw new Error(`Cannot confirm payment: Order ${order.orderNumber} is in '${order.status}' status and cannot be marked as paid.`);
      }

      const transitionCheck = validateOrderStateTransition(order.status, 'paid');
      if (!transitionCheck.allowed) {
        throw new Error(transitionCheck.reason);
      }

      // 4. Strict USD Currency Validation
      if (intent.currency !== 'USD' || order.currency !== 'USD') {
        throw new Error(`Currency violation: Expected USD, but order is configured as ${order.currency}`);
      }

      if (paystackData.currency && paystackData.currency.toUpperCase() !== 'USD') {
        throw new Error(`Currency violation: Paystack payment payload currency is ${paystackData.currency}, expected USD`);
      }

      // 5. Strict Amount Validation (Convert database authoritative price to minor cents)
      const expectedCents = Math.round(parseFloat(order.amountUsd.replace(/[^0-9.]/g, '')) * 100);
      const receivedCents = Number(paystackData.amount);

      if (isNaN(receivedCents) || receivedCents !== expectedCents) {
        throw new Error(
          `Amount mismatch: expected ${expectedCents} cents ($${order.amountUsd} USD), received ${receivedCents} cents`
        );
      }

      const now = new Date();
      const existingMeta = (intent.metadata as Record<string, any>) || {};
      const updatedMetadata = {
        ...existingMeta,
        paystackTransactionId: paystackData.id || null,
        paystackReference: paystackData.reference || reference,
        paystackChannel: paystackData.channel || 'card',
        paystackPaidAt: paystackData.paid_at || now.toISOString(),
        paystackGatewayResponse: paystackData.gateway_response || 'Successful',
        verifiedSource: source,
        verifiedAt: now.toISOString(),
      };

      // 6. Set payment intent status = paid
      const [updatedIntent] = await tx
        .update(schema.paymentIntents)
        .set({
          status: 'paid',
          confirmedBy: source,
          confirmedAt: now,
          metadata: updatedMetadata,
          updatedAt: now,
        })
        .where(eq(schema.paymentIntents.id, intent.id))
        .returning();

      // 7. Set order status = paid
      const [updatedOrder] = await tx
        .update(schema.orders)
        .set({
          status: 'paid',
          updatedAt: now,
        })
        .where(eq(schema.orders.id, order.id))
        .returning();

      // 8. Create immutable audit log
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await tx.insert(schema.auditLogs).values({
        id: logId,
        adminEmail: source,
        action: 'Paystack Payment Confirmed',
        entityType: 'Order',
        entityId: order.id,
        details: `Order ${order.orderNumber} ($${order.amountUsd} USD) confirmed as PAID via Paystack [Ref: ${reference}, TxID: ${paystackData.id || 'N/A'}, Channel: ${paystackData.channel || 'card'}, Source: ${source}]`,
        ipAddress: ipAddress || 'unknown',
        timestamp: now,
      });

      return {
        order: {
          ...updatedOrder,
          createdAt: updatedOrder.createdAt.toISOString(),
          updatedAt: updatedOrder.updatedAt.toISOString(),
        },
        paymentIntent: {
          ...updatedIntent,
          createdAt: updatedIntent.createdAt.toISOString(),
          updatedAt: updatedIntent.updatedAt.toISOString(),
          confirmedAt: updatedIntent.confirmedAt ? updatedIntent.confirmedAt.toISOString() : undefined,
        },
        alreadyProcessed: false,
      };
    });
  }

  /**
   * Atomic PostgreSQL transaction to process Paystack refund event
   */
  async handlePaystackRefund(reference: string, refundData: any, ipAddress?: string) {
    return await db.transaction(async (tx) => {
      const intents = await tx
        .select()
        .from(schema.paymentIntents)
        .where(eq(schema.paymentIntents.reference, reference))
        .limit(1);
      const intent = intents[0];
      if (!intent) {
        throw new Error(`Payment intent reference not found for refund: ${reference}`);
      }

      const orderRows = await tx
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, intent.orderId))
        .limit(1);
      const order = orderRows[0];
      if (!order) {
        throw new Error(`Associated order not found for refund`);
      }

      if (order.status === 'refunded' && intent.status === 'refunded') {
        return {
          order,
          paymentIntent: intent,
          alreadyProcessed: true,
        };
      }

      const now = new Date();
      const existingMeta = (intent.metadata as Record<string, any>) || {};
      const updatedMetadata = {
        ...existingMeta,
        paystackRefundedAt: now.toISOString(),
        refundData: refundData || {},
      };

      const [updatedIntent] = await tx
        .update(schema.paymentIntents)
        .set({
          status: 'refunded',
          metadata: updatedMetadata,
          updatedAt: now,
        })
        .where(eq(schema.paymentIntents.id, intent.id))
        .returning();

      const [updatedOrder] = await tx
        .update(schema.orders)
        .set({
          status: 'refunded',
          updatedAt: now,
        })
        .where(eq(schema.orders.id, order.id))
        .returning();

      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await tx.insert(schema.auditLogs).values({
        id: logId,
        adminEmail: 'paystack_webhook',
        action: 'Paystack Refund Processed',
        entityType: 'Order',
        entityId: order.id,
        details: `Order ${order.orderNumber} ($${order.amountUsd} USD) updated to REFUNDED via Paystack webhook [Ref: ${reference}]`,
        ipAddress: ipAddress || 'unknown',
        timestamp: now,
      });

      return {
        order: updatedOrder,
        paymentIntent: updatedIntent,
        alreadyProcessed: false,
      };
    });
  }

  /**
   * Public helper to record structured audit log entries
   */
  async addAuditLog(adminEmail: string, action: string, entityType: string, entityId?: string, details?: string, ipAddress?: string) {
    const now = new Date();
    const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.insert(schema.auditLogs).values({
      id: logId,
      adminEmail,
      action,
      entityType,
      entityId: entityId || null,
      details: details || '',
      ipAddress: ipAddress || 'system',
      timestamp: now,
    });
  }

  /**
   * Logs Paystack dispute event in audit logs and updates payment intent metadata
   */
  async logDisputeEvent(reference: string, disputeData: any, ipAddress?: string) {
    const intents = await db
      .select()
      .from(schema.paymentIntents)
      .where(eq(schema.paymentIntents.reference, reference))
      .limit(1);
    const intent = intents[0];
    if (!intent) return;

    const now = new Date();
    const existingMeta = (intent.metadata as Record<string, any>) || {};
    const updatedMetadata = {
      ...existingMeta,
      disputeFlag: true,
      disputeAt: now.toISOString(),
      disputeData,
    };

    await db
      .update(schema.paymentIntents)
      .set({
        metadata: updatedMetadata,
        updatedAt: now,
      })
      .where(eq(schema.paymentIntents.id, intent.id));

    const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.insert(schema.auditLogs).values({
      id: logId,
      adminEmail: 'paystack_webhook',
      action: 'Paystack Dispute Logged',
      entityType: 'Order',
      entityId: intent.orderId,
      details: `Charge dispute initiated on Paystack for Reference ${reference}. Status: ${disputeData?.status || 'opened'}`,
      ipAddress: ipAddress || 'unknown',
      timestamp: now,
    });
  }

  // ==========================================
  // DASHBOARD STATS
  // ==========================================
  async getDashboardStats(): Promise<DashboardStats> {
    const [
      servicesCount,
      packagesCount,
      demosCount,
      faqsCount,
      leadsList,
      pmCount,
      recentLogs,
      testimonialsCount,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(schema.services).where(eq(schema.services.published, true)),
      db.select({ count: sql<number>`count(*)` }).from(schema.pricingPackages).where(eq(schema.pricingPackages.active, true)),
      db.select({ count: sql<number>`count(*)` }).from(schema.demos).where(eq(schema.demos.active, true)),
      db.select({ count: sql<number>`count(*)` }).from(schema.faqs).where(eq(schema.faqs.published, true)),
      this.getLeads(),
      db.select({ count: sql<number>`count(*)` }).from(schema.paymentMethods).where(eq(schema.paymentMethods.active, true)),
      this.getAuditLogs(10),
      db.select({ count: sql<number>`count(*)` }).from(schema.testimonials).where(eq(schema.testimonials.published, true)),
    ]);

    const leadsByStatus: Record<LeadStatus, number> = {
      new: 0,
      contacted: 0,
      qualified: 0,
      proposal: 0,
      won: 0,
      lost: 0,
    };

    leadsList.forEach((lead) => {
      if (leadsByStatus[lead.status] !== undefined) {
        leadsByStatus[lead.status]++;
      }
    });

    return {
      activeServices: Number(servicesCount[0]?.count || 0),
      activePackages: Number(packagesCount[0]?.count || 0),
      publishedDemos: Number(demosCount[0]?.count || 0),
      publishedFaqs: Number(faqsCount[0]?.count || 0),
      publishedTestimonials: Number(testimonialsCount[0]?.count || 0),
      totalLeads: leadsList.length,
      newLeads: leadsByStatus.new,
      leadsByStatus,
      activePaymentMethods: Number(pmCount[0]?.count || 0),
      recentLeads: leadsList.slice(0, 5),
      recentAuditLogs: recentLogs,
    };
  }

  async getDatabaseTableCounts() {
    const [adminCount, leadsCount, demosCount, faqsCount, servicesCount, packagesCount, testimonialsCount, paymentMethodsCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(schema.adminUsers),
      db.select({ count: sql<number>`count(*)` }).from(schema.leads),
      db.select({ count: sql<number>`count(*)` }).from(schema.demos),
      db.select({ count: sql<number>`count(*)` }).from(schema.faqs),
      db.select({ count: sql<number>`count(*)` }).from(schema.services),
      db.select({ count: sql<number>`count(*)` }).from(schema.pricingPackages),
      db.select({ count: sql<number>`count(*)` }).from(schema.testimonials),
      db.select({ count: sql<number>`count(*)` }).from(schema.paymentMethods),
    ]);

    return [
      { name: 'admin_users', rows: Number(adminCount[0]?.count || 0), description: 'System administrators and access control' },
      { name: 'leads', rows: Number(leadsCount[0]?.count || 0), description: 'Live CRM entries and potential clients' },
      { name: 'demos', rows: Number(demosCount[0]?.count || 0), description: 'Interactive demo videos and scripts' },
      { name: 'faqs', rows: Number(faqsCount[0]?.count || 0), description: 'Clarifications and turnaround content' },
      { name: 'services', rows: Number(servicesCount[0]?.count || 0), description: 'Value pillars and service listings' },
      { name: 'pricing_packages', rows: Number(packagesCount[0]?.count || 0), description: 'Commercial packages and subscription bundles' },
      { name: 'testimonials', rows: Number(testimonialsCount[0]?.count || 0), description: 'Social proof, reviews, and ratings' },
      { name: 'payment_methods', rows: Number(paymentMethodsCount[0]?.count || 0), description: 'Integrated checkout gateways and settings' },
    ];
  }

  // ==========================================
  // AI CONVERSATION & ANALYTICS PERSISTENCE
  // ==========================================

  private aiTablesChecked = false;
  private useInMemoryAiStore = false;
  private inMemoryConversations = new Map<string, AiConversation>();
  private inMemoryMessages: AiMessage[] = [];
  private inMemoryEvents: { id: string; conversationId?: string; eventType: string; payload?: Record<string, any>; createdAt: Date }[] = [];

  private async ensureAiTablesExist(): Promise<void> {
    if (this.aiTablesChecked) return;
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ai_conversations (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          user_role TEXT NOT NULL DEFAULT 'customer',
          user_email TEXT,
          summary TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ai_messages (
          id TEXT PRIMARY KEY,
          conversation_id TEXT NOT NULL,
          sender TEXT NOT NULL,
          content TEXT NOT NULL,
          metadata JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ai_events (
          id TEXT PRIMARY KEY,
          conversation_id TEXT,
          event_type TEXT NOT NULL,
          payload JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      this.aiTablesChecked = true;
      this.useInMemoryAiStore = false;
    } catch (err) {
      this.aiTablesChecked = true;
      this.useInMemoryAiStore = true;
    }
  }

  async getOrCreateAiConversation(
    sessionId: string,
    userRole: 'customer' | 'admin' | 'superadmin' | 'editor' = 'customer',
    userEmail?: string
  ): Promise<AiConversation> {
    await this.ensureAiTablesExist();

    if (this.useInMemoryAiStore) {
      let conv = this.inMemoryConversations.get(sessionId);
      if (!conv) {
        const now = new Date().toISOString();
        conv = {
          id: `conv_mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          sessionId,
          userRole,
          userEmail,
          summary: '',
          createdAt: now,
          updatedAt: now,
        };
        this.inMemoryConversations.set(sessionId, conv);
      }
      return conv;
    }

    try {
      const existing = await db
        .select()
        .from(schema.aiConversations)
        .where(eq(schema.aiConversations.sessionId, sessionId))
        .limit(1);

      if (existing && existing.length > 0) {
        const conv = existing[0];
        return {
          id: conv.id,
          sessionId: conv.sessionId,
          userRole: conv.userRole as any,
          userEmail: conv.userEmail || undefined,
          summary: conv.summary || undefined,
          createdAt: conv.createdAt.toISOString(),
          updatedAt: conv.updatedAt.toISOString(),
        };
      }

      const now = new Date();
      const convId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await db.insert(schema.aiConversations).values({
        id: convId,
        sessionId,
        userRole,
        userEmail: userEmail || null,
        summary: '',
        createdAt: now,
        updatedAt: now,
      });

      return {
        id: convId,
        sessionId,
        userRole,
        userEmail,
        summary: '',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
    } catch (err) {
      this.useInMemoryAiStore = true;
      let conv = this.inMemoryConversations.get(sessionId);
      if (!conv) {
        const now = new Date().toISOString();
        conv = {
          id: `conv_mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          sessionId,
          userRole,
          userEmail,
          summary: '',
          createdAt: now,
          updatedAt: now,
        };
        this.inMemoryConversations.set(sessionId, conv);
      }
      return conv;
    }
  }

  async saveAiMessage(
    conversationId: string,
    sender: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: Record<string, any>
  ): Promise<AiMessage> {
    await this.ensureAiTablesExist();
    const now = new Date();
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (!this.useInMemoryAiStore) {
      try {
        await db.insert(schema.aiMessages).values({
          id: msgId,
          conversationId,
          sender,
          content,
          metadata: metadata || null,
          createdAt: now,
        });

        await db
          .update(schema.aiConversations)
          .set({ updatedAt: now })
          .where(eq(schema.aiConversations.id, conversationId));
      } catch (err) {
        this.useInMemoryAiStore = true;
      }
    }

    const msgObj: AiMessage = {
      id: msgId,
      conversationId,
      sender,
      content,
      metadata,
      createdAt: now.toISOString(),
    };
    this.inMemoryMessages.push(msgObj);
    return msgObj;
  }

  async getAiMessages(conversationId: string, limit: number = 30): Promise<AiMessage[]> {
    await this.ensureAiTablesExist();

    if (this.useInMemoryAiStore) {
      return this.inMemoryMessages.filter((m) => m.conversationId === conversationId).slice(-limit);
    }

    try {
      const rows = await db
        .select()
        .from(schema.aiMessages)
        .where(eq(schema.aiMessages.conversationId, conversationId))
        .orderBy(schema.aiMessages.createdAt)
        .limit(limit);

      return rows.map((r) => ({
        id: r.id,
        conversationId: r.conversationId,
        sender: r.sender as any,
        content: r.content,
        metadata: (r.metadata as Record<string, any>) || undefined,
        createdAt: r.createdAt.toISOString(),
      }));
    } catch (err) {
      this.useInMemoryAiStore = true;
      return this.inMemoryMessages.filter((m) => m.conversationId === conversationId).slice(-limit);
    }
  }

  async logAiEvent(
    eventType: string,
    payload?: Record<string, any>,
    conversationId?: string
  ): Promise<void> {
    await this.ensureAiTablesExist();
    const now = new Date();
    const eventId = `aie_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (!this.useInMemoryAiStore) {
      try {
        await db.insert(schema.aiEvents).values({
          id: eventId,
          conversationId: conversationId || null,
          eventType,
          payload: payload || null,
          createdAt: now,
        });
      } catch (err) {
        this.useInMemoryAiStore = true;
      }
    }

    this.inMemoryEvents.push({
      id: eventId,
      conversationId,
      eventType,
      payload,
      createdAt: now,
    });
  }

  async getAiAnalytics(): Promise<AiAnalytics> {
    await this.ensureAiTablesExist();
    let convRows: any[] = [];
    let eventRows: any[] = [];

    try {
      [convRows, eventRows] = await Promise.all([
        db.select().from(schema.aiConversations).orderBy(desc(schema.aiConversations.updatedAt)).limit(20),
        db.select().from(schema.aiEvents).orderBy(desc(schema.aiEvents.createdAt)).limit(500),
      ]);
    } catch (err) {
      console.warn('PostgreSQL query failed for getAiAnalytics, calculating from in-memory fallback:', err);
      convRows = Array.from(this.inMemoryConversations.values());
      eventRows = this.inMemoryEvents;
    }

    const packageRecs: Record<string, number> = {};
    let qualifiedLeads = 0;
    let checkoutClicks = 0;
    let humanHandoffs = 0;

    eventRows.forEach((e) => {
      const payload = e.payload as Record<string, any> | null;
      if (e.eventType === 'package_recommended' && payload && payload.packageName) {
        const pName = payload.packageName as string;
        packageRecs[pName] = (packageRecs[pName] || 0) + 1;
      } else if (e.eventType === 'lead_created' || e.eventType === 'lead_qualified') {
        qualifiedLeads++;
      } else if (e.eventType === 'checkout_clicked') {
        checkoutClicks++;
      } else if (e.eventType === 'human_handoff') {
        humanHandoffs++;
      }
    });

    const recentConversations: AiConversation[] = convRows.map((c) => ({
      id: c.id,
      sessionId: c.sessionId,
      userRole: c.userRole as any,
      userEmail: c.userEmail || undefined,
      summary: c.summary || undefined,
      createdAt: typeof c.createdAt === 'string' ? c.createdAt : c.createdAt.toISOString(),
      updatedAt: typeof c.updatedAt === 'string' ? c.updatedAt : c.updatedAt.toISOString(),
    }));

    return {
      totalConversations: convRows.length,
      qualifiedLeads,
      packageRecommendations: packageRecs,
      checkoutClicks,
      humanHandoffs,
      recentConversations,
    };
  }

  async createLeadFromAssistant(data: {
    name: string;
    email: string;
    whatsapp: string;
    businessType: string;
    sellingDetails: string;
    websiteUrl?: string;
    message?: string;
    recommendedPackage?: string;
    conversationSummary?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  }): Promise<Lead> {
    const existing = await db
      .select()
      .from(schema.leads)
      .where(eq(schema.leads.email, data.email.trim().toLowerCase()))
      .limit(1);

    if (existing && existing.length > 0) {
      const updated = await db
        .update(schema.leads)
        .set({
          whatsapp: data.whatsapp || existing[0].whatsapp,
          businessType: data.businessType || existing[0].businessType,
          sellingDetails: `${existing[0].sellingDetails}\n[AI Update]: ${data.sellingDetails}`,
          updatedAt: new Date(),
        })
        .where(eq(schema.leads.id, existing[0].id))
        .returning();

      if (data.conversationSummary) {
        await this.addLeadNote(
          existing[0].id,
          'ApexGrowth AI Assistant',
          `AI Qualification Summary:\n${data.conversationSummary}${
            data.recommendedPackage ? `\nRecommended Package: ${data.recommendedPackage}` : ''
          }`
        );
      }

      await this.logAiEvent('lead_created', { leadId: existing[0].id, isExisting: true, email: data.email });

      return this.getLeadById(existing[0].id) as Promise<Lead>;
    }

    const createdLead = await this.createLeadWithTransaction(
      {
        name: data.name,
        email: data.email.toLowerCase().trim(),
        whatsapp: data.whatsapp,
        businessType: data.businessType,
        websiteUrl: data.websiteUrl || '',
        sellingDetails: data.sellingDetails,
        message: data.message || `AI Qualified Lead. Recommended Package: ${data.recommendedPackage || 'N/A'}`,
        utmSource: data.utmSource || 'ai_assistant',
        utmMedium: data.utmMedium || 'chat',
        utmCampaign: data.utmCampaign || 'apex_ai_v5',
      },
      'system_ai'
    );

    if (data.conversationSummary) {
      await this.addLeadNote(
        createdLead.id,
        'ApexGrowth AI Assistant',
        `AI Qualification Summary:\n${data.conversationSummary}${
          data.recommendedPackage ? `\nRecommended Package: ${data.recommendedPackage}` : ''
        }`
      );
    }

    await this.logAiEvent('lead_created', { leadId: createdLead.id, isExisting: false, email: data.email });

    return createdLead;
  }

  // ==========================================
  // OPPORTUNITY SCOUT & INTELLIGENCE
  // ==========================================
  private scoutTablesChecked = false;
  private useInMemoryScoutStore = false;
  private inMemoryOpportunities = new Map<string, Opportunity>();
  private inMemoryScoutSettings: ScoutSettings = {
    id: 'scout_settings_primary',
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
    telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
    telegramEnabled: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    tavilyApiKey: process.env.TAVILY_API_KEY || '',
    tavilyEnabled: Boolean(process.env.TAVILY_API_KEY),
    autonomousWorkerEnabled: true,
    runIntervalMinutes: 60,
    targetNiches: ['E-commerce Brands', 'Shopify Store Owners', 'Course & Digital Creators', 'High-Ticket Coaches'],
    intentKeywords: ['checkout dropoff', 'low conversion rate', 'feedback on store', 'need landing page', 'video ad script', 'abandoned carts'],
    aiProvider: 'gemini',
    aiModel: 'gemini-2.5-flash',
    emailProvider: (process.env.EMAIL_OUTREACH_PROVIDER as any) || 'gmail',
    gmailUser: process.env.GMAIL_USER || process.env.SMTP_USER || '',
    gmailAppPassword: process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '',
    resendApiKey: process.env.RESEND_API_KEY || '',
    resendFromEmail: process.env.RESEND_FROM_EMAIL || 'ApexGrowth Growth Team <onboarding@resend.dev>',
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465,
    totalScoutedCount: 0,
    updatedAt: new Date().toISOString(),
  };

  private async ensureScoutTablesExist(): Promise<void> {
    if (this.scoutTablesChecked) return;
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS opportunities (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          prospect_name TEXT NOT NULL,
          business_name TEXT NOT NULL,
          website_url TEXT,
          niche TEXT NOT NULL,
          source_platform TEXT NOT NULL DEFAULT 'web_search',
          source_url TEXT NOT NULL,
          source_post_excerpt TEXT,
          relevance_summary TEXT NOT NULL,
          evidence JSONB NOT NULL DEFAULT '[]',
          public_contacts JSONB NOT NULL DEFAULT '[]',
          opportunity_score TEXT NOT NULL DEFAULT 'MEDIUM',
          outreach_status TEXT NOT NULL DEFAULT 'DRAFTED',
          outreach_draft TEXT NOT NULL,
          refined_draft TEXT,
          refinement_feedback TEXT,
          telegram_message_id TEXT,
          action_approved_at TIMESTAMPTZ,
          action_sent_at TIMESTAMPTZ,
          action_rejected_at TIMESTAMPTZ,
          sent_channel TEXT,
          sent_provider TEXT,
          outreach_message_id TEXT,
          resend_message_id TEXT,
          recipient_email TEXT,
          send_error_reason TEXT,
          email_subject TEXT,
          dispatch_attempt_id TEXT,
          dispatch_attempt_at TIMESTAMPTZ,
          next_follow_up_date TIMESTAMPTZ,
          prospect_reply TEXT,
          prospect_replied_at TIMESTAMPTZ,
          deal_id TEXT,
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS scout_settings (
          id TEXT PRIMARY KEY,
          telegram_bot_token TEXT,
          telegram_chat_id TEXT,
          telegram_enabled BOOLEAN NOT NULL DEFAULT FALSE,
          tavily_api_key TEXT,
          tavily_enabled BOOLEAN NOT NULL DEFAULT TRUE,
          autonomous_worker_enabled BOOLEAN NOT NULL DEFAULT TRUE,
          run_interval_minutes INTEGER NOT NULL DEFAULT 60,
          target_niches JSONB NOT NULL DEFAULT '["E-commerce Brands", "Shopify Store Owners", "Course & Digital Creators"]',
          intent_keywords JSONB NOT NULL DEFAULT '["checkout dropoff", "low conversion rate", "feedback on store", "need landing page"]',
          ai_provider TEXT NOT NULL DEFAULT 'gemini',
          ai_model TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
          email_provider TEXT NOT NULL DEFAULT 'gmail',
          gmail_user TEXT,
          gmail_app_password TEXT,
          resend_api_key TEXT,
          resend_from_email TEXT DEFAULT 'ApexGrowth Growth Team <onboarding@resend.dev>',
          smtp_host TEXT,
          smtp_port INTEGER DEFAULT 465,
          last_run_at TIMESTAMPTZ,
          total_scouted_count INTEGER NOT NULL DEFAULT 0,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      // Ensure columns exist if table was already created earlier
      await db.execute(sql`
        ALTER TABLE scout_settings ADD COLUMN IF NOT EXISTS tavily_api_key TEXT;
        ALTER TABLE scout_settings ADD COLUMN IF NOT EXISTS tavily_enabled BOOLEAN NOT NULL DEFAULT TRUE;
        ALTER TABLE scout_settings ADD COLUMN IF NOT EXISTS ai_provider TEXT NOT NULL DEFAULT 'gemini';
        ALTER TABLE scout_settings ADD COLUMN IF NOT EXISTS ai_model TEXT NOT NULL DEFAULT 'gemini-2.5-flash';
        ALTER TABLE scout_settings ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;
        ALTER TABLE scout_settings ADD COLUMN IF NOT EXISTS groq_api_key TEXT;
        ALTER TABLE scout_settings ADD COLUMN IF NOT EXISTS mistral_api_key TEXT;
        ALTER TABLE scout_settings ADD COLUMN IF NOT EXISTS nvidia_api_key TEXT;
        ALTER TABLE scout_settings ADD COLUMN IF NOT EXISTS secondary_ai_api_key TEXT;
        ALTER TABLE scout_settings ADD COLUMN IF NOT EXISTS secondary_ai_base_url TEXT;
        ALTER TABLE scout_settings ADD COLUMN IF NOT EXISTS ai_temperature INTEGER DEFAULT 70;
        ALTER TABLE scout_settings ADD COLUMN IF NOT EXISTS email_provider TEXT NOT NULL DEFAULT 'gmail';
        ALTER TABLE scout_settings ADD COLUMN IF NOT EXISTS gmail_user TEXT;
        ALTER TABLE scout_settings ADD COLUMN IF NOT EXISTS gmail_app_password TEXT;
        ALTER TABLE scout_settings ADD COLUMN IF NOT EXISTS resend_api_key TEXT;
        ALTER TABLE scout_settings ADD COLUMN IF NOT EXISTS resend_from_email TEXT DEFAULT 'ApexGrowth Growth Team <onboarding@resend.dev>';
        ALTER TABLE scout_settings ADD COLUMN IF NOT EXISTS smtp_host TEXT;
        ALTER TABLE scout_settings ADD COLUMN IF NOT EXISTS smtp_port INTEGER DEFAULT 465;

        ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS sent_channel TEXT;
        ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS sent_provider TEXT;
        ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS outreach_message_id TEXT;
        ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS resend_message_id TEXT;
        ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS recipient_email TEXT;
        ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS send_error_reason TEXT;
        ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS email_subject TEXT;
        ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS dispatch_attempt_id TEXT;
        ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS dispatch_attempt_at TIMESTAMPTZ;
        ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS next_follow_up_date TIMESTAMPTZ;
        ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS prospect_reply TEXT;
        ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS prospect_replied_at TIMESTAMPTZ;
        ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS deal_id TEXT;
      `).catch(() => {});
      this.scoutTablesChecked = true;
      this.useInMemoryScoutStore = false;
    } catch {
      this.scoutTablesChecked = true;
      this.useInMemoryScoutStore = true;
    }
  }

  async getScoutSettings(): Promise<ScoutSettings> {
    await this.ensureScoutTablesExist();
    if (this.useInMemoryScoutStore) {
      return { ...this.inMemoryScoutSettings };
    }

    try {
      const rows = await db.select().from(schema.scoutSettings).limit(1);
      if (rows.length > 0) {
        const r = rows[0];
        return {
          id: r.id,
          telegramBotToken: r.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || '',
          telegramChatId: r.telegramChatId || process.env.TELEGRAM_CHAT_ID || '',
          telegramEnabled: r.telegramEnabled,
          tavilyApiKey: r.tavilyApiKey || process.env.TAVILY_API_KEY || '',
          tavilyEnabled: r.tavilyEnabled ?? true,
          autonomousWorkerEnabled: r.autonomousWorkerEnabled,
          runIntervalMinutes: r.runIntervalMinutes,
          targetNiches: (r.targetNiches as string[]) || this.inMemoryScoutSettings.targetNiches,
          intentKeywords: (r.intentKeywords as string[]) || this.inMemoryScoutSettings.intentKeywords,
          aiProvider: (r.aiProvider as any) || 'gemini',
          aiModel: r.aiModel || 'gemini-2.5-flash',
          geminiApiKey: r.geminiApiKey || process.env.GEMINI_API_KEY || '',
          groqApiKey: r.groqApiKey || process.env.GROQ_API_KEY || '',
          mistralApiKey: r.mistralApiKey || process.env.MISTRAL_API_KEY || '',
          nvidiaApiKey: r.nvidiaApiKey || process.env.NVIDIA_API_KEY || '',
          secondaryAiApiKey: r.secondaryAiApiKey || '',
          secondaryAiBaseUrl: r.secondaryAiBaseUrl || '',
          aiTemperature: r.aiTemperature ?? 70,
          emailProvider: (r.emailProvider as any) || (process.env.EMAIL_OUTREACH_PROVIDER as any) || 'gmail',
          gmailUser: r.gmailUser || process.env.GMAIL_USER || process.env.SMTP_USER || '',
          gmailAppPassword: r.gmailAppPassword || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '',
          resendApiKey: r.resendApiKey || process.env.RESEND_API_KEY || '',
          resendFromEmail: r.resendFromEmail || process.env.RESEND_FROM_EMAIL || 'ApexGrowth Growth Team <onboarding@resend.dev>',
          smtpHost: r.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com',
          smtpPort: r.smtpPort || (process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465),
          lastRunAt: r.lastRunAt ? r.lastRunAt.toISOString() : undefined,
          totalScoutedCount: r.totalScoutedCount || 0,
          updatedAt: r.updatedAt.toISOString(),
        };
      }

      // Seed initial settings row
      const initial: ScoutSettings = {
        id: 'scout_settings_primary',
        telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
        telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
        telegramEnabled: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
        tavilyApiKey: process.env.TAVILY_API_KEY || '',
        tavilyEnabled: Boolean(process.env.TAVILY_API_KEY),
        autonomousWorkerEnabled: true,
        runIntervalMinutes: 60,
        targetNiches: this.inMemoryScoutSettings.targetNiches,
        intentKeywords: this.inMemoryScoutSettings.intentKeywords,
        aiProvider: 'gemini',
        aiModel: 'gemini-2.5-flash',
        geminiApiKey: process.env.GEMINI_API_KEY || '',
        groqApiKey: process.env.GROQ_API_KEY || '',
        mistralApiKey: process.env.MISTRAL_API_KEY || '',
        nvidiaApiKey: process.env.NVIDIA_API_KEY || '',
        secondaryAiApiKey: '',
        secondaryAiBaseUrl: '',
        aiTemperature: 70,
        emailProvider: (process.env.EMAIL_OUTREACH_PROVIDER as any) || 'gmail',
        gmailUser: process.env.GMAIL_USER || process.env.SMTP_USER || '',
        gmailAppPassword: process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '',
        resendApiKey: process.env.RESEND_API_KEY || '',
        resendFromEmail: process.env.RESEND_FROM_EMAIL || 'ApexGrowth Growth Team <onboarding@resend.dev>',
        smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
        smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465,
        totalScoutedCount: 0,
        updatedAt: new Date().toISOString(),
      };

      await db.insert(schema.scoutSettings).values({
        id: initial.id,
        telegramBotToken: initial.telegramBotToken,
        telegramChatId: initial.telegramChatId,
        telegramEnabled: initial.telegramEnabled,
        tavilyApiKey: initial.tavilyApiKey,
        tavilyEnabled: initial.tavilyEnabled,
        autonomousWorkerEnabled: initial.autonomousWorkerEnabled,
        runIntervalMinutes: initial.runIntervalMinutes,
        targetNiches: initial.targetNiches,
        intentKeywords: initial.intentKeywords,
        aiProvider: initial.aiProvider || 'gemini',
        aiModel: initial.aiModel || 'gemini-2.5-flash',
        geminiApiKey: initial.geminiApiKey,
        groqApiKey: initial.groqApiKey,
        mistralApiKey: initial.mistralApiKey,
        nvidiaApiKey: initial.nvidiaApiKey,
        secondaryAiApiKey: initial.secondaryAiApiKey,
        secondaryAiBaseUrl: initial.secondaryAiBaseUrl,
        aiTemperature: initial.aiTemperature ?? 70,
        emailProvider: initial.emailProvider || 'gmail',
        gmailUser: initial.gmailUser,
        gmailAppPassword: initial.gmailAppPassword,
        resendApiKey: initial.resendApiKey,
        resendFromEmail: initial.resendFromEmail,
        smtpHost: initial.smtpHost,
        smtpPort: initial.smtpPort,
        totalScoutedCount: 0,
      });

      return initial;
    } catch {
      return { ...this.inMemoryScoutSettings };
    }
  }

  async updateScoutSettings(partial: Partial<ScoutSettings>): Promise<ScoutSettings> {
    await this.ensureScoutTablesExist();
    const current = await this.getScoutSettings();
    const updated: ScoutSettings = {
      ...current,
      ...partial,
      updatedAt: new Date().toISOString(),
    };

    if (this.useInMemoryScoutStore) {
      this.inMemoryScoutSettings = updated;
      return updated;
    }

    try {
      await db
        .insert(schema.scoutSettings)
        .values({
          id: updated.id,
          telegramBotToken: updated.telegramBotToken,
          telegramChatId: updated.telegramChatId,
          telegramEnabled: updated.telegramEnabled,
          tavilyApiKey: updated.tavilyApiKey,
          tavilyEnabled: updated.tavilyEnabled,
          autonomousWorkerEnabled: updated.autonomousWorkerEnabled,
          runIntervalMinutes: updated.runIntervalMinutes,
          targetNiches: updated.targetNiches,
          intentKeywords: updated.intentKeywords,
          aiProvider: updated.aiProvider || 'gemini',
          aiModel: updated.aiModel || 'gemini-2.5-flash',
          geminiApiKey: updated.geminiApiKey,
          groqApiKey: updated.groqApiKey,
          mistralApiKey: updated.mistralApiKey,
          nvidiaApiKey: updated.nvidiaApiKey,
          secondaryAiApiKey: updated.secondaryAiApiKey,
          secondaryAiBaseUrl: updated.secondaryAiBaseUrl,
          aiTemperature: updated.aiTemperature ?? 70,
          emailProvider: updated.emailProvider || 'gmail',
          gmailUser: updated.gmailUser,
          gmailAppPassword: updated.gmailAppPassword,
          resendApiKey: updated.resendApiKey,
          resendFromEmail: updated.resendFromEmail,
          smtpHost: updated.smtpHost,
          smtpPort: updated.smtpPort,
          lastRunAt: updated.lastRunAt ? new Date(updated.lastRunAt) : null,
          totalScoutedCount: updated.totalScoutedCount,
        })
        .onConflictDoUpdate({
          target: schema.scoutSettings.id,
          set: {
            telegramBotToken: updated.telegramBotToken,
            telegramChatId: updated.telegramChatId,
            telegramEnabled: updated.telegramEnabled,
            tavilyApiKey: updated.tavilyApiKey,
            tavilyEnabled: updated.tavilyEnabled,
            autonomousWorkerEnabled: updated.autonomousWorkerEnabled,
            runIntervalMinutes: updated.runIntervalMinutes,
            targetNiches: updated.targetNiches,
            intentKeywords: updated.intentKeywords,
            aiProvider: updated.aiProvider || 'gemini',
            aiModel: updated.aiModel || 'gemini-2.5-flash',
            geminiApiKey: updated.geminiApiKey,
            groqApiKey: updated.groqApiKey,
            mistralApiKey: updated.mistralApiKey,
            nvidiaApiKey: updated.nvidiaApiKey,
            secondaryAiApiKey: updated.secondaryAiApiKey,
            secondaryAiBaseUrl: updated.secondaryAiBaseUrl,
            aiTemperature: updated.aiTemperature ?? 70,
            emailProvider: updated.emailProvider || 'gmail',
            gmailUser: updated.gmailUser,
            gmailAppPassword: updated.gmailAppPassword,
            resendApiKey: updated.resendApiKey,
            resendFromEmail: updated.resendFromEmail,
            smtpHost: updated.smtpHost,
            smtpPort: updated.smtpPort,
            lastRunAt: updated.lastRunAt ? new Date(updated.lastRunAt) : null,
            totalScoutedCount: updated.totalScoutedCount,
            updatedAt: new Date(),
          },
        });
      return updated;
    } catch {
      this.inMemoryScoutSettings = updated;
      return updated;
    }
  }

  async getExistingOpportunitySourceUrls(): Promise<Set<string>> {
    await this.ensureScoutTablesExist();
    const urls = new Set<string>();

    if (this.useInMemoryScoutStore) {
      for (const opp of this.inMemoryOpportunities.values()) {
        urls.add(opp.sourceUrl);
      }
      return urls;
    }

    try {
      const rows = await db.select({ sourceUrl: schema.opportunities.sourceUrl }).from(schema.opportunities);
      for (const r of rows) {
        if (r.sourceUrl) urls.add(r.sourceUrl);
      }
    } catch {
      for (const opp of this.inMemoryOpportunities.values()) {
        urls.add(opp.sourceUrl);
      }
    }
    return urls;
  }

  async createOpportunity(opp: Opportunity): Promise<Opportunity> {
    await this.ensureScoutTablesExist();

    if (this.useInMemoryScoutStore) {
      this.inMemoryOpportunities.set(opp.id, opp);
      return opp;
    }

    try {
      await db.insert(schema.opportunities).values({
        id: opp.id,
        title: opp.title,
        prospectName: opp.prospectName,
        businessName: opp.businessName,
        websiteUrl: opp.websiteUrl || null,
        niche: opp.niche,
        sourcePlatform: opp.sourcePlatform,
        sourceUrl: opp.sourceUrl,
        sourcePostExcerpt: opp.sourcePostExcerpt || null,
        relevanceSummary: opp.relevanceSummary,
        evidence: opp.evidence as any,
        publicContacts: opp.publicContacts as any,
        opportunityScore: opp.opportunityScore,
        outreachStatus: opp.outreachStatus,
        outreachDraft: opp.outreachDraft,
        refinedDraft: opp.refinedDraft || null,
        refinementFeedback: opp.refinementFeedback || null,
        telegramMessageId: opp.telegramMessageId || null,
        actionApprovedAt: opp.actionApprovedAt ? new Date(opp.actionApprovedAt) : null,
        actionSentAt: opp.actionSentAt ? new Date(opp.actionSentAt) : null,
        actionRejectedAt: opp.actionRejectedAt ? new Date(opp.actionRejectedAt) : null,
        notes: opp.notes || null,
      });
      return opp;
    } catch {
      this.inMemoryOpportunities.set(opp.id, opp);
      return opp;
    }
  }

  async getOpportunities(filter?: { status?: string; score?: string; limit?: number }): Promise<Opportunity[]> {
    await this.ensureScoutTablesExist();

    if (this.useInMemoryScoutStore) {
      let list = Array.from(this.inMemoryOpportunities.values());
      if (filter?.status) {
        list = list.filter((o) => o.outreachStatus === filter.status);
      }
      if (filter?.score) {
        list = list.filter((o) => o.opportunityScore === filter.score);
      }
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (filter?.limit) {
        list = list.slice(0, filter.limit);
      }
      return list;
    }

    try {
      let query = db.select().from(schema.opportunities).orderBy(desc(schema.opportunities.createdAt));
      const rows = await query;
      let mapped: Opportunity[] = rows.map((r) => ({
        id: r.id,
        title: r.title,
        prospectName: r.prospectName,
        businessName: r.businessName,
        websiteUrl: r.websiteUrl || undefined,
        niche: r.niche,
        sourcePlatform: r.sourcePlatform as any,
        sourceUrl: r.sourceUrl,
        sourcePostExcerpt: r.sourcePostExcerpt || undefined,
        relevanceSummary: r.relevanceSummary,
        evidence: (r.evidence as any) || [],
        publicContacts: (r.publicContacts as any) || [],
        opportunityScore: r.opportunityScore as any,
        outreachStatus: r.outreachStatus as any,
        outreachDraft: r.outreachDraft,
        refinedDraft: r.refinedDraft || undefined,
        refinementFeedback: r.refinementFeedback || undefined,
        telegramMessageId: r.telegramMessageId || undefined,
        actionApprovedAt: r.actionApprovedAt ? r.actionApprovedAt.toISOString() : undefined,
        actionSentAt: r.actionSentAt ? r.actionSentAt.toISOString() : undefined,
        actionRejectedAt: r.actionRejectedAt ? r.actionRejectedAt.toISOString() : undefined,
        sentChannel: r.sentChannel || undefined,
        sentProvider: (r.sentProvider as any) || undefined,
        outreachMessageId: r.outreachMessageId || undefined,
        resendMessageId: r.resendMessageId || undefined,
        recipientEmail: r.recipientEmail || undefined,
        sendErrorReason: r.sendErrorReason || undefined,
        emailSubject: r.emailSubject || undefined,
        dispatchAttemptId: r.dispatchAttemptId || undefined,
        dispatchAttemptAt: r.dispatchAttemptAt ? r.dispatchAttemptAt.toISOString() : undefined,
        nextFollowUpDate: r.nextFollowUpDate ? r.nextFollowUpDate.toISOString() : undefined,
        prospectReply: r.prospectReply || undefined,
        prospectRepliedAt: r.prospectRepliedAt ? r.prospectRepliedAt.toISOString() : undefined,
        dealId: r.dealId || undefined,
        notes: r.notes || undefined,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }));

      if (filter?.status) {
        mapped = mapped.filter((o) => o.outreachStatus === filter.status);
      }
      if (filter?.score) {
        mapped = mapped.filter((o) => o.opportunityScore === filter.score);
      }
      if (filter?.limit) {
        mapped = mapped.slice(0, filter.limit);
      }

      return mapped;
    } catch {
      let res = Array.from(this.inMemoryOpportunities.values());
      if (filter?.limit) res = res.slice(0, filter.limit);
      return res;
    }
  }

  async getOpportunityById(id: string): Promise<Opportunity | null> {
    await this.ensureScoutTablesExist();

    if (this.useInMemoryScoutStore) {
      return this.inMemoryOpportunities.get(id) || null;
    }

    try {
      const rows = await db.select().from(schema.opportunities).where(eq(schema.opportunities.id, id)).limit(1);
      if (rows.length === 0) return null;
      const r = rows[0];
      return {
        id: r.id,
        title: r.title,
        prospectName: r.prospectName,
        businessName: r.businessName,
        websiteUrl: r.websiteUrl || undefined,
        niche: r.niche,
        sourcePlatform: r.sourcePlatform as any,
        sourceUrl: r.sourceUrl,
        sourcePostExcerpt: r.sourcePostExcerpt || undefined,
        relevanceSummary: r.relevanceSummary,
        evidence: (r.evidence as any) || [],
        publicContacts: (r.publicContacts as any) || [],
        opportunityScore: r.opportunityScore as any,
        outreachStatus: r.outreachStatus as any,
        outreachDraft: r.outreachDraft,
        refinedDraft: r.refinedDraft || undefined,
        refinementFeedback: r.refinementFeedback || undefined,
        telegramMessageId: r.telegramMessageId || undefined,
        actionApprovedAt: r.actionApprovedAt ? r.actionApprovedAt.toISOString() : undefined,
        actionSentAt: r.actionSentAt ? r.actionSentAt.toISOString() : undefined,
        actionRejectedAt: r.actionRejectedAt ? r.actionRejectedAt.toISOString() : undefined,
        notes: r.notes || undefined,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      };
    } catch {
      return this.inMemoryOpportunities.get(id) || null;
    }
  }

  async findOpportunityByTelegramMessageId(messageId: string): Promise<Opportunity | null> {
    await this.ensureScoutTablesExist();

    if (this.useInMemoryScoutStore) {
      for (const opp of this.inMemoryOpportunities.values()) {
        if (opp.telegramMessageId === messageId) return opp;
      }
      return null;
    }

    try {
      const rows = await db
        .select()
        .from(schema.opportunities)
        .where(eq(schema.opportunities.telegramMessageId, messageId))
        .limit(1);
      if (rows.length === 0) return null;
      return this.getOpportunityById(rows[0].id);
    } catch {
      for (const opp of this.inMemoryOpportunities.values()) {
        if (opp.telegramMessageId === messageId) return opp;
      }
      return null;
    }
  }

  async updateOpportunityStatus(
    id: string,
    status: 'DRAFTED' | 'REFINED' | 'APPROVED' | 'SENT' | 'REJECTED'
  ): Promise<Opportunity> {
    const opp = await this.getOpportunityById(id);
    if (!opp) throw new Error(`Opportunity #${id} not found`);

    const now = new Date().toISOString();
    opp.outreachStatus = status;
    opp.updatedAt = now;
    if (status === 'APPROVED') opp.actionApprovedAt = now;
    if (status === 'SENT') opp.actionSentAt = now;
    if (status === 'REJECTED') opp.actionRejectedAt = now;

    if (this.useInMemoryScoutStore) {
      this.inMemoryOpportunities.set(id, opp);
      return opp;
    }

    try {
      await db
        .update(schema.opportunities)
        .set({
          outreachStatus: status,
          actionApprovedAt: opp.actionApprovedAt ? new Date(opp.actionApprovedAt) : null,
          actionSentAt: opp.actionSentAt ? new Date(opp.actionSentAt) : null,
          actionRejectedAt: opp.actionRejectedAt ? new Date(opp.actionRejectedAt) : null,
          updatedAt: new Date(),
        })
        .where(eq(schema.opportunities.id, id));
      return opp;
    } catch {
      this.inMemoryOpportunities.set(id, opp);
      return opp;
    }
  }

  async updateOpportunityTelegramMessageId(id: string, messageId: string): Promise<void> {
    const opp = await this.getOpportunityById(id);
    if (!opp) return;

    opp.telegramMessageId = messageId;
    if (this.useInMemoryScoutStore) {
      this.inMemoryOpportunities.set(id, opp);
      return;
    }

    try {
      await db
        .update(schema.opportunities)
        .set({ telegramMessageId: messageId, updatedAt: new Date() })
        .where(eq(schema.opportunities.id, id));
    } catch {
      this.inMemoryOpportunities.set(id, opp);
    }
  }

  async updateOpportunityRefinedDraft(
    id: string,
    refinedDraft: string,
    feedback: string
  ): Promise<Opportunity> {
    const opp = await this.getOpportunityById(id);
    if (!opp) throw new Error(`Opportunity #${id} not found`);

    const now = new Date().toISOString();
    opp.refinedDraft = refinedDraft;
    opp.refinementFeedback = feedback;
    opp.outreachStatus = 'REFINED';
    opp.updatedAt = now;

    if (this.useInMemoryScoutStore) {
      this.inMemoryOpportunities.set(id, opp);
      return opp;
    }

    try {
      await db
        .update(schema.opportunities)
        .set({
          refinedDraft,
          refinementFeedback: feedback,
          outreachStatus: 'REFINED',
          updatedAt: new Date(),
        })
        .where(eq(schema.opportunities.id, id));
      return opp;
    } catch {
      this.inMemoryOpportunities.set(id, opp);
      return opp;
    }
  }

  async markOpportunityApproved(id: string): Promise<Opportunity> {
    const opp = await this.getOpportunityById(id);
    if (!opp) throw new Error(`Opportunity #${id} not found`);

    const now = new Date().toISOString();
    opp.outreachStatus = 'APPROVED';
    opp.actionApprovedAt = now;
    opp.updatedAt = now;

    if (this.useInMemoryScoutStore) {
      this.inMemoryOpportunities.set(id, opp);
      return opp;
    }

    try {
      await db
        .update(schema.opportunities)
        .set({
          outreachStatus: 'APPROVED',
          actionApprovedAt: new Date(now),
          updatedAt: new Date(),
        })
        .where(eq(schema.opportunities.id, id));
      return opp;
    } catch {
      this.inMemoryOpportunities.set(id, opp);
      return opp;
    }
  }

  async markOpportunityDispatching(id: string, attemptId: string, recipientEmail?: string): Promise<Opportunity> {
    const opp = await this.getOpportunityById(id);
    if (!opp) throw new Error(`Opportunity #${id} not found`);

    const now = new Date().toISOString();
    opp.outreachStatus = 'DISPATCHING';
    opp.dispatchAttemptId = attemptId;
    opp.dispatchAttemptAt = now;
    if (recipientEmail) opp.recipientEmail = recipientEmail;
    opp.updatedAt = now;

    if (this.useInMemoryScoutStore) {
      this.inMemoryOpportunities.set(id, opp);
      return opp;
    }

    try {
      await db
        .update(schema.opportunities)
        .set({
          outreachStatus: 'DISPATCHING',
          dispatchAttemptId: attemptId,
          dispatchAttemptAt: new Date(now),
          recipientEmail: opp.recipientEmail || null,
          updatedAt: new Date(),
        })
        .where(eq(schema.opportunities.id, id));
      return opp;
    } catch {
      this.inMemoryOpportunities.set(id, opp);
      return opp;
    }
  }

  async markOpportunitySent(
    id: string,
    details: {
      messageId?: string;
      resendId?: string;
      provider?: string;
      recipientEmail?: string;
      subject?: string;
      channel?: string;
      nextFollowUpDate?: string;
    }
  ): Promise<Opportunity> {
    const opp = await this.getOpportunityById(id);
    if (!opp) throw new Error(`Opportunity #${id} not found`);

    const now = new Date().toISOString();
    opp.outreachStatus = 'SENT';
    opp.actionSentAt = now;
    opp.sentChannel = details.channel || 'Email';
    opp.sentProvider = (details.provider as any) || 'Gmail';
    if (details.messageId) opp.outreachMessageId = details.messageId;
    if (details.resendId) opp.resendMessageId = details.resendId;
    if (details.recipientEmail) opp.recipientEmail = details.recipientEmail;
    if (details.subject) opp.emailSubject = details.subject;
    opp.sendErrorReason = undefined;

    if (!details.nextFollowUpDate) {
      const followUp = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
      opp.nextFollowUpDate = followUp.toISOString();
    } else {
      opp.nextFollowUpDate = details.nextFollowUpDate;
    }
    opp.updatedAt = now;

    if (this.useInMemoryScoutStore) {
      this.inMemoryOpportunities.set(id, opp);
      return opp;
    }

    try {
      await db
        .update(schema.opportunities)
        .set({
          outreachStatus: 'SENT',
          actionSentAt: new Date(now),
          sentChannel: opp.sentChannel,
          sentProvider: opp.sentProvider,
          outreachMessageId: opp.outreachMessageId || details.messageId || null,
          resendMessageId: opp.resendMessageId || details.resendId || null,
          recipientEmail: opp.recipientEmail || null,
          emailSubject: opp.emailSubject || null,
          sendErrorReason: null,
          nextFollowUpDate: opp.nextFollowUpDate ? new Date(opp.nextFollowUpDate) : null,
          updatedAt: new Date(),
        })
        .where(eq(schema.opportunities.id, id));
      return opp;
    } catch {
      this.inMemoryOpportunities.set(id, opp);
      return opp;
    }
  }

  async markOpportunitySendFailed(
    id: string,
    reason: string,
    recipientEmail?: string
  ): Promise<Opportunity> {
    const opp = await this.getOpportunityById(id);
    if (!opp) throw new Error(`Opportunity #${id} not found`);

    const now = new Date().toISOString();
    opp.outreachStatus = 'SEND_FAILED';
    opp.sendErrorReason = reason;
    if (recipientEmail) opp.recipientEmail = recipientEmail;
    opp.updatedAt = now;

    if (this.useInMemoryScoutStore) {
      this.inMemoryOpportunities.set(id, opp);
      return opp;
    }

    try {
      await db
        .update(schema.opportunities)
        .set({
          outreachStatus: 'SEND_FAILED',
          sendErrorReason: reason,
          recipientEmail: opp.recipientEmail || null,
          updatedAt: new Date(),
        })
        .where(eq(schema.opportunities.id, id));
      return opp;
    } catch {
      this.inMemoryOpportunities.set(id, opp);
      return opp;
    }
  }

  async updateOpportunitySent(
    id: string,
    channel?: string,
    nextFollowUpDate?: string
  ): Promise<Opportunity> {
    return this.markOpportunitySent(id, { channel, nextFollowUpDate });
  }

  async recordProspectReply(
    id: string,
    replyText: string
  ): Promise<Opportunity> {
    const opp = await this.getOpportunityById(id);
    if (!opp) throw new Error(`Opportunity #${id} not found`);

    const now = new Date().toISOString();
    opp.outreachStatus = 'REPLIED';
    opp.prospectReply = replyText;
    opp.prospectRepliedAt = now;
    opp.updatedAt = now;

    if (this.useInMemoryScoutStore) {
      this.inMemoryOpportunities.set(id, opp);
      return opp;
    }

    try {
      await db
        .update(schema.opportunities)
        .set({
          outreachStatus: 'REPLIED',
          updatedAt: new Date(),
        })
        .where(eq(schema.opportunities.id, id));
      return opp;
    } catch {
      this.inMemoryOpportunities.set(id, opp);
      return opp;
    }
  }

  async getScoutStats(): Promise<{ total: number; drafted: number; approved: number; sent: number; rejected: number }> {
    const all = await this.getOpportunities();
    return {
      total: all.length,
      drafted: all.filter((o) => o.outreachStatus === 'DRAFTED' || o.outreachStatus === 'REFINED').length,
      approved: all.filter((o) => o.outreachStatus === 'APPROVED').length,
      sent: all.filter((o) => o.outreachStatus === 'SENT').length,
      rejected: all.filter((o) => o.outreachStatus === 'REJECTED').length,
    };
  }
}

export const dbService = new DatabaseService();

