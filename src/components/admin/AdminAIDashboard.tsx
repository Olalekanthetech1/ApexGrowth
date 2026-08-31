import React, { useEffect, useState } from 'react';
import { Bot, Sparkles, MessageSquare, Users, ShoppingCart, ArrowUpRight, Loader2, RefreshCw } from 'lucide-react';
import { AiAnalytics } from '../../types';

export const AdminAIDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AiAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/admin/ai/analytics', {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      if (!res.ok) {
        throw new Error('Failed to load AI analytics');
      }
      const data = await res.json();
      setAnalytics(data);
    } catch (err: any) {
      setError(err.message || 'Error loading analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-6 rounded-2xl glass-panel flex items-center justify-center space-x-3 text-slate-400 text-sm">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
        <span>Loading AI Lead Intelligence & Analytics...</span>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-6 rounded-2xl glass-panel text-slate-400 text-xs flex items-center justify-between">
        <span>AI Analytics currently unavailable for this user role.</span>
        <button onClick={fetchAnalytics} className="p-1.5 rounded-lg bg-slate-800 hover:text-white">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-slate-100">AI Assistant Performance & Lead Intelligence</h2>
        </div>
        <button
          onClick={fetchAnalytics}
          className="p-1.5 text-xs text-slate-400 hover:text-emerald-400 flex items-center space-x-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>AI Chats</span>
            <MessageSquare className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-100">{analytics.totalConversations}</div>
          <p className="text-[10px] text-slate-500">Public user sessions</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Qualified Leads</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">{analytics.qualifiedLeads}</div>
          <p className="text-[10px] text-slate-500">Captured in CRM</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Checkout Clicks</span>
            <ShoppingCart className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-purple-300">{analytics.checkoutClicks}</div>
          <p className="text-[10px] text-slate-500">Guided to payment</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Human Handoffs</span>
            <Bot className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400">{analytics.humanHandoffs}</div>
          <p className="text-[10px] text-slate-500">WhatsApp redirects</p>
        </div>
      </div>

      {/* Recommendations Breakdown */}
      {Object.keys(analytics.packageRecommendations).length > 0 && (
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Top AI Package Recommendations</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {Object.entries(analytics.packageRecommendations).map(([pkg, count]) => (
              <div key={pkg} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">{pkg}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[11px] border border-emerald-500/20">
                  {count} recommendations
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
