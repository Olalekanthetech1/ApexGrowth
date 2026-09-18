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

// 9b. Testimonials Table
export const testimonials = pgTable(
  'testimonials',
  {
    id: text('id').primaryKey(),
    clientName: text('client_name').notNull(),
    clientRole: text('client_role').notNull(),
    companyName: text('company_name'),
    avatarUrl: text('avatar_url'),
    rating: integer('rating').default(5).notNull(),
    content: text('content').notNull(),
    published: boolean('published').default(true).notNull(),
    displayOrder: integer('display_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('testimonials_published_idx').on(table.published),
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

// 19. Opportunities Table (24/7 Scout & Evidence Intelligence)
export const opportunities = pgTable(
  'opportunities',
  {
    id: text('id').primaryKey(),
    opportunityFingerprint: text('opportunity_fingerprint'), // Hash(person + company + platform + source_url)
    entityFingerprint: text('entity_fingerprint'),       // Hash(person + company + normalized_domain)
    title: text('title').notNull(),
    prospectName: text('prospect_name').notNull(),
    businessName: text('business_name').notNull(),
    websiteUrl: text('website_url'),
    niche: text('niche').notNull(),
    sourcePlatform: text('source_platform').default('web_search').notNull(), // 'reddit' | 'twitter' | 'web_search' | 'shopify_community' | 'manual_audit'
    sourceUrl: text('source_url').notNull(),
    sourcePostExcerpt: text('source_post_excerpt'),
    relevanceSummary: text('relevance_summary').notNull(),
    evidence: jsonb('evidence').default([]).notNull(), // Array of EvidenceObservation
    publicContacts: jsonb('public_contacts').default([]).notNull(), // Array of PublicContact with explicit provenance & confidence
    confidenceScores: jsonb('confidence_scores'), // Identity, company, contact, problem confidence metrics
    verificationStatus: jsonb('verification_status'), // Object tracking individual gate criteria passing/failing
    isVerifiedOpportunity: boolean('is_verified_opportunity').default(false).notNull(), // Flag determining outreach-readiness
    opportunityScore: text('opportunity_score').default('MEDIUM').notNull(), // 'HIGH' | 'MEDIUM' | 'LOW'
    outreachStatus: text('outreach_status').default('DRAFTED').notNull(), // 'DRAFTED' | 'REFINED' | 'APPROVED' | 'SENT' | 'REJECTED'
    outreachDraft: text('outreach_draft').notNull(),
    refinedDraft: text('refined_draft'),
    refinementFeedback: text('refinement_feedback'),
    telegramMessageId: text('telegram_message_id'),
    actionApprovedAt: timestamp('action_approved_at', { withTimezone: true }),
    actionSentAt: timestamp('action_sent_at', { withTimezone: true }),
    actionRejectedAt: timestamp('action_rejected_at', { withTimezone: true }),
    sentChannel: text('sent_channel'),
    sentProvider: text('sent_provider'),
    outreachMessageId: text('outreach_message_id'),
    resendMessageId: text('resend_message_id'),
    recipientEmail: text('recipient_email'),
    sendErrorReason: text('send_error_reason'),
    emailSubject: text('email_subject'),
    dispatchAttemptId: text('dispatch_attempt_id'),
    dispatchAttemptAt: timestamp('dispatch_attempt_at', { withTimezone: true }),
    nextFollowUpDate: timestamp('next_follow_up_date', { withTimezone: true }),
    prospectReply: text('prospect_reply'),
    prospectRepliedAt: timestamp('prospect_replied_at', { withTimezone: true }),
    dealId: text('deal_id'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('opportunities_status_idx').on(table.outreachStatus),
    index('opportunities_score_idx').on(table.opportunityScore),
    index('opportunities_created_at_idx').on(table.createdAt),
    index('opportunities_source_url_idx').on(table.sourceUrl),
  ]
);

// 20. Scout Settings Table
export const scoutSettings = pgTable(
  'scout_settings',
  {
    id: text('id').primaryKey(),
    telegramBotToken: text('telegram_bot_token'),
    telegramChatId: text('telegram_chat_id'),
    telegramEnabled: boolean('telegram_enabled').default(false).notNull(),
    tavilyApiKey: text('tavily_api_key'),
    tavilyEnabled: boolean('tavily_enabled').default(true).notNull(),
    autonomousWorkerEnabled: boolean('autonomous_worker_enabled').default(true).notNull(),
    runIntervalMinutes: integer('run_interval_minutes').default(60).notNull(),
    targetNiches: jsonb('target_niches').default(['E-commerce Brands', 'Shopify Store Owners', 'Course & Digital Creators', 'High-Ticket Coaches']).notNull(),
    intentKeywords: jsonb('intent_keywords').default(['checkout dropoff', 'low conversion rate', 'feedback on store', 'need landing page', 'video ad script', 'abandoned carts']).notNull(),
    aiProvider: text('ai_provider').default('gemini').notNull(),
    aiModel: text('ai_model').default('gemini-2.5-flash').notNull(),
    geminiApiKey: text('gemini_api_key'),
    groqApiKey: text('groq_api_key'),
    mistralApiKey: text('mistral_api_key'),
    nvidiaApiKey: text('nvidia_api_key'),
    secondaryAiApiKey: text('secondary_ai_api_key'),
    secondaryAiBaseUrl: text('secondary_ai_base_url'),
    aiTemperature: integer('ai_temperature').default(70),
    // Outbound Email Provider Abstraction Settings
    emailProvider: text('email_provider').default('gmail').notNull(),
    gmailUser: text('gmail_user'),
    gmailAppPassword: text('gmail_app_password'),
    resendApiKey: text('resend_api_key'),
    resendFromEmail: text('resend_from_email').default('ApexGrowth Growth Team <onboarding@resend.dev>'),
    smtpHost: text('smtp_host'),
    smtpPort: integer('smtp_port').default(465),
    lastRunAt: timestamp('last_run_at', { withTimezone: true }),
    totalScoutedCount: integer('total_scouted_count').default(0).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  }
);

// 21. Deals Table
export const deals = pgTable(
  'deals',
  {
    id: text('id').primaryKey(),
    prospectId: text('prospect_id'),
    clientName: text('client_name').notNull(),
    clientEmail: text('client_email'),
    clientCompany: text('client_company'),
    clientWebsite: text('client_website'),
    servicePackage: text('service_package').notNull(),
    proposedPrice: integer('proposed_price').notNull().default(0),
    currency: text('currency').notNull().default('USD'),
    stage: text('stage').notNull().default('OPEN'),
    proposalSummary: text('proposal_summary'),
    proposalDraft: text('proposal_draft'),
    negotiationNotes: text('negotiation_notes'),
    paymentStatus: text('payment_status').notNull().default('UNPAID'),
    agreementStatus: text('agreement_status').notNull().default('PENDING'),
    expectedDeliveryDate: timestamp('expected_delivery_date', { withTimezone: true }),
    projectId: text('project_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  }
);

// 22. Active Projects Table
export const activeProjects = pgTable(
  'active_projects',
  {
    id: text('id').primaryKey(),
    dealId: text('deal_id').notNull(),
    prospectId: text('prospect_id'),
    clientName: text('client_name').notNull(),
    clientEmail: text('client_email'),
    clientCompany: text('client_company'),
    clientWebsite: text('client_website'),
    servicePackage: text('service_package').notNull(),
    agreedPrice: integer('agreed_price').notNull().default(0),
    currency: text('currency').notNull().default('USD'),
    currentPhase: text('current_phase').notNull().default('PROJECT_CREATED'),
    projectBrief: text('project_brief').notNull(),
    diagnosticDossier: jsonb('diagnostic_dossier'),
    kickoffDate: timestamp('kickoff_date', { withTimezone: true }).defaultNow().notNull(),
    targetDeliveryDate: timestamp('target_delivery_date', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  }
);

// 23. Project Deliverables Table
export const projectDeliverables = pgTable(
  'project_deliverables',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id').notNull(),
    title: text('title').notNull(),
    phase: text('phase').notNull().default('PHASE_1'),
    description: text('description').notNull(),
    status: text('status').notNull().default('TODO'),
    draftContent: text('draft_content'),
    finalContent: text('final_content'),
    clientFeedback: text('client_feedback'),
    orderIndex: integer('order_index').default(0).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  }
);

// 24. Project Activities & Audit Trail Table
export const projectActivities = pgTable(
  'project_activities',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id'),
    dealId: text('deal_id'),
    actor: text('actor').notNull().default('SYSTEM'),
    eventType: text('event_type').notNull(),
    summary: text('summary').notNull(),
    details: text('details'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  }
);

// 25. Approval Gates Table
export const approvalGates = pgTable(
  'approval_gates',
  {
    id: text('id').primaryKey(),
    dealId: text('deal_id'),
    projectId: text('project_id'),
    actionType: text('action_type').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    proposedPayload: jsonb('proposed_payload'),
    status: text('status').notNull().default('PENDING'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  }
);

