import React, { useState } from 'react';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Building,
  Globe,
  MessageSquare,
  User,
  Mail,
  Phone,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { captureUTMParams } from '../../lib/utm';

export function LeadAuditSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    businessType: 'E-commerce & Digital Products',
    websiteUrl: '',
    sellingDetails: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const businessTypes = [
    'E-commerce & Digital Products',
    'Info Products & Coaching / Courses',
    'B2B Services & Agency',
    'SaaS & Tech Platform',
    'Local Business / Service Provider',
    'Other Offer / Project',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const utm = captureUTMParams();

    try {
      const res = await api.submitLead({
        ...formData,
        utmSource: utm.utmSource,
        utmMedium: utm.utmMedium,
        utmCampaign: utm.utmCampaign,
        utmContent: utm.utmContent,
        landingPage: utm.landingPage,
        referrer: utm.referrer,
      });

      setSuccessMsg(res.message || 'Your audit request has been successfully submitted!');
      setFormData({
        name: '',
        email: '',
        whatsapp: '',
        businessType: 'E-commerce & Digital Products',
        websiteUrl: '',
        sellingDetails: '',
        message: '',
      });
    } catch (err: any) {
      if (err instanceof ApiError && err.details && Array.isArray(err.details)) {
        setErrorMsg(err.details.map((d: any) => d.message).join('. '));
      } else {
        setErrorMsg(err.message || 'Failed to submit audit request. Please check your fields.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="audit-form" className="py-20 md:py-28 relative overflow-hidden bg-slate-100/50 dark:bg-slate-950/90 border-t border-slate-200 dark:border-slate-900 transition-colors">
      {/* Glow */}
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-emerald-500/10 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-600/10 blur-[130px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Value Pitch */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Complimentary Opportunity Analysis</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight leading-[1.15]">
              Get a Free <span className="text-emerald-500 dark:text-emerald-400">Funnel Audit</span>
            </h2>

            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Submit your offer details. Our growth architects will review your current page, copy hook angles, and checkout friction points, then deliver an actionable breakdown via WhatsApp/Email.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Headline &amp; Hook Teardown</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Analysis of your direct-response messaging and curiosity triggers.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Mobile Speed &amp; UX Friction Check</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Identification of load hurdles and checkout drop-off leaks.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Payment Architecture Recommendations</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Optimal setup guidance for Paystack, Stripe, and localized links.</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <span>We respect your privacy. Zero spam, and your project data is strictly confidential.</span>
            </div>
          </div>

          {/* Right Column: High-Converting Form */}
          <div className="lg:col-span-7">
            <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl relative">
              {successMsg ? (
                <div className="py-10 text-center space-y-4 animate-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold font-display text-white">Audit Request Received!</h3>
                  <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">{successMsg}</p>
                  <button
                    onClick={() => setSuccessMsg(null)}
                    className="mt-4 px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-white"
                  >
                    Submit Another Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMsg && (
                    <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/40 text-xs text-red-200 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Your Full Name *</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Alex Morgan"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-colors"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Business Email *</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="alex@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* WhatsApp */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>WhatsApp Number *</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="+1 555 123 4567 or local number"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-colors"
                      />
                    </div>

                    {/* Business Type */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Business Category *</span>
                      </label>
                      <select
                        value={formData.businessType}
                        onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition-colors"
                      >
                        {businessTypes.map((type) => (
                          <option key={type} value={type} className="bg-slate-950 text-white">
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Website URL */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Current Website or Funnel URL (If any)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="https://yourbrand.com/offer"
                      value={formData.websiteUrl}
                      onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-colors"
                    />
                  </div>

                  {/* What are you trying to sell */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>What are you trying to sell? *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Skincare serum / 1-on-1 coaching program / Physical gadget"
                      value={formData.sellingDetails}
                      onChange={(e) => setFormData({ ...formData, sellingDetails: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-colors"
                    />
                  </div>

                  {/* Additional message */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Additional Project Details (Optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Tell us about your main challenge (e.g. cold ad conversions, checkout drop-off, high traffic low sales)..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    id="submit-audit-btn"
                    disabled={loading}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Submitting Audit Request...</span>
                      </>
                    ) : (
                      <>
                        <span>Request Free Funnel Audit</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
