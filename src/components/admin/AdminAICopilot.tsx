import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, Sparkles, Copy, Check, FileText, TrendingUp, Users, AlertCircle, Loader2 } from 'lucide-react';

interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AdminAICopilotProps {
  userRole: 'superadmin' | 'admin' | 'editor';
}

export const AdminAICopilot: React.FC<AdminAICopilotProps> = ({ userRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'init',
      sender: 'assistant',
      content: `ApexGrowth Admin AI Copilot active (${userRole.toUpperCase()} mode). How can I assist with lead summaries, video ad hooks, or CMS content today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sessionId] = useState(() => `admin_copilot_${Date.now()}`);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const quickPromptsByRole = {
    superadmin: [
      "Summarize current revenue and recent orders",
      "Draft follow-up script for new qualified leads",
      "Suggest high-converting hooks for video ad script demo",
      "Draft SEO meta tags for our pricing page",
    ],
    admin: [
      "Summarize current revenue and recent orders",
      "Draft follow-up script for new qualified leads",
      "Suggest high-converting hooks for video ad script demo",
    ],
    editor: [
      "Suggest 3 high-converting hooks for direct response video ads",
      "Draft a new FAQ answer explaining our 7-day funnel delivery",
      "Optimize service descriptions for SEO clarity",
    ],
  };

  const handleSend = async (textToSend?: string) => {
    const prompt = textToSend || input;
    if (!prompt.trim() || loading) return;

    const userMsg: CopilotMessage = {
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

      const res = await fetch('/api/admin/ai/chat', {
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
        setMessages((prev) => [
          ...prev,
          {
            id: `ai_${Date.now()}`,
            sender: 'assistant',
            content: dataRes.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        throw new Error(dataRes.error || 'Failed to process Copilot request');
      }
    } catch (err: any) {
      console.error('Admin AI Copilot Error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_err_${Date.now()}`,
          sender: 'assistant',
          content: `Copilot error: ${err.message || 'Server communication failed.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      {/* Floating Copilot Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center space-x-2 px-4 py-2.5 rounded-full bg-slate-900 border border-emerald-500/40 text-emerald-400 font-bold text-xs shadow-xl hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>AI Copilot ({userRole})</span>
        </button>
      )}

      {/* Docked Drawer */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[440px] h-[600px] max-h-[88vh] z-50 flex flex-col rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-100 flex items-center space-x-2">
                  <span>ApexGrowth AI Copilot</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {userRole.toUpperCase()}
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">Executive & Operations Intelligence</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[90%] rounded-xl p-3 text-xs leading-relaxed relative group ${
                    m.sender === 'user'
                      ? 'bg-emerald-500 text-slate-950 font-medium'
                      : 'bg-slate-900 text-slate-200 border border-slate-800'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.content}</p>

                  {m.sender === 'assistant' && (
                    <button
                      onClick={() => copyToClipboard(m.content, m.id)}
                      className="absolute top-2 right-2 p-1 rounded bg-slate-950/60 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy response"
                    >
                      {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                  <span className="block mt-1 text-[9px] opacity-50 text-right">{m.timestamp}</span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-slate-400 text-xs italic p-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Copilot processing operational data...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 bg-slate-900/60 border-t border-slate-800/80 flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
            {(quickPromptsByRole[userRole] || quickPromptsByRole.editor).map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qp)}
                className="shrink-0 text-[10px] px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-700 whitespace-nowrap transition-colors"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center space-x-2">
            <input
              type="text"
              placeholder="Ask Copilot for stats, scripts, or summaries..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 text-slate-100 text-xs border border-slate-800 focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
