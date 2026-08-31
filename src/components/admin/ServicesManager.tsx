import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Loader2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Service } from '../../types/index';
import { usePublicData } from '../../context/PublicDataContext';

export function ServicesManager() {
  const { refreshPublicData } = usePublicData();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const availableIcons = [
    'TrendingUp',
    'Layout',
    'CreditCard',
    'Video',
    'Smartphone',
    'MessageSquare',
    'SearchCheck',
    'PenTool',
    'Zap',
    'Layers',
  ];

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await api.getServices();
      setServices(data);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load services' });
    } finally {
      setLoading(false);
    }
  };

  const handleStartAdd = () => {
    setIsNew(true);
    setEditingService({
      title: '',
      slug: '',
      description: '',
      iconName: 'Zap',
      features: ['Conversion-optimized copywriting', 'Custom styling and assets'],
      published: true,
      displayOrder: services.length + 1,
    });
  };

  const handleStartEdit = (service: Service) => {
    setIsNew(false);
    setEditingService({ ...service });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    setSaving(true);

    try {
      if (isNew) {
        await api.createService(editingService);
        setFeedback({ type: 'success', text: 'Service created successfully' });
      } else {
        await api.updateService(editingService.id!, editingService);
        setFeedback({ type: 'success', text: 'Service updated successfully' });
      }
      setEditingService(null);
      await loadServices();
      await refreshPublicData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to save service' });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await api.deleteService(id);
      setFeedback({ type: 'success', text: `Service "${title}" deleted` });
      await loadServices();
      await refreshPublicData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete service' });
    }
  };

  const handleFeatureChange = (index: number, val: string) => {
    if (!editingService || !editingService.features) return;
    const next = [...editingService.features];
    next[index] = val;
    setEditingService({ ...editingService, features: next });
  };

  const handleAddFeature = () => {
    if (!editingService) return;
    const current = editingService.features || [];
    setEditingService({ ...editingService, features: [...current, 'New benefit feature'] });
  };

  const handleRemoveFeature = (index: number) => {
    if (!editingService || !editingService.features) return;
    const next = editingService.features.filter((_, i) => i !== index);
    setEditingService({ ...editingService, features: next });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Services &amp; Offerings</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage the direct-response solutions, icon representations, and feature checklists displayed on the public site.
          </p>
        </div>

        <button
          onClick={handleStartAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Service</span>
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

      {/* Editing Modal / Drawer */}
      {editingService && (
        <div className="glass-panel rounded-2xl p-6 border border-emerald-500/50 bg-slate-900/95 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white font-display">
              {isNew ? 'Create New Service' : `Edit: ${editingService.title}`}
            </h3>
            <button
              onClick={() => setEditingService(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Service Title *</label>
                <input
                  type="text"
                  required
                  value={editingService.title || ''}
                  onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Slug *</label>
                <input
                  type="text"
                  required
                  value={editingService.slug || ''}
                  onChange={(e) => setEditingService({ ...editingService, slug: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Description *</label>
              <textarea
                rows={2}
                required
                value={editingService.description || ''}
                onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Icon Representation</label>
                <select
                  value={editingService.iconName || 'Zap'}
                  onChange={(e) => setEditingService({ ...editingService, iconName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                >
                  {availableIcons.map((ico) => (
                    <option key={ico} value={ico}>
                      {ico}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Display Order</label>
                <input
                  type="number"
                  value={editingService.displayOrder || 1}
                  onChange={(e) => setEditingService({ ...editingService, displayOrder: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="service-is-published"
                    checked={editingService.published ?? true}
                    onChange={(e) => setEditingService({ ...editingService, published: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                  <label htmlFor="service-is-published" className="text-xs text-slate-300 cursor-pointer">
                    Published on website
                  </label>
                </div>
              </div>
            </div>

            {/* Feature Bullets Editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300">Feature Bullet Points</label>
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  + Add Point
                </button>
              </div>
              <div className="space-y-2">
                {(editingService.features || []).map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={feat}
                      onChange={(e) => handleFeatureChange(idx, e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingService(null)}
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
                <span>Save Service</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Services Table/Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <div
            key={service.id}
            className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  #{service.displayOrder} • {service.iconName}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                    service.published
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {service.published ? 'Published' : 'Draft'}
                </span>
              </div>

              <h3 className="text-base font-bold text-white mb-1.5">{service.title}</h3>
              <p className="text-xs text-slate-400 line-clamp-2 mb-3">{service.description}</p>

              <div className="space-y-1 mb-4">
                {(service.features || []).slice(0, 3).map((f, i) => (
                  <div key={i} className="text-[11px] text-slate-300 flex items-center gap-1.5 truncate">
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
              <button
                onClick={() => handleStartEdit(service)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleDelete(service.id, service.title)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950/40 border border-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                title="Delete Service"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
