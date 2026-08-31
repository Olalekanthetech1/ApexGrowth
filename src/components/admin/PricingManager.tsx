import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { PricingPackage } from '../../types/index';
import { usePublicData } from '../../context/PublicDataContext';

export function PricingManager() {
  const { refreshPublicData } = usePublicData();
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPkg, setEditingPkg] = useState<Partial<PricingPackage> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const data = await api.getPricingPackages();
      setPackages(data);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load pricing packages' });
    } finally {
      setLoading(false);
    }
  };

  const handleStartAdd = () => {
    setIsNew(true);
    setEditingPkg({
      name: '',
      slug: '',
      description: '',
      priceUsd: '199',
      promoPriceUsd: '',
      currency: 'USD',
      priceNaira: '',
      features: ['High-converting landing page', 'Mobile & speed optimization', '2 rounds of revisions'],
      isFeatured: false,
      badgeText: '',
      ctaText: 'Get Started Now',
      ctaAction: 'checkout',
      active: true,
      displayOrder: packages.length + 1,
    });
  };

  const handleStartEdit = (pkg: PricingPackage) => {
    setIsNew(false);
    setEditingPkg({ ...pkg });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPkg) return;
    setSaving(true);

    try {
      if (isNew) {
        await api.createPricingPackage({
          ...editingPkg,
          currency: 'USD',
          promoPriceUsd: editingPkg.promoPriceUsd || undefined,
        });
        setFeedback({ type: 'success', text: 'USD Pricing package created successfully' });
      } else {
        await api.updatePricingPackage(editingPkg.id!, {
          ...editingPkg,
          currency: 'USD',
          promoPriceUsd: editingPkg.promoPriceUsd || undefined,
        });
        setFeedback({ type: 'success', text: 'USD Pricing package updated successfully' });
      }
      setEditingPkg(null);
      await loadPackages();
      await refreshPublicData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to save package' });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete package "${name}"?`)) return;
    try {
      await api.deletePricingPackage(id);
      setFeedback({ type: 'success', text: `Package "${name}" deleted` });
      await loadPackages();
      await refreshPublicData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete package' });
    }
  };

  const handleFeatureChange = (index: number, val: string) => {
    if (!editingPkg || !editingPkg.features) return;
    const next = [...editingPkg.features];
    next[index] = val;
    setEditingPkg({ ...editingPkg, features: next });
  };

  const handleAddFeature = () => {
    if (!editingPkg) return;
    const current = editingPkg.features || [];
    setEditingPkg({ ...editingPkg, features: [...current, 'Included capability'] });
  };

  const handleRemoveFeature = (index: number) => {
    if (!editingPkg || !editingPkg.features) return;
    const next = editingPkg.features.filter((_, i) => i !== index);
    setEditingPkg({ ...editingPkg, features: next });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">USD Pricing Packages</h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure USD service packages, promotional rates, deliverables checklist, and display order.
          </p>
        </div>

        <button
          onClick={handleStartAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all self-start cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Pricing Package</span>
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

      {/* Package Edit Form */}
      {editingPkg && (
        <div className="glass-panel rounded-2xl p-6 border border-emerald-500/50 bg-slate-900/95 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white font-display">
              {isNew ? 'Create New USD Package' : `Edit: ${editingPkg.name}`}
            </h3>
            <button
              onClick={() => setEditingPkg(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Package Name *</label>
                <input
                  type="text"
                  required
                  value={editingPkg.name || ''}
                  onChange={(e) => setEditingPkg({ ...editingPkg, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Slug</label>
                <input
                  type="text"
                  placeholder="e.g. conversion-launchpad"
                  value={editingPkg.slug || ''}
                  onChange={(e) => setEditingPkg({ ...editingPkg, slug: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
              <textarea
                rows={2}
                value={editingPkg.description || ''}
                onChange={(e) => setEditingPkg({ ...editingPkg, description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Regular Price (USD $) *</label>
                <input
                  type="text"
                  required
                  placeholder="249"
                  value={editingPkg.priceUsd ?? ''}
                  onChange={(e) => setEditingPkg({ ...editingPkg, priceUsd: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Promo Price (USD $, Optional)</label>
                <input
                  type="text"
                  placeholder="199"
                  value={editingPkg.promoPriceUsd ?? ''}
                  onChange={(e) => setEditingPkg({ ...editingPkg, promoPriceUsd: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Display Order</label>
                <input
                  type="number"
                  value={editingPkg.displayOrder ?? 0}
                  onChange={(e) => setEditingPkg({ ...editingPkg, displayOrder: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">CTA Button Text</label>
                <input
                  type="text"
                  value={editingPkg.ctaText || 'Get Started Now'}
                  onChange={(e) => setEditingPkg({ ...editingPkg, ctaText: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="pkg-is-featured"
                  checked={editingPkg.isFeatured ?? false}
                  onChange={(e) => setEditingPkg({ ...editingPkg, isFeatured: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
                <label htmlFor="pkg-is-featured" className="text-xs text-slate-300 cursor-pointer">
                  Featured (Highlight Card)
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Badge Text (If Featured)</label>
                <input
                  type="text"
                  placeholder="e.g. MOST POPULAR"
                  value={editingPkg.badgeText || ''}
                  onChange={(e) => setEditingPkg({ ...editingPkg, badgeText: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="pkg-is-active"
                  checked={editingPkg.active ?? true}
                  onChange={(e) => setEditingPkg({ ...editingPkg, active: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
                <label htmlFor="pkg-is-active" className="text-xs text-slate-300 cursor-pointer">
                  Active (Visible on Site)
                </label>
              </div>
            </div>

            {/* Feature Bullets */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300">Package Inclusions Checklist</label>
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                >
                  + Add Inclusion
                </button>
              </div>
              <div className="space-y-2">
                {(editingPkg.features || []).map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={feat}
                      onChange={(e) => handleFeatureChange(idx, e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingPkg(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow flex items-center gap-1.5 cursor-pointer"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Package</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`glass-panel rounded-2xl p-6 border flex flex-col justify-between ${
              pkg.isFeatured ? 'border-emerald-500/50 bg-slate-900/90' : 'border-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  #{pkg.displayOrder}
                </span>
                {pkg.isFeatured && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-300">
                    {pkg.badgeText || 'Featured'}
                  </span>
                )}
              </div>

              <h3 className="text-lg font-bold text-white mb-1">{pkg.name}</h3>
              <p className="text-xs text-slate-400 mb-4">{pkg.description}</p>

              <div className="flex items-baseline gap-2 mb-4">
                {pkg.promoPriceUsd ? (
                  <>
                    <span className="text-2xl font-extrabold text-white font-mono">
                      ${pkg.promoPriceUsd}
                    </span>
                    <span className="text-sm text-slate-500 line-through font-mono">
                      ${pkg.priceUsd}
                    </span>
                    <span className="text-xs text-emerald-400 font-medium">USD</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-extrabold text-white font-mono">
                      ${pkg.priceUsd}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">USD</span>
                  </>
                )}
              </div>

              <div className="space-y-1.5 mb-6">
                {(pkg.features || []).map((feat, fIdx) => (
                  <div key={fIdx} className="text-xs text-slate-300 flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800/80">
              <button
                onClick={() => handleStartEdit(pkg)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleDelete(pkg.id, pkg.name)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950/40 border border-slate-800 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                title="Delete Package"
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
