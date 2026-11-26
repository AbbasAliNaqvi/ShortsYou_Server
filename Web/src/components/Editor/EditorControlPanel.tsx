"use client";

import { useState } from "react";
import { Lightbulb, Loader2, RotateCcw } from "lucide-react";
import type { AutoComposeResult, EditSettings, HookVariation } from "@/lib/api";

const layouts = [
  { value: "standard", title: "Smart portrait", desc: "One focused speaker, centered.", panels: 1 },
  { value: "two_frame", title: "Two faces", desc: "Pin two speakers stacked.", panels: 2 },
  { value: "multi_face", title: "Multi-faces", desc: "Up to three stacked panels.", panels: 3 },
  { value: "auto_face", title: "Auto face", desc: "Adapts framing automatically.", panels: 0 },
] as const;

const GRADES = [
  { value: "vibrant", label: "Vibrant", bg: "linear-gradient(135deg, #f59e0b, #ef4444)" },
  { value: "warm", label: "Warm", bg: "linear-gradient(135deg, #fbbf24, #ea580c)" },
  { value: "cinematic", label: "Cinematic", bg: "linear-gradient(135deg, #1e293b, #0f766e)" },
  { value: "cool", label: "Cool", bg: "linear-gradient(135deg, #38bdf8, #4f46e5)" },
  { value: "natural", label: "Natural", bg: "linear-gradient(135deg, #6ee7b7, #64748b)" },
] as const;

function LayoutIcon({ panels }: { panels: number }) {
  return (
    <svg width="24" height="32" viewBox="0 0 24 32" aria-hidden="true" style={{ flexShrink: 0 }}>
      <rect x="1" y="1" width="22" height="30" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      {panels === 1 && <circle cx="12" cy="13" r="4" fill="currentColor" opacity="0.8" />}
      {panels === 2 && (
        <>
          <line x1="3" y1="16" x2="21" y2="16" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
          <circle cx="12" cy="9" r="3" fill="currentColor" opacity="0.8" />
          <circle cx="12" cy="23" r="3" fill="currentColor" opacity="0.8" />
        </>
      )}
      {panels === 3 && (
        <>
          <line x1="3" y1="11" x2="21" y2="11" stroke="currentColor" strokeWidth="1.1" opacity="0.5" />
          <line x1="3" y1="21" x2="21" y2="21" stroke="currentColor" strokeWidth="1.1" opacity="0.5" />
          <circle cx="12" cy="6.5" r="2.2" fill="currentColor" opacity="0.8" />
          <circle cx="12" cy="16" r="2.2" fill="currentColor" opacity="0.8" />
          <circle cx="12" cy="25.5" r="2.2" fill="currentColor" opacity="0.8" />
        </>
      )}
      {panels === 0 && (
        <>
          <rect x="5" y="6" width="14" height="14" rx="3" fill="none" stroke="currentColor" strokeDasharray="2 2" strokeWidth="1.3" />
          <circle cx="12" cy="13" r="3" fill="currentColor" opacity="0.8" />
        </>
      )}
    </svg>
  );
}

export interface EditorControlPanelProps {
  settings: EditSettings;
  layout: string;
  hook: string;
  aiSuggestion?: AutoComposeResult | null;
  onUpdate: <K extends keyof EditSettings>(key: K, value: EditSettings[K]) => void;
  onSetHook: (val: string) => void;
  onAutoCompose?: () => Promise<void>;
  composing?: boolean;
  composeReasoning?: string;
  onFetchHookVariations?: () => Promise<HookVariation[]>;
}

export function EditorControlPanel({
  settings,
  layout,
  hook,
  aiSuggestion,
  onUpdate,
  onSetHook,
  onFetchHookVariations,
}: EditorControlPanelProps) {
  const [hookVariations, setHookVariations] = useState<HookVariation[]>([]);
  const [loadingHooks, setLoadingHooks] = useState(false);
  const [hooksOpen, setHooksOpen] = useState(false);

  async function handleLoadHooks() {
    if (!onFetchHookVariations) return;
    setHooksOpen(true);
    setLoadingHooks(true);
    try {
      const vars = await onFetchHookVariations();
      setHookVariations(vars);
    } catch {
      // handled upstream
    } finally {
      setLoadingHooks(false);
    }
  }

  return (
    <aside className="ss-manual-grid ss-enter" aria-label="Manual Controls">
      {/* 1. Frame People (4 Radio Cards) */}
      <section className="ca-glass ss-panel" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div>
            <h2 className="ss-card-title">Frame People</h2>
            <p className="ss-muted" style={{ margin: "2px 0 0" }}>Face detection &amp; panel layout</p>
          </div>
          {aiSuggestion?.layout && (
            <button type="button" className="ss-link-btn" onClick={() => onUpdate("layout", aiSuggestion.layout)}>
              <RotateCcw size={13} />
              <span>Reset to AI suggestion</span>
            </button>
          )}
        </div>

        <div className="ss-cards-2x2" role="radiogroup" aria-label="Framing layout">
          {layouts.map((item) => {
            const isSelected = layout === item.value;
            return (
              <label key={item.value} className={`ss-radio-card ${isSelected ? "is-selected" : ""}`}>
                <input
                  type="radio"
                  name="manual-layout"
                  value={item.value}
                  checked={isSelected}
                  onChange={() => onUpdate("layout", item.value)}
                  style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
                />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <LayoutIcon panels={item.panels} />
                  {isSelected && <span className="ss-selected-chip">Selected</span>}
                </div>
                <strong style={{ fontSize: 14, fontWeight: 800 }}>{item.title}</strong>
                <p className="ss-card-desc">{item.desc}</p>
              </label>
            );
          })}
        </div>
      </section>

      {/* 2. Captions & Hook */}
      <section className="ca-glass ss-panel" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div>
            <h2 className="ss-card-title">Captions &amp; Hook</h2>
            <p className="ss-muted" style={{ margin: "2px 0 0" }}>Opening headline &amp; caption look</p>
          </div>
          {aiSuggestion && (
            <button
              type="button"
              className="ss-link-btn"
              onClick={() => {
                if (aiSuggestion.hookText) onSetHook(aiSuggestion.hookText);
                if (aiSuggestion.captionStyle) onUpdate("captionStyle", aiSuggestion.captionStyle);
              }}
            >
              <RotateCcw size={13} />
              <span>Reset to AI suggestion</span>
            </button>
          )}
        </div>

        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <label htmlFor="ss-hook-input" style={{ fontSize: 12, fontWeight: 700, color: "var(--ss-ink-2)" }}>
              Opening Hook Headline
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {onFetchHookVariations && (
                <button
                  type="button"
                  className="ss-btn-secondary"
                  style={{ minHeight: 32, padding: "4px 10px" }}
                  onClick={() => void handleLoadHooks()}
                  disabled={loadingHooks}
                >
                  {loadingHooks ? <Loader2 size={13} className="ss-spin" /> : <Lightbulb size={13} />}
                  <span>AI hook ideas</span>
                </button>
              )}
              <span className="ss-meta-mono">{hook.length}/100</span>
            </div>
          </div>

          <input
            id="ss-hook-input"
            type="text"
            className="ss-input"
            maxLength={100}
            value={hook}
            onChange={(e) => onSetHook(e.target.value)}
            placeholder="Stop the scroll (e.g. This changes everything…)"
          />

          {hooksOpen && hookVariations.length > 0 && (
            <div className="ss-popover" style={{ width: "100%" }}>
              {hookVariations.map((v, i) => (
                <button
                  key={i}
                  type="button"
                  className={`ss-popover-opt ${hook === v.text ? "is-selected" : ""}`}
                  onClick={() => {
                    onSetHook(v.text);
                    setHooksOpen(false);
                  }}
                >
                  <span>{v.tone}: &ldquo;{v.text}&rdquo;</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ss-ink-2)" }}>Caption Style</span>
          <div className="ss-tabs" role="radiogroup" aria-label="Caption style">
            {(["karaoke", "bold", "minimal"] as const).map((cap) => {
              const selected = settings.captionStyle === cap;
              return (
                <label
                  key={cap}
                  className={`ss-tab-btn ${selected ? "active" : ""}`}
                  style={{ textTransform: "capitalize", position: "relative" }}
                >
                  <input
                    type="radio"
                    name="manual-caption"
                    value={cap}
                    checked={selected}
                    onChange={() => onUpdate("captionStyle", cap)}
                    style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
                  />
                  {selected && <span className="ss-tab-indicator" />}
                  <span>{cap}</span>
                </label>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Polish & Grade (Full width across 2 cols) */}
      <section className="ca-glass ss-panel ss-manual-full" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <div>
            <h2 className="ss-card-title">Polish &amp; Grade</h2>
            <p className="ss-muted" style={{ margin: "2px 0 0" }}>Music track mood, color LUT swatches &amp; canvas fill</p>
          </div>
          {aiSuggestion && (
            <button
              type="button"
              className="ss-link-btn"
              onClick={() => {
                if (aiSuggestion.musicMood) onUpdate("musicMood", aiSuggestion.musicMood);
                if (aiSuggestion.colorGrade) onUpdate("colorGrade", aiSuggestion.colorGrade);
                if (aiSuggestion.backgroundStyle) onUpdate("backgroundStyle", aiSuggestion.backgroundStyle);
              }}
            >
              <RotateCcw size={13} />
              <span>Reset to AI suggestion</span>
            </button>
          )}
        </div>

        {/* Music Mood Chips */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ss-ink-2)" }}>Music Mood</span>
          <div className="ss-blueprint-row" role="radiogroup" aria-label="Music mood">
            {(["energetic", "calm", "motivational", "dramatic", "neutral", "none"] as const).map((mood) => {
              const selected = settings.musicMood === mood;
              return (
                <button
                  key={mood}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`ss-chip-btn ${selected ? "is-active" : ""}`}
                  style={{ textTransform: "capitalize" }}
                  onClick={() => onUpdate("musicMood", mood)}
                >
                  {mood}
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Grade Gradient Swatches */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ss-ink-2)" }}>Color Grade</span>
          <div className="ss-swatch-grid" role="radiogroup" aria-label="Color grade">
            {GRADES.map((g) => {
              const selected = settings.colorGrade === g.value;
              return (
                <label
                  key={g.value}
                  className={`ss-radio-card ${selected ? "is-selected" : ""}`}
                  style={{ alignItems: "center", padding: 12 }}
                >
                  <input
                    type="radio"
                    name="manual-grade"
                    value={g.value}
                    checked={selected}
                    onChange={() => onUpdate("colorGrade", g.value)}
                    style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
                  />
                  <span className="ss-swatch-dot" style={{ background: g.bg }} />
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{g.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Canvas Background Visual Selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ss-ink-2)" }}>Canvas Background</span>
          <div className="ss-blueprint-row" role="radiogroup" aria-label="Canvas background">
            {(
              [
                ["crop", "Full 9:16"],
                ["blur", "Blur fill"],
                ["dark_gradient", "Dark gradient"],
                ["original", "Original"],
                ["brand_color", "Brand tint"],
              ] as const
            ).map(([val, label]) => {
              const selected = (settings.backgroundStyle || "crop") === val;
              return (
                <button
                  key={val}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`ss-chip-btn ${selected ? "is-active" : ""}`}
                  onClick={() => onUpdate("backgroundStyle", val)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </aside>
  );
}
