export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'editor';
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface BusinessProfile {
  id: string;
  businessName: string;
  tagline: string;
  description: string;
  email: string;
  supportEmail: string;
  phone: string;
  whatsappNumber: string;
  businessHours: string;
  logoUrl?: string;
  faviconUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactSettings {
  id: string;
  businessEmail: string;
  supportEmail: string;
  phone: string;
  whatsappNumber: string;
  whatsappUrl: string;
  whatsappPrefilledMessage: string;
  whatsappButtonText: string;
  floatingWhatsappEnabled: boolean;
  heroCtaEnabled: boolean;
  pricingCtaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SocialPlatform =
  | 'whatsapp'
  | 'discord'
  | 'telegram'
  | 'instagram'
  | 'tiktok'
  | 'twitter'
  | 'linkedin'
  | 'youtube'
  | 'custom';

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  label: string;
  url: string;
  username?: string;
  enabled: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentMethod {
  id: string;
  provider: 'paystack' | 'bybit' | 'grey' | 'stripe' | 'selar' | 'flutterwave' | 'crypto' | 'custom';
  displayName: string;
  type: 'payment_link' | 'api_integration' | 'crypto_gateway' | 'bank_transfer';
  paymentUrl: string;
  currency: string;
  description: string;
  instructions?: string;
  active: boolean;
  displayOrder: number;
  isDirectLink: boolean;
  configMetadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  slug: string;
  title: string;
  description: string;
  iconName: string;
  features: string[];
  published: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PricingPackage {
  id: string;
  slug?: string;
  name: string;
  description: string;
  priceUsd: string;
  promoPriceUsd?: string;
  currency: string;
  priceNaira?: string;
  features: string[];
  isFeatured: boolean;
  badgeText?: string;
  ctaText: string;
  ctaAction: 'contact' | 'checkout_demo' | 'payment_link' | 'whatsapp';
  paymentMethodId?: string;
  active: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'pending' | 'awaiting_payment' | 'processing' | 'paid' | 'completed' | 'failed' | 'cancelled' | 'refunded' | 'expired';
export type PaymentIntentStatus = 'pending' | 'awaiting_payment' | 'processing' | 'paid' | 'completed' | 'failed' | 'cancelled' | 'refunded' | 'expired';

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerWhatsapp?: string;
  packageId?: string;
  packageName: string;
  amountUsd: string;
  currency: string;
  status: OrderStatus;
  paymentMethodId?: string;
  paymentProvider: string;
  customerNotes?: string;
  metadata?: Record<string, any>;
  paymentIntents?: PaymentIntent[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentIntent {
  id: string;
  orderId: string;
  provider: 'paystack' | 'bybit' | 'grey' | 'custom';
  paymentType: 'card' | 'crypto' | 'bank_transfer';
  amountUsd: string;
  currency: string;
  status: PaymentIntentStatus;
  reference: string;
  paymentUrl?: string;
  transferInstructions?: string;
  cryptoAddress?: string;
  cryptoNetwork?: string;
  proofOfPaymentUrl?: string;
  adminNotes?: string;
  confirmedBy?: string;
  confirmedAt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface DemoScene {
  timestamp: string;
  title: string;
  script: string;
  visualDirection: string;
  type: 'hook' | 'problem' | 'solution' | 'cta';
}

export interface DemoItem {
  id: string;
  type: 'video_ad_script' | 'checkout_sim' | 'interactive_custom';
  title: string;
  subtitle: string;
  description: string;
  active: boolean;
  displayOrder: number;
  config: {
    scenes?: DemoScene[];
    productTitle?: string;
    productPrice?: number;
    currencySymbol?: string;
    supportedTabs?: string[];
  };
  updatedAt: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  published: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Testimonial {
  id: string;
  clientName: string;
  clientRole: string;
  companyName?: string;
  avatarUrl?: string;
  rating: number;
  content: string;
  published: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';

export interface LeadNote {
  id: string;
  leadId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  businessType: string;
  websiteUrl?: string;
  sellingDetails: string;
  message?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  landingPage?: string;
  referrer?: string;
  status: LeadStatus;
  notes?: LeadNote[];
  createdAt: string;
  updatedAt: string;
}

export interface SEOSettings {
  id: string;
  pageTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  favicon: string;
  canonicalUrl: string;
  robotsConfig: string;
  keywords: string[];
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  adminEmail: string;
  action: string;
  entityType: string;
  entityId?: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface PublicAppData {
  business: BusinessProfile;
  contact: ContactSettings;
  socialLinks: SocialLink[];
  services: Service[];
  pricing: PricingPackage[];
  demos: DemoItem[];
  faqs: FAQ[];
  testimonials?: Testimonial[];
  paymentMethods: PaymentMethod[];
  seo: SEOSettings;
}

export interface DashboardStats {
  activeServices: number;
  activePackages: number;
  publishedDemos: number;
  publishedFaqs: number;
  publishedTestimonials?: number;
  totalLeads: number;
  newLeads: number;
  leadsByStatus: Record<LeadStatus, number>;
  activePaymentMethods: number;
  recentLeads: Lead[];
  recentAuditLogs: AuditLog[];
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AiConversation {
  id: string;
  sessionId: string;
  userRole: 'customer' | 'admin' | 'superadmin' | 'editor';
  userEmail?: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiMessage {
  id: string;
  conversationId: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface AiEvent {
  id: string;
  conversationId?: string;
  eventType: string;
  payload?: Record<string, any>;
  createdAt: string;
}

export interface AiAnalytics {
  totalConversations: number;
  qualifiedLeads: number;
  packageRecommendations: Record<string, number>;
  checkoutClicks: number;
  humanHandoffs: number;
  recentConversations: AiConversation[];
}
