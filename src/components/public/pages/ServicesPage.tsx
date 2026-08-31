import React from 'react';
import {
  TrendingUp,
  Layout,
  CreditCard,
  Video,
  Smartphone,
  MessageSquare,
  SearchCheck,
  PenTool,
  Zap,
  Check,
  Layers,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { usePublicData } from '../../../context/PublicDataContext';
import { Service } from '../../../types/index';

interface ServicesPageProps {
  onNavigate: (path: string) => void;
}

const iconMap: Record<string, React.ElementType> = {
  TrendingUp,
  Layout,
  CreditCard,
  Video,
  Smartphone,
  MessageSquare,
  SearchCheck,
  PenTool,
  Zap,
  Layers,
};

export function ServicesPage({ onNavigate }: ServicesPageProps) {
  const { services, isLoading } = usePublicData();

  return (
    <div className="pt-28 pb-20 md:pt-36 md:pb-28">
      {/* Background Glows */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-emerald-500/10 blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Growth Engineering Catalog</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-display text-white tracking-tight mb-6">
            High-Converting <span className="text-emerald-400">Digital Services</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Every service is built around direct-response psychology, frictionless payments, and high-converting asset delivery.
          </p>
        </div>

        {/* Services Grid */}
        {isLoading && services.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-panel rounded-3xl p-8 animate-pulse h-80">
                <div className="w-14 h-14 bg-slate-800 rounded-2xl mb-6" />
                <div className="h-6 bg-slate-800 rounded w-3/4 mb-4" />
                <div className="h-4 bg-slate-800/60 rounded w-full mb-2" />
                <div className="h-4 bg-slate-800/60 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-3xl max-w-lg mx-auto">
            <p className="text-slate-400 text-base">No services currently published in the database.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service: Service, idx: number) => {
              const IconComponent = iconMap[service.iconName] || Zap;
              return (
                <div
                  key={service.id}
                  id={`services-page-card-${service.slug || idx}`}
                  className="glass-panel glass-panel-hover rounded-3xl p-8 flex flex-col justify-between group relative overflow-hidden border border-slate-800/90"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div>
                    {/* Icon and Slug Badge */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 group-hover:border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md group-hover:shadow-emerald-500/20 transition-all duration-300">
                        <IconComponent className="w-7 h-7 group-hover:scale-110 transition-transform duration-200" />
                      </div>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 bg-slate-900/90 px-3 py-1 rounded-full border border-slate-800">
                        {service.slug || `service-${idx + 1}`}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-white mb-3 font-display group-hover:text-emerald-300 transition-colors">
                      {service.title}
                    </h2>

                    {/* Description */}
                    <p className="text-sm text-slate-300 leading-relaxed mb-6">
                      {service.description}
                    </p>

                    {/* Features */}
                    {service.features && service.features.length > 0 && (
                      <div className="mb-6 border-t border-slate-800/80 pt-5 space-y-2.5">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Included Deliverables:
                        </div>
                        <ul className="space-y-2">
                          {service.features.map((feat, fIdx) => (
                            <li key={fIdx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-200">
                              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between gap-4">
                    <button
                      onClick={() => onNavigate(`/services/${service.slug}`)}
                      className="inline-flex items-center gap-2 text-sm font-bold text-emerald-400 group-hover:text-emerald-300 hover:gap-3 transition-all"
                    >
                      <span>Explore Full Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onNavigate('/contact')}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                    >
                      Inquire
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Banner */}
        <div className="mt-20 glass-panel rounded-3xl p-8 sm:p-12 border border-slate-800/90 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Tailored Architecture</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold font-display text-white mb-3">
            Need a Custom Funnel or Multi-Channel Integration?
          </h3>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto mb-8 leading-relaxed">
            We architect bespoke payment gateways, custom video angles, and high-ticket customer qualification systems.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('/contact')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all"
            >
              Request Free Funnel Audit
            </button>
            <button
              onClick={() => onNavigate('/pricing')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-sm transition-all"
            >
              View Transparent USD Pricing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
