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
  Eye,
  EyeOff,
  ChevronRight,
  PlusCircle,
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

  // Active selected or editing item
  const [selectedDemo, setSelectedDemo] = useState<DemoItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  useEffect(() => {
    loadDemos();
  }, []);

  const loadDemos = async (selectId?: string) => {
    try {
      setLoading(true);
      const data = await api.getDemos();
      setDemos(data);
      
      if (selectId) {
        const found = data.find((d) => d.id === selectId);
        if (found) {
          setSelectedDemo(JSON.parse(JSON.stringify(found)));
          setIsCreatingNew(false);
          return;
        }
      }

      if (data.length > 0 && !selectedDemo) {
        setSelectedDemo(JSON.parse(JSON.stringify(data[0])));
        setIsCreatingNew(false);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load demos' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = (demo: DemoItem) => {
    setIsCreatingNew(false);
    setSelectedDemo(JSON.parse(JSON.stringify(demo)));
  };

  const handleInitCreateNew = () => {
    setIsCreatingNew(true);
    setSelectedDemo({
      id: 'new',
      type: 'video_ad_script',
      title: 'New Custom Showcase',
      subtitle: 'Premium Interactive Demonstration',
      description: 'See our high-performance marketing frameworks in full action.',
      active: true,
      displayOrder: demos.length + 1,
      config: {
        scenes: [
          {
            timestamp: '0:00 – 0:05',
            title: 'Unbelievable Hook',
            script: '"Attention e-commerce founders: This one strategy is scaling brand revenue by 34%..."',
            visualDirection: 'Zooming screen transition with highlighted revenue graph in background.',
            type: 'hook',
          }
        ]
      }
    });
  };

  const handleSaveDemo = async () => {
    if (!selectedDemo) return;
    setSaving(true);
    setFeedback(null);
    try {
      if (isCreatingNew || selectedDemo.id === 'new') {
        // Create endpoint
        const created = await api.createDemo(selectedDemo);
        await refreshPublicData();
        setFeedback({ type: 'success', text: 'New interactive demo created successfully!' });
        await loadDemos(created.id);
      } else {
        // Update endpoint
        await api.updateDemo(selectedDemo.id, selectedDemo);
        await refreshPublicData();
        setFeedback({ type: 'success', text: 'Interactive demo updated successfully!' });
        await loadDemos(selectedDemo.id);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to save demo' });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleDeleteDemo = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this interactive showcase? This cannot be undone.')) {
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      await api.deleteDemo(id);
      await refreshPublicData();
      setFeedback({ type: 'success', text: 'Showcase demo deleted successfully.' });
      
      // If we deleted the active demo, select another one
      if (selectedDemo?.id === id) {
        setSelectedDemo(null);
      }
      await loadDemos();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete demo' });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // Scene handlers
  const handleSceneChange = (idx: number, field: keyof DemoScene, val: string) => {
    if (!selectedDemo) return;
    const scenes = [...(selectedDemo.config?.scenes || [])];
    scenes[idx] = { ...scenes[idx], [field]: val };
    setSelectedDemo({
      ...selectedDemo,
      config: { ...selectedDemo.config, scenes },
    });
  };

  const handleAddScene = () => {
    if (!selectedDemo) return;
    const scenes = [...(selectedDemo.config?.scenes || [])];
    scenes.push({
      timestamp: '0:30 – 0:45',
      title: 'New Scene Angle',
      script: '"Spoken direct-response script angle goes here."',
      visualDirection: 'Visual shot camera angle and B-roll notes.',
      type: 'solution',
    });
    setSelectedDemo({
      ...selectedDemo,
      config: { ...selectedDemo.config, scenes },
    });
  };

  const handleRemoveScene = (idx: number) => {
    if (!selectedDemo) return;
    const scenes = (selectedDemo.config?.scenes || []).filter((_, i) => i !== idx);
    setSelectedDemo({
      ...selectedDemo,
      config: { ...selectedDemo.config, scenes },
    });
  };

  // Type-specific configs
  const handleTypeChange = (newType: 'video_ad_script' | 'checkout_sim' | 'interactive_custom') => {
    if (!selectedDemo) return;
    let initialConfig: any = {};
    if (newType === 'video_ad_script') {
      initialConfig = {
        scenes: [
          {
            timestamp: '0:00 – 0:05',
            title: 'Hook',
            script: '"Double your checkout rate with this premium custom strategy."',
            visualDirection: 'Cinematic split-screen transition with crisp animated typography.',
            type: 'hook',
          }
        ]
      };
    } else if (newType === 'checkout_sim') {
      initialConfig = {
        productTitle: 'Conversion Accelerator',
        productPrice: 299,
        currencySymbol: '$',
        supportedTabs: ['Paystack Demo', 'Crypto Demo'],
      };
    } else {
      initialConfig = {
        customData: 'Configure any specific sandbox JSON or link metadata here.'
      };
    }

    setSelectedDemo({
      ...selectedDemo,
      type: newType,
      config: initialConfig,
    });
  };

  if (loading && demos.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mr-2.5" />
        <span>Loading interactive demos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Interactive Proof Gallery Configuration</h1>
          <p className="text-sm text-slate-400 mt-1">
            Build, edit, and delete real-time interactive customer simulation sandboxes shown on the public site.
          </p>
        </div>
        <button
          onClick={handleInitCreateNew}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Custom Demo</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Dynamic List */}
        <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
            Available Demos ({demos.length})
          </h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {demos.map((d) => {
              const isSelected = selectedDemo?.id === d.id && !isCreatingNew;
              return (
                <div
                  key={d.id}
                  onClick={() => handleSelectDemo(d)}
                  className={`group p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                      : 'bg-slate-950/40 border-slate-850 hover:bg-slate-900/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-slate-400'}`}>
                      {d.type === 'video_ad_script' ? (
                        <Film className="w-4 h-4" />
                      ) : d.type === 'checkout_sim' ? (
                        <CreditCard className="w-4 h-4" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-xs font-bold truncate">{d.title}</p>
                      <p className="text-[10px] text-slate-400 truncate capitalize">
                        {d.type.replace('_', ' ')} (Order: {d.displayOrder})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!d.active && (
                      <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase font-mono">
                        Draft
                      </span>
                    )}
                    <button
                      onClick={(e) => handleDeleteDemo(d.id, e)}
                      className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800/80 transition-colors"
                      title="Delete Demo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className={`w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform ${isSelected ? 'text-emerald-400' : ''}`} />
                  </div>
                </div>
              );
            })}

            {demos.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs">
                No interactive showcases exist in your database yet. Click "+ New Custom Demo" to create one.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Active Form */}
        <div className="lg:col-span-8">
          {selectedDemo ? (
            <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    {selectedDemo.type === 'video_ad_script' ? (
                      <Film className="w-5 h-5" />
                    ) : selectedDemo.type === 'checkout_sim' ? (
                      <CreditCard className="w-5 h-5" />
                    ) : (
                      <Sparkles className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white font-display">
                      {isCreatingNew ? 'Create Showcase Demo' : 'Edit Showcase Demo'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      ID: <span className="font-mono text-slate-500">{selectedDemo.id}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSaveDemo}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow flex items-center gap-1.5 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{isCreatingNew ? 'Create Demo' : 'Save Changes'}</span>
                </button>
              </div>

              {/* Base Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Demo Type</label>
                  <select
                    value={selectedDemo.type}
                    onChange={(e) => handleTypeChange(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                  >
                    <option value="video_ad_script">Video Ad Script Studio (Scene builder)</option>
                    <option value="checkout_sim">Checkout Simulation Sandbox</option>
                    <option value="interactive_custom">Custom Interactive JSON Integration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Display Order Priority</label>
                  <input
                    type="number"
                    value={selectedDemo.displayOrder}
                    onChange={(e) =>
                      setSelectedDemo({ ...selectedDemo, displayOrder: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Showcase Title</label>
                  <input
                    type="text"
                    value={selectedDemo.title}
                    onChange={(e) => setSelectedDemo({ ...selectedDemo, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Subtitle / Subheader</label>
                  <input
                    type="text"
                    value={selectedDemo.subtitle}
                    onChange={(e) => setSelectedDemo({ ...selectedDemo, subtitle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={selectedDemo.description}
                    onChange={(e) => setSelectedDemo({ ...selectedDemo, description: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none resize-none"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    {selectedDemo.active ? (
                      <Eye className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-slate-500" />
                    )}
                    <div>
                      <p className="text-xs font-bold text-white">Showcase Availability</p>
                      <p className="text-[10px] text-slate-400">Toggles whether this demo is visible on the public site.</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedDemo.active}
                    onChange={(e) => setSelectedDemo({ ...selectedDemo, active: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-800 text-emerald-500 focus:ring-emerald-500 bg-slate-950"
                  />
                </div>
              </div>

              {/* Dynamic Type Configuration Panes */}
              {selectedDemo.type === 'video_ad_script' && (
                <div className="pt-6 border-t border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Interactive Scene Breakdown
                    </span>
                    <button
                      type="button"
                      onClick={handleAddScene}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Add Scene Block</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(selectedDemo.config?.scenes || []).map((scene, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-950/80 border border-slate-850 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-400">Scene Sequence #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveScene(idx)}
                            className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors"
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
                              onChange={(e) => handleSceneChange(idx, 'type', e.target.value as any)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                            >
                              <option value="hook">Hook Angle</option>
                              <option value="problem">Problem / Agitation</option>
                              <option value="solution">Solution / Offer</option>
                              <option value="cta">CTA Pitch</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">Voiceover Script Copy</label>
                          <textarea
                            rows={2}
                            value={scene.script}
                            onChange={(e) => handleSceneChange(idx, 'script', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">Visual &amp; B-Roll Production Guidelines</label>
                          <textarea
                            rows={2}
                            value={scene.visualDirection}
                            onChange={(e) => handleSceneChange(idx, 'visualDirection', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none resize-none"
                          />
                        </div>
                      </div>
                    ))}
                    {(selectedDemo.config?.scenes || []).length === 0 && (
                      <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                        No scenes defined for this direct response script. Click "Add Scene Block" to construct sequences.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedDemo.type === 'checkout_sim' && (
                <div className="pt-6 border-t border-slate-800 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Simulated Sandbox Checkout Metrics
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Product Title</label>
                      <input
                        type="text"
                        value={selectedDemo.config?.productTitle || ''}
                        onChange={(e) =>
                          setSelectedDemo({
                            ...selectedDemo,
                            config: { ...selectedDemo.config, productTitle: e.target.value },
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Simulated Price</label>
                      <input
                        type="number"
                        value={selectedDemo.config?.productPrice ?? 199}
                        onChange={(e) =>
                          setSelectedDemo({
                            ...selectedDemo,
                            config: { ...selectedDemo.config, productPrice: parseFloat(e.target.value) || 0 },
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Currency Symbol</label>
                      <input
                        type="text"
                        value={selectedDemo.config?.currencySymbol || '$'}
                        onChange={(e) =>
                          setSelectedDemo({
                            ...selectedDemo,
                            config: { ...selectedDemo.config, currencySymbol: e.target.value },
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedDemo.type === 'interactive_custom' && (
                <div className="pt-6 border-t border-slate-800 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Custom JSON / Metadata Config
                  </span>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Raw Config Details</label>
                    <textarea
                      rows={6}
                      value={typeof selectedDemo.config === 'object' ? JSON.stringify(selectedDemo.config, null, 2) : selectedDemo.config || ''}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          setSelectedDemo({ ...selectedDemo, config: parsed });
                        } catch (err) {
                          // Handle string or non-strict JSON as fallback
                          setSelectedDemo({ ...selectedDemo, config: { customData: e.target.value } });
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none resize-y"
                      placeholder='{ "key": "value" }'
                    />
                    <p className="text-[10px] text-slate-500 mt-1.5">
                      Valid JSON syntax is automatically parsed. Non-JSON inputs will be wrapped in a "customData" attribute.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-12 border border-slate-800/60 flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 text-slate-600">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Select or Create a Demo Showcase</h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Pick any existing demonstration item from the sidebar layout or click the "+ New Custom Demo" button to configure another.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
