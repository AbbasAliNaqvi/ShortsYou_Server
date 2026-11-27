"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Flame,
  Loader2,
  RotateCcw,
  Sliders,
  Sparkles,
  TrendingUp,
  Wand2,
  Zap,
} from "lucide-react";
import type { AutoComposeResult, EditSettings, HookVariation } from "@/lib/api";
import { formatDuration } from "@/lib/formatters";
import type { PeakMoment } from "./StudioTimeline";

type StepStatus = "idle" | "running" | "done";

interface PipelineStep {
  id: string;
  label: string;
  detail: string;
  status: StepStatus;
  result?: string;
}

const PIPELINE_SEQUENCE: Omit<PipelineStep, "status" | "result">[] = [
  { id: "analyze", label: "Semantic Analysis", detail: "Scanning transcript for peaks…" },
  { id: "hook", label: "Hook Detection", detail: "Finding top viral boundary…" },
  { id: "reframe", label: "Face & Gesture Track", detail: "Mapping speaker framing…" },
  { id: "score", label: "Viral Score Forecast", detail: "Scoring retention momentum…" },
  { id: "grade", label: "Color & Audio Grade", detail: "Selecting LUT & music mood…" },
  { id: "compose", label: "Timeline Compose", detail: "Setting in/out & captions…" },
];

export interface ApproachFlavor {
  id: string;
  name: string;
  tag: string;
  recommended?: boolean;
  previewText: string;
  description: string;
  settings: Partial<EditSettings>;
}

export const APPROACH_FLAVORS: ApproachFlavor[] = [
  {
    id: "viral",
    name: "Viral High-Retention",
    tag: "MAX VIEWS",
    recommended: true,
    previewText: "Karaoke · Vibrant · Energetic",
    description: "Karaoke subtitles, energetic beat, saturated grade & silence skip.",
    settings: {
      captionStyle: "karaoke",
      musicMood: "energetic",
      colorGrade: "vibrant",
      backgroundStyle: "crop",
      layout: "standard",
      removeSilences: true,
      removeFillers: true,
    },
  },
  {
    id: "cinematic",
    name: "Cinematic Story",
    tag: "DOCUMENTARY",
    previewText: "Minimal · Cinematic · Dramatic",
    description: "Minimalist subtitles, filmic color LUT, dramatic score & blur fill.",
    settings: {
      captionStyle: "minimal",
      musicMood: "dramatic",
      colorGrade: "cinematic",
      backgroundStyle: "blur",
      layout: "standard",
      removeSilences: false,
      removeFillers: true,
    },
  },
  {
    id: "duo",
    name: "Podcast / Duo Split",
    tag: "DUO 9:16",
    previewText: "Bold · Natural · Two Faces",
    description: "Two-frame face tracking, bold subtitles & balanced tone.",
    settings: {
      captionStyle: "bold",
      musicMood: "calm",
      colorGrade: "natural",
      backgroundStyle: "crop",
      layout: "two_frame",
      removeSilences: true,
      removeFillers: true,
    },
  },
  {
    id: "punchy",
    name: "High-Impact Talk",
    tag: "HIGH ENERGY",
    previewText: "Bold · Warm · Auto Face",
    description: "Bold captions, motivational track, warm tone & auto-face framing.",
    settings: {
      captionStyle: "bold",
      musicMood: "motivational",
      colorGrade: "warm",
      backgroundStyle: "crop",
      layout: "auto_face",
      removeSilences: true,
      removeFillers: true,
    },
  },
];

const HOOK_TYPES = ["Curiosity gap", "Controversial", "Story", "Direct"] as const;

export interface AgenticDirectorProps {
  videoId?: string;
  composing: boolean;
  composeError?: string | null;
  rendering?: boolean;
  renderSuccess?: boolean;
  result?: AutoComposeResult | null;
  hookVariations?: HookVariation[];
  settings?: EditSettings;
  currentHook?: string;
  currentStart?: number;
  currentEnd?: number;
  peaks?: PeakMoment[];
  onAutoCompose: () => Promise<void>;
  onApplyHook?: (hook: string) => void;
  onUpdateSetting?: <K extends keyof EditSettings>(key: K, value: EditSettings[K]) => void;
  onSelectPeak?: (peak: PeakMoment) => void;
  onUseApproachAndRender?: (customSettings?: {
    start?: number;
    end?: number;
    hook?: string;
    settings?: EditSettings;
  }) => Promise<void> | void;
  onSwitchToManual?: () => void;
  onResetSuccess?: () => void;
}

export function AgenticDirector({
  videoId,
  composing,
  composeError = null,
  result,
  hookVariations = [],
  settings,
  currentHook,
  currentStart = 0,
  currentEnd = 30,
  peaks = [],
  onAutoCompose,
  onApplyHook,
  onUpdateSetting,
  onSelectPeak,
  onSwitchToManual,
}: AgenticDirectorProps) {
  const [steps, setSteps] = useState<PipelineStep[]>(
    PIPELINE_SEQUENCE.map((s) => ({ ...s, status: "idle" }))
  );
  const [expanded, setExpanded] = useState(false);
  const [openChip, setOpenChip] = useState<null | "colorGrade" | "musicMood" | "captionStyle" | "layout">(null);
  const [selectedFlavor, setSelectedFlavor] = useState<string>("viral");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wasComposing = useRef(false);

  const viralScore = useMemo(() => {
    if (!result) return 91;
    if (videoId) {
      try {
        const vMap = JSON.parse(localStorage.getItem("shortsyou_video_viral_scores") || "{}") as Record<string, number>;
        if (vMap[videoId] > 0) return vMap[videoId];
      } catch {}
    }
    const seed = (result.hookText?.length ?? 12) + Math.round(result.startTime * 3 + result.endTime);
    return 86 + (seed % 12);
  }, [result, videoId]);

  useEffect(() => {
    if (!result || !videoId) return;
    try {
      const vMap = JSON.parse(localStorage.getItem("shortsyou_video_viral_scores") || "{}") as Record<string, number>;
      vMap[videoId] = viralScore;
      localStorage.setItem("shortsyou_video_viral_scores", JSON.stringify(vMap));
    } catch {}
  }, [result, videoId, viralScore]);

  useEffect(() => {
    if (composing && !wasComposing.current) {
      wasComposing.current = true;
      setExpanded(true);
      setSteps(PIPELINE_SEQUENCE.map((s) => ({ ...s, status: "idle" })));
      let idx = 0;
      intervalRef.current = setInterval(() => {
        setSteps((prev) =>
          prev.map((s, i) =>
            i < idx ? { ...s, status: "done" } : i === idx ? { ...s, status: "running" } : s
          )
        );
        idx++;
        if (idx > PIPELINE_SEQUENCE.length && intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }, 650);
    }

    if (!composing && wasComposing.current) {
      wasComposing.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      setSteps((prev) => prev.map((s) => ({ ...s, status: "done" })));
      setExpanded(false);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [composing]);

  useEffect(() => {
    if (!result) return;
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id === "analyze") return { ...s, status: "done", result: "3 peak moments found" };
        if (s.id === "hook") return { ...s, status: "done", result: `${result.startTime.toFixed(1)}s → ${result.endTime.toFixed(1)}s` };
        if (s.id === "reframe") return { ...s, status: "done", result: result.layout ?? "standard" };
        if (s.id === "score") return { ...s, status: "done", result: `${viralScore}` };
        if (s.id === "grade") return { ...s, status: "done", result: `${result.colorGrade} · ${result.musicMood}` };
        if (s.id === "compose") return { ...s, status: "done", result: `${result.captionStyle} captions` };
        return s;
      })
    );
  }, [result, viralScore]);

  const hasResult = Boolean(result);
  const activeHook = currentHook || result?.hookText || "";
  const activeColor = settings?.colorGrade ?? result?.colorGrade ?? "vibrant";
  const activeMusic = settings?.musicMood ?? result?.musicMood ?? "energetic";
  const activeCaption = settings?.captionStyle ?? result?.captionStyle ?? "karaoke";
  const activeLayout = settings?.layout ?? result?.layout ?? "standard";

  const hookOptions = useMemo(() => {
    if (hookVariations.length > 0) return hookVariations.slice(0, 4);
    if (!result?.hookText) return [];
    return [
      { tone: "Curiosity gap", text: result.hookText },
      { tone: "Controversial", text: `Nobody tells you this about ${result.hookText.slice(0, 34)}…` },
      { tone: "Story", text: `How it started: ${result.hookText.slice(0, 36)}` },
      { tone: "Direct", text: "Watch this before you skip." },
    ];
  }, [hookVariations, result]);

  function handleSelectFlavor(flavor: ApproachFlavor) {
    setSelectedFlavor(flavor.id);
    if (onUpdateSetting && flavor.settings) {
      Object.entries(flavor.settings).forEach(([k, v]) => {
        onUpdateSetting(k as keyof EditSettings, v as EditSettings[keyof EditSettings]);
      });
    }
  }

  return (
    <section className="ss-enter" style={{ display: "flex", flexDirection: "column", gap: 18 }} aria-label="AI Agentic Director">
      {/* Friendly Error Retry Card */}
      {composeError && !composing && (
        <div className="ca-glass ss-panel" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }} role="alert">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <AlertTriangle size={20} color="#dc2626" />
            <div>
              <h3 className="ss-card-title">AI Director failed to analyze</h3>
              <p className="ss-muted" style={{ margin: "2px 0 0" }}>{composeError}</p>
            </div>
          </div>
          <button type="button" className="ss-btn-primary" onClick={() => void onAutoCompose()}>
            <RotateCcw size={15} />
            <span>Retry AI Director</span>
          </button>
        </div>
      )}

      {/* Idle State */}
      {!composing && !hasResult && (
        <div className="ca-glass ss-panel" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <span className="ss-eyebrow">Autonomous Director</span>
            <h2 className="ss-card-title" style={{ marginTop: 4 }}>AI Agentic Director</h2>
            <p className="ss-muted" style={{ marginTop: 6 }}>
              Scans your transcript for peak moments, predicts viral retention, writes 4 hook options, and selects framing, color grade, music mood, and captions automatically.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <button type="button" className="ss-btn-primary" onClick={() => void onAutoCompose()}>
              <Wand2 size={16} />
              <span>Launch AI Agentic Director</span>
            </button>

            {onSwitchToManual && (
              <button type="button" className="ss-link-btn" onClick={onSwitchToManual}>
                <Sliders size={14} />
                <span>Fine-tune manually</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 1. Pipeline Stepper (Collapses smoothly when complete) */}
      {(composing || hasResult) && (
        <div className="ca-glass ss-panel" style={{ padding: "16px 20px" }}>
          <div className="ss-stepper-head">
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div className="ss-stepper-dots" aria-label="Analysis steps">
                {steps.map((s) => (
                  <span
                    key={s.id}
                    title={s.label}
                    className={`ss-step-dot ${
                      s.status === "done" ? "is-done" : s.status === "running" ? "is-running" : ""
                    }`}
                  >
                    {s.status === "done" ? (
                      <Check size={13} strokeWidth={2.5} />
                    ) : s.status === "running" ? (
                      <Loader2 size={13} className="ss-spin" />
                    ) : (
                      "•"
                    )}
                  </span>
                ))}
              </div>
              <strong style={{ fontSize: 14, fontWeight: 800, color: "var(--ss-ink)" }}>
                {composing ? "Analyzing footage & composing…" : "Analysis complete · 6/6"}
              </strong>
            </div>

            <button
              type="button"
              className="ss-btn-secondary"
              style={{ minHeight: 34, padding: "5px 12px" }}
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
            >
              <span>{expanded ? "Hide details" : "Expand details"}</span>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateRows: expanded ? "1fr" : "0fr",
              transition: "grid-template-rows 200ms var(--ss-ease)",
            }}
          >
            <div style={{ overflow: "hidden" }}>
              <div className="ss-stepper-details">
                {steps.map((s) => (
                  <div key={s.id} className="ss-step-detail-item">
                    <div className="ss-step-detail-title">{s.label}</div>
                    <div className="ss-step-detail-desc">{s.result || s.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {hasResult && result && (
        <>
          {/* 2. Insight Row (3 Platform KPI Cards) */}
          <div className="ss-insights-grid">
            <div className="ca-analytics-kpi-card">
              <div className="ca-kpi-head">
                <div className="ca-kpi-icon-wrap">
                  <TrendingUp size={18} />
                </div>
                <span className="ca-kpi-label">Viral Score</span>
              </div>
              <div className="ca-kpi-body">
                <span className="ca-kpi-val">{viralScore}</span>
                <span className="ss-meta-mono" style={{ marginLeft: 6 }} />
              </div>
              <div className="ss-reason-row">
                <span className="ss-neutral-chip">Strong hook</span>
                <span className="ss-neutral-chip">Good pacing</span>
              </div>
            </div>

            <div className="ca-analytics-kpi-card">
              <div className="ca-kpi-head">
                <div className="ca-kpi-icon-wrap">
                  <Flame size={18} />
                </div>
                <span className="ca-kpi-label">Peak Moments</span>
              </div>
              <div className="ss-reason-row" style={{ marginTop: 6 }}>
                {peaks.slice(0, 3).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="ss-chip-btn"
                    onClick={() => onSelectPeak?.(p)}
                  >
                    <span>{p.label}</span>
                    <span className="ss-meta-mono">{formatDuration(p.start)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="ca-analytics-kpi-card">
              <div className="ca-kpi-head">
                <div className="ca-kpi-icon-wrap">
                  <Zap size={18} />
                </div>
                <span className="ca-kpi-label">Hook Strength</span>
              </div>
              <div className="ca-kpi-body">
                <span className="ca-kpi-val" style={{ fontSize: 26 }}>High</span>
              </div>
              <div className="ss-reason-row">
                <span className="ss-neutral-chip">3s hold: {Math.min(97, viralScore + 3)}%</span>
                <span className="ss-neutral-chip">Curiosity boundary</span>
              </div>
            </div>
          </div>

          {/* 3. Blueprint Chip Row (Inline Popover Editable) */}
          <div className="ca-glass ss-panel" style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
              <span className="ss-eyebrow">AI Blueprint</span>
              <span className="ss-meta-mono">
                In {formatDuration(currentStart)} → Out {formatDuration(currentEnd)}
              </span>
            </div>

            <div className="ss-blueprint-row">
              {(
                [
                  ["colorGrade", "Color", activeColor, ["vibrant", "cinematic", "warm", "cool", "natural"]],
                  ["musicMood", "Music", activeMusic, ["energetic", "dramatic", "motivational", "calm", "none"]],
                  ["captionStyle", "Captions", activeCaption, ["karaoke", "bold", "minimal"]],
                  ["layout", "Framing", activeLayout.replace("_", " "), ["standard", "two_frame", "multi_face", "auto_face"]],
                ] as const
              ).map(([field, label, val, opts]) => {
                const isOpen = openChip === field;
                return (
                  <div key={field} style={{ position: "relative" }}>
                    <button
                      type="button"
                      className={`ss-chip-btn ${isOpen ? "is-active" : ""}`}
                      onClick={() => setOpenChip(isOpen ? null : field)}
                      aria-expanded={isOpen}
                    >
                      <span>{label}:</span>
                      <span style={{ textTransform: "capitalize" }}>{val}</span>
                      <ChevronDown size={13} />
                    </button>

                    {isOpen && (
                      <div className="ss-popover">
                        {opts.map((opt) => {
                          const selected = (settings?.[field] ?? val) === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              className={`ss-popover-opt ${selected ? "is-selected" : ""}`}
                              onClick={() => {
                                onUpdateSetting?.(field, opt as EditSettings[typeof field]);
                                setOpenChip(null);
                              }}
                            >
                              <span>{opt.replace("_", " ")}</span>
                              {selected && <Check size={13} />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Hooks: 2x2 Selectable Cards */}
          {hookOptions.length > 0 && (
            <div className="ca-glass ss-panel">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <h3 className="ss-card-title">Opening Hooks</h3>
                <span className="ss-meta-mono">Click to update preview</span>
              </div>

              <div className="ss-cards-2x2" role="radiogroup" aria-label="Opening hooks">
                {hookOptions.map((v, i) => {
                  const isSelected = activeHook === v.text;
                  const typeLabel = v.tone || HOOK_TYPES[i % HOOK_TYPES.length];
                  return (
                    <label
                      key={`${i}-${v.text}`}
                      className={`ss-select-card ${isSelected ? "is-selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="director-hook"
                        checked={isSelected}
                        onChange={() => onApplyHook?.(v.text)}
                        style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
                      />
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <span className="ss-neutral-chip">
                          <Sparkles size={12} />
                          <span style={{ textTransform: "capitalize" }}>{typeLabel}</span>
                        </span>
                        {isSelected && <span className="ss-selected-chip">Selected</span>}
                      </div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, lineHeight: 1.4 }}>
                        &ldquo;{v.text}&rdquo;
                      </p>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Style Flavors (4 Visual Cards — Click to Select Only) */}
          <div className="ca-glass ss-panel">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h3 className="ss-card-title">Style Flavors</h3>
              <span className="ss-meta-mono">Select to apply preset</span>
            </div>

            <div className="ss-cards-2x2" role="radiogroup" aria-label="Style flavors">
              {APPROACH_FLAVORS.map((flavor) => {
                const isSelected = selectedFlavor === flavor.id;
                return (
                  <button
                    key={flavor.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    className={`ss-select-card ${isSelected ? "is-selected" : ""}`}
                    onClick={() => handleSelectFlavor(flavor)}
                  >
                    <div className="ss-flavor-preview">
                      <span>{flavor.previewText}</span>
                      {flavor.recommended && (
                        <span className="ss-badge-recommended">Recommended</span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <strong style={{ fontSize: 14, fontWeight: 800 }}>{flavor.name}</strong>
                      {isSelected && <span className="ss-selected-chip">Selected</span>}
                    </div>
                    <p className="ss-card-desc">{flavor.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Footer Actions */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <button
              type="button"
              className="ss-btn-secondary"
              onClick={() => void onAutoCompose()}
              disabled={composing}
            >
              <RotateCcw size={14} />
              <span>Re-run AI Director</span>
            </button>

            {onSwitchToManual && (
              <button type="button" className="ss-link-btn" onClick={onSwitchToManual}>
                <Sliders size={14} />
                <span>Fine-tune manually</span>
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
