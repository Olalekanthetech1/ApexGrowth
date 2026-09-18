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

// ----------------------------------------------------
// OPPORTUNITY SCOUT & LEAD INTELLIGENCE SYSTEM
// ----------------------------------------------------

export type ContactChannel =
  | 'email'
  | 'instagram'
  | 'whatsapp'
  | 'phone'
  | 'twitter'
  | 'linkedin'
  | 'reddit'
  | 'discord'
  | 'website_form'
  | 'custom';

export type ContactConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface PublicContact {
  type: ContactChannel;
  value: string;
  sourceLocation: string; // e.g. "Public / website contact page", "Public / website footer", "Source post bio"
  confidence: ContactConfidence;
  directLink?: string;
}

export interface EvidenceProvenance {
  source: string; // e.g. "ApexGrowth audit", "Reddit / r/ecommerce", "DOM metric"
  testDate: string; // e.g. "Sep 18, 2026"
  deviceProfile?: 'Mobile' | 'Desktop' | 'General';
  measurement?: string; // e.g. "Mobile page loaded in ~5.6s", "Missing sticky checkout CTA"
  originalUrl?: string;
  evidenceType: 'ApexGrowth Audit' | 'Public Discussion' | 'Verified DOM Metric';
}

export interface EvidenceObservation {
  category: 'ux_checkout' | 'mobile_performance' | 'copy_funnel' | 'public_intent';
  observation: string; // Objective factual statement, e.g. "Observed: checkout CTA requires scrolling"
  potentialImpact: string; // Measured impact, e.g. "Slower mobile experiences can contribute to checkout friction"
  sourceOrMethod: string; // e.g. "Website audit test", "Public community post"
  verified: boolean;
  provenance?: EvidenceProvenance;
}

export type OpportunityScore = 'HIGH' | 'MEDIUM' | 'LOW';
export type OutreachStatus = 'DRAFTED' | 'REFINED' | 'APPROVED' | 'DISPATCHING' | 'SENT' | 'SEND_FAILED' | 'REPLIED' | 'REJECTED';

export interface Opportunity {
  id: string;
  opportunityFingerprint?: string;
  entityFingerprint?: string;
  title: string;
  prospectName: string;
  businessName: string;
  websiteUrl?: string;
  niche: string;
  sourcePlatform: 'reddit' | 'twitter' | 'web_search' | 'shopify_community' | 'manual_audit';
  sourceUrl: string;
  sourcePostExcerpt?: string;
  relevanceSummary: string;
  evidence: EvidenceObservation[];
  publicContacts: PublicContact[];
  confidenceScores?: {
    identity: number;
    company: number;
    contact: number;
    problem: number;
  };
  verificationStatus?: {
    identityResolved: boolean;
    companyVerified: boolean;
    contactAvailable: boolean;
    problemExplicit: boolean;
    auditPerformed: boolean;
    isDeduplicated: boolean;
  };
  isVerifiedOpportunity: boolean;
  opportunityScore: OpportunityScore;
  outreachStatus: OutreachStatus;
  outreachDraft: string;
  refinedDraft?: string;
  refinementFeedback?: string;
  telegramMessageId?: string;
  actionApprovedAt?: string;
  actionSentAt?: string;
  actionRejectedAt?: string;
  sentChannel?: string;
  sentProvider?: 'gmail' | 'resend' | string;
  outreachMessageId?: string;
  resendMessageId?: string;
  recipientEmail?: string;
  sendErrorReason?: string;
  emailSubject?: string;
  dispatchAttemptId?: string;
  dispatchAttemptAt?: string;
  nextFollowUpDate?: string;
  prospectReply?: string;
  prospectRepliedAt?: string;
  dealId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OpportunitySignal {
  id: string;
  opportunityId: string;
  sourcePlatform: string;
  sourceUrl: string;
  sourceFingerprint: string;
  observedAt: string;
  rawExcerpt?: string;
}

export interface ScoutSettings {
  id: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  telegramEnabled: boolean;
  tavilyApiKey?: string;
  tavilyEnabled: boolean;
  autonomousWorkerEnabled: boolean;
  runIntervalMinutes: number;
  targetNiches: string[];
  intentKeywords: string[];
  // Dynamic AI Provider Settings
  aiProvider?: 'gemini' | 'groq' | 'mistral' | 'nvidia' | 'custom';
  aiModel?: string;
  geminiApiKey?: string;
  groqApiKey?: string;
  mistralApiKey?: string;
  nvidiaApiKey?: string;
  secondaryAiApiKey?: string;
  secondaryAiBaseUrl?: string;
  aiTemperature?: number;
  // Outbound Email Provider Abstraction Settings
  emailProvider?: 'gmail' | 'resend';
  gmailUser?: string;
  gmailAppPassword?: string;
  resendApiKey?: string;
  resendFromEmail?: string;
  smtpHost?: string;
  smtpPort?: number;
  lastRunAt?: string;
  totalScoutedCount: number;
  updatedAt: string;
}

// ----------------------------------------------------
// ApexGrowth Assistant: Deal-to-Delivery Pipeline Types
// ----------------------------------------------------

export type DealStage =
  | 'OPEN'
  | 'QUALIFIED'
  | 'PROPOSAL_SENT'
  | 'NEGOTIATING'
  | 'WON'
  | 'LOST'
  | 'ON_HOLD';

export type DealPaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED';
export type DealAgreementStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export interface Deal {
  id: string;
  prospectId?: string;
  clientName: string;
  clientEmail?: string;
  clientCompany?: string;
  clientWebsite?: string;
  servicePackage: string; // e.g. "48-Hour CRO Funnel Sprint", "Landing Page Overhaul", "Full Funnel & Ad Engine"
  proposedPrice: number;
  currency: string;
  stage: DealStage;
  proposalSummary?: string;
  proposalDraft?: string;
  negotiationNotes?: string;
  paymentStatus: DealPaymentStatus;
  agreementStatus: DealAgreementStatus;
  expectedDeliveryDate?: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProjectPhase =
  | 'PROJECT_CREATED'
  | 'KICKOFF'
  | 'PHASE_1'
  | 'PHASE_2'
  | 'REVIEW'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'RETAINER';

export type DeliverableStatus = 'TODO' | 'IN_PROGRESS' | 'READY_FOR_REVIEW' | 'APPROVED' | 'DELIVERED';

export interface ProjectDeliverable {
  id: string;
  projectId: string;
  title: string;
  phase: string;
  description: string;
  status: DeliverableStatus;
  draftContent?: string;
  finalContent?: string;
  clientFeedback?: string;
  requiresApproval?: boolean;
  estimatedHours?: number;
  orderIndex: number;
  updatedAt: string;
}

export interface ProjectActivity {
  id: string;
  projectId?: string;
  dealId?: string;
  actor: 'USER' | 'AI_ASSISTANT' | 'TELEGRAM_BOT' | 'SYSTEM';
  eventType:
    | 'DEAL_CREATED'
    | 'PROPOSAL_DRAFTED'
    | 'PROPOSAL_SENT'
    | 'DEAL_WON'
    | 'PROJECT_CREATED'
    | 'PHASE_ADVANCED'
    | 'DELIVERABLE_GENERATED'
    | 'APPROVAL_REQUESTED'
    | 'APPROVAL_GRANTED'
    | 'NOTE_ADDED';
  summary: string;
  details?: string;
  createdAt: string;
}

export interface ApprovalGate {
  id: string;
  dealId?: string;
  projectId?: string;
  targetEntity?: string;
  targetId?: string;
  actionType:
    | 'SEND_PROPOSAL'
    | 'MARK_DELIVERED'
    | 'CONVERT_TO_PROJECT'
    | 'SEND_CLIENT_EMAIL'
    | 'ADVANCE_PHASE'
    | string;
  title: string;
  description: string;
  proposedPayload?: Record<string, any>;
  payloadSnapshot?: Record<string, any>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
}

export interface ActiveProject {
  id: string;
  dealId: string;
  prospectId?: string;
  clientName: string;
  clientEmail?: string;
  clientCompany?: string;
  clientWebsite?: string;
  servicePackage: string;
  agreedPrice: number;
  currency: string;
  currentPhase: ProjectPhase;
  projectBrief: string;
  diagnosticDossier?: {
    problemsDetected: string[];
    liveAuditObservations: string[];
    conversionFriction: string[];
  };
  deliverables?: ProjectDeliverable[];
  activities?: ProjectActivity[];
  pendingApprovals?: ApprovalGate[];
  kickoffDate: string;
  targetDeliveryDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

