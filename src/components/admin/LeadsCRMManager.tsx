import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Eye,
  Trash2,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Mail,
  Phone,
  Globe,
  Plus,
  Send,
  X,
  Clock,
  Tag,
  Loader2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Lead } from '../../types/index';
import { useAuth } from '../../context/AuthContext';

interface LeadsCRMManagerProps {
  initialSelectedLead?: Lead | null;
}

export function LeadsCRMManager({ initialSelectedLead }: LeadsCRMManagerProps) {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(initialSelectedLead || null);
  const [newNoteText, setNewNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadLeads();
  }, [statusFilter]);

  useEffect(() => {
    if (initialSelectedLead) {
      setSelectedLead(initialSelectedLead);
    }
  }, [initialSelectedLead]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const data = await api.getLeads(statusFilter);
      setLeads(data);
      if (selectedLead) {
        const refreshed = data.find((l) => l.id === selectedLead.id);
        if (refreshed) setSelectedLead(refreshed);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load leads' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: any) => {
    try {
      const updated = await api.updateLeadStatus(leadId, newStatus);
      setFeedback({ type: 'success', text: `Lead status updated to ${newStatus.toUpperCase()}` });
      setSelectedLead(updated);
      await loadLeads();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update status' });
    } finally {
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !newNoteText.trim()) return;
    setSavingNote(true);

    try {
      const updated = await api.addLeadNote(selectedLead.id, newNoteText.trim());
      setSelectedLead(updated);
      setNewNoteText('');
      setFeedback({ type: 'success', text: 'Internal note added' });
      await loadLeads();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to save note' });
    } finally {
      setSavingNote(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleDeleteLead = async (leadId: string, leadName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete lead "${leadName}"?`)) return;
    try {
      await api.deleteLead(leadId);
      setFeedback({ type: 'success', text: 'Lead deleted' });
      if (selectedLead?.id === leadId) setSelectedLead(null);
      await loadLeads();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete lead' });
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const q = searchQuery.toLowerCase();
    return (
      lead.name.toLowerCase().includes(q) ||
      lead.email.toLowerCase().includes(q) ||
      lead.businessType.toLowerCase().includes(q) ||
      lead.sellingDetails.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'contacted':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'qualified':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'proposal':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'won':
        return 'bg-emerald-400 text-slate-950 font-bold border-transparent';
      case 'lost':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Lead Capture CRM &amp; Funnel Audits</h1>
          <p className="text-sm text-slate-400 mt-1">
            Review inbound inquiries, inspect UTM marketing attribution, and track deal pipeline progress.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/80 border border-red-500/40 text-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leads by name, email, product or business..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['all', 'new', 'contacted', 'qualified', 'proposal', 'won', 'lost'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Leads List & Lead Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Leads Table/Cards */}
        <div className={`${selectedLead ? 'lg:col-span-6' : 'lg:col-span-12'} space-y-3`}>
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Loading lead pipeline...</div>
          ) : filteredLeads.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center text-slate-400">
              No leads found matching current criteria.
            </div>
          ) : (
            filteredLeads.map((lead) => {
              const isSelected = selectedLead?.id === lead.id;
              return (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className={`glass-panel rounded-2xl p-5 border cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-emerald-500 bg-slate-900/90 shadow-xl shadow-emerald-500/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{lead.name}</span>
                        {lead.utmSource && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono">
                            {lead.utmSource}
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-400">{lead.email} • {lead.whatsapp}</p>
                    </div>

                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full uppercase font-bold tracking-wider border ${getStatusBadge(
                        lead.status
                      )}`}
                    >
                      {lead.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 mb-3">
                    <span className="text-slate-500 font-medium">Selling: </span>
                    <span className="font-semibold text-white">{lead.sellingDetails}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
                    <span>{lead.businessType}</span>
                    <span className="font-mono">{new Date(lead.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Lead Detail Drawer */}
        {selectedLead && (
          <div className="lg:col-span-6 glass-panel rounded-2xl p-6 border border-slate-800 bg-slate-900/95 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Lead Dossier</span>
                <h3 className="text-xl font-bold text-white font-display">{selectedLead.name}</h3>
                <p className="text-xs text-slate-400 font-mono">ID: {selectedLead.id}</p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions & Status Selector */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Pipeline Status</label>
                <select
                  value={selectedLead.status}
                  onChange={(e) => handleStatusChange(selectedLead.id, e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
                >
                  <option value="new">NEW INQUIRY</option>
                  <option value="contacted">CONTACTED</option>
                  <option value="qualified">QUALIFIED</option>
                  <option value="proposal">PROPOSAL SENT</option>
                  <option value="won">DEAL WON / CONVERTED</option>
                  <option value="lost">CLOSED / LOST</option>
                </select>
              </div>

              {selectedLead.whatsapp && (
                <a
                  href={`https://wa.me/${selectedLead.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Hi ${selectedLead.name}, this is ApexGrowth Digital regarding your Free Funnel Audit request.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold text-xs flex items-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Lead</span>
                </a>
              )}

              <button
                onClick={() => handleDeleteLead(selectedLead.id, selectedLead.name)}
                className="mt-4 p-2 rounded-xl bg-slate-950 hover:bg-red-950/40 border border-slate-800 text-slate-400 hover:text-red-400"
                title="Delete Lead"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Inbound Details */}
            <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[11px]">Email Address</span>
                  <a href={`mailto:${selectedLead.email}`} className="text-emerald-400 hover:underline">
                    {selectedLead.email}
                  </a>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Phone / WhatsApp</span>
                  <span className="text-white font-mono">{selectedLead.whatsapp}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                <div>
                  <span className="text-slate-400 block text-[11px]">Business Category</span>
                  <span className="text-white">{selectedLead.businessType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Website / Funnel URL</span>
                  {selectedLead.websiteUrl ? (
                    <a
                      href={selectedLead.websiteUrl.startsWith('http') ? selectedLead.websiteUrl : `https://${selectedLead.websiteUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:underline flex items-center gap-1 truncate"
                    >
                      <Globe className="w-3 h-3 shrink-0" />
                      <span className="truncate">{selectedLead.websiteUrl}</span>
                    </a>
                  ) : (
                    <span className="text-slate-500">None Provided</span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-slate-400 block text-[11px] mb-1">What They Are Selling</span>
                <p className="text-white font-semibold">{selectedLead.sellingDetails}</p>
              </div>

              {selectedLead.message && (
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400 block text-[11px] mb-1">Project Message</span>
                  <p className="text-slate-300 leading-relaxed">{selectedLead.message}</p>
                </div>
              )}
            </div>

            {/* Marketing Attribution & UTM Info */}
            <div className="space-y-2 bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                Campaign &amp; Traffic Attribution
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400">UTM Source:</span>{' '}
                  <span className="text-white font-mono">{selectedLead.utmSource || 'direct'}</span>
                </div>
                <div>
                  <span className="text-slate-400">UTM Medium:</span>{' '}
                  <span className="text-white font-mono">{selectedLead.utmMedium || 'none'}</span>
                </div>
                <div>
                  <span className="text-slate-400">UTM Campaign:</span>{' '}
                  <span className="text-white font-mono">{selectedLead.utmCampaign || 'none'}</span>
                </div>
                <div>
                  <span className="text-slate-400">UTM Content:</span>{' '}
                  <span className="text-white font-mono">{selectedLead.utmContent || 'none'}</span>
                </div>
              </div>
              <div className="pt-2 text-[10px] text-slate-500 truncate">
                Landing Page: {selectedLead.landingPage || '/'}
              </div>
            </div>

            {/* Internal Notes Timeline */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                Internal Audit Notes &amp; Activity
              </span>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(!selectedLead.notes || selectedLead.notes.length === 0) ? (
                  <p className="text-xs text-slate-500 italic">No notes recorded for this lead.</p>
                ) : (
                  selectedLead.notes.map((note) => (
                    <div key={note.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-400 text-[10px]">
                        <span className="font-bold text-slate-300">{note.author}</span>
                        <span className="font-mono">{new Date(note.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-200">{note.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Note Input */}
              <form onSubmit={handleAddNote} className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Add internal note (e.g. Sent Loom audit link)..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
                <button
                  type="submit"
                  disabled={savingNote || !newNoteText.trim()}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  {savingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  <span>Add</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
