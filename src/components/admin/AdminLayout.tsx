import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Building,
  Layers,
  Tag,
  Film,
  HelpCircle,
  Globe,
  Phone,
  CreditCard,
  ShoppingBag,
  Users,
  ShieldCheck,
  Activity,
  LogOut,
  ArrowLeft,
  Menu,
  X,
  Zap,
  Bot,
  MessageCircle,
  Coins,
  Database,
  Star,
  Radar,
  Sliders,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePublicData } from '../../context/PublicDataContext';
import { api } from '../../lib/api';

// New Bespoke Tab Managers
import { LeadsCRMManager } from './LeadsCRMManager';
import { PipelineOperationsManager } from './PipelineOperationsManager';
import { OrdersManager } from './OrdersManager';
import { ServicesPricingManager } from './ServicesPricingManager';
import { DemosManager } from './DemosManager';
import { TestimonialsManager } from './TestimonialsManager';
import { FAQManager } from './FAQManager';
import { CryptoGatewaySettings } from './CryptoGatewaySettings';
import { PaystackGatewaySettings } from './PaystackGatewaySettings';
import { ContactBankSettings } from './ContactBankSettings';
import { NeonDatabaseManager } from './NeonDatabaseManager';
import { OpportunityScoutManager } from './OpportunityScoutManager';
import { IntegrationsManager } from './IntegrationsManager';

// Classic admin components if they navigate to older pages
import { AIIntelligenceManager } from './AIIntelligenceManager';
import { BusinessProfileManager } from './BusinessProfileManager';
import { SEOManager } from './SEOManager';
import { SocialLinksManager } from './SocialLinksManager';
import { AuditLogViewer } from './AuditLogViewer';
import { AdminUsersManager } from './AdminUsersManager';
import { SettingsManager } from './SettingsManager';

import { ThemeToggle } from '../ThemeToggle';
import { Lead } from '../../types/index';

interface AdminLayoutProps {
  onBackToSite: () => void;
}

export function AdminLayout({ onBackToSite }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  
  const getTabFromPath = (): string => {
    const path = window.location.pathname.replace(/\/admin\/?/, '').toLowerCase();
    if (!path || path === 'dashboard') return 'leads';
    const allowed = [
      'leads', 'pipeline-operations', 'orders', 'services-pricing', 'demos', 'testimonials', 'faq',
      'crypto-settings', 'paystack-settings', 'contact-bank', 'neon-database',
      'scout-intelligence', 'ai-intelligence', 'business', 'seo', 'socials', 'users', 'activity', 'settings'
    ];
    return allowed.includes(path) ? path : 'leads';
  };

  const [activeTab, setActiveTab] = useState<string>(getTabFromPath);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<Lead | null>(null);

  // Dynamic Live Counts State
  const [counts, setCounts] = useState({
    leads: 0,
    pipeline: 0,
    orders: 0,
    services: 0,
    demos: 0,
    testimonials: 0,
    faqs: 0,
    scout: 0,
  });

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getTabFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch true live counts from Neon database
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [stats, orders, scoutStats, dealsData] = await Promise.all([
          api.getDashboardStats(),
          api.getOrders(),
          api.getScoutStats().catch(() => ({ total: 0 })),
          api.getDeals().catch(() => []),
        ]);
        setCounts({
          leads: stats.totalLeads || 0,
          pipeline: dealsData?.length || 0,
          orders: orders?.length || 0,
          services: (stats.activeServices || 0) + (stats.activePackages || 0),
          demos: stats.publishedDemos || 0,
          testimonials: stats.publishedTestimonials || 0,
          faqs: stats.publishedFaqs || 0,
          scout: scoutStats.total || 0,
        });
      } catch (e) {
        console.error('Failed to load dynamic counts', e);
      }
    };
    fetchCounts();
  }, [activeTab]);

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    setMobileSidebarOpen(false);
    setSelectedLeadForDetail(null);
    window.history.pushState({}, '', `/admin/${tab}`);
  };

  const handleOpenLead = (lead: Lead) => {
    setSelectedLeadForDetail(lead);
    setActiveTab('leads');
    window.history.pushState({}, '', '/admin/leads');
  };

  // Nav configuration inside the side menu
  const navSections = [
    {
      title: 'Navigation Console',
      items: [
        { id: 'leads', label: 'Analytics & Leads', icon: Users, hasDot: true },
        { id: 'pipeline-operations', label: 'Deal & Delivery Pipeline', icon: Briefcase, badge: 'OPERATIONS', count: counts.pipeline },
        { id: 'orders', label: 'Orders List', icon: ShoppingBag, count: counts.orders },
        { id: 'services-pricing', label: 'Services & Pricing', icon: Layers, count: counts.services },
        { id: 'demos', label: 'Proof Gallery', icon: Film, count: counts.demos },
        { id: 'testimonials', label: 'Testimonials', icon: Star, count: counts.testimonials },
        { id: 'faq', label: 'FAQs List', icon: HelpCircle, count: counts.faqs },
      ],
    },
    {
      title: 'Gateways & Integrations',
      items: [
        { id: 'scout-intelligence', label: 'Copilot Ally Scout', icon: Radar, badge: '24/7 BOT', count: counts.scout },
        { id: 'integrations-settings', label: 'Integrations Hub', icon: Sliders, badge: 'TELEGRAM & TAVILY' },
        { id: 'crypto-settings', label: 'Crypto (BYBIT)', icon: Coins, badge: 'BYBIT' },
        { id: 'paystack-settings', label: 'Paystack Setup', icon: CreditCard, badge: 'USD CARDS' },
        { id: 'contact-bank', label: 'Contact & Bank', icon: Phone },
        { id: 'neon-database', label: 'Neon Database', icon: Database, badge: 'CLOUD' },
      ],
    },
    {
      title: 'System Utilities',
      items: [
        { id: 'ai-intelligence', label: 'AI Intelligence', icon: Bot },
        { id: 'seo', label: 'SEO & Meta Settings', icon: Globe },
        ...(user?.role === 'superadmin' || user?.role === 'admin'
          ? [{ id: 'users', label: 'Admin Users', icon: ShieldCheck }]
          : []),
        { id: 'activity', label: 'Audit Activity Logs', icon: Activity },
      ],
    },
  ];

  const premiumTabs = [
    { id: 'leads', label: 'Live Analytics & Leads', hasDot: true },
    { id: 'pipeline-operations', label: `Deal & Delivery Pipeline (${counts.pipeline})`, badge: 'DEALS & SPRINTS', badgeColor: 'bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 border border-indigo-500/30 font-bold' },
    { id: 'scout-intelligence', label: `Copilot Ally Scout (${counts.scout})`, badge: '24/7 BOT', badgeColor: 'bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 border border-indigo-500/30 font-bold' },
    { id: 'integrations-settings', label: 'Integrations Hub', badge: 'CONFIG', badgeColor: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30 font-bold' },
    { id: 'orders', label: `Orders (${counts.orders})` },
    { id: 'services-pricing', label: `Services & Pricing (${counts.services})` },
    { id: 'demos', label: `Proof Gallery (${counts.demos})` },
    { id: 'testimonials', label: `Testimonials (${counts.testimonials})` },
    { id: 'faq', label: `FAQs (${counts.faqs})` },
    { id: 'crypto-settings', label: 'Crypto Gateway Settings', badge: 'BYBIT', badgeColor: 'bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30 font-bold' },
    { id: 'paystack-settings', label: 'Paystack Gateway Settings', badge: 'USD CARDS', badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold' },
    { id: 'contact-bank', label: 'Contact & Bank Settings' },
    { id: 'neon-database', label: 'Neon PostgreSQL Database', badge: 'CLOUD', badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-bold' },
  ];

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'leads':
        return <LeadsCRMManager initialSelectedLead={selectedLeadForDetail} />;
      case 'pipeline-operations':
        return <PipelineOperationsManager />;
      case 'scout-intelligence':
        return <OpportunityScoutManager />;
      case 'integrations-settings':
        return <IntegrationsManager />;
      case 'orders':
        return <OrdersManager />;
      case 'services-pricing':
        return <ServicesPricingManager />;
      case 'demos':
        return <DemosManager />;
      case 'testimonials':
        return <TestimonialsManager />;
      case 'faq':
        return <FAQManager />;
      case 'crypto-settings':
        return <CryptoGatewaySettings />;
      case 'paystack-settings':
        return <PaystackGatewaySettings />;
      case 'contact-bank':
        return <ContactBankSettings />;
      case 'neon-database':
        return <NeonDatabaseManager />;
      
      // Fallback handlers
      case 'ai-intelligence':
        return <AIIntelligenceManager />;
      case 'business':
        return <BusinessProfileManager />;
      case 'seo':
        return <SEOManager />;
      case 'socials':
        return <SocialLinksManager />;
      case 'users':
        return <AdminUsersManager />;
      case 'activity':
        return <AuditLogViewer />;
      case 'settings':
        return <SettingsManager />;
      default:
        return <LeadsCRMManager initialSelectedLead={selectedLeadForDetail} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col md:flex-row font-sans transition-colors duration-250">
      {/* Mobile Sticky Header */}
      <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
          <span className="font-bold font-display text-slate-900 dark:text-white">ApexGrowth Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToSite}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-500 hover:dark:text-white text-xs border border-slate-200 dark:border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      {/* Responsive Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/80 p-5 flex flex-col justify-between overflow-y-auto transition-transform duration-250 shrink-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Logo Brand Title */}
          <div>
            <div className="flex items-center gap-2.5 px-1 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-indigo-600 p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Zap className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <div>
                <span className="font-bold text-sm font-display text-slate-900 dark:text-white block">ApexGrowth</span>
                <span className="text-[9px] text-emerald-500 dark:text-emerald-400 uppercase font-bold tracking-wider">Enterprise Console</span>
              </div>
            </div>

            <button
              onClick={onBackToSite}
              className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>Return to Public Site</span>
            </button>
          </div>

          {/* Grouped Sidebar Navigation */}
          <nav className="space-y-5">
            {navSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 px-3">
                  {section.title}
                </span>
                <div className="space-y-0.5 mt-1">
                  {section.items.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        id={`admin-nav-${item.id}`}
                        onClick={() => handleNavigate(item.id)}
                        className={`w-full text-left py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <item.icon className={`w-4 h-4 ${isActive ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
                          <span>{item.label}</span>
                        </div>
                        
                        {item.count !== undefined ? (
                          <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                            {item.count}
                          </span>
                        ) : item.badge ? (
                          <span className="text-[8px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1 py-0.5 rounded border border-emerald-500/20">
                            {item.badge}
                          </span>
                        ) : item.hasDot ? (
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* User Identity Info card */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 mt-6">
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800/60 mb-2">
            <div className="text-xs font-bold text-slate-950 dark:text-white truncate">{user?.name || 'Administrator'}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</div>
          </div>

          <button
            id="admin-logout-btn"
            onClick={logout}
            className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-red-50 dark:bg-slate-900 dark:hover:bg-red-950/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 hover:text-red-500 hover:dark:text-red-400 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 w-full p-4 sm:p-6 lg:p-8 flex flex-col gap-6 relative overflow-x-hidden">
        {/* Top bar tools */}
        <div className="flex items-center justify-between gap-4 shrink-0 border-b border-slate-200 dark:border-slate-800/50 pb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-500 hidden sm:block" />
            <h2 className="text-lg font-bold font-display text-slate-950 dark:text-white">Admin Operations Workspace</h2>
          </div>
          <ThemeToggle />
        </div>

        {/* High-End Bento Horizontal Scrollable Tab Bar */}
        <div className="w-full overflow-x-auto no-scrollbar py-2 -my-2 flex items-center gap-2 shrink-0 border-b border-slate-200 dark:border-slate-800/50">
          {premiumTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleNavigate(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-md shadow-emerald-500/10'
                    : 'bg-white hover:bg-slate-50 dark:bg-slate-900/60 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                {tab.hasDot && (
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-slate-950 animate-pulse' : 'bg-emerald-400 animate-ping'}`} />
                )}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[8px] tracking-wider px-1.5 py-0.5 rounded font-extrabold ${tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active Content Body Canvas */}
        <div className="flex-1 min-w-0 w-full">
          {renderActiveContent()}
        </div>
      </main>
    </div>
  );
}
