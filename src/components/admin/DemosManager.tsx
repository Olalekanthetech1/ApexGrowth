import React, { useState, useEffect } from 'react';
import {
  Film,
  CreditCard,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { DemoItem, DemoScene } from '../../types/index';
import { usePublicData } from '../../context/PublicDataContext';

export function DemosManager() {
  const { refreshPublicData } = usePublicData();
  const [demos, setDemos] = useState<DemoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Active editable state
  const [videoDemo, setVideoDemo] = useState<DemoItem | null>(null);
  const [checkoutDemo, setCheckoutDemo] = useState<DemoItem | null>(null);

  useEffect(() => {
    loadDemos();
  }, []);

  const loadDemos = async () => {
    try {
      setLoading(true);
      const data = await api.getDemos();
      setDemos(data);
      const v = data.find((d) => d.type === 'video_ad_script');
      const c = data.find((d) => d.type === 'checkout_sim');
      if (v) setVideoDemo(JSON.parse(JSON.stringify(v)));
      if (c) setCheckoutDemo(JSON.parse(JSON.stringify(c)));
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load demos' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVideoDemo = async () => {
    if (!videoDemo) return;
    setSaving(true);
    try {
      await api.updateDemo(videoDemo.id, videoDemo);
      await refreshPublicData();
      setFeedback({ type: 'success', text: 'Video ad script demo updated successfully' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to save demo' });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleSaveCheckoutDemo = async () => {
    if (!checkoutDemo) return;
    setSaving(true);
    try {
      await api.updateDemo(checkoutDemo.id, checkoutDemo);
      await refreshPublicData();
      setFeedback({ type: 'success', text: 'Checkout simulation demo updated successfully' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to save demo' });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleSceneChange = (idx: number, field: keyof DemoScene, val: string) => {
    if (!videoDemo) return;
    const scenes = [...(videoDemo.config?.scenes || [])];
    scenes[idx] = { ...scenes[idx], [field]: val };
    setVideoDemo({ ...videoDemo, config: { ...videoDemo.config, scenes } });
  };

  const handleAddScene = () => {
    if (!videoDemo) return;
    const scenes = [...(videoDemo.config?.scenes || [])];
    scenes.push({
      timestamp: '0:30 – 0:45',
      title: 'New Scene Angle',
      script: '"Spoken direct-response script angle goes here."',
      visualDirection: 'Visual shot camera angle and B-roll notes.',
      type: 'solution',
    });
    setVideoDemo({ ...videoDemo, config: { ...videoDemo.config, scenes } });
  };

  const handleRemoveScene = (idx: number) => {
    if (!videoDemo) return;
    const scenes = (videoDemo.config?.scenes || []).filter((_, i) => i !== idx);
    setVideoDemo({ ...videoDemo, config: { ...videoDemo.config, scenes } });
  };

  if (loading) {
    return <div className="p-8 text-slate-400">Loading interactive demos configuration...</div>;
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold font-display text-white">Interactive Demos Configuration</h1>
        <p className="text-sm text-slate-400 mt-1">
          Customize the interactive video script demonstration and sandbox payment simulation shown on the public site.
        </p>
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

      {/* Demo 1: Video Script Config */}
      {videoDemo && (
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Film className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-lg font-bold text-white font-display">Demo A: Video Ad Script Studio</h3>
                <p className="text-xs text-slate-400">Configure scenes, timestamps, scripts, and visual instructions.</p>
              </div>
            </div>
            <button
              onClick={handleSaveVideoDemo}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow flex items-center gap-1.5 cursor-pointer"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Demo A</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Script Scenes Breakdown</span>
              <button
                type="button"
                onClick={handleAddScene}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                + Add Scene
              </button>
            </div>

            {(videoDemo.config?.scenes || []).map((scene, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">Scene #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveScene(idx)}
                    className="p-1 text-slate-500 hover:text-red-400 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Timestamp</label>
                    <input
                      type="text"
                      value={scene.timestamp}
                      onChange={(e) => handleSceneChange(idx, 'timestamp', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Scene Title</label>
                    <input
                      type="text"
                      value={scene.title}
                      onChange={(e) => handleSceneChange(idx, 'title', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Scene Phase</label>
                    <select
                      value={scene.type}
                      onChange={(e) => handleSceneChange(idx, 'type', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                    >
                      <option value="hook">Hook</option>
                      <option value="problem">Problem / Agitation</option>
                      <option value="solution">Solution / Offer CTA</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Voiceover Script</label>
                  <textarea
                    rows={2}
                    value={scene.script}
                    onChange={(e) => handleSceneChange(idx, 'script', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Visual &amp; B-Roll Direction</label>
                  <textarea
                    rows={2}
                    value={scene.visualDirection}
                    onChange={(e) => handleSceneChange(idx, 'visualDirection', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none resize-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Demo 2: Checkout Simulation Config */}
      {checkoutDemo && (
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-lg font-bold text-white font-display">Demo B: Checkout Simulation Sandbox</h3>
                <p className="text-xs text-slate-400">Configure simulated order summary amount and product title.</p>
              </div>
            </div>
            <button
              onClick={handleSaveCheckoutDemo}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow flex items-center gap-1.5 cursor-pointer"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Demo B</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Simulated Product Title</label>
              <input
                type="text"
                value={checkoutDemo.config?.productTitle || ''}
                onChange={(e) =>
                  setCheckoutDemo({
                    ...checkoutDemo,
                    config: { ...checkoutDemo.config, productTitle: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Simulated Order Price ($ USD)</label>
              <input
                type="number"
                value={checkoutDemo.config?.productPrice ?? 249}
                onChange={(e) =>
                  setCheckoutDemo({
                    ...checkoutDemo,
                    config: { ...checkoutDemo.config, productPrice: parseFloat(e.target.value) || 0 },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
