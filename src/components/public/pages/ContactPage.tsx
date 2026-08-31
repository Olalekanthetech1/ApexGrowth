import React from 'react';
import {
  Mail,
  Phone,
  MessageCircle,
  Clock,
  Send,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Globe,
} from 'lucide-react';
import { usePublicData } from '../../../context/PublicDataContext';
import { LeadAuditSection } from '../LeadAuditSection';

interface ContactPageProps {
  onNavigate: (path: string) => void;
}

export function ContactPage({ onNavigate }: ContactPageProps) {
  const { business, contact, socialLinks } = usePublicData();

  const whatsappLink = contact.whatsappUrl
    ? `${contact.whatsappUrl}?text=${encodeURIComponent(
        contact.whatsappPrefilledMessage || "Hi, I'd like to get in touch with ApexGrowth Digital."
      )}`
    : '#';

  return (
    <div className="pt-28 pb-20 md:pt-36 md:pb-28">
      {/* Background Glows */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-emerald-500/10 blur-[150px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Direct Communication Channels</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-display text-white tracking-tight mb-6">
            Let's Engineer Your <span className="text-emerald-400">Conversion Funnel</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Submit your offer for a complimentary teardown or reach our growth engineering team directly through verified channels.
          </p>
        </div>

        {/* Contact Methods Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          {/* WhatsApp Direct */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800/90 flex flex-col justify-between group hover:border-emerald-500/40 transition-all">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white mb-1 font-display">Instant WhatsApp Desk</h2>
              <p className="text-xs text-slate-400 mb-4">
                Chat directly with our direct-response strategists for fast inquiries and sprint updates.
              </p>
              {(contact.whatsappNumber || business.whatsappNumber) ? (
                <div className="text-xs font-mono text-emerald-400 font-semibold mb-4">
                  {contact.whatsappNumber || business.whatsappNumber}
                </div>
              ) : (
                <div className="text-xs text-slate-500 mb-4">Available via configured WhatsApp link or audit form.</div>
              )}
            </div>

            {contact.whatsappUrl ? (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold text-center transition-colors block"
              >
                Open WhatsApp Chat
              </a>
            ) : (
              <div className="text-xs text-slate-500 text-center py-2 border border-slate-800 rounded-xl">
                WhatsApp pending configuration in /admin
              </div>
            )}
          </div>

          {/* Email Support */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800/90 flex flex-col justify-between group hover:border-indigo-500/40 transition-all">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white mb-1 font-display">Business &amp; Support Email</h2>
              <p className="text-xs text-slate-400 mb-4">
                Send RFPs, enterprise scopes, or detailed project briefs to our leadership desk.
              </p>
              {(contact.businessEmail || business.email) ? (
                <div className="text-xs font-mono text-indigo-400 font-semibold mb-4 break-all">
                  {contact.businessEmail || business.email}
                </div>
              ) : (
                <div className="text-xs text-slate-500 mb-4">Submit inquiries via the audit form below.</div>
              )}
            </div>

            {(contact.businessEmail || business.email) ? (
              <a
                href={`mailto:${contact.businessEmail || business.email}`}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold text-center transition-colors block"
              >
                Compose Email
              </a>
            ) : (
              <div className="text-xs text-slate-500 text-center py-2 border border-slate-800 rounded-xl">
                Email pending configuration in /admin
              </div>
            )}
          </div>

          {/* Business Hours */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800/90 flex flex-col justify-between group hover:border-teal-500/40 transition-all">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white mb-1 font-display">Sprint Hours</h2>
              <p className="text-xs text-slate-400 mb-4">
                Our production team operates continuously across sprint cycles with guaranteed response SLAs.
              </p>
              <div className="text-xs text-slate-300 font-medium mb-4">
                {business.businessHours || 'Monday – Friday: 9:00 AM – 6:00 PM (EST)'}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sprint Slots Active</span>
            </div>
          </div>
        </div>

        {/* Lead Audit Form Section */}
        <div className="mb-16">
          <LeadAuditSection />
        </div>

        {/* Social Links Section */}
        {socialLinks.length > 0 && (
          <div className="text-center pt-8 border-t border-slate-900">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
              Verified Social Channels
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-emerald-400 transition-colors flex items-center gap-2"
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{link.label || link.platform}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
