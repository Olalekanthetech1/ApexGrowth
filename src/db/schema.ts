import { pgTable, text, boolean, integer, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Admin Users Table
export const adminUsers = pgTable(
  'admin_users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    name: text('name').notNull(),
    role: text('role').notNull(), // 'superadmin' | 'admin' | 'editor'
    active: boolean('active').default(true).notNull(),
    passwordHash: text('password_hash').notNull(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('admin_users_email_idx').on(table.email),
  ]
);

// 2. Business Profile Table
export const businessProfile = pgTable('business_profile', {
  id: text('id').primaryKey(),
  businessName: text('business_name').notNull(),
  tagline: text('tagline').notNull(),
  description: text('description').notNull(),
  email: text('email').notNull(),
  supportEmail: text('support_email').notNull(),
  phone: text('phone'),
  whatsappNumber: text('whatsapp_number').notNull(),
  businessHours: text('business_hours'),
  logoUrl: text('logo_url'),
  faviconUrl: text('favicon_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 3. Contact & CTA Settings Table
export const contactSettings = pgTable('contact_settings', {
  id: text('id').primaryKey(),
  businessEmail: text('business_email').notNull(),
  supportEmail: text('support_email').notNull(),
  phone: text('phone'),
  whatsappNumber: text('whatsapp_number').notNull(),
  whatsappUrl: text('whatsapp_url').notNull(),
  whatsappPrefilledMessage: text('whatsapp_prefilled_message').notNull(),
  whatsappButtonText: text('whatsapp_button_text').notNull(),
  floatingWhatsappEnabled: boolean('floating_whatsapp_enabled').default(true).notNull(),
  heroCtaEnabled: boolean('hero_cta_enabled').default(true).notNull(),
  pricingCtaEnabled: boolean('pricing_cta_enabled').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 4. Social Links Table
export const socialLinks = pgTable(
  'social_links',
  {
    id: text('id').primaryKey(),
    platform: text('platform').notNull(), // 'whatsapp' | 'discord' | 'telegram' etc.
    label: text('label').notNull(),
    url: text('url').notNull(),
    username: text('username'),
    enabled: boolean('enabled').default(true).notNull(),
    displayOrder: integer('display_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('social_links_order_idx').on(table.displayOrder),
  ]
);

// 5. Payment Methods Table
export const paymentMethods = pgTable(
  'payment_methods',
  {
    id: text('id').primaryKey(),
    provider: text('provider').notNull(), // 'paystack' | 'stripe' | 'selar' etc.
    displayName: text('display_name').notNull(),
    type: text('type').default('payment_link').notNull(), // 'payment_link' | 'api_integration'
    paymentUrl: text('payment_url').notNull(),
    currency: text('currency').default('USD').notNull(),
    description: text('description').default('').notNull(),
    instructions: text('instructions'),
    active: boolean('active').default(true).notNull(),
    displayOrder: integer('display_order').default(0).notNull(),
    isDirectLink: boolean('is_direct_link').default(true).notNull(),
    configMetadata: jsonb('config_metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('payment_methods_active_idx').on(table.active),
  ]
);

// 6. Services Table
export const services = pgTable(
  'services',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    iconName: text('icon_name').default('Zap').notNull(),
    features: jsonb('features').$type<string[]>().default([]).notNull(),
    published: boolean('published').default(true).notNull(),
    displayOrder: integer('display_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('services_slug_idx').on(table.slug),
    index('services_published_idx').on(table.published),
  ]
);

// 7. Pricing Packages Table (USD-First)
export const pricingPackages = pgTable(
  'pricing_packages',
  {
    id: text('id').primaryKey(),
    slug: text('slug').default(''),
    name: text('name').notNull(),
    description: text('description').notNull(),
    priceUsd: text('price_usd').notNull(),
    promoPriceUsd: text('promo_price_usd'),
    currency: text('currency').default('USD').notNull(),
    priceNaira: text('price_naira').default(''),
    features: jsonb('features').$type<string[]>().default([]).notNull(),
    isFeatured: boolean('is_featured').default(false).notNull(),
    badgeText: text('badge_text'),
    ctaText: text('cta_text').default('Get Started Now').notNull(),
    ctaAction: text('cta_action').default('contact').notNull(),
    paymentMethodId: text('payment_method_id').references(() => paymentMethods.id, { onDelete: 'set null' }),
    active: boolean('active').default(true).notNull(),
    displayOrder: integer('display_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('pricing_packages_active_idx').on(table.active),
  ]
);

// 8. Interactive Demos Table
export const demos = pgTable(
  'demos',
  {
    id: text('id').primaryKey(),
    type: text('type').notNull(), // 'video_ad_script' | 'checkout_sim' | 'interactive_custom'
    title: text('title').notNull(),
    subtitle: text('subtitle').notNull(),
    description: text('description').notNull(),
    active: boolean('active').default(true).notNull(),
    displayOrder: integer('display_order').default(0).notNull(),
    config: jsonb('config').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('demos_active_idx').on(table.active),
  ]
);

// 9. FAQs Table
export const faqs = pgTable(
  'faqs',
  {
    id: text('id').primaryKey(),
    question: text('question').notNull(),
    answer: text('answer').notNull(),
    published: boolean('published').default(true).notNull(),
    displayOrder: integer('display_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('faqs_published_idx').on(table.published),
  ]
);

// 10. Leads CRM Table
export const leads = pgTable(
  'leads',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    whatsapp: text('whatsapp').notNull(),
    businessType: text('business_type').notNull(),
    websiteUrl: text('website_url'),
    sellingDetails: text('selling_details').notNull(),
    message: text('message'),
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    utmContent: text('utm_content'),
    landingPage: text('landing_page'),
    referrer: text('referrer'),
    status: text('status').default('new').notNull(), // 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost'
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('leads_status_idx').on(table.status),
    index('leads_created_at_idx').on(table.createdAt),
    index('leads_email_idx').on(table.email),
  ]
);

// 11. Lead Notes Table (Cascade delete with Lead)
export const leadNotes = pgTable(
  'lead_notes',
  {
    id: text('id').primaryKey(),
    leadId: text('lead_id')
      .references(() => leads.id, { onDelete: 'cascade' })
      .notNull(),
    authorName: text('author_name').notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('lead_notes_lead_id_idx').on(table.leadId),
  ]
);

// 12. SEO Settings Table
export const seoSettings = pgTable('seo_settings', {
  id: text('id').primaryKey(),
  pageTitle: text('page_title').notNull(),
  metaDescription: text('meta_description').notNull(),
  ogTitle: text('og_title').notNull(),
  ogDescription: text('og_description').notNull(),
  ogImage: text('og_image').notNull(),
  favicon: text('favicon').notNull(),
  canonicalUrl: text('canonical_url').notNull(),
  robotsConfig: text('robots_config').notNull(),
  keywords: jsonb('keywords').$type<string[]>().default([]).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 13. Audit Log Table (Append-only)
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: text('id').primaryKey(),
    adminEmail: text('admin_email').notNull(),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id'),
    details: text('details').notNull(),
    ipAddress: text('ip_address'),
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('audit_logs_timestamp_idx').on(table.timestamp),
    index('audit_logs_admin_email_idx').on(table.adminEmail),
  ]
);

// 14. Orders Table
export const orders = pgTable(
  'orders',
  {
    id: text('id').primaryKey(),
    orderNumber: text('order_number').notNull(),
    customerName: text('customer_name').notNull(),
    customerEmail: text('customer_email').notNull(),
    customerWhatsapp: text('customer_whatsapp'),
    packageId: text('package_id').references(() => pricingPackages.id, { onDelete: 'set null' }),
    packageName: text('package_name').notNull(),
    amountUsd: text('amount_usd').notNull(),
    currency: text('currency').default('USD').notNull(),
    status: text('status').default('pending').notNull(), // 'pending' | 'awaiting_payment' | 'paid' | 'failed' | 'cancelled' | 'refunded'
    paymentMethodId: text('payment_method_id').references(() => paymentMethods.id, { onDelete: 'set null' }),
    paymentProvider: text('payment_provider').notNull(), // 'paystack' | 'bybit' | 'grey' | 'custom'
    customerNotes: text('customer_notes'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('orders_order_number_idx').on(table.orderNumber),
    index('orders_status_idx').on(table.status),
    index('orders_customer_email_idx').on(table.customerEmail),
    index('orders_created_at_idx').on(table.createdAt),
  ]
);

// 15. Payment Intents Table
export const paymentIntents = pgTable(
  'payment_intents',
  {
    id: text('id').primaryKey(),
    orderId: text('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
    provider: text('provider').notNull(), // 'paystack' | 'bybit' | 'grey' | 'custom'
    paymentType: text('payment_type').notNull(), // 'card' | 'crypto' | 'bank_transfer'
    amountUsd: text('amount_usd').notNull(),
    currency: text('currency').default('USD').notNull(),
    status: text('status').default('pending').notNull(), // 'pending' | 'awaiting_payment' | 'paid' | 'failed' | 'cancelled' | 'refunded'
    reference: text('reference').notNull(),
    paymentUrl: text('payment_url'),
    transferInstructions: text('transfer_instructions'),
    cryptoAddress: text('crypto_address'),
    cryptoNetwork: text('crypto_network'),
    proofOfPaymentUrl: text('proof_of_payment_url'),
    adminNotes: text('admin_notes'),
    confirmedBy: text('confirmed_by'),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('payment_intents_reference_idx').on(table.reference),
    index('payment_intents_order_id_idx').on(table.orderId),
    index('payment_intents_status_idx').on(table.status),
  ]
);

// Relations
export const leadsRelations = relations(leads, ({ many }) => ({
  notes: many(leadNotes),
}));

export const leadNotesRelations = relations(leadNotes, ({ one }) => ({
  lead: one(leads, {
    fields: [leadNotes.leadId],
    references: [leads.id],
  }),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({ many }) => ({
  packages: many(pricingPackages),
  orders: many(orders),
}));

export const pricingPackagesRelations = relations(pricingPackages, ({ one, many }) => ({
  paymentMethod: one(paymentMethods, {
    fields: [pricingPackages.paymentMethodId],
    references: [paymentMethods.id],
  }),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  package: one(pricingPackages, {
    fields: [orders.packageId],
    references: [pricingPackages.id],
  }),
  paymentMethod: one(paymentMethods, {
    fields: [orders.paymentMethodId],
    references: [paymentMethods.id],
  }),
  paymentIntents: many(paymentIntents),
}));

export const paymentIntentsRelations = relations(paymentIntents, ({ one }) => ({
  order: one(orders, {
    fields: [paymentIntents.orderId],
    references: [orders.id],
  }),
}));

// 16. AI Conversations Table
export const aiConversations = pgTable(
  'ai_conversations',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id').notNull(),
    userRole: text('user_role').default('customer').notNull(), // 'customer' | 'admin' | 'superadmin' | 'editor'
    userEmail: text('user_email'),
    summary: text('summary'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('ai_conversations_session_idx').on(table.sessionId),
    index('ai_conversations_created_at_idx').on(table.createdAt),
  ]
);

// 17. AI Messages Table
export const aiMessages = pgTable(
  'ai_messages',
  {
    id: text('id').primaryKey(),
    conversationId: text('conversation_id')
      .references(() => aiConversations.id, { onDelete: 'cascade' })
      .notNull(),
    sender: text('sender').notNull(), // 'user' | 'assistant' | 'system'
    content: text('content').notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('ai_messages_conversation_idx').on(table.conversationId),
    index('ai_messages_created_at_idx').on(table.createdAt),
  ]
);

// 18. AI Events Table
export const aiEvents = pgTable(
  'ai_events',
  {
    id: text('id').primaryKey(),
    conversationId: text('conversation_id'),
    eventType: text('event_type').notNull(),
    payload: jsonb('payload'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('ai_events_type_idx').on(table.eventType),
    index('ai_events_created_at_idx').on(table.createdAt),
  ]
);

export const aiConversationsRelations = relations(aiConversations, ({ many }) => ({
  messages: many(aiMessages),
}));

export const aiMessagesRelations = relations(aiMessages, ({ one }) => ({
  conversation: one(aiConversations, {
    fields: [aiMessages.conversationId],
    references: [aiConversations.id],
  }),
}));
