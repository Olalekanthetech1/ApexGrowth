import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Sparkles, Eye, Film, Volume2, ShieldAlert } from 'lucide-react';
import { DemoScene } from '../../../types/index';

interface VideoScriptDemoProps {
  scenes?: DemoScene[];
}

const defaultScenes: DemoScene[] = [
  {
    timestamp: '0:00 – 0:03',
    title: '1. Pattern-Interrupt Hook',
    script: '"Stop using standard moisturizer if your skin still looks dull by noon."',
    visualDirection: 'Split-screen comparison: Left side showing dull, dry midday skin vs. right side showing glowing, hydrated skin with subtle kinetic typography overlay.',
    type: 'hook',
  },
  {
    timestamp: '0:04 – 0:15',
    title: '2. Problem & Agitation',
    script: '"Most formulas lose their effect quickly because they don\'t properly support the skin\'s moisture barrier."',
    visualDirection: 'Macro close-up texture shot showing skin surface dehydration simulation and moisture-loss 3D layer graphic.',
    type: 'problem',
  },
  {
    timestamp: '0:16 – 0:30',
    title: '3. Solution & Offer CTA',
    script: '"This serum is designed to help lock in hydration for longer. Tap Shop Now to discover the formula."',
    visualDirection: 'Clean product application dropper shot, radiant skin close-up, premium product packaging hero shot with animated "Shop Now" pulse button.',
    type: 'solution',
  },
];

export function VideoScriptDemo({ scenes = defaultScenes }: VideoScriptDemoProps) {
  const activeScenes = scenes.length > 0 ? scenes : defaultScenes;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackProgress((prev) => {
          if (prev >= 100) {
            setSelectedIndex((curr) => (curr + 1) % activeScenes.length);
            return 0;
          }
          return prev + 2.5; // ~4 seconds per scene
        });
      }, 100);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, activeScenes.length]);

  const currentScene = activeScenes[selectedIndex] || activeScenes[0];

  const handleSelectScene = (idx: number) => {
    setSelectedIndex(idx);
    setPlaybackProgress(0);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setSelectedIndex(0);
    setPlaybackProgress(0);
  };

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-slate-800/90 shadow-2xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Film className="w-3.5 h-3.5" />
            <span>Interactive Demo A</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
            Interactive Video Ad Script Preview
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Explore how direct-response visual cues, hooks, and retention pacing are structured.
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            id="play-script-demo-btn"
            onClick={togglePlay}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Preview</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Script Preview</span>
              </>
            )}
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress timeline bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Scene: {currentScene.title}</span>
          <span className="font-mono text-emerald-400">{currentScene.timestamp}</span>
        </div>
        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full transition-all duration-100 ease-linear rounded-full"
            style={{ width: `${isPlaying ? playbackProgress : (selectedIndex + 1) * (100 / activeScenes.length)}%` }}
          />
        </div>
      </div>

      {/* Interactive Scene Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {activeScenes.map((scene, idx) => {
          const isSelected = selectedIndex === idx;
          return (
            <button
              key={idx}
              id={`script-scene-tab-${idx}`}
              onClick={() => handleSelectScene(idx)}
              className={`text-left p-3.5 rounded-xl border transition-all duration-200 ${
                isSelected
                  ? 'bg-slate-900/90 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-semibold ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {scene.type.toUpperCase()}
                </span>
                <span className="text-[10px] font-mono text-slate-400">{scene.timestamp}</span>
              </div>
              <p className={`text-xs font-medium line-clamp-1 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                {scene.title}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Director Simulation Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-950/80 rounded-2xl p-5 border border-slate-800">
        {/* Left: Script & Voiceover Prompt */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-2">
              <Volume2 className="w-4 h-4" />
              <span>Voiceover / Spoken Script ({currentScene.timestamp})</span>
            </div>
            <blockquote className="text-base sm:text-lg font-medium text-white italic bg-slate-900/80 p-4 rounded-xl border-l-4 border-emerald-500">
              {currentScene.script}
            </blockquote>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-2">
              <Eye className="w-4 h-4" />
              <span>Visual &amp; B-Roll Scene Directions</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80 leading-relaxed">
              {currentScene.visualDirection}
            </p>
          </div>
        </div>

        {/* Right: Split Screen Visual Simulation Mock */}
        <div className="lg:col-span-6 bg-slate-900 rounded-xl p-4 border border-slate-800 flex flex-col justify-center items-center relative overflow-hidden min-h-[220px]">
          {currentScene.type === 'hook' && (
            <div className="w-full h-full flex flex-col items-center justify-center text-center">
              <div className="grid grid-cols-2 gap-2 w-full max-w-sm mb-3">
                <div className="bg-slate-950/90 rounded-lg p-3 border border-red-500/20">
                  <span className="text-[10px] uppercase font-bold text-red-400">Before: Standard</span>
                  <div className="h-16 bg-slate-800 rounded mt-2 flex items-center justify-center text-xs text-slate-400">
                    Dull Midday Skin
                  </div>
                </div>
                <div className="bg-slate-950/90 rounded-lg p-3 border border-emerald-500/30">
                  <span className="text-[10px] uppercase font-bold text-emerald-400">After: Formula</span>
                  <div className="h-16 bg-emerald-950/40 rounded mt-2 flex items-center justify-center text-xs text-emerald-300 font-semibold">
                    Radiant &amp; Hydrated ✨
                  </div>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">⚡ 0:00–0:03 Pattern-Interrupt Hook</span>
            </div>
          )}

          {currentScene.type === 'problem' && (
            <div className="w-full h-full flex flex-col items-center justify-center text-center">
              <div className="w-full max-w-xs bg-slate-950/90 rounded-xl p-4 border border-amber-500/30 mb-2">
                <div className="flex items-center justify-between text-xs text-amber-400 font-bold mb-2">
                  <span>Moisture Barrier Breakdown</span>
                  <span>45% Loss</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
                  <div className="bg-amber-400 h-full w-2/5 animate-pulse" />
                </div>
                <p className="text-[11px] text-slate-400">Micro-texture simulation showing water evaporation</p>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">🧪 0:04–0:15 Agitation Pacing</span>
            </div>
          )}

          {currentScene.type === 'solution' && (
            <div className="w-full h-full flex flex-col items-center justify-center text-center">
              <div className="w-full max-w-xs bg-gradient-to-br from-slate-950 to-emerald-950/50 rounded-xl p-4 border border-emerald-500/40 mb-2">
                <span className="text-xs font-bold text-emerald-300">Serum Absorption Active</span>
                <div className="my-2 py-2 px-4 bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg shadow-md animate-bounce">
                  TAP SHOP NOW ➔
                </div>
                <p className="text-[10px] text-emerald-400/80">Continuous 24h Barrier Protection</p>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">🎯 0:16–0:30 Offer Presentation</span>
            </div>
          )}
        </div>
      </div>

      {/* Regulatory/Demonstration Disclaimer */}
      <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950/60 px-3.5 py-2 rounded-xl border border-slate-800/60">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>
          <strong>Demonstration Content:</strong> The skincare product script shown above is an educational direct-response copywriting sample. Product claims are illustrative and not medically verified.
        </span>
      </div>
    </div>
  );
}
