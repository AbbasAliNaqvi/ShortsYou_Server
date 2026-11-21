"use client";

import { memo } from "react";
import { Cpu, Flame, Clock, Wand2, Volume2 } from "lucide-react";
import type { CreatorSettings } from "@/lib/settings";

export interface EngineSettingsPanelProps {
  settings: CreatorSettings;
  onChange: (updater: (prev: CreatorSettings) => CreatorSettings) => void;
}

const AI_MODELS = [
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    provider: "Google DeepMind",
    badge: "⚡ 3.2s Fast",
    description: "Best for high-volume ingest, instant hook extraction, and real-time viral scoring.",
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "Google DeepMind",
    badge: "🧠 Deep Reasoning",
    description: "Multi-hour video context analysis with nuanced comedic timing & psychological retention.",
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    badge: "✍️ Nuanced Dialogue",
    description: "Exceptional narrative pacing, punchline timing, and contextual humor recognition.",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    badge: "👁️ Multimodal",
    description: "Balanced reasoning across facial expression cues and voice intonation changes.",
  },
] as const;

const DURATIONS = [
  { sec: 15, label: "15s Micro", note: "Maximum completion & re-watch rate on TikTok & Reels" },
  { sec: 30, label: "30s Standard", note: "Sweet-spot for YouTube Shorts monetization and algorithmic push" },
  { sec: 45, label: "45s Narrative", note: "Best for step-by-step tutorials and compelling storytelling" },
  { sec: 60, label: "60s In-Depth", note: "Maximum length for complete podcast clips and case studies" },
] as const;

const BROLL_OPTIONS = [
  { id: "none", label: "No B-Roll", note: "Original camera footage only" },
  { id: "light", label: "Light (every 10s)", note: "Subtle visual pattern interrupts" },
  { id: "dynamic", label: "Dynamic (every 5s)", note: "High-paced dopamine retention cuts" },
] as const;

export const EngineSettingsPanel = memo(function EngineSettingsPanel({
  settings,
  onChange,
}: EngineSettingsPanelProps) {
  const engine = settings.engine;

  const updateEngine = (field: keyof typeof engine, val: unknown) => {
    onChange((prev) => ({
      ...prev,
      engine: { ...prev.engine, [field]: val },
    }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-800 bg-emerald-50 border-emerald-300";
    if (score >= 75) return "text-amber-800 bg-amber-50 border-amber-300";
    return "text-rose-800 bg-rose-50 border-rose-300";
  };

  return (
    <div className="ca-settings-panel">
      {/* ── AI Model Engine ── */}
      <section className="ca-settings-card" aria-labelledby="ai-model-heading">
        <div className="ca-settings-card-head">
          <div className="ca-settings-card-head-left">
            <div className="ca-settings-card-icon" aria-hidden="true">
              <Cpu size={22} />
            </div>
            <div>
              <h2 id="ai-model-heading">AI Hook Detection Model</h2>
              <p>Select the foundation model powering automated video clip segmentation and viral hook indexing.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {AI_MODELS.map((m) => {
            const isSelected = engine.aiModel === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => updateEngine("aiModel", m.id)}
                className={`flex flex-col text-left p-4 rounded-2xl border transition-all ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 shadow-md scale-[1.01]"
                    : "bg-white text-slate-900 border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs"
                }`}
                aria-pressed={isSelected}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className="font-extrabold text-sm">{m.name}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {m.badge}
                  </span>
                </div>
                <span className={`text-xs ${isSelected ? "text-slate-300" : "text-slate-600"} leading-relaxed`}>
                  {m.description}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Virality Threshold & Duration ── */}
      <section className="ca-settings-card" aria-labelledby="virality-heading">
        <div className="ca-settings-card-head">
          <div className="ca-settings-card-head-left">
            <div className="ca-settings-card-icon" aria-hidden="true">
              <Flame size={22} />
            </div>
            <div>
              <h2 id="virality-heading">Viral Score Threshold &amp; Duration</h2>
              <p>Filter low-performing clips and calibrate standard short length.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Slider */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-sm font-bold text-slate-900 block">Minimum Viral Score Filter</span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Clips scoring below this threshold are marked as drafts and won&apos;t auto-queue.
                </p>
              </div>
              <span
                className={`text-sm font-black px-3.5 py-1 rounded-full border shadow-2xs ${getScoreColor(
                  engine.viralScoreThreshold,
                )}`}
              >
                {engine.viralScoreThreshold} / 100
              </span>
            </div>
            <input
              type="range"
              min={60}
              max={95}
              step={1}
              value={engine.viralScoreThreshold}
              onChange={(e) => updateEngine("viralScoreThreshold", Number(e.target.value))}
              className="ca-settings-range"
              aria-label="Minimum viral score threshold"
            />
            <div className="flex justify-between text-[11px] font-semibold text-slate-500 mt-2">
              <span>60 (Permissive)</span>
              <span>75 (Standard Recommended)</span>
              <span>90+ (Top 5% Virality Only)</span>
            </div>
          </div>

          {/* Duration Pills */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Default Target Short Length
              </span>
              <span className="text-xs text-slate-500 font-medium">
                <Clock size={13} className="inline mr-1 text-slate-400" />
                Selected: {engine.defaultDuration}s
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {DURATIONS.map((d) => {
                const isSelected = engine.defaultDuration === d.sec;
                return (
                  <button
                    key={d.sec}
                    type="button"
                    onClick={() => updateEngine("defaultDuration", d.sec)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-md scale-[1.01]"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-2xs"
                    }`}
                  >
                    <span className="font-extrabold text-sm">{d.label}</span>
                    <span className={`text-[10px] mt-0.5 ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                      {d.sec}s limit
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Auto-Queue Toggle */}
          <div className="ca-settings-toggle-row">
            <div className="ca-settings-toggle-info">
              <span className="ca-settings-toggle-title">Auto-Queue Viral Candidates</span>
              <span className="ca-settings-toggle-sub">
                Automatically render and export clips that hit or exceed the viral threshold.
              </span>
            </div>
            <label className="ca-settings-switch">
              <input
                type="checkbox"
                checked={engine.autoQueueViral}
                onChange={(e) => updateEngine("autoQueueViral", e.target.checked)}
              />
              <span className="ca-settings-slider-round" />
            </label>
          </div>
        </div>
      </section>

      {/* ── Audio & B-Roll Polish ── */}
      <section className="ca-settings-card" aria-labelledby="audio-heading">
        <div className="ca-settings-card-head">
          <div className="ca-settings-card-head-left">
            <div className="ca-settings-card-icon" aria-hidden="true">
              <Volume2 size={22} />
            </div>
            <div>
              <h2 id="audio-heading">Audio Engineering &amp; B-Roll Flow</h2>
              <p>Enhance speech clarity, duck background music, and configure dynamic visual cuts.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="ca-settings-toggle-row">
            <div className="ca-settings-toggle-info">
              <span className="ca-settings-toggle-title">Studio Voice Isolation &amp; Noise Suppression</span>
              <span className="ca-settings-toggle-sub">
                Removes room echo, microphone hiss, and background room hum using neural audio filters.
              </span>
            </div>
            <label className="ca-settings-switch">
              <input
                type="checkbox"
                checked={engine.audioEnhance}
                onChange={(e) => updateEngine("audioEnhance", e.target.checked)}
              />
              <span className="ca-settings-slider-round" />
            </label>
          </div>

          <div className="ca-settings-toggle-row">
            <div className="ca-settings-toggle-info">
              <span className="ca-settings-toggle-title">Automatic Music Ducking</span>
              <span className="ca-settings-toggle-sub">
                Smoothly lowers background audio track volume by {Math.abs(engine.musicDuckingDb)} dB whenever speech is detected.
              </span>
            </div>
            <label className="ca-settings-switch">
              <input
                type="checkbox"
                checked={engine.musicDucking}
                onChange={(e) => updateEngine("musicDucking", e.target.checked)}
              />
              <span className="ca-settings-slider-round" />
            </label>
          </div>

          {/* B-Roll Pills */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 shadow-2xs mt-1">
            <div className="flex items-center gap-2 mb-2.5">
              <Wand2 size={15} className="text-slate-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                B-Roll Overlay Rhythm
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {BROLL_OPTIONS.map((opt) => {
                const isSelected = engine.brollFrequency === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateEngine("brollFrequency", opt.id)}
                    className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className="font-bold text-xs">{opt.label}</span>
                    <span className={`text-[10px] mt-0.5 ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                      {opt.note}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
});
