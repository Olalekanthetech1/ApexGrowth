import React from 'react';
import { Zap, MessageCircle, ArrowRight, CheckCircle2, Flame, Shield, Award, Sparkles } from 'lucide-react';
import { usePublicData } from '../../context/PublicDataContext';

interface HeroProps {
  onNavigate?: (path: string) => void;
}

export function Hero({ onNavigate }: HeroProps = {}) {
  const { business, contact } = usePublicData();

  const handleScrollTo = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      const navOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    } else if (onNavigate) {
      onNavigate('/contact');
    }
  };

  const whatsappLink = contact.whatsappUrl
    ? `${contact.whatsappUrl}?text=${encodeURIComponent(
        contact.whatsappPrefilledMessage || "Hi, I'd like to discuss a project with ApexGrowth Digital."
      )}`
    : '#';

  const trustBadges = [
    'Mobile-First Design',
    'Fast Deployment',
    'Payment Integration',
    'Conversion-Focused Copy',
  ];

  return (
    <section id="hero" className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] md:w-[900px] md:h-[450px] bg-gradient-to-tr from-emerald-500/15 via-indigo-600/15 to-teal-500/10 blur-[130px] -z-10 pointer-events-none" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-emerald-500/5 blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-indigo-600/10 blur-3xl -z-10 pointer-events-none" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Top Badge */}
          <div
            id="hero-badge"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 dark:bg-slate-900/90 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-semibold mb-8 shadow-inner shadow-emerald-500/10 animate-fade-in"
          >
            <Zap className="w-3.5 h-3.5 fill-emerald-500 dark:fill-emerald-400 text-emerald-500 dark:text-emerald-400" />
            <span>⚡ High-Converting Funnels &amp; Video Ad Scripts</span>
          </div>

          {/* Headline */}
          <h1
            id="hero-headline"
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold font-display tracking-tight text-slate-900 dark:text-white leading-[1.12] mb-6"
          >
            Turn Cold Ad Traffic Into{' '}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-indigo-600 dark:from-emerald-400 dark:via-teal-300 dark:to-indigo-400 bg-clip-text text-transparent">
              Paying Customers.
            </span>
          </h1>

          {/* Supporting Text */}
          <p
            id="hero-supporting-text"
            className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 font-normal leading-relaxed max-w-2xl mb-10 text-balance"
          >
            {business.description ||
              'We build conversion-focused sales funnels, payment experiences, and direct-response video ad scripts designed to turn attention into action.'}
          </p>

          {/* Primary & Secondary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-14">
            <button
              id="hero-primary-cta"
              onClick={() => handleScrollTo('#audit-form')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-base shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <span>Launch Your Funnel</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            {contact.heroCtaEnabled && (
              <a
                id="hero-secondary-whatsapp-cta"
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-900/90 dark:hover:bg-slate-800/90 border border-slate-300 dark:border-slate-700/80 hover:border-emerald-500/50 text-slate-800 dark:text-slate-100 font-semibold text-base shadow-sm transition-all duration-200"
              >
                <MessageCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                <span>{contact.whatsappButtonText || 'Chat on WhatsApp'}</span>
              </a>
            )}
          </div>

          {/* Trust Indicators */}
          <div
            id="hero-trust-indicators"
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 pt-6 border-t border-slate-300 dark:border-slate-800/80 w-full max-w-3xl"
          >
            {trustBadges.map((badge, idx) => (
              <div
                key={idx}
                id={`trust-badge-${idx}`}
                className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                <span className="truncate">{badge}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Visual Highlights Bar */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-500 dark:text-emerald-400">
              <Flame className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 font-display">Direct-Response Architecture</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Every headline, hook, visual transition, and CTA is engineered around core human buying psychology.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group hover:border-indigo-500/40 transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-500 dark:text-indigo-400">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 font-display">Zero-Friction Checkouts</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Native integrations for Paystack, Stripe, and regional payment methods to minimize cart abandonment.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group hover:border-teal-500/40 transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4 text-teal-500 dark:text-teal-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 font-display">High-Velocity Turnaround</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Rapid 48–72 hour standard sprint delivery with 2 rounds of revisions on all production packages.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
