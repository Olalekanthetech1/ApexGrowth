import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PublicDataProvider, usePublicData } from './context/PublicDataContext';
import { ThemeProvider } from './context/ThemeContext';
import { analytics } from './lib/analytics';
import { Navbar } from './components/public/Navbar';
import { Hero } from './components/public/Hero';
import { ServicesSection } from './components/public/ServicesSection';
import { LiveDemosSection } from './components/public/demos/LiveDemosSection';
import { PricingSection } from './components/public/PricingSection';
import { LeadAuditSection } from './components/public/LeadAuditSection';
import { FAQSection } from './components/public/FAQSection';
import { Footer } from './components/public/Footer';
import { FloatingWhatsApp } from './components/public/FloatingWhatsApp';
import { PublicAIAssistant } from './components/public/PublicAIAssistant';
import { LoginView } from './components/admin/LoginView';
import { AdminLayout } from './components/admin/AdminLayout';
import { ServicesPage } from './components/public/pages/ServicesPage';
import { ServiceDetailPage } from './components/public/pages/ServiceDetailPage';
import { PricingPage } from './components/public/pages/PricingPage';
import { CheckoutPage } from './components/public/pages/CheckoutPage';
import { ContactPage } from './components/public/pages/ContactPage';

function MainApp() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { seo, business } = usePublicData();

  // Client-side route tracking
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  useEffect(() => {
    // Sync browser URL and back/forward history
    const handlePopState = () => {
      const p = window.location.pathname || '/';
      setCurrentPath(p);
      analytics.track('page_view', { path: p });
    };
    window.addEventListener('popstate', handlePopState);
    analytics.track('page_view', { path: currentPath });
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // JSON-LD Schema.org Injection for SEO
  useEffect(() => {
    const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const contactPoint: Record<string, any> = {
      '@type': 'ContactPoint',
      'contactType': 'customer service',
    };
    if (business?.phone) contactPoint.telephone = business.phone;
    if (business?.email) contactPoint.email = business.email;

    const schemaData: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: business?.businessName || 'ApexGrowth Digital',
      url: originUrl,
      description: business?.description || 'High-Converting Sales Funnels & Video Ad Scripts',
    };

    if (business?.logoUrl) {
      schemaData.logo = business.logoUrl;
    }
    if (business?.phone || business?.email) {
      schemaData.contactPoint = contactPoint;
    }

    const script = document.createElement('script');
    script.id = 'json-ld-org';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schemaData);
    const existing = document.getElementById('json-ld-org');
    if (existing) existing.remove();
    document.head.appendChild(script);
  }, [business]);

  const navigateTo = (path: string) => {
    if (path.includes('#')) {
      const [routePath, hash] = path.split('#');
      const targetRoute = routePath || '/';
      window.history.pushState({}, '', path);
      setCurrentPath(targetRoute);

      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          const navOffset = 80;
          const elementPosition = el.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - navOffset;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Sync Document Title with route and SEO configuration
  useEffect(() => {
    const baseTitle = business?.businessName || 'ApexGrowth Digital';
    if (currentPath.startsWith('/services/')) {
      const slug = currentPath.replace('/services/', '');
      const formatted = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      document.title = `${formatted} | ${baseTitle}`;
    } else if (currentPath === '/services') {
      document.title = `Growth Engineering Services | ${baseTitle}`;
    } else if (currentPath === '/pricing') {
      document.title = `Transparent USD Pricing Packages | ${baseTitle}`;
    } else if (currentPath.startsWith('/checkout')) {
      document.title = `Secure Checkout & Order Intent | ${baseTitle}`;
    } else if (currentPath === '/contact') {
      document.title = `Contact & Free Funnel Audit | ${baseTitle}`;
    } else if (currentPath.startsWith('/admin')) {
      document.title = `Admin Portal | ${baseTitle}`;
    } else if (seo?.pageTitle) {
      document.title = seo.pageTitle;
    } else {
      document.title = `${baseTitle} | High-Converting Funnels & Video Ad Scripts`;
    }
  }, [currentPath, seo, business]);

  if (currentPath.startsWith('/admin')) {
    if (authLoading) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
          <div className="animate-pulse font-medium text-sm">Loading secure admin portal...</div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return <LoginView onBackToSite={() => navigateTo('/')} />;
    }

    return <AdminLayout onBackToSite={() => navigateTo('/')} />;
  }

  // Render specific public route
  const renderPublicContent = () => {
    if (currentPath === '/services') {
      return <ServicesPage onNavigate={navigateTo} />;
    }

    if (currentPath.startsWith('/services/')) {
      const slug = currentPath.replace('/services/', '').replace(/\/$/, '');
      return <ServiceDetailPage slug={slug} onNavigate={navigateTo} />;
    }

    if (currentPath === '/pricing') {
      return <PricingPage onNavigate={navigateTo} />;
    }

    if (currentPath.startsWith('/checkout')) {
      const packageSlug = currentPath.replace('/checkout/', '').replace('/checkout', '').replace(/\/$/, '');
      return <CheckoutPage packageSlug={packageSlug || undefined} onNavigate={navigateTo} />;
    }

    if (currentPath === '/contact') {
      return <ContactPage onNavigate={navigateTo} />;
    }

    // Default Home Page
    return (
      <main>
        <Hero onNavigate={navigateTo} />
        <ServicesSection onNavigate={navigateTo} />
        <LiveDemosSection />
        <PricingSection onNavigate={navigateTo} />
        <LeadAuditSection />
        <FAQSection />
      </main>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-slate-950 flex flex-col justify-between transition-colors duration-200">
      <Navbar currentPath={currentPath} onNavigate={navigateTo} onOpenAdmin={() => navigateTo('/admin')} />
      <div className="flex-1">
        {renderPublicContent()}
      </div>
      <Footer onNavigate={navigateTo} onOpenAdmin={() => navigateTo('/admin')} />
      <FloatingWhatsApp />
      <PublicAIAssistant onNavigate={navigateTo} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PublicDataProvider>
          <MainApp />
        </PublicDataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
