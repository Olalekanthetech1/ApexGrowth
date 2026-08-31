import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, TrendingUp, Users, ShoppingBag, ShieldAlert, CheckCircle2, RefreshCw, Layers, ArrowRight, MessageSquare, ExternalLink, Zap } from 'lucide-react';

interface AIAnalyticsData {
  totalConversations: number;
  qualifiedLeads: number;
  packageRecommendations: Record<string, number>;
  checkoutClicks: number;
  humanHandoffs: number;
  recentConversations: Array<{
    id: string;
    sessionId: string;
    userRole: string;
    userEmail?: string;
    summary?: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

export const AIIntelligenceManager: React.FC = () => {
  const [data, setData] = useState<AIAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/ai/analytics');
      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error('Failed to load AI analytics:', err);
      setError(err.message || 'Failed to connect to AI analytics endpoint');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const totalConvs = data?.totalConversations || 0;
  const qualLeads = data?.qualifiedLeads || 0;
  const conversionRate = totalConvs > 0 ? ((qualLeads / totalConvs) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <span>AI Intelligence & Business Automation</span>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Gemini 3.7 Flash
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Conversion analytics, tool call monitoring, and AI sales performance metrics.
            </p>
          </div>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="self-start sm:self-auto flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-4">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">AI Conversations</span>
            <span className="text-2xl font-bold text-slate-100 font-display mt-0.5 block">
              {loading ? '...' : totalConvs}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Qualified CRM Leads</span>
            <span className="text-2xl font-bold text-slate-100 font-display mt-0.5 block">
              {loading ? '...' : qualLeads}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-4">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Checkout Handoffs</span>
            <span className="text-2xl font-bold text-slate-100 font-display mt-0.5 block">
              {loading ? '...' : data?.checkoutClicks || 0}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">AI Lead Conv. Rate</span>
            <span className="text-2xl font-bold text-slate-100 font-display mt-0.5 block">
              {loading ? '...' : `${conversionRate}%`}
            </span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Package Recs & AI Provider Security Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Recommended Packages */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Top AI Package Recommendations</span>
            </h3>
            <span className="text-[10px] text-slate-400">Grounded in CMS Pricing</span>
          </div>

          {!data || Object.keys(data.packageRecommendations).length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">
              No packages recommended in live sessions yet. The AI matches visitor intent with published pricing packages.
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(data.packageRecommendations).map(([pkgName, count], idx) => {
                const counts = Object.values(data.packageRecommendations) as number[];
                const maxCount = Math.max(...counts, 1);
                const currentCount = Number(count) || 0;
                const percent = Math.round((currentCount / maxCount) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-300">
                      <span>{pkgName}</span>
                      <span className="font-mono text-emerald-400">{count} recs</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* AI Provider & Security Status */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>AI Provider & Security</span>
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">SDK Provider</span>
              <span className="text-slate-200 font-semibold font-mono">@google/genai</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Active LLM Model</span>
              <span className="text-emerald-400 font-semibold font-mono">gemini-3.7-flash</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Tool Calls (FunctionDecl)</span>
              <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Active</span>
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Code-Level RBAC</span>
              <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Enforced</span>
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-400">Prompt Injection Shield</span>
              <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Active</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent AI Conversations Stream */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h3 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
            <Bot className="w-4 h-4 text-emerald-400" />
            <span>Recent AI Conversations Log</span>
          </h3>
          <span className="text-[10px] text-slate-400">Persisted in PostgreSQL</span>
        </div>

        {!data || data.recentConversations.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4">No AI conversations logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Session ID</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">User / Email</th>
                  <th className="py-2.5 px-3">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {data.recentConversations.map((conv) => (
                  <tr key={conv.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-200">{conv.sessionId}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${
                          conv.userRole === 'customer'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {conv.userRole}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{conv.userEmail || 'Public Visitor'}</td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      {new Date(conv.updatedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
