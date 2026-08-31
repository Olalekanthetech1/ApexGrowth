import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, Sparkles, CheckCircle2, ArrowRight, MessageSquare, ShieldCheck, Loader2 } from 'lucide-react';
import { usePublicData } from '../../context/PublicDataContext';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  recommendedPackage?: string;
  timestamp: string;
}

interface PublicAIAssistantProps {
  onNavigate?: (path: string) => void;
}

export const PublicAIAssistant: React.FC<PublicAIAssistantProps> = ({ onNavigate }) => {
  const { data } = usePublicData();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content: "Hello! I'm ApexGrowth AI. I can help you select the ideal conversion funnel, ad script, or payment setup for your business growth goals. What are you looking to launch?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

  // Lead qualification modal state inside chat
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadForm, setLeadForm] = useState({
    name: '',
    email: '',
    whatsapp: '',
    businessType: '',
    sellingDetails: '',
  });
  const [submittingLead, setSubmittingLead] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    "Which package is best for high-converting sales funnels?",
    "How much does the Full Growth Engine cost?",
    "Can I pay using Paystack, Crypto, or USD Bank Transfer?",
    "How fast will my project be delivered?",
  ];

  const handleSend = async (textToSend?: string) => {
    const prompt = textToSend || input;
    if (!prompt.trim() || loading) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const historyFormatted = messages.slice(-6).map((m) => ({
        sender: m.sender,
        content: m.content,
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          sessionId,
          history: historyFormatted,
        }),
      });

      const dataRes = await res.json();

      if (dataRes.success) {
        const assistantMsg: Message = {
          id: `ai_${Date.now()}`,
          sender: 'assistant',
          content: dataRes.text,
          recommendedPackage: dataRes.recommendedPackage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(dataRes.error || 'Failed to generate response');
      }
    } catch (err) {
      console.error('AI Assistant Fetch Error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_err_${Date.now()}`,
          sender: 'assistant',
          content: "Thank you for asking! We specialize in custom sales funnels, Paystack USD checkout setups, and video ad scripts. Feel free to contact our growth leads on WhatsApp for immediate support.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.email || !leadForm.whatsapp) return;

    setSubmittingLead(true);
    try {
      const lastAiMsg = messages.filter((m) => m.sender === 'assistant').pop();
      const res = await fetch('/api/ai/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...leadForm,
          conversationSummary: messages.map((m) => `${m.sender.toUpperCase()}: ${m.content}`).join('\n'),
          recommendedPackage: lastAiMsg?.recommendedPackage || 'General Growth Inquiry',
        }),
      });

      const dataRes = await res.json();
      if (dataRes.success) {
        setLeadSubmitted(true);
        setShowLeadForm(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `ai_lead_conf_${Date.now()}`,
            sender: 'assistant',
            content: `Thank you ${leadForm.name}! Your request has been logged. An ApexGrowth senior strategist will review your business details and reach out on WhatsApp (${leadForm.whatsapp}) within 2 hours.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      console.error('Lead submission error:', err);
    } finally {
      setSubmittingLead(false);
    }
  };

  const matchedPackageData = (pkgName?: string) => {
    if (!pkgName || !data?.pricing) return null;
    return data.pricing.find((p) => p.name.toLowerCase() === pkgName.toLowerCase());
  };

  return (
    <>
      {/* Floating Widget Trigger */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center space-x-3">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            id="public-ai-assistant-button"
            className="group flex items-center space-x-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold shadow-2xl shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95"
          >
            <Sparkles className="w-5 h-5 animate-spin-slow" />
            <span className="text-sm font-semibold tracking-wide">ApexGrowth AI</span>
          </button>
        )}
      </div>

      {/* Expandable Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] h-[580px] max-h-[85vh] z-50 flex flex-col rounded-2xl bg-slate-950 dark:bg-slate-950 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 shadow-2xl overflow-hidden transition-all animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="p-4 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 flex items-center space-x-1.5">
                  <span>ApexGrowth AI Assistant</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600">Official Growth & Funnel Strategist</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              const matchedPkg = matchedPackageData(msg.recommendedPackage);
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-emerald-500 text-slate-950 font-medium rounded-br-xs'
                        : 'bg-slate-900 dark:bg-slate-900 light:bg-slate-100 text-slate-200 dark:text-slate-200 light:text-slate-800 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-bl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.content}</p>

                    {/* Inline Recommended Package Card */}
                    {matchedPkg && (
                      <div className="mt-3 p-3 rounded-xl bg-slate-950/80 dark:bg-slate-950/80 light:bg-white border border-emerald-500/30 text-slate-100 dark:text-slate-100 light:text-slate-900 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Recommended Package</span>
                          <span className="text-sm font-extrabold text-white dark:text-white light:text-slate-900">${matchedPkg.priceUsd} USD</span>
                        </div>
                        <h4 className="font-bold text-xs">{matchedPkg.name}</h4>
                        <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600">{matchedPkg.description}</p>
                        <div className="pt-1 flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              if (onNavigate) {
                                onNavigate(`/checkout/${matchedPkg.slug || matchedPkg.id}`);
                              } else {
                                window.location.href = `/checkout/${matchedPkg.slug || matchedPkg.id}`;
                              }
                            }}
                            className="flex-1 py-2 px-3 min-h-[44px] rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs text-center transition-colors flex items-center justify-center space-x-1"
                          >
                            <span>Checkout Now</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setShowLeadForm(true)}
                            className="py-2 px-3 min-h-[44px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors flex items-center justify-center"
                          >
                            Get Proposal
                          </button>
                        </div>
                      </div>
                    )}

                    <span className="block mt-1 text-[10px] opacity-60 text-right">{msg.timestamp}</span>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center space-x-2 text-slate-400 text-xs italic p-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>ApexGrowth AI is typing...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompt Suggestions */}
          {messages.length < 3 && (
            <div className="px-4 py-2 border-t border-slate-800/60 dark:border-slate-800/60 light:border-slate-200 bg-slate-900/40 dark:bg-slate-900/40 light:bg-slate-50 flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(qp)}
                  className="shrink-0 text-[10px] px-2.5 py-1 rounded-full bg-slate-800/80 dark:bg-slate-800/80 light:bg-slate-200 text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-emerald-400 dark:hover:text-emerald-400 light:hover:text-emerald-600 transition-colors border border-slate-700/50 dark:border-slate-700/50 light:border-slate-300 whitespace-nowrap"
                >
                  {qp}
                </button>
              ))}
            </div>
          )}

          {/* Inline Lead Form Drawer */}
          {showLeadForm && (
            <div className="p-4 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border-t border-slate-800 dark:border-slate-800 light:border-slate-300 animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Request Strategy Proposal</span>
                </h4>
                <button onClick={() => setShowLeadForm(false)} className="text-slate-400 hover:text-white text-xs">
                  Cancel
                </button>
              </div>
              <form onSubmit={handleLeadSubmit} className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                    className="p-2 text-xs rounded-lg bg-slate-950 dark:bg-slate-950 light:bg-white text-slate-100 dark:text-slate-100 light:text-slate-900 border border-slate-800 dark:border-slate-800 light:border-slate-300 focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Work Email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    className="p-2 text-xs rounded-lg bg-slate-950 dark:bg-slate-950 light:bg-white text-slate-100 dark:text-slate-100 light:text-slate-900 border border-slate-800 dark:border-slate-800 light:border-slate-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="WhatsApp Number"
                    value={leadForm.whatsapp}
                    onChange={(e) => setLeadForm({ ...leadForm, whatsapp: e.target.value })}
                    className="p-2 text-xs rounded-lg bg-slate-950 dark:bg-slate-950 light:bg-white text-slate-100 dark:text-slate-100 light:text-slate-900 border border-slate-800 dark:border-slate-800 light:border-slate-300 focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Business Type (e.g., Ecom, SaaS)"
                    value={leadForm.businessType}
                    onChange={(e) => setLeadForm({ ...leadForm, businessType: e.target.value })}
                    className="p-2 text-xs rounded-lg bg-slate-950 dark:bg-slate-950 light:bg-white text-slate-100 dark:text-slate-100 light:text-slate-900 border border-slate-800 dark:border-slate-800 light:border-slate-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <textarea
                  rows={2}
                  required
                  placeholder="What are you selling or offering?"
                  value={leadForm.sellingDetails}
                  onChange={(e) => setLeadForm({ ...leadForm, sellingDetails: e.target.value })}
                  className="w-full p-2 text-xs rounded-lg bg-slate-950 dark:bg-slate-950 light:bg-white text-slate-100 dark:text-slate-100 light:text-slate-900 border border-slate-800 dark:border-slate-800 light:border-slate-300 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={submittingLead}
                  className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5"
                >
                  {submittingLead ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Submit to Growth Strategist</span>}
                </button>
              </form>
            </div>
          )}

          {/* Action Input Bar */}
          <div className="p-3 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border-t border-slate-800 dark:border-slate-800 light:border-slate-200 flex items-center space-x-2">
            <input
              type="text"
              placeholder="Ask ApexGrowth AI..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 dark:bg-slate-950 light:bg-white text-slate-100 dark:text-slate-100 light:text-slate-900 text-xs border border-slate-800 dark:border-slate-800 light:border-slate-300 focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
