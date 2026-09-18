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

  // Active sub-panels and state within accordions
  const [bankCurrencyTab, setBankCurrencyTab] = useState<'USD' | 'GBP' | 'EUR'>('USD');
  const [wireReference, setWireReference] = useState('');
  const [cryptoCoin, setCryptoCoin] = useState<'USDT' | 'BTC' | 'ETH' | 'USDC'>('USDT');
  const [cryptoNetwork, setCryptoNetwork] = useState<'TRC20' | 'ERC20' | 'BEP20' | 'SOL' | 'Bitcoin'>('TRC20');
  const [cryptoTxHash, setCryptoTxHash] = useState('');
  const [verifyRefInput, setVerifyRefInput] = useState('');
  const [isVerifyInputOpen, setIsVerifyInputOpen] = useState(false);

  // Countdown timer for Crypto (60 minutes)
  const [timeLeft, setTimeLeft] = useState<number>(3600);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ status: string; message?: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [sessionOrderCode] = useState(() => `APX-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`);

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

  // Handle URL Paystack Reference triggers
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('reference') || params.get('trxref');
    if (ref) {
      handleVerifyReference(ref);
    }
  }, []);

  // Crypto countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 3600; // Reset or stop
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const activePackage = pricing.find((p) => p.id === selectedPkgId) || pricing[0];
  const activePaymentMethod = paymentMethods.find((pm) => pm.id === selectedPaymentMethodId) || paymentMethods[0];

  const rawPrice = activePackage ? (activePackage.promoPriceUsd || activePackage.priceUsd) : '0';
  const payablePrice = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0;

  // Crypto conversion rates
  const getCryptoAmount = (usdInput: number | string, coin: string) => {
    const usd = typeof usdInput === 'number' ? usdInput : parseFloat(String(usdInput).replace(/[^0-9.]/g, '')) || 0;
    switch (coin) {
      case 'USDT':
      case 'USDC':
        return usd.toFixed(2);
      case 'BTC':
        return (usd / 59102).toFixed(6);
      case 'ETH':
        return (usd / 2512).toFixed(5);
      default:
        return usd.toFixed(2);
    }
  };

  // Real Database-driven Bank Wire Details
  const getBankWireDetails = () => {
    const greyMethod = paymentMethods.find((pm) => pm.provider === 'grey') || activePaymentMethod;
    const customConfig = greyMethod?.configMetadata;
    const key = bankCurrencyTab.toLowerCase();
    
    if (customConfig && customConfig[key]) {
      const data = customConfig[key];
      const hasAccount = data.accountNumber && data.accountNumber.trim() !== '';
      const hasBeneficiary = data.beneficiary && data.beneficiary.trim() !== '';
      const isEnabled = customConfig[`${key}Enabled`] !== false;
      if ((hasAccount || hasBeneficiary) && isEnabled) {
        return {
          isConfigured: true,
          beneficiary: data.beneficiary || '',
          bankName: data.bankName || '',
          accountNumber: data.accountNumber || '',
          accountType: data.accountType || (bankCurrencyTab === 'USD' ? 'Checking' : 'Business Account'),
          routingNumber: data.routingNumber || '',
          bankAddress: data.bankAddress || '',
        };
      }
    }

    return {
      isConfigured: false,
      beneficiary: '',
      bankName: '',
      accountNumber: '',
      accountType: '',
      routingNumber: '',
      bankAddress: '',
    };
  };

  const getPaystackConfig = () => {
    const paystackMethod = paymentMethods.find((pm) => pm.provider === 'paystack');
    const metadata = (paystackMethod?.configMetadata as any) || {};
    const hasKeys = (metadata.publicKey && metadata.publicKey.trim() !== '') || (metadata.secretKey && metadata.secretKey.trim() !== '');
    return {
      isConfigured: !!hasKeys,
      isActive: paystackMethod ? paystackMethod.active !== false : true,
      publicKey: metadata.publicKey || '',
    };
  };

  const getCryptoWalletAddress = () => {
    const customConfig = activePaymentMethod?.configMetadata;
    if (!customConfig || !customConfig.addresses) return '';
    
    const coinKey = cryptoCoin.toLowerCase();
    const configItem = customConfig.addresses[coinKey];
    if (configItem) {
      const addr = typeof configItem === 'object' ? configItem.address : configItem;
      if (addr && addr.trim() !== '') {
        return addr.trim();
      }
    }
    return '';
  };

  const getCryptoNetworkLabel = () => {
    const customConfig = activePaymentMethod?.configMetadata;
    if (!customConfig || !customConfig.addresses) return 'Not Configured';
    const coinKey = cryptoCoin.toLowerCase();
    const configItem = customConfig.addresses[coinKey];
    if (configItem && typeof configItem === 'object' && configItem.network) {
      return configItem.network;
    }
    if (cryptoCoin === 'BTC') return 'Bitcoin';
    if (cryptoCoin === 'ETH') return 'ERC20 (Ethereum)';
    return 'TRC20';
  };

  // Helper payment submissions
  const handleCheckoutSubmit = async (e: React.FormEvent, customRef?: string) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!customerName.trim()) {
      setErrorMessage('Please provide your full name in the Billing Info section.');
      // Scroll smoothly to top
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      setErrorMessage('Please provide a valid email address in the Billing Info section.');
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }
    if (!activePackage) {
      setErrorMessage('Please select a growth package.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const referenceToSave = customRef || '';
      const notes = [
        customerNotes.trim(),
        referenceToSave ? `Payment Ref: ${referenceToSave}` : '',
        activePaymentMethod ? `Channel: ${activePaymentMethod.displayName}` : ''
      ].filter(Boolean).join(' | ');

      const res = await api.createPaymentIntent({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        customerWhatsapp: customerWhatsapp.trim() || undefined,
        packageId: activePackage.id,
        packageName: activePackage.name,
        paymentMethodId: activePaymentMethod?.id,
        paymentProvider: (activePaymentMethod?.provider || 'paystack') as any,
        customerNotes: notes || undefined,
      });

      if (res && res.order) {
        // If it is a Cards / Paystack payment, initiate direct redirect automatically!
        if (activePaymentMethod?.provider === 'paystack' && res.paymentIntent?.paymentUrl) {
          window.location.href = res.paymentIntent.paymentUrl;
          return;
        }
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

  const handleVerifyReference = async (ref: string) => {
    try {
      setIsVerifying(true);
      setErrorMessage('');
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
      setErrorMessage(err.message || 'Reference verification failed. Please check the code and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="pt-24 pb-20 md:pt-32 md:pb-28 min-h-screen bg-slate-950/40">
      {/* Background radial glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-indigo-500/5 blur-[160px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <button
          id="btn-back-pricing"
          onClick={() => onNavigate('/pricing')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-emerald-400 mb-8 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Pricing Packages</span>
        </button>

        {completedOrder ? (
          /* Order Confirmation Success Screen */
          <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-emerald-500/40 text-center max-w-2xl mx-auto shadow-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h1 className="text-3xl font-bold font-display text-white mb-2 tracking-tight">
              {completedOrder.order?.status === 'paid' ? 'Payment Verified & Confirmed' : 'Order Intent Initialized'}
            </h1>
            <p className="text-sm text-slate-300 mb-8 max-w-md mx-auto leading-relaxed">
              {completedOrder.order?.status === 'paid' ? (
                <span>
                  Thank you! Your payment for <strong>{completedOrder.order?.packageName}</strong> (${completedOrder.order?.amountUsd} USD) has been verified. Our engineering and marketing leads have been notified.
                </span>
              ) : (
                <span>
                  Your order for <strong>{completedOrder.order?.packageName}</strong> (${completedOrder.order?.amountUsd} USD) has been registered in our system. Please complete the transfer steps.
                </span>
              )}
            </p>

            {/* Order Details Card */}
            <div className="bg-slate-950/80 rounded-2xl p-6 border border-slate-900 text-left mb-8 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Order Reference</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-white">
                    {completedOrder.order?.orderNumber || completedOrder.paymentIntent?.reference}
                  </span>
                  <button
                    id="btn-copy-order-ref"
                    onClick={() =>
                      copyToClipboard(
                        completedOrder.order?.orderNumber || completedOrder.paymentIntent?.reference || '',
                        'order-ref'
                      )
                    }
                    className="p-1 rounded hover:bg-slate-900 text-slate-400 hover:text-white transition-colors"
                    title="Copy Reference"
                  >
                    {copiedField === 'order-ref' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <span className="text-xs text-slate-400">Total Investment</span>
                <span className="font-mono text-lg font-extrabold text-emerald-400">
                  ${completedOrder.order?.amountUsd} USD
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <span className="text-xs text-slate-400">Selected Provider</span>
                <span className="text-xs font-bold text-white uppercase tracking-wider">
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
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold uppercase flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Paid &amp; Verified</span>
                        </span>
                      );
                    case 'processing':
                      return (
                        <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-extrabold uppercase flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 animate-pulse" />
                          <span>Verifying Payment</span>
                        </span>
                      );
                    case 'failed':
                      return (
                        <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-extrabold uppercase flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Payment Failed</span>
                        </span>
                      );
                    default:
                      return (
                        <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-extrabold uppercase">
                          Awaiting Payment
                        </span>
                      );
                  }
                })()}
              </div>
            </div>

            {/* Direct Redirect actions */}
            {completedOrder.order?.status !== 'paid' && completedOrder.paymentIntent?.paymentUrl && (
              <div className="mb-6 space-y-3">
                <a
                  id="link-paystack-direct"
                  href={completedOrder.paymentIntent.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all"
                >
                  <span>Proceed to Secure Checkout</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                {completedOrder.paymentIntent?.reference && (
                  <button
                    id="btn-manual-verify-checkout"
                    onClick={() => handleVerifyReference(completedOrder.paymentIntent.reference)}
                    disabled={isVerifying}
                    className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        <span>Verifying Reference with Paystack...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>I Have Completed Payment — Verify Now</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* WhatsApp Confirmation CTA */}
            {contact.whatsappUrl && (
              <div className="pt-6 border-t border-slate-900">
                <a
                  id="link-whatsapp-notify"
                  href={`${contact.whatsappUrl}?text=${encodeURIComponent(
                    `Hi ApexGrowth, I just submitted Order #${completedOrder.order?.orderNumber} for "${completedOrder.order?.packageName}" ($${completedOrder.order?.amountUsd} USD).`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 hover:text-emerald-300 font-bold text-xs uppercase tracking-wider transition-all shadow-md"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Notify Production Team on WhatsApp</span>
                </a>
              </div>
            )}
          </div>
        ) : (
          /* Interactive Layout Upgraded */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Contact and Dynamic Accordion */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* STEP 1: Contact Information Header and Form */}
              <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-900 shadow-xl">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Secure Project Order Initialization</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold font-display text-white mb-2">
                  Finalize Your Project Order
                </h1>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  Provide your project contact information below. Then select your preferred payment channel to access details.
                </p>

                {errorMessage && (
                  <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-pulse">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Customer Name */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Full Name *
                    </label>
                    <input
                      id="input-customer-name"
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Alexander Cole"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Customer Email */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Business / Work Email *
                    </label>
                    <input
                      id="input-customer-email"
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="alex@company.com"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* WhatsApp */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                      WhatsApp Number (Optional, for instant production sprint updates)
                    </label>
                    <input
                      id="input-customer-whatsapp"
                      type="tel"
                      value={customerWhatsapp}
                      onChange={(e) => setCustomerWhatsapp(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Customer Notes */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Project Details / Website URL (Optional)
                    </label>
                    <textarea
                      id="textarea-customer-notes"
                      rows={2}
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder="Briefly state your current offer, target market, or share a website link..."
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* STEP 2: Select Payment Method Accordions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-lg font-bold text-white tracking-tight">Select Payment Method</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                    Checkout Ready
                  </span>
                </div>

                {/* --- 1. CARDS / PAYSTACK ACCORDION --- */}
                {(() => {
                  const method = paymentMethods.find((pm) => pm.provider === 'paystack') || paymentMethods[0];
                  const isSelected = selectedPaymentMethodId === method?.id;
                  const paystackConfig = getPaystackConfig();
                  
                  return (
                    <div 
                      id="card-acc-paystack"
                      className={`glass-panel rounded-2xl overflow-hidden border transition-all duration-300 ${
                        isSelected 
                          ? 'border-emerald-500/40 bg-slate-900/40 shadow-xl' 
                          : 'border-slate-900/90 bg-slate-950/20 hover:border-slate-800/80 hover:bg-slate-900/10'
                      }`}
                    >
                      {/* Accordion Trigger */}
                      <button
                        id="btn-select-paystack"
                        type="button"
                        onClick={() => setSelectedPaymentMethodId(method?.id)}
                        className="w-full p-5 flex items-center justify-between text-left focus:outline-none"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-900/90 flex items-center justify-center border border-slate-800 shadow-md">
                            <CreditCard className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white">Cards / Paystack</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Credit / Debit Cards (Visa, Mastercard, Amex, Apple Pay)</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />}
                        </div>
                      </button>

                      {/* Expanded Panel */}
                      {isSelected && (
                        <div className="p-6 border-t border-slate-900 bg-slate-950/40 space-y-6 animate-fade-in">
                          {!paystackConfig.isConfigured ? (
                            <div className="p-5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300 space-y-2 text-center sm:text-left">
                              <div className="flex items-center gap-2 font-bold text-amber-400 justify-center sm:justify-start">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>Paystack Gateway Configuration Required</span>
                              </div>
                              <p className="leading-relaxed">
                                The merchant has not configured their Paystack API keys yet in the Admin Dashboard.
                              </p>
                              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                                💡 <strong>Admin Checklist:</strong> Go to Admin Dashboard &gt; Payment Methods &gt; Paystack Gateway to configure your Public Key and Secret Key.
                              </p>
                            </div>
                          ) : (
                            <>
                              {/* Inside Blue Banner */}
                              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-slate-300 flex items-start gap-3">
                                <CreditCard className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold text-white block mb-0.5">Credit / Debit Card &amp; Apple Pay</span>
                                  Pay securely with any Visa, Mastercard, American Express, Apple Pay, or regional Bank Transfer options instantly via Paystack.
                                </div>
                              </div>

                              {/* Line breakdown */}
                              <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 space-y-2.5">
                                <div className="flex justify-between text-xs text-slate-400">
                                  <span>Package Price:</span>
                                  <span className="font-mono text-white font-bold">${payablePrice} USD</span>
                                </div>
                                <div className="flex justify-between text-xs border-t border-slate-900/60 pt-2.5">
                                  <span className="font-bold text-slate-300">Payable Total:</span>
                                  <span className="font-mono text-base font-extrabold text-emerald-400">${payablePrice} USD</span>
                                </div>
                              </div>

                              {/* Trigger pay button */}
                              <button
                                id="btn-paystack-submit"
                                onClick={(e) => handleCheckoutSubmit(e)}
                                disabled={isSubmitting}
                                className="w-full py-4 rounded-xl bg-[#06b6d4] hover:bg-[#0891b2] text-slate-950 font-extrabold text-sm shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
                              >
                                {isSubmitting ? (
                                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <CreditCard className="w-4 h-4" />
                                    <span>Pay ${payablePrice} with Card</span>
                                  </>
                                )}
                              </button>
                            </>
                          )}

                          {/* Already Paid Toggle */}
                          <div className="border-t border-slate-900/80 pt-4">
                            <button
                              id="btn-toggle-verify-input"
                              type="button"
                              onClick={() => setIsVerifyInputOpen(!isVerifyInputOpen)}
                              className="text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors flex items-center justify-between w-full"
                            >
                              <span>Already paid or have a Paystack Transaction Reference?</span>
                              <span className="text-[10px] text-slate-500">{isVerifyInputOpen ? 'Verify Reference ▲' : 'Verify Reference ▼'}</span>
                            </button>

                            {isVerifyInputOpen && (
                              <div className="mt-3 flex gap-2 animate-fade-in">
                                <input
                                  id="input-verify-ref"
                                  type="text"
                                  value={verifyRefInput}
                                  onChange={(e) => setVerifyRefInput(e.target.value)}
                                  placeholder="e.g. PSTK-74128940"
                                  className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                                />
                                <button
                                  id="btn-verify-ref-action"
                                  type="button"
                                  onClick={() => handleVerifyReference(verifyRefInput)}
                                  disabled={isVerifying || !verifyRefInput.trim()}
                                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-40"
                                >
                                  {isVerifying ? 'Verifying...' : 'Verify'}
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Security seals footer */}
                          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 pt-2 border-t border-slate-900/60">
                            <Lock className="w-3.5 h-3.5 text-slate-600" />
                            <span>PCI-DSS Level 1 Certified • 256-Bit SSL  |  VISA • MASTERCARD • VERVE • AMEX • APPLE PAY</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}


                {/* --- 2. CRYPTO PAY ACCORDION --- */}
                {(() => {
                  const method = paymentMethods.find((pm) => pm.provider === 'bybit') || paymentMethods.find((pm) => pm.provider === 'crypto');
                  const isSelected = selectedPaymentMethodId === method?.id;

                  return (
                    <div 
                      id="card-acc-crypto"
                      className={`glass-panel rounded-2xl overflow-hidden border transition-all duration-300 ${
                        isSelected 
                          ? 'border-emerald-500/40 bg-slate-900/40 shadow-xl' 
                          : 'border-slate-900/90 bg-slate-950/20 hover:border-slate-800/80 hover:bg-slate-900/10'
                      }`}
                    >
                      {/* Accordion Trigger */}
                      <button
                        id="btn-select-crypto"
                        type="button"
                        onClick={() => setSelectedPaymentMethodId(method?.id || 'crypto')}
                        className="w-full p-5 flex items-center justify-between text-left focus:outline-none"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-900/90 flex items-center justify-center border border-slate-800 shadow-md">
                            <Coins className="w-5 h-5 text-indigo-400" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white">Crypto Pay</h3>
                            <p className="text-xs text-slate-400 mt-0.5">USDT, BTC, ETH &amp; more</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />}
                        </div>
                      </button>

                      {/* Expanded Panel */}
                      {isSelected && (
                        <div className="p-6 border-t border-slate-900 bg-slate-950/40 space-y-6 animate-fade-in">
                          {/* Banner Header */}
                          <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-xs text-slate-300 flex items-start gap-3">
                            <Coins className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                            <div className="w-full">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-white uppercase tracking-wider text-[10px]">Bybit Multi-Currency Crypto Gateway</span>
                                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold">Auto-Verified</span>
                              </div>
                              Select your preferred Cryptocurrency and Network below. Payment will be automatically queried and verified via deposit records upon transfer.
                            </div>
                          </div>

                          {/* 1. Coin selection grid */}
                          <div>
                            <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                              1. Select Cryptocurrency
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {(['USDT', 'USDC', 'BTC', 'ETH'] as const).map((coin) => {
                                const activeCoin = cryptoCoin === coin;
                                const equivalent = getCryptoAmount(payablePrice, coin);
                                return (
                                  <button
                                    id={`btn-crypto-coin-${coin.toLowerCase()}`}
                                    type="button"
                                    key={coin}
                                    onClick={() => {
                                      setCryptoCoin(coin);
                                    }}
                                    className={`p-2.5 rounded-xl border text-center transition-all ${
                                      activeCoin
                                        ? 'bg-indigo-500/10 border-indigo-500 text-white shadow-md'
                                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-800 hover:text-slate-300'
                                    }`}
                                  >
                                    <div className="text-xs font-black">{coin}</div>
                                    <div className="text-[9px] text-slate-400 font-medium mt-0.5 font-mono">1 {coin} ≈ ${(payablePrice / parseFloat(equivalent)).toLocaleString(undefined, {maximumFractionDigits: 1})} USD</div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* 2. Dynamic Network display */}
                          <div>
                            <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                              2. Configured Transfer Network
                            </div>
                            <div className="inline-flex px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-xs font-bold text-white items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{getCryptoNetworkLabel()}</span>
                            </div>
                          </div>

                          {/* Active deposit panel */}
                          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-900 space-y-5">
                            {!getCryptoWalletAddress() ? (
                              <div className="p-5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300 space-y-2 text-center sm:text-left">
                                <div className="flex items-center gap-2 font-bold text-amber-400 justify-center sm:justify-start">
                                  <AlertCircle className="w-4 h-4 shrink-0" />
                                  <span>Receiving Wallet Address Required</span>
                                </div>
                                <p className="leading-relaxed">
                                  The merchant has not configured their receiving wallet address for <strong>{cryptoCoin}</strong> yet in the Admin Dashboard.
                                </p>
                                <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                                  💡 <strong>Admin Checklist:</strong> Go to Admin Dashboard &gt; Payment Methods &gt; Crypto Settings to configure your recipient address.
                                </p>
                              </div>
                            ) : (
                              <>
                                {/* Session Timer Banner */}
                                <div className="flex items-center justify-between bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-2.5">
                                  <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                                    <span>Payment Deposit Session Active</span>
                                  </span>
                                  <span className="font-mono text-xs font-black text-amber-400">Expires in {formatTime(timeLeft)}</span>
                                </div>

                                {/* QR Code and Address */}
                                <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
                                  <div className="p-3 bg-white rounded-2xl flex items-center justify-center shrink-0 border border-slate-200">
                                    <img
                                      src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(getCryptoWalletAddress())}`}
                                      alt="Deposit Wallet QR Address"
                                      className="w-[120px] h-[120px]"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                  
                                  <div className="flex-1 space-y-4 w-full">
                                    {/* Exact Amount */}
                                    <div>
                                      <span className="text-[10px] text-slate-400 block mb-1 uppercase tracking-wider font-bold">Exact Amount to Send:</span>
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-lg font-black text-white">{getCryptoAmount(payablePrice, cryptoCoin)} {cryptoCoin}</span>
                                        <button
                                          id="btn-copy-crypto-amount"
                                          type="button"
                                          onClick={() => copyToClipboard(getCryptoAmount(payablePrice, cryptoCoin), 'crypto-amount')}
                                          className="p-1 rounded hover:bg-slate-900 text-slate-400 hover:text-white transition-all"
                                          title="Copy Amount"
                                        >
                                          {copiedField === 'crypto-amount' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                      </div>
                                    </div>

                                    {/* Wallet Address */}
                                    <div>
                                      <span className="text-[10px] text-slate-400 block mb-1 uppercase tracking-wider font-bold">Recipient Wallet Address ({getCryptoNetworkLabel()}):</span>
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs text-slate-300 bg-slate-900/60 py-1.5 px-3 rounded-lg border border-slate-800 break-all flex-1">
                                          {getCryptoWalletAddress()}
                                        </span>
                                        <button
                                          id="btn-copy-crypto-addr"
                                          type="button"
                                          onClick={() => copyToClipboard(getCryptoWalletAddress(), 'crypto-address')}
                                          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all"
                                          title="Copy Address"
                                        >
                                          {copiedField === 'crypto-address' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Form Input for TxHash & Final confirmation */}
                          <div className="space-y-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                                Enter Your TxHash / Transaction Reference ID *
                              </label>
                              <input
                                id="input-crypto-txhash"
                                type="text"
                                required
                                value={cryptoTxHash}
                                onChange={(e) => setCryptoTxHash(e.target.value)}
                                placeholder="e.g. f8317a26c8... (Paste your blockchain hash here)"
                                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none transition-colors"
                              />
                            </div>

                            <button
                              id="btn-crypto-submit"
                              onClick={(e) => handleCheckoutSubmit(e, cryptoTxHash)}
                              disabled={isSubmitting || !cryptoTxHash.trim()}
                              className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                            >
                              {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <span>Confirm Crypto Transfer &amp; Submit Order (${payablePrice} USD)</span>
                                  <ArrowRight className="w-4 h-4" />
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}


                {/* --- 3. BANK WIRE ACCORDION --- */}
                {(() => {
                  const method = paymentMethods.find((pm) => pm.provider === 'grey') || paymentMethods.find((pm) => pm.type === 'bank_transfer');
                  const isSelected = selectedPaymentMethodId === method?.id;
                  const bankDetails = getBankWireDetails();

                  return (
                    <div 
                      id="card-acc-bank"
                      className={`glass-panel rounded-2xl overflow-hidden border transition-all duration-300 ${
                        isSelected 
                          ? 'border-emerald-500/40 bg-slate-900/40 shadow-xl' 
                          : 'border-slate-900/90 bg-slate-950/20 hover:border-slate-800/80 hover:bg-slate-900/10'
                      }`}
                    >
                      {/* Accordion Trigger */}
                      <button
                        id="btn-select-bank"
                        type="button"
                        onClick={() => setSelectedPaymentMethodId(method?.id || 'bank')}
                        className="w-full p-5 flex items-center justify-between text-left focus:outline-none"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-900/90 flex items-center justify-center border border-slate-800 shadow-md">
                            <Building2 className="w-5 h-5 text-teal-400" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white">Bank Wire</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Direct Transfer (USD/EUR/GBP)</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />}
                        </div>
                      </button>

                      {/* Expanded Panel */}
                      {isSelected && (
                        <div className="p-6 border-t border-slate-900 bg-slate-950/40 space-y-6 animate-fade-in">
                          {/* Currency switch buttons */}
                          <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-900">
                            {(['USD', 'GBP', 'EUR'] as const).map((curr) => {
                              const activeCurr = bankCurrencyTab === curr;
                              const flag = curr === 'USD' ? '🇺🇸' : curr === 'GBP' ? '🇬🇧' : '🇪🇺';
                              return (
                                <button
                                  id={`btn-bank-curr-${curr.toLowerCase()}`}
                                  type="button"
                                  key={curr}
                                  onClick={() => setBankCurrencyTab(curr)}
                                  className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                    activeCurr
                                      ? 'bg-indigo-600 text-white shadow'
                                      : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  <span>{flag}</span>
                                  <span>{curr}</span>
                                </button>
                              );
                            })}
                          </div>

                          {!bankDetails.isConfigured ? (
                            <div className="p-5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300 space-y-2 text-center sm:text-left">
                              <div className="flex items-center gap-2 font-bold text-amber-400 justify-center sm:justify-start">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>Receiving Bank Details Required ({bankCurrencyTab})</span>
                              </div>
                              <p className="leading-relaxed">
                                The merchant has not configured their <strong>{bankCurrencyTab}</strong> receiving bank account details yet in the Admin Dashboard.
                              </p>
                              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                                💡 <strong>Admin Checklist:</strong> Go to Admin Dashboard &gt; Contact &amp; Bank Settings to configure your {bankCurrencyTab} bank name, account number, and routing information.
                              </p>
                            </div>
                          ) : (
                            <>
                              {/* Banner Header */}
                              <div className="p-4 rounded-xl bg-teal-500/5 border border-teal-500/20 text-xs text-slate-300 flex items-start gap-3">
                                <Building2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                                <div className="w-full">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-white uppercase tracking-wider text-[10px]">Bank Wire Receiving Account Details</span>
                                    <span className="px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[9px] font-bold">USD / GBP / EUR</span>
                                  </div>
                                  Transfer directly to our verified local receiving accounts via ACH, BACS, SEPA, or international wire transfer.
                                </div>
                              </div>

                              {/* Bank details grid rows */}
                              <div className="bg-slate-950 rounded-2xl border border-slate-900 divide-y divide-slate-900 text-xs overflow-hidden">
                                {/* Beneficiary Row */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 gap-1 hover:bg-slate-900/10 transition-colors">
                                  <span className="text-slate-400">Beneficiary Name:</span>
                                  <span className="font-bold text-white uppercase text-right">{bankDetails.beneficiary || 'N/A'}</span>
                                </div>

                                {/* Bank Name Row */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 gap-1 hover:bg-slate-900/10 transition-colors">
                                  <span className="text-slate-400">Bank Name:</span>
                                  <span className="font-bold text-white uppercase text-right">{bankDetails.bankName || 'N/A'}</span>
                                </div>

                                {/* Account Type Row */}
                                {bankDetails.accountType && (
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 gap-1 hover:bg-slate-900/10 transition-colors">
                                    <span className="text-slate-400">Account Type:</span>
                                    <span className="font-bold text-white uppercase text-right">{bankDetails.accountType}</span>
                                  </div>
                                )}

                                {/* Routing Number / Sort Code / BIC */}
                                {bankDetails.routingNumber && (
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 gap-2 hover:bg-slate-900/10 transition-colors">
                                    <span className="text-slate-400">
                                      {bankCurrencyTab === 'USD' ? 'Routing Number (ACH & Wire):' : bankCurrencyTab === 'GBP' ? 'Sort Code:' : 'BIC / SWIFT Code:'}
                                    </span>
                                    <div className="flex items-center gap-2 self-end sm:self-auto">
                                      <span className="font-mono font-bold text-[#38bdf8]">{bankDetails.routingNumber}</span>
                                      <button
                                        id="btn-copy-bank-routing"
                                        type="button"
                                        onClick={() => copyToClipboard(bankDetails.routingNumber, 'bank-routing')}
                                        className="p-1 rounded hover:bg-slate-900 text-slate-500 hover:text-white transition-all"
                                        title="Copy"
                                      >
                                        {copiedField === 'bank-routing' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Account Number / IBAN */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 gap-2 hover:bg-slate-900/10 transition-colors">
                                  <span className="text-slate-400">
                                    {bankCurrencyTab === 'EUR' ? 'IBAN:' : 'Account Number:'}
                                  </span>
                                  <div className="flex items-center gap-2 self-end sm:self-auto">
                                    <span className="font-mono font-extrabold text-emerald-400 text-sm">{bankDetails.accountNumber}</span>
                                    <button
                                      id="btn-copy-bank-account"
                                      type="button"
                                      onClick={() => copyToClipboard(bankDetails.accountNumber, 'bank-account')}
                                      className="p-1 rounded hover:bg-slate-900 text-slate-500 hover:text-white transition-all"
                                      title="Copy"
                                    >
                                      {copiedField === 'bank-account' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                </div>

                                {/* Bank Address Row */}
                                {bankDetails.bankAddress && (
                                  <div className="flex flex-col sm:flex-row sm:items-start justify-between p-3.5 gap-2 hover:bg-slate-900/10 transition-colors">
                                    <span className="text-slate-400 shrink-0">Bank Address:</span>
                                    <div className="flex items-start gap-2 self-end sm:self-auto max-w-xs text-right">
                                      <span className="font-medium text-slate-300 break-words leading-relaxed text-xs">{bankDetails.bankAddress}</span>
                                      <button
                                        id="btn-copy-bank-address"
                                        type="button"
                                        onClick={() => copyToClipboard(bankDetails.bankAddress, 'bank-address')}
                                        className="p-1 rounded hover:bg-slate-900 text-slate-500 hover:text-white transition-all"
                                        title="Copy"
                                      >
                                        {copiedField === 'bank-address' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Payment Reference Code Row */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 gap-2 hover:bg-slate-900/10 transition-colors">
                                  <span className="text-slate-400 font-bold">Payment Reference Code:</span>
                                  <div className="flex items-center gap-2 self-end sm:self-auto">
                                    <span className="font-mono font-black text-amber-400">{sessionOrderCode}</span>
                                    <button
                                      id="btn-copy-bank-ref"
                                      type="button"
                                      onClick={() => copyToClipboard(sessionOrderCode, 'bank-reference')}
                                      className="p-1 rounded hover:bg-slate-900 text-slate-500 hover:text-white transition-all"
                                      title="Copy Code"
                                    >
                                      {copiedField === 'bank-reference' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Reference input & Wire Confirm button */}
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                                    Enter Your Transfer Reference / Transaction ID *
                                  </label>
                                  <input
                                    id="input-bank-ref"
                                    type="text"
                                    required
                                    value={wireReference}
                                    onChange={(e) => setWireReference(e.target.value)}
                                    placeholder="e.g. ACH-9812405 or Wire Ref #"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none transition-colors"
                                  />
                                </div>

                                <button
                                  id="btn-bank-submit"
                                  onClick={(e) => handleCheckoutSubmit(e, wireReference)}
                                  disabled={isSubmitting || !wireReference.trim()}
                                  className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                                >
                                  {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <>
                                      <span>Submit Transfer &amp; Confirm Order (${payablePrice} USD)</span>
                                      <ArrowRight className="w-4 h-4" />
                                    </>
                                  )}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

              </div>
            </div>

            {/* Right Column: Order Package Summary Card */}
            <div className="lg:col-span-4 space-y-6">
              <div className="glass-panel rounded-3xl p-6 border border-slate-900 shadow-xl space-y-6">
                <h3 className="text-lg font-bold font-display text-white tracking-tight">Package Summary</h3>

                {activePackage ? (
                  <div className="space-y-6">
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80">
                      <div className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider mb-1">Selected Plan</div>
                      <div className="text-base font-bold text-white mb-1.5 leading-tight">{activePackage.name}</div>
                      <p className="text-xs text-slate-400 leading-relaxed mb-3">{activePackage.description}</p>
                      
                      {/* Package selector dropdown in summary card */}
                      <div className="mb-4">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Change Package:</label>
                        <select
                          id="select-change-package"
                          value={selectedPkgId}
                          onChange={(e) => setSelectedPkgId(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                        >
                          {pricing.map((pkg) => (
                            <option key={pkg.id} value={pkg.id}>
                              {pkg.name} (${pkg.promoPriceUsd || pkg.priceUsd} USD)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight flex items-baseline gap-1.5">
                        <span>${payablePrice}</span>
                        <span className="text-[11px] font-bold text-slate-500 font-sans uppercase">USD</span>
                      </div>
                    </div>

                    {/* Features checklist */}
                    <div className="space-y-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scope Included:</div>
                      <ul className="space-y-2.5 text-xs text-slate-300">
                        {activePackage.features?.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span className="leading-normal">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Timeline & Revisions */}
                    <div className="pt-4 border-t border-slate-900 space-y-2.5 text-xs text-slate-400">
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-emerald-400" />
                        <span>Delivery Turnaround: 48–72 Hours</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Revisions: 2 Full Rounds Included</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 text-center py-10">
                    No active package selected. Select a plan to continue.
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
