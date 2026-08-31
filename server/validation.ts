import { z } from 'zod';

export const LeadSubmissionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  whatsapp: z.string().min(5, 'Please provide a valid WhatsApp number').max(30),
  businessType: z.string().min(2, 'Please select or enter your business type').max(100),
  websiteUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  sellingDetails: z.string().min(3, 'Please describe what you are selling or offering').max(2000),
  message: z.string().max(2000).optional().or(z.literal('')),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
  utmContent: z.string().max(100).optional(),
  landingPage: z.string().max(255).optional(),
  referrer: z.string().max(255).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const AdminUserCreateSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['superadmin', 'admin', 'editor']),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const AdminUserUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(['superadmin', 'admin', 'editor']).optional(),
  active: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

export const BusinessProfileSchema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  tagline: z.string().min(2, 'Tagline is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  email: z.string().email('Valid business email required'),
  supportEmail: z.string().email('Valid support email required'),
  phone: z.string().optional().or(z.literal('')),
  whatsappNumber: z.string().min(5, 'WhatsApp number required'),
  businessHours: z.string().optional().or(z.literal('')),
  logoUrl: z.string().optional().or(z.literal('')),
  faviconUrl: z.string().optional().or(z.literal('')),
});

export const ContactSettingsSchema = z.object({
  businessEmail: z.string().email('Valid business email required'),
  supportEmail: z.string().email('Valid support email required'),
  phone: z.string().optional().or(z.literal('')),
  whatsappNumber: z.string().min(5, 'WhatsApp number required'),
  whatsappUrl: z.string().url('Valid WhatsApp URL required'),
  whatsappPrefilledMessage: z.string().min(1, 'Prefilled message required'),
  whatsappButtonText: z.string().min(1, 'Button text required'),
  floatingWhatsappEnabled: z.boolean(),
  heroCtaEnabled: z.boolean(),
  pricingCtaEnabled: z.boolean(),
});

export const SocialLinkSchema = z.object({
  platform: z.enum(['whatsapp', 'discord', 'telegram', 'instagram', 'tiktok', 'twitter', 'linkedin', 'youtube', 'custom']),
  label: z.string().min(1, 'Label is required'),
  url: z.string().url('Must be a valid URL'),
  username: z.string().optional().or(z.literal('')),
  enabled: z.boolean(),
  displayOrder: z.number().int().nonnegative().optional(),
});

export const PaymentMethodSchema = z.object({
  provider: z.enum(['paystack', 'bybit', 'grey', 'stripe', 'selar', 'flutterwave', 'crypto', 'custom']),
  displayName: z.string().min(2, 'Display name is required'),
  type: z.enum(['payment_link', 'api_integration', 'crypto_gateway', 'bank_transfer']),
  paymentUrl: z.string().optional().or(z.literal('')),
  currency: z.string().min(1, 'Currency is required').default('USD'),
  description: z.string().default(''),
  instructions: z.string().optional().or(z.literal('')),
  active: z.boolean(),
  displayOrder: z.number().int().nonnegative().optional(),
  isDirectLink: z.boolean().default(true),
  configMetadata: z.record(z.string(), z.any()).optional(),
});

export const ServiceSchema = z.object({
  slug: z.string().min(2, 'Slug is required'),
  title: z.string().min(2, 'Title is required'),
  description: z.string().min(5, 'Description is required'),
  iconName: z.string().min(1).default('Zap'),
  features: z.array(z.string()).default([]),
  published: z.boolean(),
  displayOrder: z.number().int().nonnegative().optional(),
});

export const PricingPackageSchema = z.object({
  slug: z.string().optional().or(z.literal('')),
  name: z.string().min(2, 'Package name is required'),
  description: z.string().min(5, 'Description is required'),
  priceUsd: z.string().min(1, 'USD price is required').refine((val) => !isNaN(Number(val.replace(/[^0-9.]/g, ''))) && Number(val.replace(/[^0-9.]/g, '')) >= 0, {
    message: 'Price in USD must be a valid non-negative amount',
  }),
  promoPriceUsd: z.string().optional().or(z.literal('')).refine((val) => !val || (!isNaN(Number(val.replace(/[^0-9.]/g, ''))) && Number(val.replace(/[^0-9.]/g, '')) >= 0), {
    message: 'Promo price must be a valid non-negative amount',
  }),
  currency: z.string().default('USD'),
  priceNaira: z.string().optional().or(z.literal('')),
  features: z.array(z.string()).default([]),
  isFeatured: z.boolean(),
  badgeText: z.string().optional().or(z.literal('')),
  ctaText: z.string().min(1).default('Get Started Now'),
  ctaAction: z.enum(['contact', 'checkout_demo', 'payment_link', 'whatsapp']),
  paymentMethodId: z.string().optional().nullable(),
  active: z.boolean(),
  displayOrder: z.number().int().nonnegative().optional(),
});

export const CheckoutIntentCreateSchema = z.object({
  packageId: z.string().min(1, 'Valid package selection is required'),
  packageName: z.string().optional(),
  amountUsd: z.string().optional(), // Accepted for payload compatibility, strictly ignored by server logic
  customerName: z.string().min(2, 'Customer name must be at least 2 characters').max(100),
  customerEmail: z.string().email('Valid customer email address required'),
  customerWhatsapp: z.string().max(30).optional().nullable(),
  paymentMethodId: z.string().optional().nullable(),
  paymentProvider: z.enum(['paystack', 'bybit', 'grey', 'custom']),
  customerNotes: z.string().max(1000).optional().nullable(),
});

export const PaymentIntentConfirmSchema = z.object({
  adminNotes: z.string().max(1000).optional().or(z.literal('')),
});

export const PaystackInitializeSchema = z
  .object({
    paymentIntentId: z.string().optional(),
    reference: z.string().optional(),
    orderId: z.string().optional(),
    amountUsd: z.string().optional(), // strictly ignored - database price is authoritative
    currency: z.string().optional(), // strictly validated to USD if provided
  })
  .refine((data) => !!(data.paymentIntentId || data.reference || data.orderId), {
    message: 'Either paymentIntentId, reference, or orderId must be provided',
  })
  .refine((data) => !data.currency || data.currency.toUpperCase() === 'USD', {
    message: 'Only USD currency transactions are supported for ApexGrowth payments',
  });

export const OrderStatusUpdateSchema = z.object({
  status: z.enum(['pending', 'awaiting_payment', 'processing', 'paid', 'completed', 'failed', 'cancelled', 'refunded', 'expired']),
  adminNotes: z.string().max(1000).optional().or(z.literal('')),
});

export const DemoSchema = z.object({
  type: z.enum(['video_ad_script', 'checkout_sim', 'interactive_custom']),
  title: z.string().min(2, 'Title is required'),
  subtitle: z.string().default(''),
  description: z.string().min(5, 'Description is required'),
  active: z.boolean(),
  displayOrder: z.number().int().nonnegative().optional(),
  config: z.record(z.string(), z.any()).default({}),
});

export const FAQSchema = z.object({
  question: z.string().min(3, 'Question must be at least 3 characters'),
  answer: z.string().min(3, 'Answer must be at least 3 characters'),
  published: z.boolean(),
  displayOrder: z.number().int().nonnegative().optional(),
});

export const TestimonialSchema = z.object({
  clientName: z.string().min(2, 'Client name must be at least 2 characters'),
  clientRole: z.string().min(2, 'Client role must be at least 2 characters'),
  companyName: z.string().optional().or(z.literal('')),
  avatarUrl: z.string().optional().or(z.literal('')),
  rating: z.number().int().min(1).max(5).default(5),
  content: z.string().min(3, 'Testimonial content must be at least 3 characters'),
  published: z.boolean(),
  displayOrder: z.number().int().nonnegative().optional(),
});

export const SEOSettingsSchema = z.object({
  pageTitle: z.string().min(2, 'Page title required'),
  metaDescription: z.string().min(10, 'Meta description required'),
  ogTitle: z.string().min(2, 'OG title required'),
  ogDescription: z.string().min(10, 'OG description required'),
  ogImage: z.string().optional().or(z.literal('')),
  favicon: z.string().optional().or(z.literal('')),
  canonicalUrl: z.string().optional().or(z.literal('')),
  robotsConfig: z.string().default('index, follow'),
  keywords: z.array(z.string()).default([]),
});

export const LeadStatusUpdateSchema = z.object({
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']),
});

export const LeadNoteCreateSchema = z.object({
  content: z.string().min(1, 'Note content cannot be empty'),
});

export const PublicAiChatSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty').max(1500, 'Prompt too long'),
  sessionId: z.string().min(3).max(100),
  history: z
    .array(
      z.object({
        sender: z.enum(['user', 'assistant']),
        content: z.string().max(2000),
      })
    )
    .optional()
    .default([]),
});

export const AiLeadSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
  email: z.string().email('Valid email address required'),
  whatsapp: z.string().min(5, 'Valid WhatsApp number required').max(30),
  businessType: z.string().min(2, 'Business type required').max(100),
  sellingDetails: z.string().min(3, 'Selling details required').max(2000),
  websiteUrl: z.string().optional().or(z.literal('')),
  recommendedPackage: z.string().optional(),
  conversationSummary: z.string().optional(),
});

export const AdminAiChatSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty').max(2000),
  sessionId: z.string().min(3).max(100),
  history: z
    .array(
      z.object({
        sender: z.enum(['user', 'assistant']),
        content: z.string().max(3000),
      })
    )
    .optional()
    .default([]),
});
