import React, { useState, useEffect } from 'react';
import { Building, Save, CheckCircle2, AlertCircle, Loader2, Image, Globe, Eye, Phone, Mail, Clock } from 'lucide-react';
import { api } from '../../lib/api';
import { BusinessProfile } from '../../types/index';
import { usePublicData } from '../../context/PublicDataContext';

export function BusinessProfileManager() {
  const { refreshPublicData } = usePublicData();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await api.getBusinessProfile();
      setProfile(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load business profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const updated = await api.updateBusinessProfile(profile);
      setProfile(updated);
      await refreshPublicData();
      setSuccessMsg('Business profile successfully updated and logged to audit trail! Changes are now live on the public website.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return <div className="p-8 text-slate-400">Loading business profile...</div>;
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold font-display text-white">Business Profile &amp; Brand Identity</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure corporate branding, business name, description, visual assets, and operating hours used across the website.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/80 border border-red-500/40 text-xs text-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Edit Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-8 glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Business Name *</label>
              <input
                type="text"
                required
                value={profile.businessName}
                onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tagline / Mission *</label>
              <input
                type="text"
                required
                value={profile.tagline}
                onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Business Description *</label>
            <textarea
              rows={3}
              required
              value={profile.description}
              onChange={(e) => setProfile({ ...profile, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Primary Email *</label>
              <input
                type="email"
                required
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Support Email *</label>
              <input
                type="email"
                required
                value={profile.supportEmail}
                onChange={(e) => setProfile({ ...profile, supportEmail: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phone Number</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">WhatsApp Number</label>
              <input
                type="text"
                value={profile.whatsappNumber}
                onChange={(e) => setProfile({ ...profile, whatsappNumber: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Operating Hours</label>
              <input
                type="text"
                value={profile.businessHours}
                onChange={(e) => setProfile({ ...profile, businessHours: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Logo Image URL</label>
              <input
                type="url"
                placeholder="https://apexgrowth.digital/logo.png"
                value={profile.logoUrl || ''}
                onChange={(e) => setProfile({ ...profile, logoUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Favicon URL</label>
              <input
                type="url"
                placeholder="https://apexgrowth.digital/favicon.ico"
                value={profile.faviconUrl || ''}
                onChange={(e) => setProfile({ ...profile, faviconUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Business Profile</span>
            </button>
          </div>
        </form>

        {/* Live Public Values Preview Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Eye className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Public Card Preview
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {profile.logoUrl ? (
                  <img
                    src={profile.logoUrl}
                    alt="Logo preview"
                    className="w-12 h-12 rounded-xl object-contain bg-slate-900 border border-slate-800"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg font-display">
                    {profile.businessName?.charAt(0) || 'A'}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-white">{profile.businessName || 'Business Name'}</h4>
                  <p className="text-xs text-emerald-400">{profile.tagline || 'Company Tagline'}</p>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                {profile.description || 'Business description will appear across footers, meta headers, and landing page hero sections.'}
              </p>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2 text-slate-400">
                  <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{profile.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{profile.whatsappNumber || profile.phone || 'No phone set'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{profile.businessHours || 'Standard Hours'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
