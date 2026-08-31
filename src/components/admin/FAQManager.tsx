import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus, Edit2, Trash2, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { FAQ } from '../../types/index';
import { usePublicData } from '../../context/PublicDataContext';

export function FAQManager() {
  const { refreshPublicData } = usePublicData();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFaq, setEditingFaq] = useState<Partial<FAQ> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadFaqs();
  }, []);

  const loadFaqs = async () => {
    try {
      setLoading(true);
      const data = await api.getFAQs();
      setFaqs(data);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load FAQs' });
    } finally {
      setLoading(false);
    }
  };

  const handleStartAdd = () => {
    setIsNew(true);
    setEditingFaq({
      question: '',
      answer: '',
      displayOrder: faqs.length + 1,
      published: true,
    });
  };

  const handleStartEdit = (faq: FAQ) => {
    setIsNew(false);
    setEditingFaq({ ...faq });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaq) return;
    setSaving(true);

    try {
      if (isNew) {
        await api.createFAQ(editingFaq);
        setFeedback({ type: 'success', text: 'FAQ created successfully' });
      } else {
        await api.updateFAQ(editingFaq.id!, editingFaq);
        setFeedback({ type: 'success', text: 'FAQ updated successfully' });
      }
      setEditingFaq(null);
      await loadFaqs();
      await refreshPublicData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to save FAQ' });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleDelete = async (id: string, question: string) => {
    if (!window.confirm(`Delete question: "${question}"?`)) return;
    try {
      await api.deleteFAQ(id);
      setFeedback({ type: 'success', text: 'FAQ deleted' });
      await loadFaqs();
      await refreshPublicData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete FAQ' });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Frequently Asked Questions</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage objections, turnaround clarifications, and payment inquiries.
          </p>
        </div>

        <button
          onClick={handleStartAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add New FAQ</span>
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

      {/* FAQ Editing Drawer */}
      {editingFaq && (
        <div className="glass-panel rounded-2xl p-6 border border-emerald-500/50 bg-slate-900/95 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white font-display">
              {isNew ? 'Create New Question' : 'Edit FAQ Item'}
            </h3>
            <button onClick={() => setEditingFaq(null)} className="p-1 rounded-lg text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Question *</label>
              <input
                type="text"
                required
                value={editingFaq.question || ''}
                onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Answer *</label>
              <textarea
                rows={3}
                required
                value={editingFaq.answer || ''}
                onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Display Order</label>
                <input
                  type="number"
                  value={editingFaq.displayOrder || 1}
                  onChange={(e) => setEditingFaq({ ...editingFaq, displayOrder: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="faq-published"
                  checked={editingFaq.published ?? true}
                  onChange={(e) => setEditingFaq({ ...editingFaq, published: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
                <label htmlFor="faq-published" className="text-xs text-slate-300 cursor-pointer">
                  Published on public site
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingFaq(null)}
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
                <span>Save Question</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FAQ List */}
      <div className="space-y-3">
        {faqs.map((faq) => (
          <div
            key={faq.id}
            className="glass-panel rounded-2xl p-5 border border-slate-800 flex items-start justify-between gap-4"
          >
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  #{faq.displayOrder}
                </span>
                <h4 className="text-base font-bold text-white">{faq.question}</h4>
              </div>
              <p className="text-xs text-slate-400 pl-8 leading-relaxed">{faq.answer}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleStartEdit(faq)}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-400"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(faq.id, faq.question)}
                className="p-2 rounded-lg bg-slate-900 hover:bg-red-950/40 border border-slate-800 text-slate-400 hover:text-red-400"
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
