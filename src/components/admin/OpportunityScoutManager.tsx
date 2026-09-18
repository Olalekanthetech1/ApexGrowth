import React, { useState, useEffect } from 'react';
import {
  Radar,
  Send,
  CheckCircle2,
  XCircle,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Mail,
  Instagram,
  Phone,
  Twitter,
  Globe,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  Copy,
  Sliders,
  Check,
  Search,
  Play,
  Pause,
  Bot,
  ArrowRight,
  Info,
  Clock,
  ChevronRight,
  FileCheck,
  Briefcase,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Opportunity, ScoutSettings, OutreachStatus, OpportunityScore } from '../../types';

export const OpportunityScoutManager: React.FC = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [settings, setSettings] = useState<ScoutSettings | null>(null);
  const [stats, setStats] = useState({ total: 0, drafted: 0, approved: 0, sent: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [runningDiscovery, setRunningDiscovery] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | OutreachStatus>('ALL');
  const [scoreFilter, setScoreFilter] = useState<'ALL' | OpportunityScore>('ALL');

  // Modals & Panels
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [refineModalOpp, setRefineModalOpp] = useState<Opportunity | null>(null);
  const [refineFeedback, setRefineFeedback] = useState('');
  const [refining, setRefining] = useState(false);

  // Audit form state
  const [auditUrl, setAuditUrl] = useState('');
  const [auditProspect, setAuditProspect] = useState('');
  const [auditing, setAuditing] = useState(false);

  // Settings form state
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [tavilyApiKey, setTavilyApiKey] = useState('');
  const [tavilyEnabled, setTavilyEnabled] = useState(true);
  const [workerEnabled, setWorkerEnabled] = useState(true);
  const [intervalMinutes, setIntervalMinutes] = useState(60);

  // Dynamic AI Provider States (Groq, Mistral, Nvidia, Gemini, Custom)
  const [aiProvider, setAiProvider] = useState<'gemini' | 'groq' | 'mistral' | 'nvidia' | 'custom'>('gemini');
  const [aiModel, setAiModel] = useState('gemini-2.5-flash');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [groqApiKey, setGroqApiKey] = useState('');
  const [mistralApiKey, setMistralApiKey] = useState('');
  const [nvidiaApiKey, setNvidiaApiKey] = useState('');
  const [secondaryAiApiKey, setSecondaryAiApiKey] = useState('');
  const [secondaryAiBaseUrl, setSecondaryAiBaseUrl] = useState('');
  const [aiTemperature, setAiTemperature] = useState(70);

  // Email Provider States (Gmail SMTP vs Resend)
  const [emailProvider, setEmailProvider] = useState<'gmail' | 'resend'>('gmail');
  const [gmailUser, setGmailUser] = useState('');
  const [gmailAppPassword, setGmailAppPassword] = useState('');
  const [resendApiKey, setResendApiKey] = useState('');
  const [resendFromEmail, setResendFromEmail] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  // Dynamic model lists fetched live from API
  const [availableModels, setAvailableModels] = useState<Array<{ id: string; name?: string }>>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [testingAi, setTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [savingSettings, setSavingSettings] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [testingTavily, setTestingTavily] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [opps, st, stg] = await Promise.all([
        api.getOpportunities(),
        api.getScoutStats(),
        api.getScoutSettings(),
      ]);
      setOpportunities(opps);
      setStats(st);
      setSettings(stg);
      setBotToken(stg.telegramBotToken || '');
      setChatId(stg.telegramChatId || '');
      setTelegramEnabled(stg.telegramEnabled);
      setTavilyApiKey(stg.tavilyApiKey || '');
      setTavilyEnabled(stg.tavilyEnabled ?? true);
      setWorkerEnabled(stg.autonomousWorkerEnabled);
      setIntervalMinutes(stg.runIntervalMinutes || 60);

      // AI Provider settings
      setAiProvider(stg.aiProvider || 'gemini');
      setAiModel(stg.aiModel || 'gemini-2.5-flash');
      setGeminiApiKey(stg.geminiApiKey || '');
      setGroqApiKey(stg.groqApiKey || '');
      setMistralApiKey(stg.mistralApiKey || '');
      setNvidiaApiKey(stg.nvidiaApiKey || '');
      setSecondaryAiApiKey(stg.secondaryAiApiKey || '');
      setSecondaryAiBaseUrl(stg.secondaryAiBaseUrl || '');
      setAiTemperature(stg.aiTemperature ?? 70);

      // Email Provider settings
      setEmailProvider(stg.emailProvider || 'gmail');
      setGmailUser(stg.gmailUser || '');
      setGmailAppPassword(stg.gmailAppPassword ? '••••••••••••••••' : '');
      setResendApiKey(stg.resendApiKey ? '••••••••••••••••' : '');
      setResendFromEmail(stg.resendFromEmail || 'ApexGrowth Growth Team <onboarding@resend.dev>');
    } catch (err: any) {
      showToast(err?.message || 'Failed to load opportunity scout data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async (providerToTest: 'gmail' | 'resend') => {
    setTestingEmail(true);
    setEmailTestResult(null);
    try {
      const isMaskedGmail = gmailAppPassword === '••••••••••••••••';
      const isMaskedResend = resendApiKey === '••••••••••••••••';

      const res = await api.testEmailConnection({
        provider: providerToTest,
        gmailUser: gmailUser.trim(),
        gmailAppPassword: isMaskedGmail ? undefined : gmailAppPassword.trim(),
        resendApiKey: isMaskedResend ? undefined : resendApiKey.trim(),
      });
      setEmailTestResult(res);
      if (res.success) {
        showToast(res.message || `${providerToTest === 'gmail' ? 'Gmail SMTP' : 'Resend'} connection verified!`, 'success');
      } else {
        showToast(res.message || `${providerToTest === 'gmail' ? 'Gmail SMTP' : 'Resend'} test failed`, 'error');
      }
    } catch (err: any) {
      const msg = err?.message || 'Email connection test failed';
      setEmailTestResult({ success: false, message: msg });
      showToast(msg, 'error');
    } finally {
      setTestingEmail(false);
    }
  };

  const handleDispatchOutreach = async (id: string) => {
    const opp = opportunities.find((o) => o.id === id);
    if (opp && !opp.isVerifiedOpportunity) {
      showToast('Opportunity must pass the Intelligence Gate before dispatching', 'error');
      return;
    }
    setDispatchingId(id);
    try {
      const res = await api.dispatchOpportunity(id);
      if (res.opportunity) {
        setOpportunities((prev) => prev.map((o) => (o.id === id ? res.opportunity! : o)));
      }
      if (res.success) {
        const provName = res.provider === 'gmail' ? 'Gmail SMTP' : res.provider === 'resend' ? 'Resend' : 'Email';
        showToast(`Outreach successfully sent via ${provName}! Message ID: ${res.messageId}`, 'success');
      } else if (res.alreadySent) {
        showToast('Outreach was already dispatched to this prospect.', 'error');
      } else {
        showToast(`Dispatch failed: ${res.error || 'Check email provider credentials'}`, 'error');
      }
      await loadData();
    } catch (err: any) {
      showToast(err?.message || 'Outreach dispatch failed', 'error');
    } finally {
      setDispatchingId(null);
    }
  };

  const handleFetchLiveModels = async () => {
    const activeKey =
      aiProvider === 'gemini'
        ? geminiApiKey
        : aiProvider === 'groq'
        ? groqApiKey
        : aiProvider === 'mistral'
        ? mistralApiKey
        : aiProvider === 'nvidia'
        ? nvidiaApiKey
        : secondaryAiApiKey;

    setFetchingModels(true);
    try {
      const res = await api.fetchAiModels(aiProvider, activeKey, secondaryAiBaseUrl);
      if (res.success && res.models && res.models.length > 0) {
        setAvailableModels(res.models);
        showToast(`Fetched ${res.models.length} live models from ${aiProvider.toUpperCase()}!`, 'success');
      } else {
        showToast(res.error || `No models returned from ${aiProvider}`, 'error');
      }
    } catch (err: any) {
      showToast(err?.message || `Failed to fetch live models from ${aiProvider}`, 'error');
    } finally {
      setFetchingModels(false);
    }
  };

  const handleTestAiProvider = async () => {
    const activeKey =
      aiProvider === 'gemini'
        ? geminiApiKey
        : aiProvider === 'groq'
        ? groqApiKey
        : aiProvider === 'mistral'
        ? mistralApiKey
        : aiProvider === 'nvidia'
        ? nvidiaApiKey
        : secondaryAiApiKey;

    setTestingAi(true);
    setAiTestResult(null);
    try {
      const res = await api.testAiProvider(aiProvider, activeKey, aiModel, secondaryAiBaseUrl);
      setAiTestResult(res);
      if (res.success) {
        showToast(res.message || `${aiProvider.toUpperCase()} connection verified!`, 'success');
      } else {
        showToast(res.message || `${aiProvider.toUpperCase()} test failed`, 'error');
      }
    } catch (err: any) {
      const msg = err?.message || 'AI provider test failed';
      setAiTestResult({ success: false, message: msg });
      showToast(msg, 'error');
    } finally {
      setTestingAi(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTriggerDiscovery = async () => {
    setRunningDiscovery(true);
    try {
      const res = await api.triggerScoutRun();
      showToast(
        `Scout scan completed! Discovered ${res.result.candidatesDiscovered} candidates, created ${res.result.opportunitiesCreated} dossiers.`,
        'success'
      );
      await loadData();
    } catch (err: any) {
      showToast(err?.message || 'Discovery run failed', 'error');
    } finally {
      setRunningDiscovery(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await api.approveOpportunity(id);
      setOpportunities((prev) => prev.map((o) => (o.id === id ? res.opportunity : o)));
      setStats((prev) => ({ ...prev, drafted: Math.max(0, prev.drafted - 1), approved: prev.approved + 1 }));
      showToast('Opportunity approved for outreach!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Approval failed', 'error');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await api.rejectOpportunity(id);
      setOpportunities((prev) => prev.map((o) => (o.id === id ? res.opportunity : o)));
      setStats((prev) => ({ ...prev, drafted: Math.max(0, prev.drafted - 1), rejected: prev.rejected + 1 }));
      showToast('Opportunity rejected', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Rejection failed', 'error');
    }
  };

  const handleMarkSent = async (id: string) => {
    try {
      const res = await api.markOpportunitySent(id);
      setOpportunities((prev) => prev.map((o) => (o.id === id ? res.opportunity : o)));
      setStats((prev) => ({ ...prev, approved: Math.max(0, prev.approved - 1), sent: prev.sent + 1 }));
      showToast('Outreach marked as sent!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to mark as sent', 'error');
    }
  };

  const handleRefineSubmit = async () => {
    if (!refineModalOpp || !refineFeedback.trim()) return;
    setRefining(true);
    try {
      const res = await api.refineOpportunity(refineModalOpp.id, refineFeedback);
      setOpportunities((prev) => prev.map((o) => (o.id === refineModalOpp.id ? res.opportunity : o)));
      showToast('Outreach draft refined by Copilot Intelligence!', 'success');
      setRefineModalOpp(null);
      setRefineFeedback('');
    } catch (err: any) {
      showToast(err?.message || 'Draft refinement failed', 'error');
    } finally {
      setRefining(false);
    }
  };

  const handleAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditUrl.trim()) return;
    setAuditing(true);
    try {
      const res = await api.auditWebsiteUrl(auditUrl, auditProspect || undefined);
      showToast(`Audit completed for ${res.opportunity.businessName}! Dossier created.`, 'success');
      setAuditModalOpen(false);
      setAuditUrl('');
      setAuditProspect('');
      await loadData();
    } catch (err: any) {
      showToast(err?.message || 'Audit failed', 'error');
    } finally {
      setAuditing(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const isMaskedGmail = gmailAppPassword === '••••••••••••••••';
      const isMaskedResend = resendApiKey === '••••••••••••••••';

      const updated = await api.updateScoutSettings({
        telegramBotToken: botToken,
        telegramChatId: chatId,
        telegramEnabled,
        tavilyApiKey: tavilyApiKey.trim(),
        tavilyEnabled,
        autonomousWorkerEnabled: workerEnabled,
        runIntervalMinutes: Number(intervalMinutes),
        aiProvider,
        aiModel: aiModel.trim(),
        geminiApiKey: geminiApiKey.trim(),
        groqApiKey: groqApiKey.trim(),
        mistralApiKey: mistralApiKey.trim(),
        nvidiaApiKey: nvidiaApiKey.trim(),
        secondaryAiApiKey: secondaryAiApiKey.trim(),
        secondaryAiBaseUrl: secondaryAiBaseUrl.trim(),
        aiTemperature: Number(aiTemperature),
        emailProvider,
        gmailUser: gmailUser.trim(),
        gmailAppPassword: isMaskedGmail ? undefined : gmailAppPassword.trim(),
        resendApiKey: isMaskedResend ? undefined : resendApiKey.trim(),
        resendFromEmail: resendFromEmail.trim(),
      });
      setSettings(updated);
      showToast('Scout, Email Provider & AI settings saved successfully!', 'success');
      setSettingsModalOpen(false);
    } catch (err: any) {
      showToast(err?.message || 'Failed to save settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTestTavily = async () => {
    if (!tavilyApiKey.trim()) {
      showToast('Please provide a Tavily API key first', 'error');
      return;
    }
    setTestingTavily(true);
    try {
      const res = await api.testTavilySearch(tavilyApiKey.trim());
      showToast(res.message || 'Tavily search connection verified!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Tavily search test failed', 'error');
    } finally {
      setTestingTavily(false);
    }
  };

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    try {
      const res = await api.sendTestTelegramAlert();
      showToast(res.message || 'Telegram test alert dispatched!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to send Telegram test alert. Check token and Chat ID.', 'error');
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleCopyDraft = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Outreach draft copied to clipboard!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter logic
  const filteredOpportunities = opportunities.filter((opp) => {
    if (activeTab !== 'ALL' && opp.outreachStatus !== activeTab) {
      // Treat REFINED as part of DRAFTED review queue if on DRAFTED tab
      if (activeTab === 'DRAFTED' && opp.outreachStatus === 'REFINED') return true;
      return false;
    }
    if (scoreFilter !== 'ALL' && opp.opportunityScore !== scoreFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/90 border-red-500/40 text-red-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span className="text-sm font-medium">{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner & Control Deck */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                <Radar className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                Copilot Ally Scout System
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                  settings?.autonomousWorkerEnabled
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    settings?.autonomousWorkerEnabled ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                  }`}
                />
                {settings?.autonomousWorkerEnabled ? '24/7 Autonomous Scout: ACTIVE' : 'Autonomous Scout: PAUSED'}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                  settings?.telegramEnabled
                    ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                    : 'bg-slate-700/40 text-slate-400 border-slate-600/40'
                }`}
              >
                <Send className="w-3 h-3 text-sky-400" />
                Telegram Alert Bot: {settings?.telegramEnabled ? 'Connected' : 'Disabled'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-purple-500/15 text-purple-300 border-purple-500/30">
                <Sparkles className="w-3 h-3 text-purple-400" />
                AI Engine: {(settings?.aiProvider || 'gemini').toUpperCase()} ({settings?.aiModel || 'gemini-2.5-flash'})
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              Opportunity Scout & Lead Intelligence
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
              Decoupled 3-layer architecture: Autonomous 24/7 Discovery → Objective Evidence & Contact Provenance →
              Human-in-the-Loop Review. No unsolicited cold blasts. Review and refine directly from your phone on
              Telegram or here in the web console.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setAuditModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600/50 text-sm font-medium transition shadow-sm active:scale-95"
            >
              <Search className="w-4 h-4 text-indigo-400" />
              Audit Any Website
            </button>
            <button
              onClick={handleTriggerDiscovery}
              disabled={runningDiscovery}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition shadow-lg shadow-indigo-600/30 active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${runningDiscovery ? 'animate-spin' : ''}`} />
              {runningDiscovery ? 'Scanning Web & Forums...' : 'Scan For Opportunities Now'}
            </button>
            <button
              onClick={() => setSettingsModalOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-sm font-medium transition"
              title="Configure Telegram Bot & 24/7 Scheduler"
            >
              <Sliders className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-indigo-500/20">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Scouted</div>
            <div className="text-2xl font-bold text-white mt-1">{stats.total}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Discovered via 24/7 engine</div>
          </div>
          <div className="bg-slate-900/60 border border-amber-500/20 rounded-xl p-3.5">
            <div className="text-xs text-amber-400 font-medium uppercase tracking-wider">Awaiting Review</div>
            <div className="text-2xl font-bold text-amber-300 mt-1">{stats.drafted}</div>
            <div className="text-[11px] text-amber-400/80 mt-0.5">Ready for operator check</div>
          </div>
          <div className="bg-slate-900/60 border border-emerald-500/20 rounded-xl p-3.5">
            <div className="text-xs text-emerald-400 font-medium uppercase tracking-wider">Approved for Outreach</div>
            <div className="text-2xl font-bold text-emerald-300 mt-1">{stats.approved}</div>
            <div className="text-[11px] text-emerald-400/80 mt-0.5">Operator approved</div>
          </div>
          <div className="bg-slate-900/60 border border-sky-500/20 rounded-xl p-3.5">
            <div className="text-xs text-sky-400 font-medium uppercase tracking-wider">Outreach Executed</div>
            <div className="text-2xl font-bold text-sky-300 mt-1">{stats.sent}</div>
            <div className="text-[11px] text-sky-400/80 mt-0.5">Direct channel engaged</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs and Score Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              activeTab === 'ALL'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            All Leads ({opportunities.length})
          </button>
          <button
            onClick={() => setActiveTab('DRAFTED')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'DRAFTED'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Awaiting Review ({stats.drafted})
          </button>
          <button
            onClick={() => setActiveTab('APPROVED')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'APPROVED'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Approved ({stats.approved})
          </button>
          <button
            onClick={() => setActiveTab('SENT')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              activeTab === 'SENT'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Sent ({stats.sent})
          </button>
          <button
            onClick={() => setActiveTab('REJECTED')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              activeTab === 'REJECTED'
                ? 'bg-slate-700 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Rejected ({stats.rejected})
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400 font-medium">Score:</span>
          <select
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Scores</option>
            <option value="HIGH">High Intent Only</option>
            <option value="MEDIUM">Medium Intent</option>
            <option value="LOW">Low Intent</option>
          </select>
        </div>
      </div>

      {/* Main Opportunities List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
          <p className="text-slate-400 text-sm">Loading verified opportunities and intelligence dossiers...</p>
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl text-center px-4">
          <Radar className="w-12 h-12 text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-slate-200">No opportunities in this filter view</h3>
          <p className="text-slate-400 text-sm mt-1 max-w-md">
            Trigger a fresh scan or conduct an on-demand audit on any client or store website to instantly generate a
            dossier.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleTriggerDiscovery}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow"
            >
              Scan Public Forums Now
            </button>
            <button
              onClick={() => setAuditModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              Audit A Website
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredOpportunities.map((opp) => (
            <div
              key={opp.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 lg:p-6 transition-all shadow-lg"
            >
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {opp.isVerifiedOpportunity ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30 shadow-sm shadow-emerald-500/10">
                        <ShieldCheck className="w-3 h-3" />
                        🎯 Verified Opportunity
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                        <Radar className="w-3 h-3" />
                        🔎 Unverified Signal
                      </span>
                    )}

                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        opp.opportunityScore === 'HIGH'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : opp.opportunityScore === 'MEDIUM'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-slate-700/50 text-slate-300 border-slate-600/40'
                      }`}
                    >
                      Score: {opp.opportunityScore}
                    </span>

                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        opp.outreachStatus === 'SENT'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : opp.outreachStatus === 'APPROVED'
                          ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                          : opp.outreachStatus === 'DISPATCHING'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse'
                          : opp.outreachStatus === 'SEND_FAILED'
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          : opp.outreachStatus === 'REFINED'
                          ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                          : opp.outreachStatus === 'REJECTED'
                          ? 'bg-red-500/15 text-red-400 border-red-500/30'
                          : 'bg-slate-700/40 text-slate-300 border-slate-600/40'
                      }`}
                    >
                      Status: {opp.outreachStatus === 'SEND_FAILED' ? '⚠️ SEND FAILED' : opp.outreachStatus}
                    </span>
                    
                    {opp.verificationStatus?.isDeduplicated && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold border border-indigo-500/20">
                        Deduplicated
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-white tracking-tight">{opp.businessName || 'Unverified Company'}</h3>
                    <span className="text-xs text-slate-400">• Prospect: <strong className="text-slate-200">{opp.prospectName || 'Unknown Identity'}</strong></span>
                  </div>

                  <p className="text-sm font-medium text-indigo-300">{opp.title}</p>

                  {/* Confidence Matrix & Gate Status */}
                  <div className="mt-4 grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-6 bg-slate-950/40 border border-slate-800/60 rounded-xl p-3">
                    {/* Confidence Scores */}
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                        <span>Intelligence Confidence</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {[
                          { label: 'ID', score: opp.confidenceScores?.identity || 0, color: 'indigo' },
                          { label: 'CO', score: opp.confidenceScores?.company || 0, color: 'emerald' },
                          { label: 'CT', score: opp.confidenceScores?.contact || 0, color: 'sky' },
                          { label: 'PB', score: opp.confidenceScores?.problem || 0, color: 'amber' },
                        ].map((s) => (
                          <div key={s.label} className="flex-1" title={`${s.label}: ${s.score}%`}>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                              <div 
                                className={`h-full ${s.color === 'indigo' ? 'bg-indigo-500' : s.color === 'emerald' ? 'bg-emerald-500' : s.color === 'sky' ? 'bg-sky-500' : 'bg-amber-500'} transition-all duration-500`}
                                style={{ width: `${s.score}%` }}
                              />
                            </div>
                            <div className="mt-1 text-[8px] font-bold text-slate-600 text-center">{s.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="w-px h-8 bg-slate-800 hidden sm:block" />

                    {/* Verification Status Checklist */}
                    <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0">
                      {[
                        { label: 'Identity', val: opp.verificationStatus?.identityResolved },
                        { label: 'Company', val: opp.verificationStatus?.companyVerified },
                        { label: 'Audit', val: opp.verificationStatus?.auditPerformed },
                        { label: 'Contact', val: opp.verificationStatus?.contactAvailable },
                      ].map((gate) => (
                        <div key={gate.label} className="flex flex-col items-center gap-1 shrink-0">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                            gate.val 
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                              : 'bg-slate-900 border-slate-800 text-slate-600'
                          }`}>
                            {gate.val ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          </div>
                          <span className={`text-[9px] font-bold ${gate.val ? 'text-slate-300' : 'text-slate-600'}`}>
                            {gate.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {opp.outreachStatus === 'SEND_FAILED' && opp.sendErrorReason && (
                    <div className="mt-2 p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-200 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>Dispatch Failure:</strong> {opp.sendErrorReason}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 flex-wrap">
                    {opp.websiteUrl && (
                      <a
                        href={opp.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-slate-300 hover:text-indigo-400 transition"
                      >
                        <Globe className="w-3.5 h-3.5 text-indigo-400" />
                        {opp.websiteUrl}
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    )}
                    <a
                      href={opp.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                      Source: {opp.sourcePlatform.replace(/_/g, ' ')}
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                    <span className="text-slate-500">• Niche: {opp.niche}</span>
                    <span className="text-slate-500">• Discovered: {new Date(opp.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Right Header Status Actions */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    onClick={async () => {
                      try {
                        await api.createDeal({
                          prospectId: opp.id,
                          servicePackage: '$2,500 Full-Funnel CRO Sprint',
                          proposedPrice: 2500,
                        });
                        alert(`Commercial deal created for ${opp.prospectName || opp.businessName}! Check "Deal & Delivery Pipeline" in the sidebar.`);
                      } catch (e: any) {
                        alert(e?.message || 'Failed to create commercial deal');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow active:scale-95 border border-indigo-400/40"
                    title="Convert into a commercial deal with proposal and sprint delivery"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-indigo-200" />
                    Create Deal
                  </button>

                  {/* Approve & Send Outreach Button */}
                  {opp.outreachStatus !== 'SENT' && (
                    <button
                      onClick={() => handleDispatchOutreach(opp.id)}
                      disabled={dispatchingId === opp.id || opp.outreachStatus === 'DISPATCHING' || !opp.isVerifiedOpportunity}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition shadow active:scale-95 ${
                        opp.isVerifiedOpportunity 
                          ? 'bg-emerald-600 hover:bg-emerald-500' 
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                      title={opp.isVerifiedOpportunity ? "Dispatches outreach" : "Opportunity must be verified before sending"}
                    >
                      {dispatchingId === opp.id || opp.outreachStatus === 'DISPATCHING' ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Sending...
                        </>
                      ) : opp.outreachStatus === 'SEND_FAILED' ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5" />
                          Retry Send
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          Approve & Send
                        </>
                      )}
                    </button>
                  )}

                  {opp.outreachStatus !== 'REJECTED' && opp.outreachStatus !== 'SENT' && (
                    <button
                      onClick={() => handleReject(opp.id)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 text-xs font-semibold transition"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  )}
                </div>
              </div>

              {/* Middle Section: Evidence & Contact Provenance (User Architectural Mandate) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 py-4 border-b border-slate-800">
                {/* Evidence Observations */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
                    <FileCheck className="w-4 h-4 text-indigo-400" />
                    Objective Evidence Observations
                  </div>
                  <div className="space-y-2">
                    {opp.evidence && opp.evidence.length > 0 ? (
                      opp.evidence.map((ev, i) => (
                        <div
                          key={i}
                          className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 text-xs space-y-1"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-slate-200">{ev.observation}</span>
                            <span className="px-1.5 py-0.5 text-[10px] rounded bg-indigo-500/10 text-indigo-300 font-mono shrink-0">
                              {ev.category}
                            </span>
                          </div>
                          <p className="text-slate-400">
                            <strong className="text-slate-300">Potential Impact:</strong> {ev.potentialImpact}
                          </p>
                          <div className="text-[11px] text-slate-500 pt-0.5">
                            Method: {ev.sourceOrMethod}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">No formal audit observations recorded.</p>
                    )}
                  </div>
                </div>

                {/* Public Contacts with Explicit Provenance */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Public Contact Provenance
                  </div>
                  <div className="space-y-2">
                    {opp.publicContacts && opp.publicContacts.length > 0 ? (
                      opp.publicContacts.map((c, i) => {
                        let ChannelIcon = Mail;
                        if (c.type === 'instagram') ChannelIcon = Instagram;
                        else if (c.type === 'whatsapp' || c.type === 'phone') ChannelIcon = Phone;
                        else if (c.type === 'twitter') ChannelIcon = Twitter;
                        else if (c.type === 'reddit') ChannelIcon = MessageSquare;

                        return (
                          <div
                            key={i}
                            className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700/60 flex items-center justify-center text-slate-300 shrink-0">
                                <ChannelIcon className="w-4 h-4 text-indigo-400" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-white truncate">{c.value}</div>
                                <div className="text-[11px] text-slate-400 truncate">
                                  Provenance: {c.sourceLocation}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  c.confidence === 'HIGH'
                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {c.confidence} CONFIDENCE
                              </span>
                              {c.directLink && (
                                <a
                                  href={c.directLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition"
                                  title="Open Channel Directly"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-400">
                        No direct email/social listed. Engage directly via source post on{' '}
                        <strong className="text-slate-200">{opp.sourcePlatform}</strong>.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Section: Outreach Draft & Refinement Deck */}
              <div className="pt-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Consultative Outreach Draft
                    </span>
                    {opp.refinedDraft && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Refined with AI
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyDraft(opp.refinedDraft || opp.outreachDraft, opp.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                    >
                      {copiedId === opp.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy Draft
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setRefineModalOpp(opp);
                        setRefineFeedback('');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      Refine Draft with AI
                    </button>
                  </div>
                </div>

                {opp.refinementFeedback && (
                  <div className="bg-purple-950/30 border border-purple-500/20 rounded-lg px-3 py-1.5 text-xs text-purple-300">
                    <strong>Refinement Instruction:</strong> "{opp.refinementFeedback}"
                  </div>
                )}

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap selection:bg-indigo-500 selection:text-white">
                  {opp.isVerifiedOpportunity ? (
                    opp.refinedDraft || opp.outreachDraft
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-900/50 rounded-lg border border-dashed border-slate-800">
                      <AlertCircle className="w-8 h-8 text-slate-700 mb-3" />
                      <div className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">Outreach Suppressed</div>
                      <p className="text-slate-500 text-xs max-w-xs mx-auto">
                        Consultative outreach is disabled for unverified signals. Resolve identity and verify business URL to unlock.
                      </p>
                      <button 
                        onClick={() => {
                          setAuditUrl(opp.websiteUrl || '');
                          setAuditProspect(opp.prospectName || '');
                          setAuditModalOpen(true);
                        }}
                        className="mt-4 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700 transition"
                      >
                        🚀 Verify & Audit Now
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-1">
                  <div className="flex items-center gap-2">
                    <span className={opp.isVerifiedOpportunity ? "text-emerald-400" : "text-slate-500"}>
                      {opp.isVerifiedOpportunity ? "✓ Intelligence Gate Passed:" : "⚠ Intelligence Gate Restricted:"}
                    </span>
                    <span className="text-[10px]">
                      {opp.isVerifiedOpportunity 
                        ? "Deduplicated • Factual UX observations only • Direct contact verified"
                        : "Unverified Identity • Missing evidence audit • No direct contact"
                      }
                    </span>
                  </div>
                  {opp.telegramMessageId && (
                    <span className="text-slate-500">
                      Dispatched to Telegram (Msg #{opp.telegramMessageId})
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Refine Draft */}
      {refineModalOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 shrink-0 bg-slate-900">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">Refine Outreach Draft</h3>
              </div>
              <button
                onClick={() => setRefineModalOpp(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
              <div className="text-xs text-slate-300">
                Prospect: <strong className="text-white">{refineModalOpp.prospectName}</strong> (
                {refineModalOpp.businessName})
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  How should Copilot Ally adjust this message?
                </label>
                <textarea
                  rows={3}
                  value={refineFeedback}
                  onChange={(e) => setRefineFeedback(e.target.value)}
                  placeholder="e.g. 'Make it shorter and under 60 words', 'Mention our $99 Funnel Sprint', 'Sound warmer and more casual'"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-800 bg-slate-900/90 shrink-0">
              <button
                type="button"
                onClick={() => setRefineModalOpp(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRefineSubmit}
                disabled={refining || !refineFeedback.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition shadow active:scale-95"
              >
                {refining ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Refining with Gemini...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Apply Refinement
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Audit Any Website */}
      {auditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleAuditSubmit}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 shrink-0 bg-slate-900">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">On-Demand Website Audit</h3>
              </div>
              <button
                type="button"
                onClick={() => setAuditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
              <p className="text-xs text-slate-300 leading-relaxed">
                Enter any prospective client's store or funnel URL. Copilot Ally will conduct an evidence observation audit,
                estimate contact channels, generate a consultative draft, and dispatch the alert to Telegram.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Website URL <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://examplebrand.com"
                  value={auditUrl}
                  onChange={(e) => setAuditUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Founder / Contact Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex (defaults to 'Store Founder')"
                  value={auditProspect}
                  onChange={(e) => setAuditProspect(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-800 bg-slate-900/90 shrink-0">
              <button
                type="button"
                onClick={() => setAuditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={auditing || !auditUrl.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition shadow active:scale-95"
              >
                {auditing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Auditing Funnel...
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    Run Evidence Audit
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Settings & Telegram Bot Setup */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleSaveSettings}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Modal Fixed Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 shrink-0 bg-slate-900">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-white text-sm sm:text-base">Copilot Ally Telegram & 24/7 Worker Settings</h3>
              </div>
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 overscroll-contain">
              {/* Guide on Telegram Bot Creation */}
              <div className="bg-sky-950/40 border border-sky-500/30 rounded-xl p-4 text-xs space-y-3 text-sky-200">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sky-300 flex items-center gap-1.5">
                    <Info className="w-4 h-4" />
                    Bot Setup & Official Media Assets
                  </div>
                  <a
                    href="/bot-avatar.html"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] transition shadow"
                  >
                    <Sparkles className="w-3 h-3" />
                    Get Avatar & Welcome Banner
                  </a>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li>
                    Open Telegram on your phone and search for <strong>@BotFather</strong>.
                  </li>
                  <li>
                    Send <code>/newbot</code>, name it <strong>ApexGrowth Intelligence</strong>, and choose your bot username.
                  </li>
                  <li>Copy the provided Bot HTTP API Token and paste it below.</li>
                  <li>
                    Tap <strong>Set New Photo</strong> in BotFather and upload the 512x512 avatar.
                  </li>
                  <li>
                    Tap <strong>Set Welcome Picture</strong> in BotFather and upload the fitted 640x360 start banner.
                  </li>
                  <li>
                    Search for <strong>@userinfobot</strong> on Telegram, send any message, and copy your numeric{' '}
                    <strong>Id</strong> (this is your Telegram Chat ID).
                  </li>
                </ol>
              </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Dynamic AI Engine & Provider Section */}
              <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">AI Intelligence Provider Engine</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Zero-Hardcoding Dynamic Setup
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Select AI Provider</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {[
                        {
                          id: 'gemini',
                          name: 'Google Gemini',
                          tag: 'Default Engine',
                          desc: 'Gemini 2.5 Flash / Pro Multimodal',
                          badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
                        },
                        {
                          id: 'groq',
                          name: 'Groq Cloud',
                          tag: 'Ultra-Fast',
                          desc: 'LPU Inference & LLaMA 3.3',
                          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                        },
                        {
                          id: 'mistral',
                          name: 'Mistral AI',
                          tag: 'European LLMs',
                          desc: 'Mistral Large & Pixtral',
                          badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
                        },
                        {
                          id: 'nvidia',
                          name: 'Nvidia NIM',
                          tag: 'GPU Microservices',
                          desc: 'High-Throughput LLaMA & Qwen',
                          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                        },
                        {
                          id: 'custom',
                          name: 'Custom Endpoint',
                          tag: 'OpenAI Protocol',
                          desc: 'Self-Hosted or OpenRouter',
                          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
                        },
                      ].map((item) => {
                        const isSelected = aiProvider === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              const newProv = item.id as any;
                              setAiProvider(newProv);
                              setAvailableModels([]);
                              if (newProv === 'gemini') setAiModel('gemini-2.5-flash');
                              else if (newProv === 'groq') setAiModel('llama-3.3-70b-versatile');
                              else if (newProv === 'mistral') setAiModel('mistral-large-latest');
                              else if (newProv === 'nvidia') setAiModel('meta/llama-3.1-70b-instruct');
                            }}
                            className={`flex flex-col items-start text-left p-3 rounded-xl border transition relative ${
                              isSelected
                                ? 'bg-indigo-950/60 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.25)]'
                                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full mb-1">
                              <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                                {item.name}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${item.badgeColor}`}>
                                {item.tag}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 leading-snug">{item.desc}</span>
                            <div className="mt-2.5 flex items-center gap-1.5 w-full">
                              <div
                                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition ${
                                  isSelected ? 'border-indigo-400 bg-indigo-500' : 'border-slate-600 bg-slate-800'
                                }`}
                              >
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                              <span className={`text-[10px] font-medium ${isSelected ? 'text-indigo-300' : 'text-slate-500'}`}>
                                {isSelected ? 'Active Provider' : 'Select'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Target AI Model
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder={
                          aiProvider === 'gemini'
                            ? 'e.g. gemini-2.5-flash'
                            : aiProvider === 'groq'
                            ? 'e.g. llama-3.3-70b-versatile'
                            : aiProvider === 'mistral'
                            ? 'e.g. mistral-large-latest'
                            : aiProvider === 'nvidia'
                            ? 'e.g. meta/llama-3.1-70b-instruct'
                            : 'e.g. custom-model-id'
                        }
                        value={aiModel}
                        onChange={(e) => setAiModel(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleFetchLiveModels}
                        disabled={fetchingModels}
                        title="Fetch dynamic live models available on this provider account"
                        className="px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 disabled:opacity-40 rounded-xl text-xs font-medium border border-indigo-500/30 transition flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {fetchingModels ? 'Fetching...' : 'Fetch Live Models'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Available models list as selectable chips if fetched live */}
                {availableModels.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">
                        {availableModels.length} Live Models from {aiProvider.toUpperCase()}
                      </label>
                      <span className="text-[10px] text-slate-400">Tap to select model</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {availableModels.map((m) => {
                        const isChosen = aiModel === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setAiModel(m.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition border ${
                              isChosen
                                ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                            }`}
                          >
                            {m.id}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Dynamic API Key Field according to active provider */}
                {aiProvider === 'gemini' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Gemini API Key (Optional override, defaults to environment variable)
                    </label>
                    <input
                      type="password"
                      placeholder="AIzaSy..."
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                ) : aiProvider === 'groq' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Groq API Key</label>
                    <input
                      type="password"
                      placeholder="gsk_xxxxxxxxxxxxxxxxxxxx"
                      value={groqApiKey}
                      onChange={(e) => setGroqApiKey(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                ) : aiProvider === 'mistral' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Mistral API Key</label>
                    <input
                      type="password"
                      placeholder="mistral_api_key_xxxxxxxx"
                      value={mistralApiKey}
                      onChange={(e) => setMistralApiKey(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                ) : aiProvider === 'nvidia' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Nvidia NIM API Key</label>
                    <input
                      type="password"
                      placeholder="nvapi-xxxxxxxxxxxxxxxxxxxx"
                      value={nvidiaApiKey}
                      onChange={(e) => setNvidiaApiKey(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Custom Base URL</label>
                      <input
                        type="text"
                        placeholder="https://your-custom-llm-host.com/v1"
                        value={secondaryAiBaseUrl}
                        onChange={(e) => setSecondaryAiBaseUrl(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Custom API Key / Bearer Token</label>
                      <input
                        type="password"
                        placeholder="Bearer token or API Key"
                        value={secondaryAiApiKey}
                        onChange={(e) => setSecondaryAiApiKey(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* AI Provider Test Runner */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleTestAiProvider}
                    disabled={testingAi}
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-40 transition font-medium"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {testingAi ? 'Testing Provider Connection...' : `Test ${aiProvider.toUpperCase()} Connection & Latency`}
                  </button>

                  {aiTestResult && (
                    <span
                      className={`text-[11px] font-medium ${
                        aiTestResult.success ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {aiTestResult.message}
                    </span>
                  )}
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* OUTBOUND EMAIL PROVIDER (GMAIL SMTP / RESEND) */}
              {/* ---------------------------------------------------- */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <Mail className="w-4 h-4 text-emerald-400" />
                      Outbound Email Dispatch Provider
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Configure your active email sender for 1-tap Telegram and Web approvals.
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Active: {emailProvider === 'gmail' ? 'Gmail SMTP' : 'Resend'}
                  </span>
                </div>

                {/* Provider Selector Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEmailProvider('gmail')}
                    className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
                      emailProvider === 'gmail'
                        ? 'bg-emerald-950/30 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs font-bold text-slate-200">Gmail SMTP</span>
                      {emailProvider === 'gmail' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Send immediately using your personal or workspace Gmail account via Google App Password. No custom domain required.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmailProvider('resend')}
                    className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
                      emailProvider === 'resend'
                        ? 'bg-sky-950/30 border-sky-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs font-bold text-slate-200">Resend REST API</span>
                      {emailProvider === 'resend' && (
                        <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      High-deliverability transactional email API. Ideal for verified custom domains and scalable production sending.
                    </p>
                  </button>
                </div>

                {/* Gmail Settings */}
                {emailProvider === 'gmail' ? (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Gmail Address / Username
                      </label>
                      <input
                        type="email"
                        placeholder="yourname@gmail.com"
                        value={gmailUser}
                        onChange={(e) => setGmailUser(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-300">
                          Google App Password (16 Characters)
                        </label>
                        <a
                          href="https://myaccount.google.com/apppasswords"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 font-medium"
                        >
                          Generate App Password <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <input
                        type="password"
                        placeholder={gmailAppPassword ? '••••••••••••••••' : 'xxxx xxxx xxxx xxxx'}
                        value={gmailAppPassword}
                        onChange={(e) => setGmailAppPassword(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Requires Google 2-Step Verification enabled. Do not use your personal Gmail login password.
                      </p>
                    </div>

                    {/* Quick Setup Guide */}
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                      <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Quick Gmail App Password Setup:
                      </div>
                      <ol className="list-decimal list-inside space-y-0.5 text-slate-400 pl-1">
                        <li>Visit Google Account &rarr; Security &rarr; 2-Step Verification.</li>
                        <li>Scroll down to <strong>App Passwords</strong>.</li>
                        <li>Enter App Name (e.g. <em>ApexGrowth Assistant</em>) and click <strong>Create</strong>.</li>
                        <li>Paste the generated 16-character code above.</li>
                      </ol>
                    </div>
                  </div>
                ) : (
                  /* Resend Settings */
                  <div className="space-y-3 pt-1">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-300">
                          Resend API Key
                        </label>
                        <a
                          href="https://resend.com/api-keys"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-sky-400 hover:text-sky-300 inline-flex items-center gap-1 font-medium"
                        >
                          Get Resend Key <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <input
                        type="password"
                        placeholder={resendApiKey ? '••••••••••••••••' : 're_xxxxxxxxxxxxxxxxxxxx'}
                        value={resendApiKey}
                        onChange={(e) => setResendApiKey(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Sender From Address
                      </label>
                      <input
                        type="text"
                        placeholder="ApexGrowth Growth Team <onboarding@resend.dev>"
                        value={resendFromEmail}
                        onChange={(e) => setResendFromEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Use <code className="text-slate-400">onboarding@resend.dev</code> for sandbox testing, or your verified domain.
                      </p>
                    </div>
                  </div>
                )}

                {/* Email Test Connection Button & Result */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={() => handleTestEmail(emailProvider)}
                    disabled={testingEmail}
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-40 transition font-medium"
                  >
                    {testingEmail ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Testing Connection...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Test {emailProvider === 'gmail' ? 'Gmail SMTP' : 'Resend'} Connection
                      </>
                    )}
                  </button>

                  {emailTestResult && (
                    <span
                      className={`text-[11px] font-medium ${
                        emailTestResult.success ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {emailTestResult.message}
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-slate-400" />
                  Credentials are stored securely as server-side secrets and masked in the UI.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Telegram Bot Token</label>
                <input
                  type="text"
                  placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Your Telegram Chat ID</label>
                <input
                  type="text"
                  placeholder="e.g. 987654321"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Tavily Search Key */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-teal-400">Tavily AI Search API Key</label>
                  <button
                    type="button"
                    onClick={handleTestTavily}
                    disabled={testingTavily || !tavilyApiKey.trim()}
                    className="text-[11px] text-teal-400 hover:text-teal-300 disabled:opacity-40 flex items-center gap-1 font-medium"
                  >
                    {testingTavily ? 'Testing...' : 'Test Tavily'}
                  </button>
                </div>
                <input
                  type="password"
                  placeholder="tvly-xxxxxxxxxxxxxxxxxxxx"
                  value={tavilyApiKey}
                  onChange={(e) => setTavilyApiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-mono"
                />
                <div className="text-[11px] text-slate-400 mt-1">
                  Direct web search grounding for Gemini copilot and live market scouting.
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <div className="text-xs font-bold text-white">Enable Telegram Alerts</div>
                  <div className="text-[11px] text-slate-400">
                    Dispatch instant dossiers & interactive approval buttons to your phone.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={telegramEnabled}
                  onChange={(e) => setTelegramEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <div className="text-xs font-bold text-white">Enable Tavily Real-Time Search</div>
                  <div className="text-[11px] text-slate-400">
                    Allows the copilot to run live web searches directly during chats.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={tavilyEnabled}
                  onChange={(e) => setTavilyEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 bg-slate-800 border-slate-700 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <div className="text-xs font-bold text-white">24/7 Autonomous Background Worker</div>
                  <div className="text-[11px] text-slate-400">
                    Continuously scours public e-commerce & Shopify forums in the background.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={workerEnabled}
                  onChange={(e) => setWorkerEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Discovery Scan Interval
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {[
                    { value: 15, label: '15 Mins', sub: 'High-frequency' },
                    { value: 30, label: '30 Mins', sub: 'Balanced' },
                    { value: 60, label: '1 Hour', sub: 'Standard' },
                    { value: 120, label: '2 Hours', sub: 'Relaxed' },
                    { value: 360, label: '6 Hours', sub: 'Periodic' },
                  ].map((opt) => {
                    const isSelected = intervalMinutes === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setIntervalMinutes(opt.value)}
                        className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <span className={`text-xs font-bold ${isSelected ? 'text-indigo-300' : 'text-slate-300'}`}>
                          {opt.label}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5">{opt.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Fixed Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-t border-slate-800 bg-slate-900/90 shrink-0">
            <button
              type="button"
              onClick={handleTestTelegram}
              disabled={testingTelegram || !botToken || !chatId}
              className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 disabled:opacity-40 transition font-medium"
            >
              <Send className="w-3.5 h-3.5" />
              {testingTelegram ? 'Sending Test...' : 'Send Test Alert to My Telegram'}
            </button>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={savingSettings}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition shadow active:scale-95"
              >
                {savingSettings ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </form>
      </div>
    )}
  </div>
);
};
