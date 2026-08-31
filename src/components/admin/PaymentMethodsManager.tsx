import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Lock,
  ExternalLink,
  Loader2,
  X,
} from 'lucide-react';
import { api } from '../../lib/api';
import { PaymentMethod } from '../../types/index';
import { usePublicData } from '../../context/PublicDataContext';

export function PaymentMethodsManager() {
  const { refreshPublicData } = usePublicData();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMethod, setEditingMethod] = useState<Partial<PaymentMethod> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    try {
      setLoading(true);
      const data = await api.getPaymentMethods();
      setMethods(data);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load payment methods' });
    } finally {
      setLoading(false);
    }
  };

  const handleStartAdd = () => {
    setIsNew(true);
    setEditingMethod({
      provider: 'paystack',
      displayName: 'Paystack Card / Transfer Gateway',
      type: 'payment_link',
      paymentUrl: 'https://paystack.shop/apexgrowth',
      currency: 'USD/NGN',
      description: 'Secure multi-channel checkout powered by Paystack.',
      instructions: 'Pay instantly via debit card, bank transfer, Apple Pay or USSD.',
      active: true,
      displayOrder: methods.length + 1,
      isDirectLink: true,
    });
  };

  const handleStartEdit = (item: PaymentMethod) => {
    setIsNew(false);
    setEditingMethod({ ...item });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMethod) return;
    setSaving(true);

    try {
      if (isNew) {
        await api.createPaymentMethod(editingMethod);
        setFeedback({ type: 'success', text: 'Payment method configured successfully' });
      } else {
        await api.updatePaymentMethod(editingMethod.id!, editingMethod);
        setFeedback({ type: 'success', text: 'Payment method updated successfully' });
      }
      setEditingMethod(null);
      await loadMethods();
      await refreshPublicData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to save payment method' });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete payment method "${name}"?`)) return;
    try {
      await api.deletePaymentMethod(id);
      setFeedback({ type: 'success', text: 'Payment method deleted' });
      await loadMethods();
      await refreshPublicData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete payment method' });
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Payment Configuration &amp; Gateways</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage checkout payment links, direct merchant destinations, and gateway infrastructure settings.
          </p>
        </div>

        <button
          onClick={handleStartAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add Payment Method</span>
        </button>
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

      {/* Production Architecture Security Card */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 bg-slate-900/60 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs text-slate-300">
          <h3 className="font-bold text-white text-sm">Enterprise Payment Routing Ready</h3>
          <p className="leading-relaxed">
            The application includes an abstraction layer designed to support both <strong>hosted merchant payment links</strong> (Paystack, Selar, Stripe Checkout) and <strong>direct server-side API webhooks</strong> (`PAYSTACK_SECRET_KEY`, `STRIPE_SECRET_KEY`) securely via server proxy routes without exposing keys.
          </p>
        </div>
      </div>

      {/* Edit / Create Form */}
      {editingMethod && (
        <div className="glass-panel rounded-2xl p-6 border border-emerald-500/50 bg-slate-900/95 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white font-display">
              {isNew ? 'Configure New Gateway / Link' : `Edit: ${editingMethod.displayName}`}
            </h3>
            <button onClick={() => setEditingMethod(null)} className="p-1 rounded-lg text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Provider Brand</label>
                <select
                  value={editingMethod.provider || 'paystack'}
                  onChange={(e) => setEditingMethod({ ...editingMethod, provider: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="paystack">Paystack</option>
                  <option value="selar">Selar</option>
                  <option value="stripe">Stripe</option>
                  <option value="flutterwave">Flutterwave</option>
                  <option value="crypto">Cryptocurrency (USDT)</option>
                  <option value="bybit">Bybit</option>
                  <option value="custom">Custom Merchant</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Integration Type</label>
                <select
                  value={editingMethod.type || 'payment_link'}
                  onChange={(e) => setEditingMethod({ ...editingMethod, type: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="payment_link">Hosted Payment Link</option>
                  <option value="api_integration">Direct API / Invoicing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Currency Code</label>
                <input
                  type="text"
                  placeholder="USD, NGN, GBP"
                  value={editingMethod.currency || ''}
                  onChange={(e) => setEditingMethod({ ...editingMethod, currency: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Display Label *</label>
              <input
                type="text"
                required
                value={editingMethod.displayName || ''}
                onChange={(e) => setEditingMethod({ ...editingMethod, displayName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Payment / Checkout Link URL</label>
              <input
                type="text"
                placeholder="https://paystack.shop/your-product"
                value={editingMethod.paymentUrl || ''}
                onChange={(e) => setEditingMethod({ ...editingMethod, paymentUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Customer Instructions / Description</label>
              <input
                type="text"
                value={editingMethod.instructions || ''}
                onChange={(e) => setEditingMethod({ ...editingMethod, instructions: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="method-is-active"
                  checked={editingMethod.active ?? true}
                  onChange={(e) => setEditingMethod({ ...editingMethod, active: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
                <label htmlFor="method-is-active" className="text-xs text-slate-300 cursor-pointer">
                  Active (Available for routing)
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Display Order</label>
                <input
                  type="number"
                  value={editingMethod.displayOrder || 1}
                  onChange={(e) =>
                    setEditingMethod({ ...editingMethod, displayOrder: parseInt(e.target.value) || 1 })
                  }
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingMethod(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow flex items-center gap-1.5"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Method</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Methods List */}
      <div className="space-y-4">
        {methods.map((method) => (
          <div
            key={method.id}
            className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase">
                  {method.provider}
                </span>
                <h4 className="text-base font-bold text-white">{method.displayName}</h4>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                    method.active ? 'bg-slate-800 text-emerald-400' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {method.active ? 'Active' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono truncate max-w-md">{method.paymentUrl || 'No direct URL'}</p>
              <p className="text-xs text-slate-300">{method.instructions}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {method.paymentUrl && (
                <a
                  href={method.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white"
                  title="Open Link"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                onClick={() => handleStartEdit(method)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleDelete(method.id, method.displayName)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950/40 border border-slate-800 text-slate-400 hover:text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
