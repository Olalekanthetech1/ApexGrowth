import React, { useState, useEffect } from 'react';
import { Star, Plus, Edit2, Trash2, X, CheckCircle2, AlertCircle, Loader2, Quote, Eye, EyeOff } from 'lucide-react';
import { api } from '../../lib/api';
import { Testimonial } from '../../types/index';
import { usePublicData } from '../../context/PublicDataContext';

export function TestimonialsManager() {
  const { refreshPublicData } = usePublicData();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTestimonial, setEditingTestimonial] = useState<Partial<Testimonial> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      setLoading(true);
      const data = await api.getTestimonials();
      setTestimonials(data);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load testimonials' });
    } finally {
      setLoading(false);
    }
  };

  const handleStartAdd = () => {
    setIsNew(true);
    setEditingTestimonial({
      clientName: '',
      clientRole: '',
      companyName: '',
      avatarUrl: '',
      rating: 5,
      content: '',
      displayOrder: testimonials.length + 1,
      published: true,
    });
  };

  const handleStartEdit = (testimonial: Testimonial) => {
    setIsNew(false);
    setEditingTestimonial({ ...testimonial });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTestimonial) return;
    setSaving(true);

    try {
      if (isNew) {
        await api.createTestimonial(editingTestimonial);
        setFeedback({ type: 'success', text: 'Testimonial added successfully' });
      } else {
        await api.updateTestimonial(editingTestimonial.id!, editingTestimonial);
        setFeedback({ type: 'success', text: 'Testimonial updated successfully' });
      }
      setEditingTestimonial(null);
      await loadTestimonials();
      await refreshPublicData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to save testimonial' });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete testimonial from "${name}"?`)) return;
    try {
      await api.deleteTestimonial(id);
      setFeedback({ type: 'success', text: 'Testimonial deleted successfully' });
      await loadTestimonials();
      await refreshPublicData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete testimonial' });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Client Testimonials</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage live social proof, reviews, and enterprise trust cards.
          </p>
        </div>

        <button
          onClick={handleStartAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add Testimonial</span>
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

      {/* Testimonial Form Drawer */}
      {editingTestimonial && (
        <div className="glass-panel rounded-2xl p-6 border border-emerald-500/50 bg-slate-900/95 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white font-display">
              {isNew ? 'Create Social Proof Card' : 'Edit Testimonial'}
            </h3>
            <button onClick={() => setEditingTestimonial(null)} className="p-1 rounded-lg text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Client Name *</label>
                <input
                  type="text"
                  required
                  value={editingTestimonial.clientName || ''}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, clientName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Client Title/Role *</label>
                <input
                  type="text"
                  required
                  value={editingTestimonial.clientRole || ''}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, clientRole: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  placeholder="e.g. CTO, Growth Lead"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Company Name</label>
                <input
                  type="text"
                  value={editingTestimonial.companyName || ''}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, companyName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  placeholder="e.g. Acme Corp"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Client Avatar Image URL</label>
                <input
                  type="url"
                  value={editingTestimonial.avatarUrl || ''}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, avatarUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  placeholder="https://images.unsplash.com/... or blank"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Review Content *</label>
              <textarea
                rows={4}
                required
                value={editingTestimonial.content || ''}
                onChange={(e) => setEditingTestimonial({ ...editingTestimonial, content: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none resize-none"
                placeholder="Write the quote verbatim as received..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Star Rating (1 - 5)</label>
                <select
                  value={editingTestimonial.rating || 5}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, rating: parseInt(e.target.value) || 5 })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                  <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                  <option value={3}>⭐⭐⭐ (3 Stars)</option>
                  <option value={2}>⭐⭐ (2 Stars)</option>
                  <option value={1}>⭐ (1 Star)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Display Order</label>
                <input
                  type="number"
                  value={editingTestimonial.displayOrder || 1}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, displayOrder: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                <div className="flex items-center h-[42px]">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingTestimonial.published ?? true}
                      onChange={(e) => setEditingTestimonial({ ...editingTestimonial, published: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    <span className="ml-3 text-xs text-slate-300 font-medium">
                      {editingTestimonial.published ? 'Published Live' : 'Draft / Hidden'}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingTestimonial(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all disabled:opacity-50"
              >
                {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>{saving ? 'Saving Proof...' : 'Publish Testimonial'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of existing testimonials */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : testimonials.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
          <Quote className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-base font-bold text-white">No Testimonials Yet</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Social proof increases user conversions by 34%. Create your first custom client testimonial!
          </p>
          <button
            onClick={handleStartAdd}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Testimonial</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className={`glass-panel rounded-2xl border p-6 transition-all flex flex-col justify-between ${
                t.published ? 'border-slate-800' : 'border-dashed border-slate-700 bg-slate-900/40 opacity-75'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {t.avatarUrl ? (
                      <img
                        src={t.avatarUrl}
                        alt={t.clientName}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-slate-700"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-emerald-400 font-bold font-display text-sm">
                        {t.clientName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-sm text-white">{t.clientName}</h3>
                      <p className="text-xs text-slate-400">
                        {t.clientRole} {t.companyName && `at ${t.companyName}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleStartEdit(t)}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id, t.clientName)}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-red-400 hover:text-red-300 hover:border-red-500/30 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < t.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                      }`}
                    />
                  ))}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                  "{t.content}"
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-900/80 pt-4 mt-4">
                <span className="text-[10px] font-semibold text-slate-500 font-mono">
                  ORDER: {t.displayOrder}
                </span>

                <div className="flex items-center gap-1.5">
                  {t.published ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <Eye className="w-3 h-3" />
                      <span>Live</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded-full border border-slate-700">
                      <EyeOff className="w-3 h-3" />
                      <span>Draft</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
