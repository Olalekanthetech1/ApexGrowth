import React, { useState, useEffect } from 'react';
import { Globe, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { SEOSettings } from '../../types/index';
import { usePublicData } from '../../context/PublicDataContext';

export function SEOManager() {
  const { refreshPublicData } = usePublicData();
  const [seo, setSeo] = useState<SEOSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSEO();
  }, []);

  const loadSEO = async () => {
    try {
      setLoading(true);
      const data = await api.getSEOSettings();
      setSeo(data);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load SEO settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seo) return;
    setSaving(true);

    try {
      const updated = await api.updateSEOSettings(seo);
      setSeo(updated);
      await refreshPublicData();
      setFeedback({ type: 'success', text: 'SEO metadata updated successfully!' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update SEO metadata' });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  if (loading || !seo) {
    return <div className="p-8 text-slate-400">Loading SEO configurations...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold font-display text-white">SEO &amp; OpenGraph Metadata</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure search engine rankings, social preview cards, OpenGraph tags, and indexing rules.
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

      <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">HTML Page Title</label>
          <input
            type="text"
            required
            value={seo.pageTitle}
            onChange={(e) => setSeo({ ...seo, pageTitle: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Meta Description</label>
          <textarea
            rows={2}
            required
            value={seo.metaDescription}
            onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">OG Social Title</label>
            <input
              type="text"
              value={seo.ogTitle}
              onChange={(e) => setSeo({ ...seo, ogTitle: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Canonical URL</label>
            <input
              type="text"
              value={seo.canonicalUrl}
              onChange={(e) => setSeo({ ...seo, canonicalUrl: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">OG Social Description</label>
          <textarea
            rows={2}
            value={seo.ogDescription}
            onChange={(e) => setSeo({ ...seo, ogDescription: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">OG Image URL</label>
            <input
              type="text"
              value={seo.ogImage}
              onChange={(e) => setSeo({ ...seo, ogImage: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Robots Directives</label>
            <input
              type="text"
              value={seo.robots}
              onChange={(e) => setSeo({ ...seo, robots: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save SEO Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
