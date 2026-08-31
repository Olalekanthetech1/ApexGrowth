import React, { useState, useEffect } from 'react';
import {
  Share2,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Loader2,
  ArrowUpDown,
  Eye,
  EyeOff,
  MessageCircle,
  Send,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Globe,
} from 'lucide-react';
import { api } from '../../lib/api';
import { SocialLink, SocialPlatform } from '../../types/index';
import { usePublicData } from '../../context/PublicDataContext';

export function SocialLinksManager() {
  const { refreshPublicData } = usePublicData();
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLink, setEditingLink] = useState<SocialLink | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [platform, setPlatform] = useState<SocialPlatform>('discord');
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(1);

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      setLoading(true);
      const data = await api.getSocialLinks();
      setLinks(data);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load social links' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingLink(null);
    setPlatform('discord');
    setLabel('Discord Server');
    setUrl('https://discord.gg/');
    setUsername('');
    setEnabled(true);
    setDisplayOrder(links.length + 1);
    setShowModal(true);
  };

  const handleOpenEdit = (item: SocialLink) => {
    setEditingLink(item);
    setPlatform(item.platform);
    setLabel(item.label);
    setUrl(item.url);
    setUsername(item.username || '');
    setEnabled(item.enabled);
    setDisplayOrder(item.displayOrder);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        platform,
        label,
        url,
        username: username.trim() || undefined,
        enabled,
        displayOrder: Number(displayOrder) || 0,
      };

      if (editingLink) {
        await api.updateSocialLink(editingLink.id, payload);
        setFeedback({ type: 'success', text: `Updated ${label} successfully` });
      } else {
        await api.createSocialLink(payload);
        setFeedback({ type: 'success', text: `Created ${label} link successfully` });
      }

      setShowModal(false);
      await loadLinks();
      await refreshPublicData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to save social link' });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleToggle = async (item: SocialLink) => {
    try {
      await api.updateSocialLink(item.id, { enabled: !item.enabled });
      setLinks(links.map((l) => (l.id === item.id ? { ...l, enabled: !l.enabled } : l)));
      await refreshPublicData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'Failed to toggle link status' });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the social link "${name}"?`)) return;

    try {
      await api.deleteSocialLink(id);
      setFeedback({ type: 'success', text: `Deleted "${name}" link` });
      await loadLinks();
      await refreshPublicData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete social link' });
    } finally {
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const getPlatformIcon = (plt: SocialPlatform) => {
    switch (plt) {
      case 'whatsapp':
        return <MessageCircle className="w-4 h-4 text-[#25D366]" />;
      case 'telegram':
        return <Send className="w-4 h-4 text-[#229ED9]" />;
      case 'instagram':
        return <Instagram className="w-4 h-4 text-[#E4405F]" />;
      case 'twitter':
        return <Twitter className="w-4 h-4 text-[#1DA1F2]" />;
      case 'linkedin':
        return <Linkedin className="w-4 h-4 text-[#0A66C2]" />;
      case 'youtube':
        return <Youtube className="w-4 h-4 text-[#FF0000]" />;
      case 'discord':
        return <Send className="w-4 h-4 text-[#5865F2]" />;
      default:
        return <Globe className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Social &amp; Community Channels</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your verified social profiles, direct conversion channels, and community invite links.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add Social Channel</span>
        </button>
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

      {/* Modal Form */}
      {showModal && (
        <div className="glass-panel rounded-2xl p-6 border border-emerald-500/40 bg-slate-900/95 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white font-display">
              {editingLink ? 'Edit Channel Link' : 'Add New Social Channel'}
            </h3>
            <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Platform *</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as SocialPlatform)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none capitalize"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="discord">Discord</option>
                  <option value="telegram">Telegram</option>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="twitter">X / Twitter</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="youtube">YouTube</option>
                  <option value="custom">Custom Channel</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Label / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Discord Community"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Username / Handle</label>
                <input
                  type="text"
                  placeholder="e.g. @apexgrowth"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Display Order</label>
                <input
                  type="number"
                  min="0"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="link-enabled"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
              <label htmlFor="link-enabled" className="text-xs text-slate-300 cursor-pointer">
                Publish and enable this social link on public site &amp; footer
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow flex items-center gap-1.5"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{editingLink ? 'Update Channel' : 'Create Channel'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Social Links List */}
      {loading ? (
        <div className="p-8 text-slate-400 text-sm">Loading channels...</div>
      ) : links.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800 space-y-3">
          <Share2 className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm font-semibold text-white">No social channels configured yet</p>
          <p className="text-xs text-slate-400">Click &quot;Add Social Channel&quot; to configure direct conversion links.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {links.map((item) => (
            <div
              key={item.id}
              className={`glass-panel rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                item.enabled ? 'border-slate-800 hover:border-slate-700' : 'border-slate-900 bg-slate-950/40 opacity-60'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      {getPlatformIcon(item.platform)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{item.label}</h4>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">{item.platform}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggle(item)}
                      title={item.enabled ? 'Disable channel' : 'Enable channel'}
                      className={`p-1.5 rounded-lg border text-xs transition-colors ${
                        item.enabled
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {item.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.label)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/50 border border-slate-700 text-slate-400 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  {item.username && (
                    <div className="text-xs text-emerald-400 font-mono">{item.username}</div>
                  )}
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-slate-400 hover:text-emerald-300 font-mono truncate flex items-center gap-1 block"
                  >
                    <span className="truncate">{item.url}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                <span>Order: {item.displayOrder}</span>
                <span className={item.enabled ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                  {item.enabled ? 'Active on site' : 'Disabled'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
