import React, { useState } from 'react';
import {
  CreditCard,
  Building2,
  Coins,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface CheckoutSimulationDemoProps {
  productTitle?: string;
  productPrice?: number;
}

export function CheckoutSimulationDemo({
  productTitle = 'Conversion Launchpad Demo',
  productPrice = 249,
}: CheckoutSimulationDemoProps) {
  const [activeTab, setActiveTab] = useState<'paystack' | 'crypto'>('paystack');
  const [paystackSubTab, setPaystackSubTab] = useState<'card' | 'bank'>('card');
  const [cryptoNetwork, setCryptoNetwork] = useState<'TRC20' | 'ERC20' | 'BEP20'>('TRC20');

  // Simulated form inputs
  const [cardNumber, setCardNumber] = useState('4084 1234 5678 9010');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');

  // Simulation states
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSimulatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
    }, 1200);
  };

  const handleReset = () => {
    setIsSuccess(false);
    setIsProcessing(false);
  };

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-slate-800/90 shadow-2xl">
      {/* Top Banner Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-800/80 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Demo B</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
            Interactive Checkout Simulation
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Experience our ultra-low friction checkout flows across card, bank, and digital assets.
          </p>
        </div>

        {/* DEMO BADGE */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-extrabold uppercase tracking-wide">
          <AlertCircle className="w-4 h-4" />
          <span>DEMO — NO REAL PAYMENT</span>
        </div>
      </div>

      {/* If Simulated Success */}
      {isSuccess ? (
        <div className="bg-slate-900/95 rounded-2xl p-8 border border-emerald-500/50 text-center animate-in zoom-in-95 duration-300 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto mb-4 text-emerald-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h4 className="text-2xl font-bold text-white mb-2 font-display">
            Demo payment successful
          </h4>

          <p className="text-sm font-semibold text-emerald-400 mb-4">
            This was a simulation. No money was charged.
          </p>

          <div className="bg-slate-950 p-4 rounded-xl text-left border border-slate-800 space-y-2 text-xs text-slate-300 mb-6">
            <div className="flex justify-between">
              <span className="text-slate-400">Simulated Item:</span>
              <span className="font-semibold text-white">{productTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Simulated Amount:</span>
              <span className="font-semibold text-emerald-400">${productPrice}.00 USD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Simulated Gateway:</span>
              <span className="font-semibold text-white">
                {activeTab === 'paystack' ? `Paystack (${paystackSubTab.toUpperCase()})` : `Crypto (${cryptoNetwork})`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Simulated Ref:</span>
              <span className="font-mono text-slate-400">APEX-DEMO-{Date.now().toString().slice(-6)}</span>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Demo Checkout</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Order Summary on Left */}
          <div className="lg:col-span-5 bg-slate-950/80 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Order Summary</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">Demo SKU</span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-sm font-bold text-white">{productTitle}</h5>
                    <p className="text-xs text-slate-400">Direct-Response Funnel &amp; Architecture</p>
                  </div>
                  <span className="font-bold text-white font-mono">${productPrice}.00</span>
                </div>

                <div className="flex justify-between text-xs text-slate-400">
                  <span>Setup &amp; Optimization Fee:</span>
                  <span className="text-emerald-400">$0.00 (Included)</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>2 Revisions Included:</span>
                  <span className="text-emerald-400">Free</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-base font-bold text-white">Order Total:</span>
                <span className="text-2xl font-extrabold text-emerald-400 font-mono">${productPrice}.00 USD</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Simulated 256-Bit SSL Encrypted Sandbox</span>
              </div>
            </div>
          </div>

          {/* Checkout Controls on Right */}
          <div className="lg:col-span-7 flex flex-col">
            {/* Primary Payment Mode Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-950 rounded-xl border border-slate-800 mb-6">
              <button
                type="button"
                id="demo-tab-paystack"
                onClick={() => setActiveTab('paystack')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'paystack'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Paystack Demo</span>
              </button>

              <button
                type="button"
                id="demo-tab-crypto"
                onClick={() => setActiveTab('crypto')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'crypto'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Coins className="w-4 h-4" />
                <span>Crypto Demo (USDT)</span>
              </button>
            </div>

            {/* Paystack Demo Panel */}
            {activeTab === 'paystack' && (
              <form onSubmit={handleSimulatePayment} className="space-y-4">
                {/* Sub tabs: Card vs Bank */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaystackSubTab('card')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                      paystackSubTab === 'card'
                        ? 'bg-slate-800 border-emerald-500 text-emerald-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    Card Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaystackSubTab('bank')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                      paystackSubTab === 'bank'
                        ? 'bg-slate-800 border-emerald-500 text-emerald-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    Bank Transfer
                  </button>
                </div>

                {paystackSubTab === 'card' ? (
                  <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Simulated Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Expiry Date</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">CVV</label>
                        <input
                          type="text"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      <span>Simulated USD Bank Wire Gateway</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Generates unique payment reference for automated USD ACH / International Wire matching.
                    </p>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400">
                      Bank: Lead Bank / Grey USD Partner (Demo)<br />
                      Routing / ABA: 101000695 | Account: 9830219482
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  id="simulate-payment-btn"
                  disabled={isProcessing}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Simulating Secure Gateway Handshake...</span>
                    </>
                  ) : (
                    <>
                      <span>Simulate Payment (${productPrice}.00 USD)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Crypto Demo Panel */}
            {activeTab === 'crypto' && (
              <form onSubmit={handleSimulatePayment} className="space-y-4">
                <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <label className="block text-xs font-medium text-slate-300">Select Blockchain Network for USDT</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['TRC20', 'ERC20', 'BEP20'] as const).map((net) => (
                      <button
                        key={net}
                        type="button"
                        onClick={() => setCryptoNetwork(net)}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                          cryptoNetwork === net
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        {net}
                      </button>
                    ))}
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">USDT Expected:</span>
                      <span className="font-mono font-bold text-emerald-400">249.00 USDT</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Simulated Deposit Wallet:</span>
                      <span className="font-mono text-[10px] text-slate-300 truncate max-w-[180px]">
                        TX9aR8...7qK2L9DemoAddress
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Simulating On-Chain Confirmation...</span>
                    </>
                  ) : (
                    <>
                      <span>Simulate Payment (249 USDT via {cryptoNetwork})</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Safety Notice Footer */}
      <div className="mt-6 text-center text-xs text-slate-400 pt-4 border-t border-slate-800/60">
        🔒 ApexGrowth Digital incorporates sandbox validation to test conversions before going live with merchant keys.
      </div>
    </div>
  );
}
