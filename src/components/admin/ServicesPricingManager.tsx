import React, { useState } from 'react';
import { Layers, Tag } from 'lucide-react';
import { ServicesManager } from './ServicesManager';
import { PricingManager } from './PricingManager';

export function ServicesPricingManager() {
  const [activeSubTab, setActiveSubTab] = useState<'services' | 'pricing'>('services');

  return (
    <div className="space-y-6">
      {/* Sub tabs navigation */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveSubTab('services')}
          className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold transition-all border-b-2 -mb-px ${
            activeSubTab === 'services'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Services Pillars</span>
        </button>

        <button
          onClick={() => setActiveSubTab('pricing')}
          className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold transition-all border-b-2 -mb-px ${
            activeSubTab === 'pricing'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Pricing Packages</span>
        </button>
      </div>

      <div>
        {activeSubTab === 'services' ? <ServicesManager /> : <PricingManager />}
      </div>
    </div>
  );
}
