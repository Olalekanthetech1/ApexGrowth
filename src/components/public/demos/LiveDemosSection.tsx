import React, { useState } from 'react';
import { VideoScriptDemo } from './VideoScriptDemo';
import { CheckoutSimulationDemo } from './CheckoutSimulationDemo';
import { usePublicData } from '../../../context/PublicDataContext';
import { Film, CreditCard, Sparkles } from 'lucide-react';

export function LiveDemosSection() {
  const { demos } = usePublicData();
  const [activeTab, setActiveTab] = useState<'video' | 'checkout'>('video');

  const videoDemo = demos.find((d) => d.type === 'video_ad_script');
  const checkoutDemo = demos.find((d) => d.type === 'checkout_sim');

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
        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl">
            <button
              id="switch-demo-video-tab"
              onClick={() => setActiveTab('video')}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'video'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>1. Video Ad Script Demo</span>
            </button>

            <button
              id="switch-demo-checkout-tab"
              onClick={() => setActiveTab('checkout')}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'checkout'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>2. Simulated Checkout Demo</span>
            </button>
          </div>
        </div>

        {/* Active Demo Panel */}
        <div className="max-w-5xl mx-auto">
          {activeTab === 'video' && (
            <VideoScriptDemo scenes={videoDemo?.config?.scenes} />
          )}

          {activeTab === 'checkout' && (
            <CheckoutSimulationDemo
              productTitle={checkoutDemo?.config?.productTitle || 'Conversion Launchpad Demo'}
              productPrice={checkoutDemo?.config?.productPrice || 249}
            />
          )}
        </div>
      </div>
    </section>
  );
}
