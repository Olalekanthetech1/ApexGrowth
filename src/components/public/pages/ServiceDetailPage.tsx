import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
  Sparkles,
  Layers,
  Code2,
  TrendingUp,
  MessageCircle,
  FileText,
  CreditCard,
  Video,
  Smartphone,
  MessageSquare,
  SearchCheck,
  PenTool,
} from 'lucide-react';
import { usePublicData } from '../../../context/PublicDataContext';
import { Service } from '../../../types/index';

interface ServiceDetailPageProps {
  slug: string;
  onNavigate: (path: string) => void;
  onOpenCheckout?: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  TrendingUp,
  Layout: Layers,
  CreditCard,
  Video,
  Smartphone,
  MessageSquare,
  SearchCheck,
  PenTool,
  Zap,
  Layers,
};

export function ServiceDetailPage({
  slug,
  onNavigate,
  onOpenCheckout,
}: ServiceDetailPageProps) {
  const { services, contact, pricing } = usePublicData();

  // Find matching service by slug or fallback
  const service = services.find((s) => s.slug === slug) || services[0];
  const otherServices = services.filter((s) => s.id !== service?.id);

  if (!service) {
    return (
      <div className="pt-36 pb-20 text-center max-w-xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-white mb-4">Service Not Found</h2>
        <p className="text-slate-400 mb-6">The requested service catalog entry could not be located.</p>
        <button
          onClick={() => onNavigate('/services')}
          className="px-6 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm"
        >
          Back to All Services
        </button>
      </div>
    );
  }

  const IconComponent = iconMap[service.iconName] || Zap;

  const whatsappLink = contact.whatsappUrl
    ? `${contact.whatsappUrl}?text=${encodeURIComponent(
        `Hi ApexGrowth, I would like to discuss your "${service.title}" service.`
      )}`
    : '#';

  return (
    <div className="pt-28 pb-20 md:pt-36 md:pb-28">
      {/* Background Glows */}
      <div className="absolute top-24 right-10 w-[500px] h-[300px] bg-emerald-500/10 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute top-96 left-10 w-[500px] h-[300px] bg-indigo-600/10 blur-[130px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <button
          onClick={() => onNavigate('/services')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Services</span>
        </button>

        {/* Hero Section */}
        <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-slate-800/90 relative overflow-hidden mb-12 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                <IconComponent className="w-4 h-4" />
                <span>Service Specification: {service.slug}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-display text-white tracking-tight leading-[1.15]">
                {service.title}
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                {service.description}
              </p>

              <div className="pt-4 flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Turnaround: 48–72 Hours</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Revisions: 2 Full Rounds</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
                  <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>PostgreSQL / Modern Stack</span>
                </div>
              </div>
            </div>

            {/* Quick Action Box */}
            <div className="lg:w-80 bg-slate-950/90 rounded-2xl p-6 border border-slate-800/90 space-y-4 shrink-0">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Direct Conversion Action
              </div>

              <button
                onClick={() => onNavigate('/pricing')}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Order via Pricing</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('/contact')}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Request Free Funnel Audit
              </button>

              {contact.whatsappUrl && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Deep Dive Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          {/* Left Column: Scope & Deliverables */}
          <div className="lg:col-span-8 space-y-8">
            {/* What is Included */}
            <div className="glass-panel rounded-3xl p-8 border border-slate-800/90">
              <h2 className="text-xl font-bold font-display text-white mb-6 flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span>Scope of Work &amp; Deliverables</span>
              </h2>

              {service.features && service.features.length > 0 ? (
                <div className="space-y-4">
                  {service.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white mb-0.5">{feat}</div>
                        <p className="text-xs text-slate-400">
                          Engineered to direct-response standards with rigorous mobile UX inspection and high-conversion validation.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Standard production delivery configured per contract.</p>
              )}
            </div>

            {/* Architecture & Engineering Standards */}
            <div className="glass-panel rounded-3xl p-8 border border-slate-800/90">
              <h3 className="text-xl font-bold font-display text-white mb-4 flex items-center gap-2.5">
                <Code2 className="w-5 h-5 text-indigo-400" />
                <span>Production Architecture Standards</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-white block">Speed &amp; Core Web Vitals</span>
                  <p className="text-slate-400">Sub-second page load times with minimal blocking JS to ensure maximum paid traffic retention.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-white block">Multi-Channel Checkout</span>
                  <p className="text-slate-400">Zero-friction payment links and checkout routing for USD Cards, Bybit USDT, and Grey USD Wire.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-white block">Conversion Copywriting</span>
                  <p className="text-slate-400">Psychological hook hierarchy designed to reduce objection friction and drive immediate action.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-white block">Pixel &amp; Server CAPI Ready</span>
                  <p className="text-slate-400">Clean tracking architecture configured for Meta Pixel, Google Tag Manager, and PostHog telemetry.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Next Steps & Guarantees */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel rounded-3xl p-6 border border-slate-800/90 space-y-4">
              <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>How We Deliver</span>
              </h3>

              <ol className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-mono font-bold text-[11px]">
                    1
                  </span>
                  <span><strong>Onboarding &amp; Hook Brief:</strong> We collect your target audience angles and product offer details.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-mono font-bold text-[11px]">
                    2
                  </span>
                  <span><strong>Sprint Build (48-72h):</strong> Copywriting, design layout, payment gateway connection, and QA testing.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-mono font-bold text-[11px]">
                    3
                  </span>
                  <span><strong>Review &amp; Revisions:</strong> Collaborative walkthrough with 2 revision cycles included.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-mono font-bold text-[11px]">
                    4
                  </span>
                  <span><strong>Production Launch:</strong> Deployment to your domain and active conversion tracking.</span>
                </li>
              </ol>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/30 text-xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Production Quality Guarantee</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                All code is clean, responsive, and adheres to production-grade security and database isolation standards.
              </p>
            </div>
          </div>
        </div>

        {/* Other Services Switcher */}
        {otherServices.length > 0 && (
          <div className="pt-12 border-t border-slate-900">
            <h3 className="text-xl font-bold font-display text-white mb-6">
              Explore Related Services
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {otherServices.slice(0, 3).map((os) => (
                <button
                  key={os.id}
                  onClick={() => onNavigate(`/services/${os.slug}`)}
                  className="p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 text-left transition-all group"
                >
                  <div className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors mb-1">
                    {os.title}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {os.description}
                  </p>
                  <span className="text-xs font-semibold text-emerald-400 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    <span>View Specifications</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
