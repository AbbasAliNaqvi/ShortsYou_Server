"use client";

import { memo } from "react";
import { Subtitles, Crop, Smile, Smartphone } from "lucide-react";
import type { CreatorSettings } from "@/lib/settings";

export interface CaptionsSettingsPanelProps {
  settings: CreatorSettings;
  onChange: (updater: (prev: CreatorSettings) => CreatorSettings) => void;
}

const PRESETS = [
  {
    id: "mrbeast",
    name: "MrBeast Pop",
    tagline: "Bold yellow stroke with explosive emphasis",
    cssClass: "ca-caption-mrbeast",
    sample: "THIS CHANGED EVERYTHING! 🔥",
  },
  {
    id: "hormozi",
    name: "Hormozi Kinetic",
    tagline: "High-contrast green/yellow word highlight",
    cssClass: "ca-caption-hormozi",
    sample: "DO NOT SKIP THIS STEP",
  },
  {
    id: "minimal",
    name: "Clean Minimal",
    tagline: "Frosted translucent badge with crisp typography",
    cssClass: "ca-caption-minimal",
    sample: "Here is the exact framework.",
  },
  {
    id: "cyber",
    name: "Cyber Neon",
    tagline: "Electric cyan & magenta glow for tech content",
    cssClass: "ca-caption-cyber",
    sample: "NEXT-GEN AI REVOLUTION",
  },
] as const;

const FRAMING_MODES = [
  {
    id: "face-track",
    label: "Active Face Tracking",
    desc: "AI detects faces and smoothly pans 9:16 viewport to keep speakers centered.",
  },
  {
    id: "center-crop",
    label: "Static Center Crop",
    desc: "Locks focus at canvas center. Ideal for gaming, screencasts, and static setups.",
  },
  {
    id: "podcast-split",
    label: "Split-Screen (2 Speakers)",
    desc: "Automatically splits 9:16 vertically to show host on top and guest below.",
  },
] as const;

const POSITIONS = [
  { id: "bottom", label: "Lower Third" },
  { id: "center", label: "Center Canvas" },
  { id: "lower-third", label: "Subtitle Bar (Near Bottom)" },
] as const;

export const CaptionsSettingsPanel = memo(function CaptionsSettingsPanel({
  settings,
  onChange,
}: CaptionsSettingsPanelProps) {
  const captions = settings.captions;

  const updateCaptions = (field: keyof typeof captions, val: unknown) => {
    onChange((prev) => ({
      ...prev,
      captions: { ...prev.captions, [field]: val },
    }));
  };

  const activePreset = PRESETS.find((p) => p.id === captions.stylePreset) || PRESETS[0];

  return (
    <div className="ca-settings-panel">
      {/* ── Visual Preset & Live Mockup ── */}
      <section className="ca-settings-card ca-glass" aria-labelledby="caption-style-heading">
        <div className="ca-settings-card-head">
          <div className="ca-settings-card-head-left">
            <div className="ca-settings-card-icon" aria-hidden="true">
              <Subtitles size={20} />
            </div>
            <div>
              <h2 id="caption-style-heading">Caption Styles &amp; Typography</h2>
              <p>Configure subtitle kinetic animations, fonts, and word-by-word highlights.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Presets Selection */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Select Preset Theme
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESETS.map((p) => {
                const isSelected = captions.stylePreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => updateCaptions("stylePreset", p.id)}
                    className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-md scale-[1.01]"
                        : "bg-white/80 text-slate-800 border-slate-200/90 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <span className="font-extrabold text-sm">{p.name}</span>
                    <span className={`text-xs mt-1 leading-relaxed ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                      {p.tagline}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Auto-Emoji Switch */}
            <div className="ca-settings-toggle-row mt-2">
              <div className="ca-settings-toggle-info">
                <div className="flex items-center gap-1.5">
                  <Smile size={16} className="text-amber-500" />
                  <span className="ca-settings-toggle-title">Contextual Auto-Emoji</span>
                </div>
                <span className="ca-settings-toggle-sub">
                  Intelligently attaches matching animated emoji (e.g., 🚀, 💡, 🤯) to keyword timestamps.
                </span>
              </div>
              <label className="ca-settings-switch">
                <input
                  type="checkbox"
                  checked={captions.autoEmoji}
                  onChange={(e) => updateCaptions("autoEmoji", e.target.checked)}
                />
                <span className="ca-settings-slider-round" />
              </label>
            </div>

            {/* Position Select */}
            <div className="ca-settings-field mt-1">
              <label htmlFor="settings-caption-pos" className="ca-settings-label">
                <span>Vertical Placement</span>
                <span className="ca-settings-hint">Avoids TikTok / Reels right-side action buttons</span>
              </label>
              <select
                id="settings-caption-pos"
                value={captions.position}
                onChange={(e) => updateCaptions("position", e.target.value)}
                className="ca-settings-select"
              >
                {POSITIONS.map((pos) => (
                  <option key={pos.id} value={pos.id}>
                    {pos.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: Live Interactive Phone Mockup */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="ca-phone-preview-container w-full max-w-[280px]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-widest mb-1">
                <Smartphone size={14} />
                <span>9:16 Live Preview</span>
              </div>

              <div className="ca-phone-frame">
                <div className="ca-phone-notch" />
                <div
                  className="ca-phone-content"
                  style={{
                    background: "radial-gradient(circle at 50% 30%, #1e293b, #090d16)",
                  }}
                >
                  {/* Subtle Video Dummy Silhouette */}
                  <div className="w-16 h-16 rounded-full bg-slate-700/50 mb-auto mt-12 flex items-center justify-center border border-slate-600/40">
                    <div className="w-8 h-8 rounded-full bg-slate-500/40" />
                  </div>

                  {/* Dynamic Subtitle Preview Box */}
                  <div
                    className={`my-auto max-w-[160px] transition-all transform duration-300 ${activePreset.cssClass}`}
                  >
                    <span>{activePreset.sample}</span>
                    {captions.autoEmoji && <span className="ml-1 inline-block animate-bounce">⚡</span>}
                  </div>

                  {/* Bottom Metadata Simulator */}
                  <div className="w-full mt-auto mb-2 text-left">
                    <div className="text-[10px] font-bold text-white/90">@creator • ShortsYou</div>
                    <div className="text-[9px] text-white/60 truncate">Viral AI Generation in Action</div>
                  </div>
                </div>
              </div>

              <span className="text-[11px] text-slate-400 font-medium text-center">
                Rendered with {activePreset.name} typography
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9:16 Smart Auto-Framing ── */}
      <section className="ca-settings-card ca-glass" aria-labelledby="framing-heading">
        <div className="ca-settings-card-head">
          <div className="ca-settings-card-head-left">
            <div className="ca-settings-card-icon" aria-hidden="true">
              <Crop size={20} />
            </div>
            <div>
              <h2 id="framing-heading">Aspect Ratio &amp; Auto-Framing Mode</h2>
              <p>How wide 16:9 landscape footage is converted to vertical 9:16 mobile format.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {FRAMING_MODES.map((mode) => {
            const isSelected = captions.framingMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => updateCaptions("framingMode", mode.id)}
                className={`flex flex-col text-left p-4 rounded-2xl border transition-all ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 shadow-md scale-[1.01]"
                    : "bg-white/80 text-slate-800 border-slate-200/90 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <span className="font-bold text-sm mb-1">{mode.label}</span>
                <span className={`text-xs leading-relaxed ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                  {mode.desc}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
});
