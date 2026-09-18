import {
  PublicAppData,
  AdminUser,
  DashboardStats,
  BusinessProfile,
  ContactSettings,
  SocialLink,
  Service,
  PricingPackage,
  DemoItem,
  FAQ,
  Testimonial,
  PaymentMethod,
  SEOSettings,
  Lead,
  LeadStatus,
  AuditLog,
  Order,
  PaymentIntent,
  OrderStatus,
  Opportunity,
  ScoutSettings,
  Deal,
  ActiveProject,
  ProjectDeliverable,
  ApprovalGate,
} from '../types/index';

const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status = 500, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ag_admin_token');
}

export function setStoredToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('ag_admin_token', token);
  } else {
    localStorage.removeItem('ag_admin_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(data.error || `Request failed with status ${res.status}`, res.status, data.details);
  }

  return data as T;
}

export const api = {
  // Public
  getPublicContent: () => request<PublicAppData>('/public/content'),
  submitLead: (payload: {
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
  }) =>
    request<{ success: boolean; message: string; leadId: string }>('/public/leads', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getPublicPaymentMethods: () => request<PaymentMethod[]>('/public/payment-methods'),
  createPaymentIntent: (payload: {
    packageId: string;
    packageName?: string;
    amountUsd?: string;
    customerName: string;
    customerEmail: string;
    customerWhatsapp?: string;
    paymentMethodId?: string;
    paymentProvider: string;
    customerNotes?: string;
  }) =>
    request<{ success: boolean; order: Order; paymentIntent: PaymentIntent }>('/checkout/create-intent', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getCheckoutIntent: (orderId: string) =>
    request<{ success: boolean; order: Order }>(`/checkout/intent/${orderId}`),

  // Paystack Automated Payments
  initializePaystack: (payload: { paymentIntentId?: string; reference?: string; orderId?: string }) =>
    request<{
      success: boolean;
      authorizationUrl: string;
      accessCode: string;
      reference: string;
      orderNumber: string;
      amountUsd: string;
      currency: string;
    }>('/payments/paystack/initialize', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  verifyPaystackPayment: (reference: string) =>
    request<{
      success: boolean;
      status: string;
      alreadyPaid?: boolean;
      message?: string;
      order?: Order;
      paymentIntent?: PaymentIntent;
    }>(`/payments/paystack/verify/${encodeURIComponent(reference)}`),

  // Auth
  getInitialInfo: () =>
    request<{ hasCustomAdmin: boolean; initialEmail: string }>('/auth/initial-info'),
  login: (credentials: { email: string; password: string }) =>
    request<{ success: boolean; token: string; user: AdminUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  logout: () =>
    request<{ success: boolean }>('/auth/logout', {
      method: 'POST',
    }),
  getMe: () => request<{ user: AdminUser }>('/auth/me'),
  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    request<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Admin Dashboard
  getDashboardStats: () => request<DashboardStats>('/admin/dashboard-stats'),

  // Admin Business Profile
  getBusinessProfile: () => request<BusinessProfile>('/admin/business'),
  updateBusinessProfile: (data: Partial<BusinessProfile>) =>
    request<BusinessProfile>('/admin/business', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Admin Contact
  getContactSettings: () => request<ContactSettings>('/admin/contact'),
  updateContactSettings: (data: Partial<ContactSettings>) =>
    request<ContactSettings>('/admin/contact', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Admin Social Links
  getSocialLinks: () => request<SocialLink[]>('/admin/social-links'),
  createSocialLink: (data: Partial<SocialLink>) =>
    request<SocialLink>('/admin/social-links', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSocialLink: (id: string, data: Partial<SocialLink>) =>
    request<SocialLink>(`/admin/social-links/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteSocialLink: (id: string) =>
    request<{ success: boolean }>(`/admin/social-links/${id}`, {
      method: 'DELETE',
    }),

  // Admin Services
  getServices: () => request<Service[]>('/admin/services'),
  createService: (data: Partial<Service>) =>
    request<Service>('/admin/services', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateService: (id: string, data: Partial<Service>) =>
    request<Service>(`/admin/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteService: (id: string) =>
    request<{ success: boolean }>(`/admin/services/${id}`, {
      method: 'DELETE',
    }),

  // Admin Pricing
  getPricingPackages: () => request<PricingPackage[]>('/admin/pricing'),
  createPricingPackage: (data: Partial<PricingPackage>) =>
    request<PricingPackage>('/admin/pricing', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePricingPackage: (id: string, data: Partial<PricingPackage>) =>
    request<PricingPackage>(`/admin/pricing/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletePricingPackage: (id: string) =>
    request<{ success: boolean }>(`/admin/pricing/${id}`, {
      method: 'DELETE',
    }),

  // Admin Demos
  getDemos: () => request<DemoItem[]>('/admin/demos'),
  createDemo: (data: Partial<DemoItem>) =>
    request<DemoItem>('/admin/demos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateDemo: (id: string, data: Partial<DemoItem>) =>
    request<DemoItem>(`/admin/demos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteDemo: (id: string) =>
    request<{ success: boolean }>(`/admin/demos/${id}`, {
      method: 'DELETE',
    }),

  // Admin FAQs
  getFAQs: () => request<FAQ[]>('/admin/faq'),
  createFAQ: (data: Partial<FAQ>) =>
    request<FAQ>('/admin/faq', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateFAQ: (id: string, data: Partial<FAQ>) =>
    request<FAQ>(`/admin/faq/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteFAQ: (id: string) =>
    request<{ success: boolean }>(`/admin/faq/${id}`, {
      method: 'DELETE',
    }),

  // Admin Testimonials
  getTestimonials: () => request<Testimonial[]>('/admin/testimonials'),
  createTestimonial: (data: Partial<Testimonial>) =>
    request<Testimonial>('/admin/testimonials', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTestimonial: (id: string, data: Partial<Testimonial>) =>
    request<Testimonial>(`/admin/testimonials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTestimonial: (id: string) =>
    request<{ success: boolean }>(`/admin/testimonials/${id}`, {
      method: 'DELETE',
    }),

  // Admin SEO
  getSEOSettings: () => request<SEOSettings>('/admin/seo'),
  updateSEOSettings: (data: Partial<SEOSettings>) =>
    request<SEOSettings>('/admin/seo', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Database Management
  getDatabaseStatus: () => request<{
    status: string;
    connectionPool: { active: boolean; dialect: string; ssl: boolean; host: string; latencyMs: number };
    tables: { name: string; rows: number; description: string }[];
  }>('/admin/db-status'),

  // Admin Payments
  getPaymentMethods: () => request<PaymentMethod[]>('/admin/payments'),
  createPaymentMethod: (data: Partial<PaymentMethod>) =>
    request<PaymentMethod>('/admin/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePaymentMethod: (id: string, data: Partial<PaymentMethod>) =>
    request<PaymentMethod>(`/admin/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletePaymentMethod: (id: string) =>
    request<{ success: boolean }>(`/admin/payments/${id}`, {
      method: 'DELETE',
    }),

  // Admin Leads
  getLeads: (status?: LeadStatus) =>
    request<Lead[]>(`/admin/leads${status ? `?status=${status}` : ''}`),
  updateLeadStatus: (id: string, status: LeadStatus) =>
    request<Lead>(`/admin/leads/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  addLeadNote: (id: string, content: string) =>
    request<any>(`/admin/leads/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  deleteLead: (id: string) =>
    request<{ success: boolean }>(`/admin/leads/${id}`, {
      method: 'DELETE',
    }),

  // Admin Audit Logs
  getAuditLogs: (limit = 100) => request<AuditLog[]>(`/admin/audit-logs?limit=${limit}`),

  // Admin Users
  getAdminUsers: () => request<AdminUser[]>('/admin/users'),
  createAdminUser: (data: { email: string; name: string; role: string; password: string }) =>
    request<AdminUser>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteAdminUser: (id: string) =>
    request<{ success: boolean }>(`/admin/users/${id}`, {
      method: 'DELETE',
    }),

  // Admin Orders & Payment Confirmation
  getOrders: (status?: string) =>
    request<Order[]>(`/admin/orders${status ? `?status=${status}` : ''}`),
  getOrderById: (id: string) => request<Order>(`/admin/orders/${id}`),
  confirmPaymentIntent: (intentId: string, adminNotes?: string) =>
    request<PaymentIntent>(`/admin/payment-intents/${intentId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ adminNotes }),
    }),
  updateOrderStatus: (orderId: string, status: OrderStatus, adminNotes?: string) =>
    request<Order>(`/admin/orders/${orderId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, adminNotes }),
    }),

  // Admin Opportunity Scout & Evidence Intelligence
  getScoutSettings: () => request<ScoutSettings>('/admin/scout/settings'),
  updateScoutSettings: (data: Partial<ScoutSettings>) =>
    request<ScoutSettings>('/admin/scout/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getOpportunities: (filter?: { status?: string; score?: string }) => {
    const params = new URLSearchParams();
    if (filter?.status) params.append('status', filter.status);
    if (filter?.score) params.append('score', filter.score);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<Opportunity[]>(`/admin/scout/opportunities${qs}`);
  },
  getOpportunityById: (id: string) => request<Opportunity>(`/admin/scout/opportunities/${id}`),
  getScoutStats: () =>
    request<{ total: number; drafted: number; approved: number; sent: number; rejected: number }>(
      '/admin/scout/stats'
    ),
  approveOpportunity: (id: string) =>
    request<{ success: boolean; opportunity: Opportunity }>(`/admin/scout/opportunities/${id}/approve`, {
      method: 'POST',
    }),
  dispatchOpportunity: (id: string, recipientEmail?: string) =>
    request<{
      success: boolean;
      alreadySent?: boolean;
      provider?: string;
      messageId?: string;
      error?: string;
      opportunity?: Opportunity;
    }>(`/admin/scout/opportunities/${id}/dispatch`, {
      method: 'POST',
      body: JSON.stringify({ recipientEmail }),
    }),
  testEmailConnection: (data: {
    provider: 'gmail' | 'resend';
    gmailUser?: string;
    gmailAppPassword?: string;
    resendApiKey?: string;
  }) =>
    request<{ success: boolean; message: string; provider?: string }>(
      '/admin/scout/email/test',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
  rejectOpportunity: (id: string) =>
    request<{ success: boolean; opportunity: Opportunity }>(`/admin/scout/opportunities/${id}/reject`, {
      method: 'POST',
    }),
  refineOpportunity: (id: string, feedback: string) =>
    request<{ success: boolean; opportunity: Opportunity }>(`/admin/scout/opportunities/${id}/refine`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    }),
  markOpportunitySent: (id: string) =>
    request<{ success: boolean; opportunity: Opportunity }>(`/admin/scout/opportunities/${id}/mark-sent`, {
      method: 'POST',
    }),
  triggerScoutRun: () =>
    request<{ success: boolean; result: any }>('/admin/scout/trigger-scout', {
      method: 'POST',
    }),
  auditWebsiteUrl: (websiteUrl: string, prospectName?: string) =>
    request<{ success: boolean; opportunity: Opportunity }>('/admin/scout/audit-url', {
      method: 'POST',
      body: JSON.stringify({ websiteUrl, prospectName }),
    }),
  sendTestTelegramAlert: () =>
    request<{ success: boolean; message: string }>('/admin/scout/test-telegram', {
      method: 'POST',
    }),
  testTavilySearch: (tavilyApiKey?: string) =>
    request<{ success: boolean; message: string; answer?: string }>('/admin/scout/test-tavily', {
      method: 'POST',
      body: JSON.stringify({ tavilyApiKey }),
    }),
  fetchAiModels: (provider: string, apiKey: string, customBaseUrl?: string) =>
    request<{ success: boolean; models: Array<{ id: string; name?: string; owned_by?: string }>; error?: string }>(
      '/admin/scout/fetch-ai-models',
      {
        method: 'POST',
        body: JSON.stringify({ provider, apiKey, customBaseUrl }),
      }
    ),
  testAiProvider: (provider: string, apiKey: string, model?: string, customBaseUrl?: string) =>
    request<{ success: boolean; message: string; modelUsed?: string; latencyMs?: number; output?: string }>(
      '/admin/scout/test-ai-provider',
      {
        method: 'POST',
        body: JSON.stringify({ provider, apiKey, model, customBaseUrl }),
      }
    ),

  // Deal-to-Delivery Pipeline API
  getDeals: (stage?: string) => {
    const qs = stage ? `?stage=${stage}` : '';
    return request<Deal[]>(`/admin/pipeline/deals${qs}`);
  },
  createDeal: (data: { prospectId: string; servicePackage?: string; proposedPrice?: number }) =>
    request<Deal>('/admin/pipeline/deals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateDealStage: (id: string, stage: string) =>
    request<Deal>(`/admin/pipeline/deals/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage }),
    }),
  convertDealToProject: (dealId: string) =>
    request<ActiveProject>(`/admin/pipeline/deals/${dealId}/convert`, {
      method: 'POST',
    }),
  getActiveProjects: (phase?: string) => {
    const qs = phase ? `?phase=${phase}` : '';
    return request<ActiveProject[]>(`/admin/pipeline/projects${qs}`);
  },
  getProjectById: (id: string) => request<ActiveProject>(`/admin/pipeline/projects/${id}`),
  updateProjectPhase: (id: string, currentPhase: string) =>
    request<ActiveProject>(`/admin/pipeline/projects/${id}/phase`, {
      method: 'PATCH',
      body: JSON.stringify({ currentPhase }),
    }),
  addDeliverable: (data: {
    projectId: string;
    title: string;
    description: string;
    phase: string;
    requiresApproval?: boolean;
    estimatedHours?: number;
  }) =>
    request<ProjectDeliverable>('/admin/pipeline/deliverables', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateDeliverableStatus: (id: string, status: string, notes?: string) =>
    request<ProjectDeliverable>(`/admin/pipeline/deliverables/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    }),
  getApprovalGates: (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return request<ApprovalGate[]>(`/admin/pipeline/approvals${qs}`);
  },
  decideApprovalGate: (id: string, status: 'APPROVED' | 'REJECTED', reviewNotes?: string) =>
    request<ApprovalGate>(`/admin/pipeline/approvals/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify({ status, reviewNotes }),
    }),
  coWorkWithAi: (projectId: string, instruction: string) =>
    request<{ success: boolean; responseText: string; deliverableId?: string; requiresHumanReview?: boolean }>(
      `/admin/pipeline/projects/${projectId}/cowork`,
      {
        method: 'POST',
        body: JSON.stringify({ instruction }),
      }
    ),
};


