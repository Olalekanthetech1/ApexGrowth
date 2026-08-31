import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { usePublicData } from '../../context/PublicDataContext';
import { FAQ } from '../../types/index';

export function FAQSection() {
  const { faqs } = usePublicData();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 md:py-28 relative bg-slate-950/80 border-t border-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-display text-white tracking-tight mb-4">
            Frequently Asked <span className="text-emerald-400">Questions</span>
          </h2>
          <p className="text-base text-slate-400 max-w-xl mx-auto">
            Everything you need to know about our turnaround, revision policy, and integration architecture.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq: FAQ, idx: number) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={faq.id || idx}
                id={`faq-item-${idx}`}
                className={`glass-panel rounded-2xl transition-all duration-200 border ${
                  isOpen ? 'border-emerald-500/50 bg-slate-900/90 shadow-lg shadow-emerald-500/5' : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="text-base sm:text-lg font-bold text-white font-display">
                    {faq.question}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-emerald-400 border-emerald-500/40' : ''
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-sm sm:text-base text-slate-300 leading-relaxed border-t border-slate-800/60 animate-in fade-in duration-200">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
