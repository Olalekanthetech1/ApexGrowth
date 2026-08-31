import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  PublicAppData,
  Service,
  PricingPackage,
  DemoItem,
  FAQ,
  BusinessProfile,
  ContactSettings,
  SocialLink,
  PaymentMethod,
  SEOSettings,
} from '../types/index';
import { api } from '../lib/api';

interface PublicDataContextType {
  data: PublicAppData | null;
  isLoading: boolean;
  error: string | null;
  refreshPublicData: () => Promise<void>;
  business: BusinessProfile;
  contact: ContactSettings;
  socialLinks: SocialLink[];
  services: Service[];
  pricing: PricingPackage[];
  demos: DemoItem[];
  faqs: FAQ[];
  paymentMethods: PaymentMethod[];
  seo: SEOSettings;
}

// Fallback initial data to guarantee zero layout flicker
const fallbackBusiness: BusinessProfile = {
  id: 'biz_default',
  businessName: 'ApexGrowth Digital',
  tagline: 'High-Converting Funnels & Video Ad Scripts',
  description: 'We build conversion-focused sales funnels, payment experiences, and direct-response video ad scripts designed to turn attention into action.',
  email: '',
  supportEmail: '',
  phone: '',
  whatsappNumber: '',
  businessHours: 'Mon - Fri: 9:00 AM - 6:00 PM (EST)',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const fallbackContact: ContactSettings = {
  id: 'contact_default',
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
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const fallbackSEO: SEOSettings = {
  id: 'seo_default',
  pageTitle: 'ApexGrowth Digital | High-Converting Funnels & Ad Scripts',
  metaDescription: 'ApexGrowth Digital builds conversion-focused sales funnels, payment experiences, and direct-response video ad scripts designed to help businesses turn traffic into customers.',
  ogTitle: 'ApexGrowth Digital | Turn Cold Traffic Into Paying Customers',
  ogDescription: 'Conversion-focused sales funnels, payment experiences, and direct-response video ad scripts.',
  ogImage: '',
  favicon: '/favicon.ico',
  canonicalUrl: '',
  robotsConfig: 'index, follow',
  keywords: ['sales funnels', 'ad scripts', 'direct response'],
  updatedAt: new Date().toISOString(),
};

const PublicDataContext = createContext<PublicDataContextType | undefined>(undefined);

export function PublicDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<PublicAppData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPublicData = useCallback(async () => {
    try {
      const res = await api.getPublicContent();
      setData(res);
      setError(null);

      // Dynamically sync document title and meta description
      if (res.seo?.pageTitle) {
        document.title = res.seo.pageTitle;
      }
      if (res.seo?.metaDescription) {
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', res.seo.metaDescription);
      }
      if (res.seo?.ogTitle) {
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', res.seo.ogTitle);
      }
    } catch (err: any) {
      console.warn('Failed to load public API data, using cached/fallback:', err);
      setError(err.message || 'Failed to load content');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPublicData();
  }, [refreshPublicData]);

  const value: PublicDataContextType = {
    data,
    isLoading,
    error,
    refreshPublicData,
    business: data?.business || fallbackBusiness,
    contact: data?.contact || fallbackContact,
    socialLinks: data?.socialLinks || [],
    services: data?.services || [],
    pricing: data?.pricing || [],
    demos: data?.demos || [],
    faqs: data?.faqs || [],
    paymentMethods: data?.paymentMethods || [],
    seo: data?.seo || fallbackSEO,
  };

  return <PublicDataContext.Provider value={value}>{children}</PublicDataContext.Provider>;
}

export function usePublicData() {
  const context = useContext(PublicDataContext);
  if (!context) {
    throw new Error('usePublicData must be used within a PublicDataProvider');
  }
  return context;
}
