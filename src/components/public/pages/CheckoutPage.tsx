import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  CreditCard,
  Building2,
  Coins,
  Copy,
  Check,
  MessageCircle,
  Clock,
  Lock,
  ArrowLeft,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { usePublicData } from '../../../context/PublicDataContext';
import { PricingPackage, PaymentMethod } from '../../../types/index';
import { api } from '../../../lib/api';

interface CheckoutPageProps {
  packageSlug?: string;
  onNavigate: (path: string) => void;
}

export function CheckoutPage({ packageSlug, onNavigate }: CheckoutPageProps) {
  const { pricing, paymentMethods, contact } = usePublicData();

  // Find package by slug or fallback to featured / first
  const [selectedPkgId, setSelectedPkgId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ status: string; message?: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Check URL parameters for returning Paystack reference (e.g. ?reference=APX-PAY-...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('reference') || params.get('trxref');
    if (ref) {
      handleVerifyReference(ref);
    }
  }, []);

  const handleVerifyReference = async (ref: string) => {
    try {
      setIsVerifying(true);
      const result = await api.verifyPaystackPayment(ref);
      if (result && result.order) {
        setCompletedOrder({
          order: result.order,
          paymentIntent: result.paymentIntent,
        });
        setVerificationResult({
          status: result.status,
          message: result.status === 'paid' ? 'Payment confirmed and verified via Paystack.' : result.message,
        });
      }
    } catch (err: any) {
      console.warn('Paystack verification error on mount:', err.message);
      // Attempt to load order via checkout intent fallback
    } finally {
      setIsVerifying(false);
    }
  };

  // Initialize selected package
  useEffect(() => {
    if (pricing.length > 0) {
      if (packageSlug) {
        const found = pricing.find(
          (p) => p.slug === packageSlug || p.id === packageSlug
        );
        if (found) {
          setSelectedPkgId(found.id);
        } else {
          setSelectedPkgId(pricing[0].id);
        }
      } else if (!selectedPkgId) {
        const featured = pricing.find((p) => p.isFeatured) || pricing[0];
        setSelectedPkgId(featured.id);
      }
    }
  }, [packageSlug, pricing]);

  // Initialize payment method
  useEffect(() => {
    if (paymentMethods.length > 0 && !selectedPaymentMethodId) {
      setSelectedPaymentMethodId(paymentMethods[0].id);
    }
  }, [paymentMethods]);

  const activePackage = pricing.find((p) => p.id === selectedPkgId) || pricing[0];
  const activePaymentMethod = paymentMethods.find((pm) => pm.id === selectedPaymentMethodId) || paymentMethods[0];

  const handleCreateOrderIntent = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerName.trim()) {
      setErrorMessage('Please provide your full name.');
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }
    if (!activePackage) {
      setErrorMessage('Please select a growth package.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.createPaymentIntent({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        customerWhatsapp: customerWhatsapp.trim() || undefined,
        packageId: activePackage.id,
        packageName: activePackage.name,
        paymentMethodId: activePaymentMethod?.id,
        paymentProvider: (activePaymentMethod?.provider || 'paystack') as any,
        customerNotes: customerNotes.trim() || undefined,
      });

      if (res && res.order) {
        setCompletedOrder(res);
      } else {
        throw new Error('Order could not be initialized.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initialize order intent. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  const getProviderIcon = (provider: string) => {
    switch (provider?.toLowerCase()) {
      case 'bybit':
      case 'crypto':
        return <Coins className="w-5 h-5 text-indigo-400" />;
      case 'grey':
      case 'bank_transfer':
        return <Building2 className="w-5 h-5 text-teal-400" />;
      case 'paystack':
      default:
        return <CreditCard className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="pt-28 pb-20 md:pt-36 md:pb-28 min-h-screen">
      {/* Background glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-emerald-500/10 blur-[150px] pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <button
          onClick={() => onNavigate('/pricing')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Pricing Packages</span>
        </button>

        {completedOrder ? (
          /* Order Confirmation View */
          <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-emerald-500/40 text-center max-w-2xl mx-auto shadow-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h1 className="text-3xl font-bold font-display text-white mb-2">
              {completedOrder.order?.status === 'paid' ? 'Payment Verified & Confirmed' : 'Order Intent Initialized'}
            </h1>
            <p className="text-sm text-slate-300 mb-8">
              {completedOrder.order?.status === 'paid' ? (
                <span>
                  Thank you! Your payment for <strong>{completedOrder.order?.packageName}</strong> (${completedOrder.order?.amountUsd} USD) has been verified. Our engineering and marketing leads have been notified.
                </span>
              ) : (
                <span>
                  Your order for <strong>{completedOrder.order?.packageName}</strong> (${completedOrder.order?.amountUsd} USD) has been registered in our system.
                </span>
              )}
            </p>

            {/* Order Details Card */}
            <div className="bg-slate-950/80 rounded-2xl p-6 border border-slate-800 text-left mb-8 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Order Reference</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-white">
                    {completedOrder.order?.orderNumber || completedOrder.paymentIntent?.reference}
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        completedOrder.order?.orderNumber || completedOrder.paymentIntent?.reference || ''
                      )
                    }
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Copy Reference"
                  >
                    {copiedRef ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="text-xs text-slate-400">Total Investment</span>
                <span className="font-mono text-lg font-extrabold text-emerald-400">
                  ${completedOrder.order?.amountUsd} USD
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="text-xs text-slate-400">Selected Provider</span>
                <span className="text-xs font-semibold text-white uppercase">
                  {completedOrder.paymentIntent?.provider || activePaymentMethod?.provider}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Status</span>
                {(() => {
                  const st = completedOrder.order?.status || completedOrder.paymentIntent?.status;
                  switch (st) {
                    case 'paid':
                    case 'completed':
                      return (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold uppercase flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Paid & Verified</span>
                        </span>
                      );
                    case 'processing':
                      return (
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[11px] font-bold uppercase flex items-center gap-1.5">
                          <Clock className="w-3 h-3 animate-pulse" />
                          <span>Processing Verification</span>
                        </span>
                      );
                    case 'failed':
                      return (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-bold uppercase flex items-center gap-1.5">
                          <AlertCircle className="w-3 h-3" />
                          <span>Payment Failed</span>
                        </span>
                      );
                    case 'cancelled':
                      return (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[11px] font-bold uppercase">
                          Cancelled
                        </span>
                      );
                    case 'expired':
                      return (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-900/30 text-amber-400 border border-amber-800/40 text-[11px] font-bold uppercase">
                          Expired
                        </span>
                      );
                    case 'refunded':
                      return (
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[11px] font-bold uppercase">
                          Refunded
                        </span>
                      );
                    case 'awaiting_payment':
                    case 'pending':
                    default:
                      return (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold uppercase">
                          Awaiting Payment
                        </span>
                      );
                  }
                })()}
              </div>
            </div>

            {/* Paystack Actions */}
            {completedOrder.order?.status !== 'paid' && completedOrder.paymentIntent?.paymentUrl && (
              <div className="mb-6 space-y-3">
                <a
                  href={completedOrder.paymentIntent.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all"
                >
                  <span>Proceed to Paystack Secure Checkout</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                {completedOrder.paymentIntent?.reference && (
                  <button
                    onClick={() => handleVerifyReference(completedOrder.paymentIntent.reference)}
                    disabled={isVerifying}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        <span>Verifying with Paystack...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>I Have Completed Payment — Verify Status</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {completedOrder.paymentIntent?.transferInstructions && (
              <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 text-left mb-6">
                <div className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                  Payment Instructions:
                </div>
                <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                  {completedOrder.paymentIntent.transferInstructions}
                </p>
              </div>
            )}

            {/* WhatsApp Confirmation CTA */}
            {contact.whatsappUrl && (
              <div className="pt-4 border-t border-slate-800">
                <a
                  href={`${contact.whatsappUrl}?text=${encodeURIComponent(
                    `Hi ApexGrowth, I just submitted Order #${completedOrder.order?.orderNumber} for "${completedOrder.order?.packageName}" ($${completedOrder.order?.amountUsd} USD).`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-emerald-400 font-semibold text-xs transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Notify Production Team on WhatsApp</span>
                </a>
              </div>
            )}
          </div>
        ) : (
          /* Checkout Form View */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Form */}
            <div className="lg:col-span-7 space-y-6">
              <div className="glass-panel rounded-3xl p-8 border border-slate-800/90 shadow-xl">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Secure Order Intent Formulation</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold font-display text-white mb-6">
                  Finalize Your Project Order
                </h1>

                {errorMessage && (
                  <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleCreateOrderIntent} className="space-y-5">
                  {/* Package Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Selected Growth Package
                    </label>
                    <select
                      value={selectedPkgId}
                      onChange={(e) => setSelectedPkgId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                    >
                      {pricing.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} (${pkg.promoPriceUsd || pkg.priceUsd} USD)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Customer Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Alexander Cole"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Customer Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Business / Work Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="alex@company.com"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      WhatsApp Number (Optional, for instant sprint updates)
                    </label>
                    <input
                      type="tel"
                      value={customerWhatsapp}
                      onChange={(e) => setCustomerWhatsapp(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Payment Channel Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Preferred USD Payment Channel
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {paymentMethods.map((pm) => {
                        const isSelected = pm.id === activePaymentMethod?.id;
                        return (
                          <button
                            type="button"
                            key={pm.id}
                            onClick={() => setSelectedPaymentMethodId(pm.id)}
                            className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                              isSelected
                                ? 'bg-emerald-500/10 border-emerald-500 text-white'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              {getProviderIcon(pm.provider)}
                              {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white">{pm.displayName}</div>
                              <div className="text-[10px] text-slate-400 capitalize">{pm.currency}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Project Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Project Notes / URL (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder="Briefly state your current offer, target market, or website link..."
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Confirm &amp; Generate Order Intent</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-5 space-y-6">
              <div className="glass-panel rounded-3xl p-8 border border-slate-800/90 shadow-xl">
                <h3 className="text-lg font-bold font-display text-white mb-4">
                  Package Summary
                </h3>

                {activePackage && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                      <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                        Selected Service
                      </div>
                      <div className="text-lg font-bold text-white mb-1">
                        {activePackage.name}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed mb-3">
                        {activePackage.description}
                      </p>
                      <div className="text-2xl font-extrabold text-white font-mono">
                        ${activePackage.promoPriceUsd || activePackage.priceUsd}{' '}
                        <span className="text-xs font-normal text-slate-400 font-sans">USD</span>
                      </div>
                    </div>

                    {/* Features */}
                    <div>
                      <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                        Scope Included:
                      </div>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {activePackage.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Production timeline */}
                    <div className="pt-4 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Delivery Turnaround: 48–72 Hours</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Revisions: 2 Full Rounds Included</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
