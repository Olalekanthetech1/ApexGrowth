import React, { useEffect, useState } from 'react';
import {
  Layers,
  Tag,
  Film,
  HelpCircle,
  Users,
  CreditCard,
  Plus,
  ArrowRight,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { api } from '../../lib/api';
import { DashboardStats, Lead } from '../../types/index';
import { AdminAIDashboard } from './AdminAIDashboard';

interface DashboardOverviewProps {
  onNavigate: (tab: string) => void;
  onOpenLead: (lead: Lead) => void;
}

export function DashboardOverview({ onNavigate, onOpenLead }: DashboardOverviewProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-900 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Active Services', value: stats?.activeServices || 0, icon: Layers, color: 'text-emerald-400', tab: 'services' },
    { label: 'Active Pricing Packages', value: stats?.activePackages || 0, icon: Tag, color: 'text-teal-400', tab: 'pricing' },
    { label: 'Published Demos', value: stats?.publishedDemos || 0, icon: Film, color: 'text-indigo-400', tab: 'demos' },
    { label: 'Published FAQs', value: stats?.publishedFaqs || 0, icon: HelpCircle, color: 'text-violet-400', tab: 'faq' },
    { label: 'New Leads', value: stats?.newLeads || 0, icon: Users, color: 'text-emerald-400', tab: 'leads', badge: stats?.newLeads ? 'Action Required' : undefined },
    { label: 'Active Payment Methods', value: stats?.activePaymentMethods || 0, icon: CreditCard, color: 'text-cyan-400', tab: 'payments' },
    { label: 'Total Leads', value: stats?.totalLeads || 0, icon: TrendingUp, color: 'text-blue-400', tab: 'leads' },
    { label: 'Won Leads', value: stats?.leadsByStatus?.won || 0, icon: CheckCircle2, color: 'text-emerald-400', tab: 'leads' },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
            System Overview &amp; Health
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time, database-driven management console for ApexGrowth Digital content, funnel assets, and sales pipeline.
          </p>
        </div>

        <button
          onClick={loadStats}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* Metrics Row (8 metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            onClick={() => onNavigate(card.tab)}
            className="glass-panel glass-panel-hover rounded-2xl p-5 cursor-pointer border border-slate-800 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">{card.label}</span>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white font-mono">{card.value}</div>
              {card.badge && (
                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                  {card.badge}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* AI Assistant Intelligence & Performance */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800">
        <AdminAIDashboard />
      </div>

      {/* Quick Action Shortcuts */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <button
            onClick={() => onNavigate('services')}
            className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/30 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add Service</span>
          </button>

          <button
            onClick={() => onNavigate('pricing')}
            className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/30 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add Pricing</span>
          </button>

          <button
            onClick={() => onNavigate('demos')}
            className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/30 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add Demo</span>
          </button>

          <button
            onClick={() => onNavigate('faq')}
            className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/30 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add FAQ</span>
          </button>

          <button
            onClick={() => onNavigate('orders')}
            className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/30 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
            <span>View Orders</span>
          </button>

          <button
            onClick={() => onNavigate('leads')}
            className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/30 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>View Leads</span>
          </button>

          <button
            onClick={() => onNavigate('business')}
            className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/30 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Edit Profile</span>
          </button>

          <button
            onClick={() => onNavigate('payments')}
            className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/30 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Payments</span>
          </button>
        </div>
      </div>

      {/* Two Column Section: Recent Leads & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Inbound Leads */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-bold text-white font-display">Recent Inbound Leads</h3>
              </div>
              <button
                onClick={() => onNavigate('leads')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                <span>View CRM</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {(!stats?.recentLeads || stats.recentLeads.length === 0) ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No leads have been submitted yet. Submissions from the public audit form will appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => onOpenLead(lead)}
                    className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-emerald-500/40 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{lead.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider bg-slate-800 text-slate-300">
                          {lead.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {lead.businessType} • Selling: {lead.sellingDetails.slice(0, 35)}...
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block font-mono">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-medium">{lead.utmSource || 'Direct'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Audit Log Stream */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <h3 className="text-base font-bold text-white font-display">System Audit Activity</h3>
            </div>
            <button
              onClick={() => onNavigate('activity')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Full Log
            </button>
          </div>

          <div className="space-y-3">
            {stats?.recentAuditLogs?.slice(0, 5).map((log) => (
              <div key={log.id} className="text-xs p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="font-bold text-slate-200">{log.action}</span>
                  <span className="font-mono text-[10px]">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-400 truncate">{log.details || log.entityType}</p>
                <span className="text-[10px] text-slate-400 font-mono mt-1 block">By: {log.adminEmail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
