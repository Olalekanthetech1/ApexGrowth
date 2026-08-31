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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DashboardOverview } from './DashboardOverview';
import { BusinessProfileManager } from './BusinessProfileManager';
import { ServicesManager } from './ServicesManager';
import { PricingManager } from './PricingManager';
import { DemosManager } from './DemosManager';
import { FAQManager } from './FAQManager';
import { SEOManager } from './SEOManager';
import { ContactSocialManager } from './ContactSocialManager';
import { SocialLinksManager } from './SocialLinksManager';
import { PaymentMethodsManager } from './PaymentMethodsManager';
import { OrdersManager } from './OrdersManager';
import { LeadsCRMManager } from './LeadsCRMManager';
import { AuditLogViewer } from './AuditLogViewer';
import { AdminUsersManager } from './AdminUsersManager';
import { SettingsManager } from './SettingsManager';
import { AIIntelligenceManager } from './AIIntelligenceManager';
import { AdminAICopilot } from './AdminAICopilot';
import { ThemeToggle } from '../ThemeToggle';
import { Lead } from '../../types/index';
import { Settings, Share2 } from 'lucide-react';

interface AdminLayoutProps {
  onBackToSite: () => void;
}

export function AdminLayout({ onBackToSite }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  
  // Helper to map pathname to tab
  const getTabFromPath = (): string => {
    const path = window.location.pathname.replace(/\/admin\/?/, '').toLowerCase();
    if (!path || path === 'dashboard') return 'dashboard';
    if (path === 'social-links' || path === 'socials') return 'socials';
    if (path === 'audit-logs' || path === 'activity') return 'activity';
    if (path === 'intelligence' || path === 'ai-intelligence') return 'ai-intelligence';
    if (['business', 'services', 'pricing', 'demos', 'faq', 'seo', 'contact', 'payments', 'orders', 'leads', 'users', 'settings'].includes(path)) {
      return path;
    }
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState<string>(getTabFromPath);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<Lead | null>(null);

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getTabFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navSections = [
    {
      title: 'Core',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'ai-intelligence', label: 'AI Intelligence', icon: Bot },
      ],
    },
    {
      title: 'Website Content',
      items: [
        { id: 'business', label: 'Business Profile', icon: Building },
        { id: 'services', label: 'Services', icon: Layers },
        { id: 'pricing', label: 'Pricing Packages', icon: Tag },
        { id: 'demos', label: 'Interactive Demos', icon: Film },
        { id: 'faq', label: 'FAQ', icon: HelpCircle },
        { id: 'seo', label: 'SEO & Metadata', icon: Globe },
      ],
    },
    {
      title: 'Business & Channels',
      items: [
        { id: 'contact', label: 'Contact Routing', icon: Phone },
        { id: 'socials', label: 'Social Links', icon: Share2 },
        { id: 'payments', label: 'Payment Methods', icon: CreditCard },
      ],
    },
    {
      title: 'Sales & Inbound CRM',
      items: [
        { id: 'orders', label: 'Orders & Payments', icon: ShoppingBag },
        { id: 'leads', label: 'Inbound Leads CRM', icon: Users },
      ],
    },
    {
      title: 'System Administration',
      items: [
        ...(user?.role === 'superadmin' || user?.role === 'admin'
          ? [{ id: 'users', label: 'Admin Users', icon: ShieldCheck }]
          : []),
        { id: 'activity', label: 'Activity Log', icon: Activity },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    setMobileSidebarOpen(false);
    setSelectedLeadForDetail(null);

    const slug = tab === 'dashboard' ? 'dashboard' : tab === 'socials' ? 'social-links' : tab === 'activity' ? 'audit-logs' : tab;
    window.history.pushState({}, '', `/admin/${slug}`);
  };

  const handleOpenLead = (lead: Lead) => {
    setSelectedLeadForDetail(lead);
    setActiveTab('leads');
  };

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview onNavigate={handleNavigate} onOpenLead={handleOpenLead} />;
      case 'ai-intelligence':
        return <AIIntelligenceManager />;
      case 'business':
        return <BusinessProfileManager />;
      case 'services':
        return <ServicesManager />;
      case 'pricing':
        return <PricingManager />;
      case 'demos':
        return <DemosManager />;
      case 'faq':
        return <FAQManager />;
      case 'seo':
        return <SEOManager />;
      case 'contact':
        return <ContactSocialManager />;
      case 'socials':
        return <SocialLinksManager />;
      case 'payments':
        return <PaymentMethodsManager />;
      case 'orders':
        return <OrdersManager />;
      case 'leads':
        return <LeadsCRMManager initialSelectedLead={selectedLeadForDetail} />;
      case 'activity':
        return <AuditLogViewer />;
      case 'users':
        return <AdminUsersManager />;
      case 'settings':
        return <SettingsManager />;
      default:
        return <DashboardOverview onNavigate={handleNavigate} onOpenLead={handleOpenLead} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-emerald-400" />
          <span className="font-bold font-display text-white">ApexGrowth Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToSite}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs"
            title="View Site"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-slate-950 border-r border-slate-800/80 p-4 flex flex-col justify-between overflow-y-auto transition-transform duration-200 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Logo & Public Site Link */}
          <div>
            <div className="flex items-center gap-2.5 px-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-indigo-600 p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Zap className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <div>
                <span className="font-bold text-sm font-display text-white block">ApexGrowth</span>
                <span className="text-[10px] text-emerald-400 uppercase font-semibold">Admin Portal</span>
              </div>
            </div>

            <button
              onClick={onBackToSite}
              className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>Return to Public Site</span>
            </button>
          </div>

          {/* Navigation Items Grouped */}
          <nav className="space-y-5">
            {navSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-3">
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
                        className={`w-full text-left py-2 px-3 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30'
                            : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                        }`}
                      >
                        <item.icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* User Session & Logout */}
        <div className="pt-4 border-t border-slate-800/80 mt-6">
          <div className="px-3 py-2 bg-slate-900/60 rounded-xl border border-slate-800/60 mb-2">
            <div className="text-xs font-bold text-white truncate">{user?.name || 'Administrator'}</div>
            <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
          </div>

          <button
            id="admin-logout-btn"
            onClick={logout}
            className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-red-950/40 border border-slate-800 text-xs text-slate-400 hover:text-red-400 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content Canvas */}
      <main className="flex-1 min-h-screen p-4 sm:p-8 lg:p-10 max-w-7xl relative">
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        {renderActiveContent()}
        <AdminAICopilot userRole={user?.role || 'editor'} />
      </main>
    </div>
  );
}
