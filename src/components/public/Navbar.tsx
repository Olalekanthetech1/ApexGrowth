import React, { useState, useEffect } from 'react';
import { Zap, Menu, X, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { usePublicData } from '../../context/PublicDataContext';
import { ThemeToggle } from '../ThemeToggle';

interface NavbarProps {
  onOpenAdmin?: () => void;
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export function Navbar({ onOpenAdmin, currentPath = '/', onNavigate }: NavbarProps) {
  const { business, contact } = usePublicData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [pressTimer, setPressTimer] = useState<any>(null);

  const handleStartPress = () => {
    const timer = setTimeout(() => {
      if (onNavigate) {
        onNavigate('/admin');
      } else if (onOpenAdmin) {
        onOpenAdmin();
      }
    }, 2000);
    setPressTimer(timer);
  };

  const handleEndPress = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('/admin');
    } else if (onOpenAdmin) {
      onOpenAdmin();
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (logoClicks === 0) return;
    const timer = setTimeout(() => {
      setLogoClicks(0);
    }, 3000); // Reset clicks after 3 seconds of inactivity
    return () => clearTimeout(timer);
  }, [logoClicks]);

  useEffect(() => {
    if (logoClicks >= 5) {
      setLogoClicks(0);
      if (onOpenAdmin) {
        onOpenAdmin();
      }
    }
  }, [logoClicks, onOpenAdmin]);

  const navLinks = [
    { name: 'Services', path: '/services', sectionId: 'services' },
    { name: 'Live Demos', path: '/#demos', sectionId: 'demos' },
    { name: 'Pricing', path: '/pricing', sectionId: 'pricing' },
    { name: 'FAQ', path: '/#faq', sectionId: 'faq' },
    { name: 'Contact', path: '/contact', sectionId: 'contact' },
  ];

  const handleNavClick = (e: React.MouseEvent, link: (typeof navLinks)[0]) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (link.path.startsWith('/#')) {
      if (currentPath === '/') {
        const el = document.getElementById(link.sectionId);
        if (el) {
          const navOffset = 80;
          const elementPosition = el.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - navOffset;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
      } else if (onNavigate) {
        onNavigate(`/${link.path.substring(1)}`);
      }
    } else {
      if (onNavigate) {
        onNavigate(link.path);
      }
    }
  };

  return (
    <header
      id="main-navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 shadow-lg shadow-black/20 py-3.5'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a
            id="navbar-logo-link"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setLogoClicks((prev) => prev + 1);
              if (currentPath === '/') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else if (onNavigate) {
                onNavigate('/');
              }
            }}
            onDoubleClick={handleDoubleClick}
            onMouseDown={handleStartPress}
            onMouseUp={handleEndPress}
            onMouseLeave={handleEndPress}
            onTouchStart={handleStartPress}
            onTouchEnd={handleEndPress}
            className="flex items-center gap-2.5 group cursor-pointer select-none"
            title="Double-click or Long-press 2s for Admin"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-indigo-600 p-0.5 shadow-md shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all duration-300 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform duration-200" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold font-display tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                {business.businessName || 'ApexGrowth'}
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-emerald-400/90 -mt-1">
                Digital Systems
              </span>
            </div>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => {
              const isActive =
                (link.path === '/services' && currentPath.startsWith('/services')) ||
                (link.path === '/pricing' && currentPath === '/pricing') ||
                (link.path === '/contact' && currentPath === '/contact') ||
                (link.path === '/' && currentPath === '/');

              return (
                <a
                  key={link.name}
                  id={`nav-link-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                  href={link.path}
                  onClick={(e) => handleNavClick(e, link)}
                  className={`text-sm font-medium transition-colors relative py-1 hover:after:w-full after:h-0.5 after:bg-emerald-400 after:absolute after:bottom-0 after:left-0 after:transition-all after:duration-200 ${
                    isActive
                      ? 'text-emerald-400 after:w-full font-semibold'
                      : 'text-slate-300 hover:text-white after:w-0'
                  }`}
                >
                  {link.name}
                </a>
              );
            })}
          </nav>

          {/* CTAs & Admin Link */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />

            <button
              id="navbar-start-project-btn"
              onClick={() => {
                if (onNavigate) onNavigate('/pricing');
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>Start Project</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle compact />

            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div id="mobile-menu-drawer" className="md:hidden bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 px-4 pt-4 pb-6 mt-2 shadow-2xl animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                id={`mobile-nav-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                href={link.path}
                onClick={(e) => handleNavClick(e, link)}
                className="text-base font-medium text-slate-200 hover:text-emerald-400 py-2.5 px-3 rounded-lg hover:bg-slate-900/60 transition-colors"
              >
                {link.name}
              </a>
            ))}

            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2.5">
              <button
                id="mobile-start-project-cta"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onNavigate) onNavigate('/pricing');
                }}
                className="w-full text-center py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-md shadow-emerald-500/25 transition-colors cursor-pointer"
              >
                Start Project
              </button>

              {contact.whatsappUrl && contact.heroCtaEnabled && (
                <a
                  id="mobile-whatsapp-cta"
                  href={`${contact.whatsappUrl}?text=${encodeURIComponent(contact.whatsappPrefilledMessage || '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-center py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-emerald-400 font-medium text-sm transition-colors"
                >
                  {contact.whatsappButtonText || 'Chat on WhatsApp'}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
