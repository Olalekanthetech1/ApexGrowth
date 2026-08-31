import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Coins,
  Building2,
  Lock,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { PricingPackage, PaymentMethod } from '../../types/index';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackage: PricingPackage | null;
  packages: PricingPackage[];
  paymentMethods: PaymentMethod[];
}

export function CheckoutModal({
  isOpen,
  onClose,
  selectedPackage,
  packages,
  paymentMethods,
}: CheckoutModalProps) {
  const [currentPkg, setCurrentPkg] = useState<PricingPackage | null>(selectedPackage);
  const [provider, setProvider] = useState<'paystack' | 'bybit' | 'grey'>('paystack');

  // Customer Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [notes, setNotes] = useState('');

  // Submission / Result state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    order: any;
    paymentIntent: any;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync state when props change
  React.useEffect(() => {
    if (selectedPackage) {
      setCurrentPkg(selectedPackage);
    } else if (packages.length > 0 && !currentPkg) {
      setCurrentPkg(packages[0]);
    }
  }, [selectedPackage, packages]);

  if (!isOpen) return null;

  const pkg = currentPkg || packages[0];
  const priceDisplay = pkg ? (pkg.promoPriceUsd || pkg.priceUsd) : '0';

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Please provide your name and email address.');
      return;
    }

    if (!pkg?.id) {
      setError('Please select a valid package before proceeding to checkout.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const selectedPm = paymentMethods.find((pm) => pm.provider === provider && pm.active);

      const res = await fetch('/api/checkout/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: pkg.id,
          packageName: pkg.name,
          customerName: name.trim(),
          customerEmail: email.trim().toLowerCase(),
          customerWhatsapp: whatsapp.trim() || undefined,
          paymentMethodId: selectedPm?.id,
          paymentProvider: provider,
          customerNotes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.details?.[0]?.message || 'Checkout failed');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during checkout.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-display">Secure USD Checkout</h3>
              <p className="text-xs text-slate-400">Direct-response growth packages &amp; retainers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {result ? (
          /* Order & Payment Intent Confirmation State */
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto mb-3 text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-bold text-white font-display">Order Initialized</h4>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Order <span className="font-mono text-emerald-400 font-bold">{result.order.orderNumber}</span> created.
              </p>
            </div>

            {/* Order details summary */}
            <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/80">
                <span className="text-slate-400">Selected Package:</span>
                <span className="font-bold text-white">{result.order.packageName}</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/80">
                <span className="text-slate-400">Amount to Pay:</span>
                <span className="font-mono font-extrabold text-emerald-400 text-base sm:text-lg">
                  ${result.order.amountUsd} USD
                </span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/80">
                <span className="text-slate-400">Payment Reference:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white">{result.paymentIntent.reference}</span>
                  <button
                    onClick={() => handleCopy(result.paymentIntent.reference)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Copy reference"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Status:</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                  Awaiting Payment / Confirmation
                </span>
              </div>
            </div>

            {/* Provider specific next steps */}
            {result.paymentIntent.provider === 'paystack' && (
              <div className="bg-slate-900/90 rounded-2xl p-5 border border-emerald-500/30 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">Complete USD Card Payment</h5>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Click the button below to proceed to our official Paystack USD hosted checkout portal.
                    </p>
                  </div>
                </div>

                {result.paymentIntent.paymentUrl && (
                  <a
                    href={result.paymentIntent.paymentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <span>Proceed to Paystack Checkout (${result.order.amountUsd} USD)</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}

            {result.paymentIntent.provider === 'bybit' && (
              <div className="bg-slate-900/90 rounded-2xl p-5 border border-emerald-500/30 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">Bybit Pay / USDT Crypto Deposit</h5>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Send ${result.order.amountUsd} USDT to the address below or checkout via Bybit Pay.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Network:</span>
                    <span className="font-bold text-emerald-400">{result.paymentIntent.cryptoNetwork || 'USDT (TRC20)'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Deposit Address:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white text-[11px] truncate max-w-[200px] sm:max-w-[260px]">
                        {result.paymentIntent.cryptoAddress}
                      </span>
                      <button
                        onClick={() => handleCopy(result.paymentIntent.cryptoAddress || '')}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {result.paymentIntent.paymentUrl && (
                  <a
                    href={result.paymentIntent.paymentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
                  >
                    <span>Open Bybit Merchant Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}

            {result.paymentIntent.provider === 'grey' && (
              <div className="bg-slate-900/90 rounded-2xl p-5 border border-emerald-500/30 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">Grey International Bank Transfer (USD)</h5>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Initiate wire or ACH transfer using the exact details below. Include your payment reference in the transfer memo.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                  {result.paymentIntent.transferInstructions}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <p className="text-[11px] text-slate-500">
                Payment confirmation is verified by our billing administration team upon settlement.
              </p>
              <button
                onClick={handleReset}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          /* Form State */
          <form onSubmit={handleCheckout} className="p-6 sm:p-8 space-y-6">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Package selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Selected Package
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {packages.map((p) => {
                  const isSelected = currentPkg?.id === p.id;
                  const price = p.promoPriceUsd || p.priceUsd;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setCurrentPkg(p)}
                      className={`p-3 rounded-xl text-left border transition-all ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold truncate">{p.name}</div>
                      <div className="text-sm font-extrabold text-emerald-400 font-mono mt-1">
                        ${price} <span className="text-[10px] text-slate-400 font-normal">USD</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Select USD Payment Channel
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setProvider('paystack')}
                  className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                    provider === 'paystack'
                      ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <CreditCard className={`w-5 h-5 ${provider === 'paystack' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <div>
                    <div className="text-xs font-bold">Paystack</div>
                    <div className="text-[10px] text-slate-400">USD Card</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider('bybit')}
                  className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                    provider === 'bybit'
                      ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Coins className={`w-5 h-5 ${provider === 'bybit' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <div>
                    <div className="text-xs font-bold">Bybit Pay</div>
                    <div className="text-[10px] text-slate-400">Crypto (USDT)</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider('grey')}
                  className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                    provider === 'grey'
                      ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Building2 className={`w-5 h-5 ${provider === 'grey' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <div>
                    <div className="text-xs font-bold">Grey</div>
                    <div className="text-[10px] text-slate-400">USD Bank Wire</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Customer Information Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Full Name / Company <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-600 focus:border-emerald-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="alex@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-600 focus:border-emerald-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  WhatsApp Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 019-2834"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-600 focus:border-emerald-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Project Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Any specific goal or niche"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-600 focus:border-emerald-500 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Total and Submit */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Total Investment</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                  ${priceDisplay} <span className="text-xs text-emerald-400 font-sans font-bold">USD</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Intent...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
