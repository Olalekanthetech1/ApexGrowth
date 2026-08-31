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
  PaymentMethod,
  SEOSettings,
  Lead,
  LeadStatus,
  AuditLog,
  Order,
  PaymentIntent,
  OrderStatus,
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

  // Admin SEO
  getSEOSettings: () => request<SEOSettings>('/admin/seo'),
  updateSEOSettings: (data: Partial<SEOSettings>) =>
    request<SEOSettings>('/admin/seo', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

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
};
