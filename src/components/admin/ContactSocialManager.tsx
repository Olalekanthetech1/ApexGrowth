import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  Save,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Send,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { ContactSettings } from '../../types/index';
import { usePublicData } from '../../context/PublicDataContext';

export function ContactSocialManager() {
  const { refreshPublicData } = usePublicData();
  const [contact, setContact] = useState<ContactSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadContact();
  }, []);

  const loadContact = async () => {
    try {
      setLoading(true);
      const data = await api.getContactSettings();
      setContact(data);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load contact configuration' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact) return;
    setSaving(true);

    try {
      const updated = await api.updateContactSettings(contact);
      setContact(updated);
      await refreshPublicData();
      setFeedback({ type: 'success', text: 'Contact & social channels successfully updated!' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update contact settings' });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  if (loading || !contact) {
    return <div className="p-8 text-slate-400">Loading contact settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold font-display text-white">Contact &amp; Social Channels</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure direct-to-WhatsApp conversion routing, floating widgets, Discord, Telegram, and social media destinations.
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

      <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-8">
        {/* WhatsApp Integration Block */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <MessageCircle className="w-5 h-5 text-[#25D366]" />
            <h3 className="text-base font-bold text-white font-display">WhatsApp Channel &amp; Routing</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp Direct Link URL</label>
              <input
                type="text"
                placeholder="https://wa.me/15551234567"
                value={contact.whatsappUrl}
                onChange={(e) => setContact({ ...contact, whatsappUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-white outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp Button Text</label>
              <input
                type="text"
                placeholder="Chat on WhatsApp"
                value={contact.whatsappButtonText}
                onChange={(e) => setContact({ ...contact, whatsappButtonText: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Default Pre-filled Message</label>
            <input
              type="text"
              value={contact.whatsappPrefilledMessage}
              onChange={(e) => setContact({ ...contact, whatsappPrefilledMessage: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="floating-whatsapp-enabled"
                checked={contact.floatingWhatsappEnabled}
                onChange={(e) => setContact({ ...contact, floatingWhatsappEnabled: e.target.checked })}
                className="w-4 h-4 accent-[#25D366] rounded cursor-pointer"
              />
              <label htmlFor="floating-whatsapp-enabled" className="text-xs text-slate-300 cursor-pointer">
                Floating Bottom-Right Widget
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hero-cta-enabled"
                checked={contact.heroCtaEnabled}
                onChange={(e) => setContact({ ...contact, heroCtaEnabled: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
              <label htmlFor="hero-cta-enabled" className="text-xs text-slate-300 cursor-pointer">
                Hero Secondary Button
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pricing-cta-enabled"
                checked={contact.pricingCtaEnabled}
                onChange={(e) => setContact({ ...contact, pricingCtaEnabled: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
              <label htmlFor="pricing-cta-enabled" className="text-xs text-slate-300 cursor-pointer">
                Pricing Package CTA Fallback
              </label>
            </div>
          </div>
        </div>

        {/* Community & Social Channels */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Send className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white font-display">Community &amp; Social Channels</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Discord Server Invite URL</label>
              <input
                type="text"
                placeholder="https://discord.gg/apexgrowth"
                value={contact.discordInviteUrl || ''}
                onChange={(e) => setContact({ ...contact, discordInviteUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Telegram Handle / URL</label>
              <input
                type="text"
                placeholder="https://t.me/apexgrowth"
                value={contact.telegramUrl || ''}
                onChange={(e) => setContact({ ...contact, telegramUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Instagram URL</label>
              <input
                type="text"
                placeholder="https://instagram.com/apexgrowth.digital"
                value={contact.instagramUrl || ''}
                onChange={(e) => setContact({ ...contact, instagramUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">TikTok URL</label>
              <input
                type="text"
                placeholder="https://tiktok.com/@apexgrowth.digital"
                value={contact.tiktokUrl || ''}
                onChange={(e) => setContact({ ...contact, tiktokUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">X (Twitter) URL</label>
              <input
                type="text"
                placeholder="https://x.com/apexgrowth"
                value={contact.twitterUrl || ''}
                onChange={(e) => setContact({ ...contact, twitterUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">LinkedIn Page URL</label>
              <input
                type="text"
                placeholder="https://linkedin.com/company/apexgrowth-digital"
                value={contact.linkedinUrl || ''}
                onChange={(e) => setContact({ ...contact, linkedinUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-white outline-none"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Channel Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
