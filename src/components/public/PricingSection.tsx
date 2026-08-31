import React, { useState } from 'react';
import { Check, Sparkles, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import { usePublicData } from '../../context/PublicDataContext';
import { PricingPackage } from '../../types/index';
import { CheckoutModal } from './CheckoutModal';

interface PricingSectionProps {
  onNavigate?: (path: string) => void;
}

export function PricingSection({ onNavigate }: PricingSectionProps = {}) {
  const { pricing, contact, paymentMethods } = usePublicData();
  const [selectedPkgForCheckout, setSelectedPkgForCheckout] = useState<PricingPackage | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const handleCtaClick = (pkg: PricingPackage) => {
    if (pkg.ctaAction === 'checkout_demo') {
      const demoSection = document.querySelector('#demos');
      const switchCheckoutBtn = document.querySelector('#switch-demo-checkout-tab') as HTMLButtonElement;
      if (switchCheckoutBtn) switchCheckoutBtn.click();
      if (demoSection) demoSection.scrollIntoView({ behavior: 'smooth' });
    } else if (pkg.ctaAction === 'whatsapp' && contact.whatsappUrl) {
      const msg = `Hi ApexGrowth, I'd like to order the ${pkg.name} package ($${pkg.promoPriceUsd || pkg.priceUsd} USD).`;
      window.open(`${contact.whatsappUrl}?text=${encodeURIComponent(msg)}`, '_blank');
    } else if (pkg.ctaAction === 'contact') {
      if (onNavigate) {
        onNavigate('/contact');
      } else {
        const auditEl = document.querySelector('#audit-form');
        if (auditEl) auditEl.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Default: Open direct USD checkout modal
      setSelectedPkgForCheckout(pkg);
      setIsCheckoutOpen(true);
    }
  };

  return (
    <section id="pricing" className="py-20 md:py-28 relative bg-slate-100/50 dark:bg-slate-950/70 border-t border-slate-200 dark:border-slate-900 transition-colors">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/5 blur-[150px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
            Transparent USD Investment
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight mb-4">
            Choose Your <span className="text-emerald-500 dark:text-emerald-400">Growth Package</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            High-converting digital funnels, ad creatives, and retention architectures priced transparently in USD.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          {pricing.map((pkg, idx) => {
            const isFeatured = pkg.isFeatured;
            const hasPromo = Boolean(pkg.promoPriceUsd && pkg.promoPriceUsd !== pkg.priceUsd);

            return (
              <div
                key={pkg.id}
                id={`pricing-card-${idx}`}
                className={`glass-panel rounded-3xl p-8 flex flex-col justify-between relative transition-all duration-300 ${
                  isFeatured
                    ? 'border-emerald-500/60 bg-white dark:bg-slate-900/90 shadow-2xl shadow-emerald-500/15 lg:-translate-y-2'
                    : 'border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Popular Badge */}
                {isFeatured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 text-[11px] font-extrabold tracking-wide uppercase shadow-md shadow-emerald-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>{pkg.badgeText || 'MOST POPULAR'}</span>
                  </div>
                )}

                <div>
                  {/* Package Title & Description */}
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-display">{pkg.name}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed min-h-[38px]">
                    {pkg.description}
                  </p>

                  {/* Price */}
                  <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-baseline gap-2">
                      {hasPromo ? (
                        <>
                          <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                            ${pkg.promoPriceUsd}
                          </span>
                          <span className="text-lg text-slate-400 dark:text-slate-500 line-through font-mono">
                            ${pkg.priceUsd}
                          </span>
                        </>
                      ) : (
                        <span className="text-4xl sm:text-5xl font-extrabold text-white font-mono tracking-tight">
                          ${pkg.priceUsd}
                        </span>
                      )}
                      <span className="text-xs text-slate-400 font-medium font-sans">USD / flat</span>
                    </div>

                    {hasPromo && (
                      <div className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[11px] font-bold">
                        <Tag className="w-3 h-3" />
                        <span>Special Promotional Price</span>
                      </div>
                    )}

                    <p className="text-[11px] text-emerald-400/90 mt-2 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Includes 2 rounds of revisions &amp; deployment assist</span>
                    </p>
                  </div>

                  {/* Feature Checklist */}
                  <div className="mb-8">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-3">
                      What's Included:
                    </span>
                    <ul className="space-y-3">
                      {pkg.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                          <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3" />
                          </div>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Action CTA */}
                <button
                  id={`pricing-cta-${idx}`}
                  onClick={() => handleCtaClick(pkg)}
                  className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isFeatured
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-lg shadow-emerald-500/25 transform hover:-translate-y-0.5'
                      : 'bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/40 text-white'
                  }`}
                >
                  <span>{pkg.ctaText || 'Get Started Now'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* USD Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        selectedPackage={selectedPkgForCheckout}
        packages={pricing}
        paymentMethods={paymentMethods}
      />
    </section>
  );
}
