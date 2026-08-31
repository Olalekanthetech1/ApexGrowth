import React, { useState, useEffect } from 'react';
import { CreditCard, Save, CheckCircle2, AlertCircle, Loader2, ToggleLeft, ToggleRight, Key, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/api';
import { PaymentMethod } from '../../types/index';
import { usePublicData } from '../../context/PublicDataContext';

export function PaystackGatewaySettings() {
  const { refreshPublicData } = usePublicData();
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [publicKey, setPublicKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [testMode, setTestMode] = useState(true);
  const [active, setActive] = useState(true);

  useEffect(() => {
    loadPaystackSettings();
  }, []);

  const loadPaystackSettings = async () => {
    try {
      setLoading(true);
      const methods = await api.getPaymentMethods();
      const paystack = methods.find(m => m.provider === 'paystack');
      if (paystack) {
        setMethod(paystack);
        const metadata = paystack.configMetadata || {};
        setPublicKey(metadata.publicKey || '');
        setSecretKey(metadata.secretKey || '');
        setTestMode(metadata.testMode !== false);
        setActive(paystack.active);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load Paystack settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!method) return;
    setSaving(true);

    try {
      const updatedMetadata = {
        publicKey,
        secretKey,
        testMode,
      };

      await api.updatePaymentMethod(method.id, {
        active,
        configMetadata: updatedMetadata,
      });

      setFeedback({ type: 'success', text: 'Paystack Gateway configuration updated successfully' });
      await refreshPublicData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to save configuration' });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold font-display text-white">Paystack Gateway Settings</h1>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase font-mono">
            USD Cards
          </span>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Connect your live Paystack credentials to process credit cards, Apple Pay, and local NGN / USD bank payments.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/80 border border-red-500/40 text-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">API Credentials</h3>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-medium">Gateway Active:</span>
                <button
                  type="button"
                  onClick={() => setActive(!active)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {active ? (
                    <ToggleRight className="w-10 h-6 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-10 h-6 text-slate-600" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Public Key (pk_test_... or pk_live_...) *
                </label>
                <input
                  type="text"
                  required
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none"
                  placeholder="e.g. pk_live_1234abcd..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Secret Key (sk_test_... or sk_live_...) *
                </label>
                <input
                  type="password"
                  required
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none"
                  placeholder="••••••••••••••••••••••••••••"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">Gateway Mode</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Toggle between Paystack Live Mode and Sandbox/Testing.</p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                  testMode 
                    ? 'bg-amber-950/50 text-amber-400 border border-amber-500/20' 
                    : 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {testMode ? 'SANDBOX' : 'PRODUCTION'}
                </span>
                <button
                  type="button"
                  onClick={() => setTestMode(!testMode)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {testMode ? (
                    <ToggleRight className="w-10 h-6 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-10 h-6 text-slate-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-slate-800 bg-slate-900/40 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs text-slate-300">
              <h3 className="font-bold text-white text-sm">Server-to-Server Verification</h3>
              <p className="leading-relaxed">
                Api transaction tokens are verified on our secure Node.js server using a hash matching schema. Your secret keys are stored safely inside PostgreSQL and never exposed to the client side.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Saving...' : 'Save Paystack Settings'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
