import React, { useState, useEffect } from 'react';
import {
  Send,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Key,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Bot,
  Globe,
  Sliders,
  Check,
  Terminal,
  Clock,
  Radio,
  Copy,
  Layers,
  ArrowRight,
  Mail,
} from 'lucide-react';
import { api } from '../../lib/api';
import { ScoutSettings } from '../../types';

export const IntegrationsManager: React.FC = () => {
  const [settings, setSettings] = useState<ScoutSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [testingTavily, setTestingTavily] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testResult, setTestResult] = useState<{
    telegram?: { success: boolean; message: string };
    tavily?: { success: boolean; message: string; answer?: string };
    email?: { success: boolean; message: string };
  }>({});

  // Form State
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [tavilyApiKey, setTavilyApiKey] = useState('');
  const [tavilyEnabled, setTavilyEnabled] = useState(true);
  const [autonomousWorkerEnabled, setAutonomousWorkerEnabled] = useState(true);
  const [runIntervalMinutes, setRunIntervalMinutes] = useState(60);
  const [targetNichesInput, setTargetNichesInput] = useState('');
  const [intentKeywordsInput, setIntentKeywordsInput] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  // Email Provider Form State
  const [emailProvider, setEmailProvider] = useState<'gmail' | 'resend'>('gmail');
  const [gmailUser, setGmailUser] = useState('');
  const [gmailAppPassword, setGmailAppPassword] = useState('');
  const [resendApiKey, setResendApiKey] = useState('');
  const [resendFromEmail, setResendFromEmail] = useState('');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await api.getScoutSettings();
      setSettings(data);
      setTelegramBotToken(data.telegramBotToken || '');
      setTelegramChatId(data.telegramChatId || '');
      setTelegramEnabled(data.telegramEnabled);
      setTavilyApiKey(data.tavilyApiKey || '');
      setTavilyEnabled(data.tavilyEnabled ?? true);
      setAutonomousWorkerEnabled(data.autonomousWorkerEnabled);
      setRunIntervalMinutes(data.runIntervalMinutes || 60);
      setTargetNichesInput((data.targetNiches || []).join(', '));
      setIntentKeywordsInput((data.intentKeywords || []).join(', '));

      // Email settings
      setEmailProvider(data.emailProvider || 'gmail');
      setGmailUser(data.gmailUser || '');
      setGmailAppPassword(data.gmailAppPassword ? '••••••••••••••••' : '');
      setResendApiKey(data.resendApiKey ? '••••••••••••••••' : '');
      setResendFromEmail(data.resendFromEmail || 'ApexGrowth Growth Team <onboarding@resend.dev>');
    } catch (err: any) {
      showToast(err?.message || 'Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const niches = targetNichesInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const keywords = intentKeywordsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const isMaskedGmail = gmailAppPassword === '••••••••••••••••';
      const isMaskedResend = resendApiKey === '••••••••••••••••';

      const updated = await api.updateScoutSettings({
        telegramBotToken: telegramBotToken.trim(),
        telegramChatId: telegramChatId.trim(),
        telegramEnabled,
        tavilyApiKey: tavilyApiKey.trim(),
        tavilyEnabled,
        autonomousWorkerEnabled,
        runIntervalMinutes: Number(runIntervalMinutes) || 60,
        targetNiches: niches.length > 0 ? niches : ['E-commerce Brands', 'Shopify Store Owners'],
        intentKeywords: keywords.length > 0 ? keywords : ['checkout dropoff', 'low conversion rate'],
        emailProvider,
        gmailUser: gmailUser.trim(),
        gmailAppPassword: isMaskedGmail ? undefined : gmailAppPassword.trim(),
        resendApiKey: isMaskedResend ? undefined : resendApiKey.trim(),
        resendFromEmail: resendFromEmail.trim(),
      });

      setSettings(updated);
      showToast('All integration and intelligence configurations updated successfully!');
    } catch (err: any) {
      showToast(err?.message || 'Failed to save configurations', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    setTestResult((prev) => ({ ...prev, email: undefined }));
    try {
      const isMaskedGmail = gmailAppPassword === '••••••••••••••••';
      const isMaskedResend = resendApiKey === '••••••••••••••••';

      const res = await api.testEmailConnection({
        provider: emailProvider,
        gmailUser: gmailUser.trim(),
        gmailAppPassword: isMaskedGmail ? undefined : gmailAppPassword.trim(),
        resendApiKey: isMaskedResend ? undefined : resendApiKey.trim(),
      });

      setTestResult((prev) => ({
        ...prev,
        email: { success: res.success, message: res.message || 'Connection test completed.' },
      }));

      if (res.success) {
        showToast(res.message || `${emailProvider === 'gmail' ? 'Gmail SMTP' : 'Resend'} connection verified!`);
      } else {
        showToast(res.message || 'Email connection test failed', 'error');
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Email connection test failed';
      setTestResult((prev) => ({
        ...prev,
        email: { success: false, message: errorMsg },
      }));
      showToast(errorMsg, 'error');
    } finally {
      setTestingEmail(false);
    }
  };

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    setTestResult((prev) => ({ ...prev, telegram: undefined }));
    try {
      // First save if changed
      if (
        telegramBotToken !== settings?.telegramBotToken ||
        telegramChatId !== settings?.telegramChatId ||
        telegramEnabled !== settings?.telegramEnabled
      ) {
        await handleSave();
      }

      const res = await api.sendTestTelegramAlert();
      setTestResult((prev) => ({
        ...prev,
        telegram: { success: true, message: res.message || 'Telegram test alert delivered to your chat!' },
      }));
      showToast('Telegram test message sent successfully!');
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to send Telegram test message. Verify bot token & chat ID.';
      setTestResult((prev) => ({
        ...prev,
        telegram: { success: false, message: errorMsg },
      }));
      showToast(errorMsg, 'error');
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleTestTavily = async () => {
    if (!tavilyApiKey.trim()) {
      showToast('Please paste your Tavily API Key before testing.', 'error');
      return;
    }

    setTestingTavily(true);
    setTestResult((prev) => ({ ...prev, tavily: undefined }));
    try {
      // Auto save key
      await api.updateScoutSettings({
        tavilyApiKey: tavilyApiKey.trim(),
        tavilyEnabled,
      });

      const res = await api.testTavilySearch(tavilyApiKey.trim());
      setTestResult((prev) => ({
        ...prev,
        tavily: {
          success: true,
          message: res.message || 'Live web search connection verified!',
          answer: res.answer,
        },
      }));
      showToast('Tavily API search connection verified successfully!');
    } catch (err: any) {
      const errorMsg = err?.message || 'Tavily connection test failed. Verify your API key.';
      setTestResult((prev) => ({
        ...prev,
        tavily: { success: false, message: errorMsg },
      }));
      showToast(errorMsg, 'error');
    } finally {
      setTestingTavily(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-3 text-indigo-500" />
        <span className="text-sm font-medium">Loading Integration Configurations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Sliders className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
              Integrations &amp; Intelligence Hub
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Configure live external providers: Telegram Bot dispatching &amp; conversational co-pilot control, Tavily AI web search grounding, and autonomous scanner parameters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => loadSettings()}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Reload
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between gap-3 shadow-lg transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/90 border border-red-500/40 text-red-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span className="font-medium">{toast.text}</span>
          </div>
          <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100 text-xs">
            ✕
          </button>
        </div>
      )}

      {/* GRID OF INTEGRATIONS */}
      <div className="grid grid-cols-1 gap-8">
        {/* ============================================================ */}
        {/* 1. TAVILY AI SEARCH INTEGRATION (Direct Option A) */}
        {/* ============================================================ */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-lg">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                    Tavily AI Search Engine
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                    Option A (Native Tool)
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Real-time web search grounding for Gemini AI, autonomous niche market research, and brand audits without quota exhaustion.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={tavilyEnabled}
                  onChange={(e) => setTavilyEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-700 peer-checked:bg-teal-600"></div>
                <span className="ml-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {tavilyEnabled ? 'Active' : 'Disabled'}
                </span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tavily API Key (tvly-...)
                  </label>
                  <a
                    href="https://app.tavily.com/home"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    Get free key on Tavily <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    placeholder="tvly-xxxxxxxxxxxxxxxxxxxx"
                    value={tavilyApiKey}
                    onChange={(e) => setTavilyApiKey(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-teal-500 rounded-xl pl-10 pr-24 py-2.5 text-xs text-slate-900 dark:text-white outline-none font-mono transition-colors"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    {tavilyApiKey && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(tavilyApiKey);
                          setCopiedKey(true);
                          setTimeout(() => setCopiedKey(false), 2000);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-200 text-[10px] flex items-center gap-1 px-2 bg-slate-200/50 dark:bg-slate-800"
                        title="Copy Key"
                      >
                        {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  The API key will be saved securely to the Neon database and used directly in server-side queries. Tavily provides 1,000 free searches every month.
                </p>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleTestTavily}
                  disabled={testingTavily || !tavilyApiKey.trim()}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] disabled:opacity-50 text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all"
                >
                  {testingTavily ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Test Tavily Live Search
                </button>
              </div>

              {testResult.tavily && (
                <div
                  className={`p-3.5 rounded-xl text-xs space-y-1.5 border ${
                    testResult.tavily.success
                      ? 'bg-teal-950/40 border-teal-500/40 text-teal-200'
                      : 'bg-red-950/40 border-red-500/40 text-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {testResult.tavily.success ? (
                      <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span>{testResult.tavily.message}</span>
                  </div>
                  {testResult.tavily.answer && (
                    <div className="text-[11px] text-slate-300 font-mono bg-black/40 p-2.5 rounded-lg mt-1 border border-teal-500/20">
                      <strong>AI Summary returned:</strong> {testResult.tavily.answer}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Feature checklist */}
            <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
                What Tavily Enables
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
                  <span>Real-time web search directly inside Telegram bot chat (<code>searchWeb</code> tool)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
                  <span>Deep prospect research (identifying founder LinkedIn, Twitter, press releases)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
                  <span>Bypasses Google Gemini free tier 20 search/day quota exhaustion</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
                  <span>Extracts clean Markdown summaries without scraping blockers</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. TELEGRAM BOT INTEGRATION & COPILOT CHAT */}
        {/* ============================================================ */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-lg">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                    Telegram Control &amp; Alert Bot
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                    24/7 Long Polling
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Real-time interactive lead alerts, inline approve/reject buttons, and autonomous conversational co-pilot in Telegram.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={telegramEnabled}
                  onChange={(e) => setTelegramEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-700 peer-checked:bg-sky-600"></div>
                <span className="ml-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {telegramEnabled ? 'Active' : 'Disabled'}
                </span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Telegram Bot Token
                </label>
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-medium"
                >
                  Create via @BotFather <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="password"
                placeholder="1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ"
                value={telegramBotToken}
                onChange={(e) => setTelegramBotToken(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none font-mono transition-colors"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                From @BotFather upon creating your bot.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Authorized Admin Chat ID
                </label>
                <a
                  href="https://t.me/userinfobot"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-medium"
                >
                  Find via @userinfobot <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="text"
                placeholder="e.g. 6307001401 or -100xxxxxxxxxx"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none font-mono transition-colors"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Your personal numeric ID or agency group ID for alert delivery.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleTestTelegram}
              disabled={testingTelegram || !telegramBotToken || !telegramChatId}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-[0.98] disabled:opacity-50 text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all"
            >
              {testingTelegram ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Send Test Alert to Telegram
            </button>
          </div>

          {testResult.telegram && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${
                testResult.telegram.success
                  ? 'bg-sky-950/40 border-sky-500/40 text-sky-200'
                  : 'bg-red-950/40 border-red-500/40 text-red-200'
              }`}
            >
              {testResult.telegram.success ? (
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{testResult.telegram.message}</span>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* 3. OUTBOUND EMAIL DISPATCH ENGINE (GMAIL SMTP / RESEND) */}
        {/* ============================================================ */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                    Outbound Email Provider (Gmail SMTP / Resend)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Active: {emailProvider === 'gmail' ? 'Gmail SMTP' : 'Resend'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select and configure the dispatch engine for 1-tap Telegram and Web outreach approvals.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Provider:</span>
              <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                {emailProvider === 'gmail' ? 'Gmail SMTP (Direct)' : 'Resend (Domain API)'}
              </span>
            </div>
          </div>

          {/* Provider Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setEmailProvider('gmail')}
              className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
                emailProvider === 'gmail'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-slate-900 dark:text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <div className="font-bold text-xs flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-500" />
                  Gmail SMTP
                </div>
                {emailProvider === 'gmail' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Zero domain setup needed. Connect with your standard Gmail address and a 16-character Google App Password.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setEmailProvider('resend')}
              className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
                emailProvider === 'resend'
                  ? 'bg-sky-50 dark:bg-sky-950/30 border-sky-500 text-slate-900 dark:text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <div className="font-bold text-xs flex items-center gap-2">
                  <Send className="w-4 h-4 text-sky-500" />
                  Resend REST API
                </div>
                {emailProvider === 'resend' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Transactional REST API for scalable outreach from verified company domains or sandbox sender.
              </p>
            </button>
          </div>

          {/* Active Provider Specific Form Fields */}
          {emailProvider === 'gmail' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Gmail User / Address
                </label>
                <input
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={gmailUser}
                  onChange={(e) => setGmailUser(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none font-mono transition-colors"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Your sender email address.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Google App Password (16 Characters)
                  </label>
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    Generate App Password <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="password"
                  placeholder={gmailAppPassword ? '••••••••••••••••' : 'xxxx xxxx xxxx xxxx'}
                  value={gmailAppPassword}
                  onChange={(e) => setGmailAppPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none font-mono transition-colors"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  16-character code created in Google Account &rarr; Security &rarr; App Passwords.
                </p>
              </div>

              <div className="md:col-span-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  How to generate a Gmail App Password:
                </div>
                <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px]">
                  <li>Ensure 2-Step Verification is ON in your Google Account.</li>
                  <li>Visit <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">myaccount.google.com/apppasswords</code>.</li>
                  <li>Give it the name <em>ApexGrowth Assistant</em> and click <strong>Create</strong>.</li>
                  <li>Paste the generated 16 letters into the box above and save.</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Resend API Key
                  </label>
                  <a
                    href="https://resend.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    Get Resend Key <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="password"
                  placeholder={resendApiKey ? '••••••••••••••••' : 're_xxxxxxxxxxxxxxxxxxxx'}
                  value={resendApiKey}
                  onChange={(e) => setResendApiKey(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none font-mono transition-colors"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  API Key from your Resend dashboard.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  From Address
                </label>
                <input
                  type="text"
                  placeholder="ApexGrowth Growth Team <onboarding@resend.dev>"
                  value={resendFromEmail}
                  onChange={(e) => setResendFromEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none font-mono transition-colors"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Default sandbox: <code className="text-slate-400">onboarding@resend.dev</code>
                </p>
              </div>
            </div>
          )}

          {/* Test Email Connection */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleTestEmail}
              disabled={testingEmail}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all"
            >
              {testingEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
              Test {emailProvider === 'gmail' ? 'Gmail SMTP' : 'Resend'} Connection
            </button>
          </div>

          {testResult.email && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${
                testResult.email.success
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-red-950/40 border-red-500/40 text-red-200'
              }`}
            >
              {testResult.email.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{testResult.email.message}</span>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* 4. AUTONOMOUS SCOUT SCANNER & TARGET SCOPE */}
        {/* ============================================================ */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-lg">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                  Autonomous Background Scout Parameters
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Schedule cadence, target e-commerce sectors, and high-intent pain point keywords.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autonomousWorkerEnabled}
                onChange={(e) => setAutonomousWorkerEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-700 peer-checked:bg-violet-600"></div>
              <span className="ml-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                {autonomousWorkerEnabled ? 'Running 24/7' : 'Worker Paused'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Scan Cadence Interval (Minutes)
              </label>
              <select
                value={runIntervalMinutes}
                onChange={(e) => setRunIntervalMinutes(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none font-medium"
              >
                <option value={15}>Every 15 minutes (High frequency)</option>
                <option value={30}>Every 30 minutes</option>
                <option value={60}>Every 1 hour (Recommended)</option>
                <option value={120}>Every 2 hours</option>
                <option value={360}>Every 6 hours</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                The autonomous worker executes a discovery cycle on this interval.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Niches (Comma-separated)
              </label>
              <input
                type="text"
                value={targetNichesInput}
                onChange={(e) => setTargetNichesInput(e.target.value)}
                placeholder="E-commerce Brands, Shopify Store Owners, High-Ticket Coaches"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Industries and brand profiles matched against discovered stores.
              </p>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Intent &amp; Pain Point Keywords (Comma-separated)
              </label>
              <input
                type="text"
                value={intentKeywordsInput}
                onChange={(e) => setIntentKeywordsInput(e.target.value)}
                placeholder="checkout dropoff, low conversion rate, store feedback, abandoned carts, video ad script"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Keywords that indicate a founder or e-commerce operator is experiencing conversion bottlenecks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
