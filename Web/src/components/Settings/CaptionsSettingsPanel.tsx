"use client";

import { memo, useState, useEffect } from "react";
import { Subtitles, Crop, Smile, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { CreatorSettings } from "@/lib/settings";

export interface CaptionsSettingsPanelProps {
  settings: CreatorSettings;
  onChange: (updater: (prev: CreatorSettings) => CreatorSettings) => void;
}

const PRESETS = [
  {
    id: "mrbeast",
    name: "MrBeast Pop",
    tagline: "Explosive yellow punchline with solid black border",
    cssClass: "ca-caption-mrbeast",
    words: ["THIS", "ONE", "FRAME", "BLEW", "UP! 🚀"],
  },
  {
    id: "hormozi",
    name: "Hormozi Kinetic",
    tagline: "High-contrast emerald highlight tracking every spoken word",
    cssClass: "ca-caption-hormozi",
    words: ["NEVER", "SKIP", "THIS", "HOOK", "MOMENT"],
  },
  {
    id: "minimal",
    name: "Clean Minimal",
    tagline: "Frosted translucent badge with crisp modern sans-serif",
    cssClass: "ca-caption-minimal",
    words: ["Here is the exact", "3-step formula"],
  },
  {
    id: "cyber",
    name: "Cyber Neon",
    tagline: "Electric cyan & magenta chromatic glow for tech",
    cssClass: "ca-caption-cyber",
    words: ["NEXT-GEN", "AI", "AUTOMATION", "ACTIVATED"],
  },
] as const;

const FRAMING_MODES = [
  {
    id: "face-track",
    label: "Active Face Tracking (Smart 9:16)",
    desc: "Neural face tracker continuously centers the speaker. Ideal for vlogs, walk-and-talk, and solo presentations.",
    badge: "AI-Powered",
  },
  {
    id: "center-crop",
    label: "Static Center Crop",
    desc: "Locks focus on the central canvas coordinates. Best for screencasts, coding demos, and centered podium talks.",
    badge: "Pixel-Lock",
  },
  {
    id: "podcast-split",
    label: "2-Person Podcast Split",
    desc: "Splits 9:16 canvas into upper and lower frames to simultaneously show host reactions and guest dialogue.",
    badge: "Dual-Feed",
  },
] as const;

const POSITIONS = [
  { id: "bottom", label: "Bottom (20% from edge)", alignClass: "mt-auto mb-12" },
  { id: "center", label: "Dead Center", alignClass: "my-auto" },
  { id: "lower-third", label: "Lower Third (Reels / Shorts)", alignClass: "mt-auto mb-16" },
] as const;

export const CaptionsSettingsPanel = memo(function CaptionsSettingsPanel({
  settings,
  onChange,
}: CaptionsSettingsPanelProps) {
  const captions = settings.captions;
  const [wordIndex, setWordIndex] = useState(0);

  const updateCaptions = (field: keyof typeof captions, val: unknown) => {
    onChange((prev) => ({
      ...prev,
      captions: { ...prev.captions, [field]: val },
    }));
  };

  const activePreset = PRESETS.find((p) => p.id === captions.stylePreset) || PRESETS[0];
  const positionObj = POSITIONS.find((p) => p.id === captions.position) || POSITIONS[1];

  useEffect(() => {
    const timer = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % activePreset.words.length);
    }, 950);
    return () => clearInterval(timer);
  }, [activePreset]);

  return (
    <div className="ca-settings-panel">
      {/* ── Visual Preset & Live Mockup ── */}
      <section className="ca-settings-card" aria-labelledby="caption-style-heading">
        <div className="ca-settings-card-head">
          <div className="ca-settings-card-head-left">
            <div className="ca-settings-card-icon" aria-hidden="true">
              <Subtitles size={22} />
            </div>
            <div>
              <h2 id="caption-style-heading">Kinetic Caption Styles &amp; Typography</h2>
              <p>Configure subtitle kinetic animations, fonts, and word-by-word highlights.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Presets Selection */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Select Subtitle Preset
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
                        : "bg-white text-slate-800 border-slate-200/90 hover:border-slate-300 hover:bg-slate-50 shadow-2xs"
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
            <div className="ca-settings-toggle-row mt-1">
              <div className="ca-settings-toggle-info">
                <div className="flex items-center gap-1.5">
                  <Smile size={16} className="text-amber-500" />
                  <span className="ca-settings-toggle-title">Contextual Auto-Emoji</span>
                </div>
                <span className="ca-settings-toggle-sub">
                  Intelligently attaches animated emoji (🔥, ⚡, 🤯) to vocal emphasis timestamps.
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
            <div className="ca-settings-field">
              <label htmlFor="settings-caption-pos" className="ca-settings-label">
                <span>Vertical Placement on 9:16 Screen</span>
                <span className="ca-settings-hint">Avoids TikTok / Reels side action buttons</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {POSITIONS.map((pos) => {
                  const isSelected = captions.position === pos.id;
                  return (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => updateCaptions("position", pos.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                        isSelected
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {pos.label.split("(")[0]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Live Interactive Phone Mockup */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="ca-phone-preview-container w-full max-w-[280px]">
              <div className="flex items-center justify-between w-full px-1">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Smartphone size={13} />
                  <span>9:16 Live Preview</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live
                </span>
              </div>

              <div className="ca-phone-frame">
                <div className="ca-phone-notch" />
                <div
                  className="ca-phone-content"
                  style={{
                    background: "radial-gradient(ellipse at 50% 25%, #1e293b 0%, #090d16 100%)",
                  }}
                >
                  {/* Watermark */}
                  <div className="w-full flex items-center justify-between text-[9px] text-white/60 pt-5 px-1 z-10">
                    <span className="font-bold">@{settings.profile.handle || "creator"}</span>
                    <span className="font-mono bg-black/40 px-1 rounded text-white/70">0:18 / 0:30</span>
                  </div>

                  {/* Audio Waveform */}
                  <div className="ca-audio-waves" aria-hidden="true">
                    {[10, 16, 7, 20, 14, 6, 18, 12, 8, 15].map((h, i) => (
                      <div
                        key={i}
                        className="ca-audio-wave-bar"
                        style={{
                          animationDelay: `${i * 0.12}s`,
                          height: `${h}px`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Dynamic Subtitle Preview Box */}
                  <div
                    className={`w-full flex flex-col items-center justify-center transition-all duration-300 ${positionObj.alignClass}`}
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${activePreset.id}-${wordIndex}`}
                        initial={{ opacity: 0, scale: 0.88, y: 3 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={`inline-block ${activePreset.cssClass}`}
                      >
                        {activePreset.words[wordIndex]}
                      </motion.div>
                    </AnimatePresence>

                    {captions.autoEmoji && (
                      <span className="mt-2 text-xl inline-block animate-bounce">
                        🔥
                      </span>
                    )}
                  </div>

                  {/* Video Progress Bar */}
                  <div className="w-full mt-auto mb-1">
                    <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 w-3/5 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              <span className="text-[11px] text-slate-400 font-medium text-center">
                Preset: <strong className="text-white">{activePreset.name}</strong> • Placement:{" "}
                <strong className="text-white">{positionObj.label.split("(")[0]}</strong>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9:16 Smart Auto-Framing ── */}
      <section className="ca-settings-card" aria-labelledby="framing-heading">
        <div className="ca-settings-card-head">
          <div className="ca-settings-card-head-left">
            <div className="ca-settings-card-icon" aria-hidden="true">
              <Crop size={22} />
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
                    : "bg-white text-slate-900 border-slate-200/90 hover:border-slate-300 hover:bg-slate-50 shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-bold text-sm">{mode.label.split("(")[0]}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {mode.badge}
                  </span>
                </div>
                <span className={`text-xs leading-relaxed ${isSelected ? "text-slate-300" : "text-slate-600"}`}>
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
