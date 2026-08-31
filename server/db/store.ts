import fs from 'fs';
import path from 'path';
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
  Lead,
  LeadNote,
  SEOSettings,
  AuditLog,
  LeadStatus,
} from '../../src/types/index';

interface DatabaseSchema {
  adminUsers: (AdminUser & { passwordHash: string })[];
  businessProfile: BusinessProfile;
  contactSettings: ContactSettings;
  socialLinks: SocialLink[];
  paymentMethods: PaymentMethod[];
  services: Service[];
  pricingPackages: PricingPackage[];
  demos: DemoItem[];
  faqs: FAQ[];
  leads: Lead[];
  leadNotes: LeadNote[];
  seoSettings: SEOSettings;
  auditLogs: AuditLog[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

const DEFAULT_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD || 'ApexGrowthAdmin2026!';

function getInitialDatabase(): DatabaseSchema {
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(DEFAULT_PASSWORD, salt);
  const now = new Date().toISOString();

  return {
    adminUsers: [
      {
        id: 'usr_admin_01',
        email: 'admin@apexgrowth.digital',
        name: 'Lead Director',
        role: 'superadmin',
        active: true,
        passwordHash: passwordHash,
        createdAt: now,
        updatedAt: now,
      },
    ],
    businessProfile: {
      id: 'biz_01',
      businessName: 'ApexGrowth Digital',
      tagline: 'High-Converting Funnels & Video Ad Scripts',
      description:
        'We build conversion-focused sales funnels, payment experiences, and direct-response video ad scripts designed to turn attention into action.',
      email: '',
      supportEmail: '',
      phone: '',
      whatsappNumber: '',
      businessHours: 'Mon - Fri: 9:00 AM - 6:00 PM (EST)',
      logoUrl: '',
      faviconUrl: '',
      createdAt: now,
      updatedAt: now,
    },
    contactSettings: {
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
      createdAt: now,
      updatedAt: now,
    },
    socialLinks: [
      {
        id: 'soc_whatsapp_01',
        platform: 'whatsapp',
        label: 'WhatsApp Direct Chat',
        url: '',
        username: '',
        enabled: false,
        displayOrder: 1,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'soc_discord_01',
        platform: 'discord',
        label: 'Discord Community',
        url: '',
        username: '',
        enabled: false,
        displayOrder: 2,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'soc_telegram_01',
        platform: 'telegram',
        label: 'Telegram Channel',
        url: '',
        username: '',
        enabled: false,
        displayOrder: 3,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'soc_instagram_01',
        platform: 'instagram',
        label: 'Instagram',
        url: '',
        username: '',
        enabled: false,
        displayOrder: 4,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'soc_tiktok_01',
        platform: 'tiktok',
        label: 'TikTok',
        url: '',
        username: '',
        enabled: false,
        displayOrder: 5,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'soc_twitter_01',
        platform: 'twitter',
        label: 'X (Twitter)',
        url: '',
        username: '',
        enabled: false,
        displayOrder: 6,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'soc_linkedin_01',
        platform: 'linkedin',
        label: 'LinkedIn',
        url: '',
        username: '',
        enabled: false,
        displayOrder: 7,
        createdAt: now,
        updatedAt: now,
      },
    ],
    paymentMethods: [
      {
        id: 'pm_paystack_01',
        provider: 'paystack',
        displayName: 'Paystack Payment Link',
        type: 'payment_link',
        paymentUrl: 'https://paystack.com/pay/apexgrowth-demo',
        currency: 'NGN/USD',
        description: 'Secure card payments, bank transfers, and USSD via Paystack gateway.',
        active: true,
        displayOrder: 1,
        isDirectLink: true,
        instructions: 'Client redirected to verified Paystack checkout page.',
        configMetadata: { gateway: 'paystack' },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'pm_selar_01',
        provider: 'selar',
        displayName: 'Selar Checkout Link',
        type: 'payment_link',
        paymentUrl: 'https://selar.com/apexgrowth-demo',
        currency: 'NGN/GHS/KES/USD',
        description: 'Multi-currency African checkout gateway for digital products and retainers.',
        active: true,
        displayOrder: 2,
        isDirectLink: true,
        instructions: 'Accepts mobile money and regional bank channels.',
        configMetadata: { gateway: 'selar' },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'pm_stripe_01',
        provider: 'stripe',
        displayName: 'Stripe Payment Link',
        type: 'payment_link',
        paymentUrl: 'https://buy.stripe.com/demo_apexgrowth',
        currency: 'USD/EUR/GBP',
        description: 'International card checkout supporting Apple Pay & Google Pay.',
        active: true,
        displayOrder: 3,
        isDirectLink: true,
        instructions: 'Global debit and credit cards.',
        configMetadata: { gateway: 'stripe' },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'pm_crypto_01',
        provider: 'crypto',
        displayName: 'Crypto / USDT Transfer',
        type: 'api_integration',
        paymentUrl: '',
        currency: 'USDT (TRC20 / ERC20)',
        description: 'Direct USDT settlement for international clients.',
        active: true,
        displayOrder: 4,
        isDirectLink: false,
        instructions: 'Wallet addresses provided in manual invoicing or via API integration.',
        configMetadata: { networks: ['TRC20', 'ERC20', 'BEP20'] },
        createdAt: now,
        updatedAt: now,
      },
    ],
    services: [
      {
        id: 'srv_01',
        slug: 'sales-funnel-development',
        title: 'Sales Funnel Development',
        description: "Conversion-focused landing pages and funnels designed around the customer's offer and audience.",
        iconName: 'TrendingUp',
        features: [
          'High-converting step structure',
          'Offer positioning & bump mechanics',
          'Fast-loading responsive layout',
          'Checkout UX optimization',
        ],
        published: true,
        displayOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'srv_02',
        slug: 'landing-page-development',
        title: 'Landing Page Development',
        description: 'Fast, responsive landing pages designed to guide visitors toward a specific action.',
        iconName: 'Layout',
        features: [
          'Clean visual hierarchy',
          'Mobile-first responsive architecture',
          'Sub-second load times',
          'Sticky CTA integration',
        ],
        published: true,
        displayOrder: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'srv_03',
        slug: 'payment-integration',
        title: 'Payment Integration',
        description: 'Integration/setup of supported payment providers and payment flows.',
        iconName: 'CreditCard',
        features: [
          'Paystack, Flutterwave & Stripe setup',
          'Multi-currency payment links',
          'Webhook & receipt notifications',
          'Frictionless checkout experience',
        ],
        published: true,
        displayOrder: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'srv_04',
        slug: 'direct-response-ad-scripts',
        title: 'Direct-Response Ad Scripts',
        description: 'Video scripts designed around hooks, problems, benefits, objections, and CTAs.',
        iconName: 'Video',
        features: [
          '3 proven hook angles per concept',
          'Visual scene & B-roll directions',
          'Voiceover / audio instructions',
          'Objection handling & closing CTA',
        ],
        published: true,
        displayOrder: 4,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'srv_05',
        slug: 'ugc-ad-scripts',
        title: 'UGC Ad Scripts',
        description: 'Creator-style scripts suitable for short-form advertising on TikTok, Reels, and YouTube Shorts.',
        iconName: 'Smartphone',
        features: [
          'Native creator tone of voice',
          'Visual pacing instructions',
          'Product demo breakdowns',
          'Platform-specific format styling',
        ],
        published: true,
        displayOrder: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'srv_06',
        slug: 'whatsapp-sales-funnels',
        title: 'WhatsApp Sales Funnels',
        description: 'Landing pages and lead flows designed to move prospects into WhatsApp conversations.',
        iconName: 'MessageSquare',
        features: [
          'Pre-filled message optimization',
          'Automated qualification prompts',
          'Direct click-to-chat triggers',
          'Lead tracking & source tagging',
        ],
        published: true,
        displayOrder: 6,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'srv_07',
        slug: 'funnel-audits',
        title: 'Funnel Audits',
        description: 'Review existing funnels and identify conversion, UX, copy, speed, and checkout friction.',
        iconName: 'SearchCheck',
        features: [
          'Friction point breakdown',
          'Copy & headline analysis',
          'Speed & mobile test score',
          'Actionable redesign roadmap',
        ],
        published: true,
        displayOrder: 7,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'srv_08',
        slug: 'conversion-copywriting',
        title: 'Conversion Copywriting',
        description: 'Landing-page copy, headlines, CTAs, product messaging, and offer positioning.',
        iconName: 'PenTool',
        features: [
          'Customer desire-focused hooks',
          'Benefit-driven feature frames',
          'Social proof structure',
          'High-urgency action triggers',
        ],
        published: true,
        displayOrder: 8,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    pricingPackages: [
      {
        id: 'pkg_01',
        name: 'Viral Ad Script Pack',
        description: 'Strategic direct-response video scripts ready for creator filming or in-house production.',
        currency: 'USD',
        priceNaira: '150,000',
        priceUsd: '99',
        features: [
          '5 Direct-Response Video Ad Scripts',
          '3 Hook Variations Per Script',
          'Visual Scene Directions',
          'Audio/Voiceover Directions',
          'CTA Recommendations',
        ],
        isFeatured: false,
        badgeText: '',
        ctaText: 'Order Scripts',
        ctaAction: 'contact',
        active: true,
        displayOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'pkg_02',
        name: 'Conversion Launchpad',
        description: 'High-performance landing page + payment system built to convert cold traffic into buyers.',
        currency: 'USD',
        priceNaira: '350,000',
        priceUsd: '249',
        features: [
          'Custom Sales Landing Page',
          'Payment Integration Setup',
          'Mobile UI/UX Optimization',
          'Conversion-Focused Copy Structure',
          'Speed Optimization',
          'Deployment Assistance',
          'Custom Domain Setup Assistance',
        ],
        isFeatured: true,
        badgeText: 'MOST POPULAR',
        ctaText: 'Build My Landing Page',
        ctaAction: 'checkout_demo',
        active: true,
        displayOrder: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'pkg_03',
        name: 'Full-Funnel Growth Suite',
        description: 'End-to-end client acquisition system combining high-converting pages, payment flows, and viral scripts.',
        currency: 'USD',
        priceNaira: '550,000',
        priceUsd: '399',
        features: [
          'Custom Sales Landing Page',
          'Payment Integration Setup',
          '5 Custom Video Ad Scripts',
          'Ad Launch Strategy',
          'WhatsApp Lead Capture Setup',
          'Mobile Optimization',
          'Deployment Assistance',
        ],
        isFeatured: false,
        badgeText: 'COMPLETE SUITE',
        ctaText: 'Get Full Funnel',
        ctaAction: 'contact',
        active: true,
        displayOrder: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    demos: [
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
        updatedAt: new Date().toISOString(),
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
        updatedAt: new Date().toISOString(),
      },
    ],
    faqs: [
      {
        id: 'faq_01',
        question: 'How quickly will my project be live?',
        answer: 'Most projects are delivered within approximately 48–72 hours after project requirements are confirmed. More complex projects may require additional time.',
        published: true,
        displayOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'faq_02',
        question: 'How do payment integrations work?',
        answer: 'We integrate supported payment providers using the merchant account and credentials provided by the client. Payments are processed through the provider\'s infrastructure.',
        published: true,
        displayOrder: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'faq_03',
        question: 'Do you provide revisions?',
        answer: 'Yes. All packages include 2 rounds of revisions.',
        published: true,
        displayOrder: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'faq_04',
        question: 'Do you provide hosting?',
        answer: 'Deployment assistance is included where specified. Hosting, domain, and third-party service fees may be separate depending on the project.',
        published: true,
        displayOrder: 4,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'faq_05',
        question: 'Can you create scripts for my product?',
        answer: 'Yes. Scripts can be tailored to your product, target audience, platform, offer, and campaign objective.',
        published: true,
        displayOrder: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    leads: [],
    leadNotes: [],
    seoSettings: {
      id: 'seo_01',
      pageTitle: 'ApexGrowth Digital | High-Converting Funnels & Ad Scripts',
      metaDescription: 'ApexGrowth Digital builds conversion-focused sales funnels, payment experiences, and direct-response video ad scripts designed to help businesses turn traffic into customers.',
      ogTitle: 'ApexGrowth Digital | Turn Cold Traffic Into Paying Customers',
      ogDescription: 'Conversion-focused sales funnels, seamless checkout architectures, and viral video ad scripts.',
      ogImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop',
      favicon: '/favicon.ico',
      canonicalUrl: 'https://apexgrowth.digital',
      robotsConfig: 'index, follow',
      keywords: ['sales funnels', 'ad scripts', 'direct response', 'conversion rate optimization', 'landing page development', 'paystack integration'],
      updatedAt: new Date().toISOString(),
    },
    auditLogs: [
      {
        id: 'log_init',
        adminEmail: 'system',
        action: 'System Initialized',
        entityType: 'System',
        entityId: 'sys_01',
        details: 'Initial database schema and production seed models loaded successfully.',
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    ensureDataDir();
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure socialLinks array exists in schema migration
        if (!this.data.socialLinks || !Array.isArray(this.data.socialLinks)) {
          this.data.socialLinks = getInitialDatabase().socialLinks;
          this.save();
        }
      } catch (err) {
        console.error('Failed to parse existing db.json, generating initial database:', err);
        this.data = getInitialDatabase();
        this.save();
      }
    } else {
      this.data = getInitialDatabase();
      this.save();
    }
  }

  private save() {
    try {
      ensureDataDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database file:', err);
    }
  }

  // Audit logger
  public logAction(adminEmail: string, action: string, entityType: string, entityId?: string, details = '', ipAddress?: string) {
    const log: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      adminEmail,
      action,
      entityType,
      entityId,
      details,
      ipAddress,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(log);
    // keep max 500 audit logs
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
    this.save();
    return log;
  }

  // Admin users
  public findAdminByEmail(email: string) {
    return this.data.adminUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public findAdminById(id: string) {
    return this.data.adminUsers.find((u) => u.id === id);
  }

  public getAdminUsers(): AdminUser[] {
    return this.data.adminUsers.map(({ passwordHash, ...user }) => user);
  }

  public updateAdminPassword(id: string, newPasswordHash: string) {
    const user = this.data.adminUsers.find((u) => u.id === id);
    if (user) {
      user.passwordHash = newPasswordHash;
      this.save();
      return true;
    }
    return false;
  }

  public updateAdminLoginTime(id: string) {
    const user = this.data.adminUsers.find((u) => u.id === id);
    if (user) {
      user.lastLoginAt = new Date().toISOString();
      this.save();
    }
  }

  public createAdminUser(email: string, name: string, role: 'superadmin' | 'admin' | 'editor', passwordHash: string) {
    const now = new Date().toISOString();
    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      email,
      name,
      role,
      active: true,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    };
    this.data.adminUsers.push(newUser);
    this.save();
    const { passwordHash: _, ...safeUser } = newUser;
    return safeUser;
  }

  public deleteAdminUser(id: string) {
    const idx = this.data.adminUsers.findIndex((u) => u.id === id);
    if (idx !== -1) {
      this.data.adminUsers.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  // Business Profile
  public getBusinessProfile(): BusinessProfile {
    return this.data.businessProfile;
  }

  public updateBusinessProfile(profile: Partial<BusinessProfile>): BusinessProfile {
    this.data.businessProfile = {
      ...this.data.businessProfile,
      ...profile,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.businessProfile;
  }

  // Contact Settings
  public getContactSettings(): ContactSettings {
    return this.data.contactSettings;
  }

  public updateContactSettings(settings: Partial<ContactSettings>): ContactSettings {
    this.data.contactSettings = {
      ...this.data.contactSettings,
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.contactSettings;
  }

  // Social Links
  public getSocialLinks(onlyEnabled = false): SocialLink[] {
    let list = [...(this.data.socialLinks || [])];
    if (onlyEnabled) {
      list = list.filter((s) => s.enabled);
    }
    return list.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public getSocialLinkById(id: string): SocialLink | undefined {
    return (this.data.socialLinks || []).find((s) => s.id === id);
  }

  public createSocialLink(data: Omit<SocialLink, 'id' | 'createdAt' | 'updatedAt'>): SocialLink {
    const item: SocialLink = {
      ...data,
      id: `soc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (!this.data.socialLinks) {
      this.data.socialLinks = [];
    }
    this.data.socialLinks.push(item);
    this.save();
    return item;
  }

  public updateSocialLink(id: string, data: Partial<SocialLink>): SocialLink | null {
    const item = (this.data.socialLinks || []).find((s) => s.id === id);
    if (!item) return null;
    Object.assign(item, data, { updatedAt: new Date().toISOString() });
    this.save();
    return item;
  }

  public deleteSocialLink(id: string): boolean {
    if (!this.data.socialLinks) return false;
    const idx = this.data.socialLinks.findIndex((s) => s.id === id);
    if (idx !== -1) {
      this.data.socialLinks.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  // Payment Methods
  public getPaymentMethods(onlyActive = false): PaymentMethod[] {
    let list = [...this.data.paymentMethods];
    if (onlyActive) {
      list = list.filter((p) => p.active);
    }
    return list.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public createPaymentMethod(data: Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>): PaymentMethod {
    const pm: PaymentMethod = {
      ...data,
      id: `pm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.paymentMethods.push(pm);
    this.save();
    return pm;
  }

  public updatePaymentMethod(id: string, data: Partial<PaymentMethod>): PaymentMethod | null {
    const idx = this.data.paymentMethods.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.data.paymentMethods[idx] = {
      ...this.data.paymentMethods[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.paymentMethods[idx];
  }

  public deletePaymentMethod(id: string): boolean {
    const idx = this.data.paymentMethods.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.data.paymentMethods.splice(idx, 1);
    this.save();
    return true;
  }

  // Services
  public getServices(onlyPublished = false): Service[] {
    let list = [...this.data.services];
    if (onlyPublished) {
      list = list.filter((s) => s.published);
    }
    return list.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public createService(data: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Service {
    const srv: Service = {
      ...data,
      id: `srv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.services.push(srv);
    this.save();
    return srv;
  }

  public updateService(id: string, data: Partial<Service>): Service | null {
    const idx = this.data.services.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    this.data.services[idx] = {
      ...this.data.services[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.services[idx];
  }

  public deleteService(id: string): boolean {
    const idx = this.data.services.findIndex((s) => s.id === id);
    if (idx === -1) return false;
    this.data.services.splice(idx, 1);
    this.save();
    return true;
  }

  // Pricing Packages
  public getPricingPackages(onlyActive = false): PricingPackage[] {
    let list = [...this.data.pricingPackages];
    if (onlyActive) {
      list = list.filter((p) => p.active);
    }
    return list.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public createPricingPackage(data: Omit<PricingPackage, 'id' | 'createdAt' | 'updatedAt'>): PricingPackage {
    const pkg: PricingPackage = {
      ...data,
      id: `pkg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.pricingPackages.push(pkg);
    this.save();
    return pkg;
  }

  public updatePricingPackage(id: string, data: Partial<PricingPackage>): PricingPackage | null {
    const idx = this.data.pricingPackages.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.data.pricingPackages[idx] = {
      ...this.data.pricingPackages[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.pricingPackages[idx];
  }

  public deletePricingPackage(id: string): boolean {
    const idx = this.data.pricingPackages.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.data.pricingPackages.splice(idx, 1);
    this.save();
    return true;
  }

  // Demos
  public getDemos(onlyActive = false): DemoItem[] {
    let list = [...this.data.demos];
    if (onlyActive) {
      list = list.filter((d) => d.active);
    }
    return list.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public createDemo(data: Omit<DemoItem, 'id' | 'updatedAt'>): DemoItem {
    const demo: DemoItem = {
      ...data,
      id: `demo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      updatedAt: new Date().toISOString(),
    };
    this.data.demos.push(demo);
    this.save();
    return demo;
  }

  public updateDemo(id: string, data: Partial<DemoItem>): DemoItem | null {
    const idx = this.data.demos.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    this.data.demos[idx] = {
      ...this.data.demos[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.demos[idx];
  }

  public deleteDemo(id: string): boolean {
    const idx = this.data.demos.findIndex((d) => d.id === id);
    if (idx === -1) return false;
    this.data.demos.splice(idx, 1);
    this.save();
    return true;
  }

  // FAQs
  public getFAQs(onlyPublished = false): FAQ[] {
    let list = [...this.data.faqs];
    if (onlyPublished) {
      list = list.filter((f) => f.published);
    }
    return list.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public createFAQ(data: Omit<FAQ, 'id' | 'createdAt' | 'updatedAt'>): FAQ {
    const faq: FAQ = {
      ...data,
      id: `faq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.faqs.push(faq);
    this.save();
    return faq;
  }

  public updateFAQ(id: string, data: Partial<FAQ>): FAQ | null {
    const idx = this.data.faqs.findIndex((f) => f.id === id);
    if (idx === -1) return null;
    this.data.faqs[idx] = {
      ...this.data.faqs[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.faqs[idx];
  }

  public deleteFAQ(id: string): boolean {
    const idx = this.data.faqs.findIndex((f) => f.id === id);
    if (idx === -1) return false;
    this.data.faqs.splice(idx, 1);
    this.save();
    return true;
  }

  // Leads & Lead Notes
  public getLeads(status?: LeadStatus): Lead[] {
    let leads = [...this.data.leads];
    if (status) {
      leads = leads.filter((l) => l.status === status);
    }
    // attach notes
    const leadsWithNotes = leads.map((lead) => ({
      ...lead,
      notes: this.data.leadNotes
        .filter((n) => n.leadId === lead.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    }));

    return leadsWithNotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createLead(data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'status'>): Lead {
    const newLead: Lead = {
      ...data,
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.leads.unshift(newLead);
    this.save();
    return newLead;
  }

  public updateLeadStatus(id: string, status: LeadStatus): Lead | null {
    const idx = this.data.leads.findIndex((l) => l.id === id);
    if (idx === -1) return null;
    this.data.leads[idx].status = status;
    this.data.leads[idx].updatedAt = new Date().toISOString();
    this.save();
    return this.data.leads[idx];
  }

  public addLeadNote(leadId: string, authorName: string, content: string): LeadNote {
    const note: LeadNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      leadId,
      authorName,
      content,
      createdAt: new Date().toISOString(),
    };
    this.data.leadNotes.push(note);
    this.save();
    return note;
  }

  public deleteLead(id: string): boolean {
    const idx = this.data.leads.findIndex((l) => l.id === id);
    if (idx === -1) return false;
    this.data.leads.splice(idx, 1);
    this.data.leadNotes = this.data.leadNotes.filter((n) => n.leadId !== id);
    this.save();
    return true;
  }

  // SEO Settings
  public getSEOSettings(): SEOSettings {
    return this.data.seoSettings;
  }

  public updateSEOSettings(settings: Partial<SEOSettings>): SEOSettings {
    this.data.seoSettings = {
      ...this.data.seoSettings,
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.seoSettings;
  }

  // Audit Logs
  public getAuditLogs(limit = 100): AuditLog[] {
    return this.data.auditLogs.slice(0, limit);
  }

  // Public Bundle (clean, sanitized without secrets/notes)
  public getPublicData() {
    return {
      business: this.getBusinessProfile(),
      contact: this.getContactSettings(),
      socialLinks: this.getSocialLinks(true),
      services: this.getServices(true),
      pricing: this.getPricingPackages(true),
      demos: this.getDemos(true),
      faqs: this.getFAQs(true),
      paymentMethods: this.getPaymentMethods(true),
      seo: this.getSEOSettings(),
    };
  }

  // Dashboard Stats
  public getDashboardStats() {
    const leads = this.data.leads;
    const leadsByStatus: Record<LeadStatus, number> = {
      new: 0,
      contacted: 0,
      qualified: 0,
      proposal: 0,
      won: 0,
      lost: 0,
    };

    leads.forEach((l) => {
      if (leadsByStatus[l.status] !== undefined) {
        leadsByStatus[l.status]++;
      }
    });

    return {
      activeServices: this.data.services.filter((s) => s.published).length,
      activePackages: this.data.pricingPackages.filter((p) => p.active).length,
      publishedDemos: this.data.demos.filter((d) => d.active).length,
      publishedFaqs: this.data.faqs.filter((f) => f.published).length,
      totalLeads: leads.length,
      newLeads: leadsByStatus.new,
      leadsByStatus,
      activePaymentMethods: this.data.paymentMethods.filter((p) => p.active).length,
      recentLeads: this.getLeads().slice(0, 5),
      recentAuditLogs: this.getAuditLogs(10),
    };
  }
}

export const db = new Database();
