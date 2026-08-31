import React, { useState } from 'react';
import { VideoScriptDemo } from './VideoScriptDemo';
import { CheckoutSimulationDemo } from './CheckoutSimulationDemo';
import { usePublicData } from '../../../context/PublicDataContext';
import { Film, CreditCard, Sparkles, Terminal, Code, Settings, ChevronRight } from 'lucide-react';

export function LiveDemosSection() {
  const { demos } = usePublicData();
  const activeDemos = (demos || []).filter((d) => d.active);

  // Default to first active demo ID, or fallback
  const [selectedDemoId, setSelectedDemoId] = useState<string | null>(null);

  const activeDemo = activeDemos.find((d) => d.id === selectedDemoId) || activeDemos[0];

  return (
    <section id="demos" className="py-20 md:py-28 relative overflow-hidden bg-slate-950/80">
      {/* Background glow accents */}
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[300px] bg-emerald-500/10 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-1/4 w-[400px] h-[300px] bg-indigo-600/10 blur-[130px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Proof of Work</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-display text-white tracking-tight mb-4">
            Live <span className="text-emerald-400">Conversion Demos</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
            Test the live psychological script structure and simulated multi-channel checkout flow built into our funnels.
          </p>
        </div>

        {/* Demo Switcher Tabs */}
        {activeDemos.length > 1 && (
          <div className="flex justify-center mb-10 overflow-x-auto px-2 max-w-full">
            <div className="inline-flex p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl gap-1">
              {activeDemos.map((d, index) => {
                const isSelected = d.id === activeDemo?.id;
                return (
                  <button
                    key={d.id}
                    id={`switch-demo-tab-${d.id}`}
                    onClick={() => setSelectedDemoId(d.id)}
                    className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                      isSelected
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    {d.type === 'video_ad_script' ? (
                      <Film className="w-4 h-4" />
                    ) : d.type === 'checkout_sim' ? (
                      <CreditCard className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>{index + 1}. {d.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Demo Panel */}
        <div className="max-w-5xl mx-auto">
          {activeDemo ? (
            <>
              {activeDemo.type === 'video_ad_script' && (
                <VideoScriptDemo scenes={activeDemo.config?.scenes} />
              )}

              {activeDemo.type === 'checkout_sim' && (
                <CheckoutSimulationDemo
                  productTitle={activeDemo.config?.productTitle || 'Conversion Launchpad Demo'}
                  productPrice={activeDemo.config?.productPrice || 249}
                />
              )}

              {activeDemo.type !== 'video_ad_script' && activeDemo.type !== 'checkout_sim' && (
                <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800/90 shadow-2xl space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
                        <Terminal className="w-3.5 h-3.5" />
                        <span>Interactive Custom Integration</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
                        {activeDemo.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400 mt-1">
                        {activeDemo.subtitle || 'Live JSON Configured Sandbox Playground'}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
                    {activeDemo.description}
                  </p>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-7 space-y-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                        <Code className="w-4 h-4" />
                        <span>Dynamic Schema Output Properties</span>
                      </div>
                      <div className="bg-slate-950 rounded-xl p-4 border border-slate-850 font-mono text-xs text-slate-300 overflow-x-auto">
                        <pre className="text-emerald-300">
                          {JSON.stringify(activeDemo.config || {}, null, 2)}
                        </pre>
                      </div>
                    </div>

                    <div className="lg:col-span-5 bg-slate-900/50 rounded-xl p-5 border border-slate-800 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-2">
                          <Settings className="w-4 h-4 text-emerald-400" />
                          <span>Interactive Parameters</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                          This dynamic schema is processed in real-time across the client application. Adjust these parameters inside the Admin Workspace.
                        </p>
                        <div className="space-y-2.5">
                          {Object.entries(activeDemo.config || {}).map(([key, val]) => (
                            <div key={key} className="flex items-center justify-between text-xs p-2.5 rounded bg-slate-950 border border-slate-850/60">
                              <span className="font-mono text-slate-400 font-semibold">{key}:</span>
                              <span className="font-mono text-emerald-400 truncate max-w-[150px]" title={String(val)}>
                                {typeof val === 'object' ? 'JSON Object' : String(val)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-500 bg-slate-950/40 p-2.5 rounded border border-slate-850/40">
                        ⚡ Updates rendered here instantly reflect real-time modifications made in your Neon PostgreSQL database.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center p-12 text-slate-500 bg-slate-900/40 border border-slate-800 rounded-3xl">
              No interactive showcases are currently marked as active. Update your settings in the Admin Operations Workspace.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

