import React, { useState } from 'react';
import {
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Tag,
  CreditCard,
  Coins,
  Building2,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { usePublicData } from '../../../context/PublicDataContext';
import { PricingPackage } from '../../../types/index';
import { CheckoutModal } from '../CheckoutModal';

interface PricingPageProps {
  onNavigate: (path: string) => void;
}

export function PricingPage({ onNavigate }: PricingPageProps) {
  const { pricing, paymentMethods, contact, faqs } = usePublicData();
  const [selectedPkgForCheckout, setSelectedPkgForCheckout] = useState<PricingPackage | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const handleCtaClick = (pkg: PricingPackage) => {
    if (pkg.ctaAction === 'whatsapp' && contact.whatsappUrl) {
      const msg = `Hi ApexGrowth, I'd like to order the ${pkg.name} package ($${pkg.promoPriceUsd || pkg.priceUsd} USD).`;
      window.open(`${contact.whatsappUrl}?text=${encodeURIComponent(msg)}`, '_blank');
    } else if (pkg.ctaAction === 'contact') {
      onNavigate('/contact');
    } else {
      // Navigate directly to dedicated secure checkout route
      onNavigate(`/checkout/${pkg.slug}`);
    }
  };

  return (
    <div className="pt-28 pb-20 md:pt-36 md:pb-28">
      {/* Glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-emerald-500/10 blur-[150px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>USD-First Transparent Investment</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-display text-white tracking-tight mb-6">
            Transparent <span className="text-emerald-400">Pricing Packages</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            High-converting sales funnels, direct-response video scripts, and custom payment architectures priced transparently with zero hidden fees.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto mb-20">
          {pricing.map((pkg, idx) => {
            const isFeatured = pkg.isFeatured;
            const hasPromo = Boolean(pkg.promoPriceUsd && pkg.promoPriceUsd !== pkg.priceUsd);

            return (
              <div
                key={pkg.id}
                id={`pricing-page-card-${idx}`}
                className={`glass-panel rounded-3xl p-8 flex flex-col justify-between relative transition-all duration-300 ${
                  isFeatured
                    ? 'border-emerald-500/60 bg-slate-900/90 shadow-2xl shadow-emerald-500/15 lg:-translate-y-2'
                    : 'border-slate-800/90 hover:border-slate-700'
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
                  <h2 className="text-2xl font-bold text-white mb-2 font-display">{pkg.name}</h2>
                  <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed min-h-[38px]">
                    {pkg.description}
                  </p>

                  {/* Price */}
                  <div className="mb-6 pb-6 border-b border-slate-800">
                    <div className="flex items-baseline gap-2">
                      {hasPromo ? (
                        <>
                          <span className="text-4xl sm:text-5xl font-extrabold text-white font-mono tracking-tight">
                            ${pkg.promoPriceUsd}
                          </span>
                          <span className="text-lg text-slate-500 line-through font-mono">
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
                      Package Inclusions:
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
                <div className="space-y-2">
                  <button
                    id={`pricing-page-cta-${idx}`}
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

                  <button
                    onClick={() => onNavigate(`/checkout/${pkg.slug || pkg.id}`)}
                    className="w-full text-center text-xs text-slate-400 hover:text-emerald-400 py-1 transition-colors"
                  >
                    Open dedicated checkout page &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Supported Payment Channels */}
        <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-slate-800/90 max-w-5xl mx-auto mb-20">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-white mb-2">
              Supported USD Payment Channels
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              We provide secure, multi-channel payment fulfillment options to accommodate clients globally.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-800 flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Paystack USD Cards</h3>
              <p className="text-xs text-slate-400">
                Instant checkout with Visa, Mastercard, and international USD debit/credit cards via 3D Secure authentication.
              </p>
            </div>

            <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-800 flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Coins className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Bybit Pay &amp; USDT Crypto</h3>
              <p className="text-xs text-slate-400">
                Low-fee digital asset payments via USDT (TRC20, ERC20, BEP20) and Bybit Merchant portal settlement.
              </p>
            </div>

            <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-800 flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Grey USD Bank Transfer</h3>
              <p className="text-xs text-slate-400">
                Direct international wire and US ACH transfer to our dedicated business accounts with swift payment reconciliation.
              </p>
            </div>
          </div>
        </div>

        {/* Custom Quote Banner */}
        <div className="glass-panel rounded-3xl p-8 sm:p-10 border border-emerald-500/30 text-center max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold font-display text-white mb-3">
            Looking for Custom Scope or High-Volume Retainer?
          </h3>
          <p className="text-sm text-slate-300 mb-6">
            If you need continuous multi-funnel testing, ongoing video ad script batches, or custom backend hooks, let's talk.
          </p>
          <button
            onClick={() => onNavigate('/contact')}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all"
          >
            Schedule Free Strategy Briefing
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        selectedPackage={selectedPkgForCheckout}
        packages={pricing}
        paymentMethods={paymentMethods}
      />
    </div>
  );
}
