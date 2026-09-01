import React from 'react';
import * as LucideIcons from 'lucide-react';
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
} from 'lucide-react';
import { usePublicData } from '../../context/PublicDataContext';
import { Service } from '../../types/index';

interface ServicesSectionProps {
  onNavigate?: (path: string) => void;
}

export function ServicesSection({ onNavigate }: ServicesSectionProps = {}) {
  const { services, isLoading } = usePublicData();

  const handleAction = (serviceSlug?: string) => {
    if (onNavigate && serviceSlug) {
      onNavigate(`/services/${serviceSlug}`);
    } else {
      const el = document.querySelector('#audit-form');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else if (onNavigate) {
        onNavigate('/contact');
      }
    }
  };

  return (
    <section id="services" className="py-20 md:py-28 relative overflow-hidden bg-slate-100/50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-900 transition-colors">
      {/* Background accents */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
            Specialized Offerings
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight mb-5">
            Engineered for <span className="text-emerald-500 dark:text-emerald-400">Maximum Conversion</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            From strategic video scripts that capture attention to frictionless checkout experiences that secure the sale.
          </p>
        </div>

        {/* Services Grid */}
        {isLoading && services.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass-panel rounded-2xl p-6 animate-pulse h-64">
                <div className="w-12 h-12 bg-slate-800 rounded-xl mb-4" />
                <div className="h-5 bg-slate-800 rounded w-3/4 mb-3" />
                <div className="h-4 bg-slate-800/60 rounded w-full mb-2" />
                <div className="h-4 bg-slate-800/60 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12 glass-panel rounded-2xl max-w-md mx-auto">
            <p className="text-slate-400 text-base">No services published yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service: Service, idx: number) => {
              const IconComponent = (LucideIcons as any)[service.iconName] || LucideIcons.Zap;
              return (
                <div
                  key={service.id}
                  id={`service-card-${service.slug || idx}`}
                  className="glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Subtle top indicator bar on hover */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div>
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 group-hover:border-emerald-500/40 flex items-center justify-center mb-5 text-emerald-400 shadow-sm group-hover:shadow-emerald-500/20 transition-all duration-300">
                      <IconComponent className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-white mb-2.5 font-display group-hover:text-emerald-300 transition-colors">
                      {service.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-slate-300 leading-relaxed mb-6 font-normal">
                      {service.description}
                    </p>

                    {/* Feature bullet list */}
                    {service.features && service.features.length > 0 && (
                      <ul className="space-y-2 mb-6 border-t border-slate-800/80 pt-4">
                        {service.features.map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2 text-xs text-slate-300">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <button
                    onClick={() => handleAction(service.slug)}
                    className="mt-auto inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 group-hover:text-emerald-300 pt-2 border-t border-slate-800/60 hover:gap-2.5 transition-all cursor-pointer"
                  >
                    <span>View Specifications &amp; Audit</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
