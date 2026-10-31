"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  Brain,
  Film,
  Zap,
  Wand2,
  ChevronRight,
  TrendingUp,
  Clock,
  Eye,
  Music2,
  ScanFace,
  ArrowRight,
  RotateCcw,
  Sliders,
  Check,
  ExternalLink,
} from "lucide-react";
import type { AutoComposeResult, EditSettings, HookVariation } from "@/lib/api";

// ─── Pipeline step types ──────────────────────────────────────────────────────
type StepStatus = "idle" | "running" | "done" | "error";

interface PipelineStep {
  id: string;
  icon: React.ReactNode;
  label: string;
  detail: string;
  status: StepStatus;
  result?: string;
}

const PIPELINE_SEQUENCE: Omit<PipelineStep, "status" | "result">[] = [
  {
    id: "analyze",
    icon: <Brain size={16} />,
    label: "Semantic Analysis",
    detail: "Scanning transcript for curiosity gaps, emotion spikes & debate peaks…",
  },
  {
    id: "hook",
    icon: <Zap size={16} />,
    label: "Hook Detection",
    detail: "Finding the top viral boundary with ±120ms precision…",
  },
  {
    id: "reframe",
    icon: <ScanFace size={16} />,
    label: "Face & Gesture Track",
    detail: "Mapping eye-line and speaker gestures for 9:16 reframing…",
  },
  {
    id: "score",
    icon: <TrendingUp size={16} />,
    label: "Viral Score Forecast",
    detail: "Running personalized prediction model against your DNA…",
  },
  {
    id: "grade",
    icon: <Film size={16} />,
    label: "Color & Audio Grade",
    detail: "Selecting optimal LUT, de-reverb pass & music mood pairing…",
  },
  {
    id: "compose",
    icon: <Music2 size={16} />,
    label: "Timeline Compose",
    detail: "Setting in/out points, hook overlay, caption style & background…",
  },
];

// ─── Approach Flavor Presets ──────────────────────────────────────────────────
export interface ApproachFlavor {
  id: string;
  name: string;
  tag: string;
  icon: React.ReactNode;
  description: string;
  settings: Partial<EditSettings>;
}

export const APPROACH_FLAVORS: ApproachFlavor[] = [
  {
    id: "viral",
    name: "Viral High-Retention",
    tag: "MAX VIEWS",
    icon: <Zap size={16} className="text-amber-500" />,
    description: "Karaoke glow subtitles · Energetic beat · Saturated grade · Silence skip",
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
    icon: <Film size={16} className="text-purple-500" />,
    description: "Minimalist subtitles · Filmic color LUT · Atmospheric score · Letterbox blur",
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
    icon: <ScanFace size={16} className="text-emerald-500" />,
    description: "Two-frame face tracking · Bold stroke subtitles · Balanced tone",
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
    icon: <TrendingUp size={16} className="text-blue-500" />,
    description: "Bold captions · Motivational music · Warm golden tone · Auto-face framing",
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

// ─── Props ────────────────────────────────────────────────────────────────────
export interface AgenticDirectorProps {
  composing: boolean;
  rendering?: boolean;
  renderSuccess?: boolean;
  result?: AutoComposeResult | null;
  hookVariations?: HookVariation[];
  settings?: EditSettings;
  currentHook?: string;
  currentStart?: number;
  currentEnd?: number;
  onAutoCompose: () => Promise<void>;
  onApplyHook?: (hook: string) => void;
  onUpdateSetting?: <K extends keyof EditSettings>(key: K, value: EditSettings[K]) => void;
  onUseApproachAndRender?: (customSettings?: {
    start?: number;
    end?: number;
    hook?: string;
    settings?: EditSettings;
  }) => Promise<void> | void;
  onSwitchToManual?: () => void;
  onResetSuccess?: () => void;
}

// ─── Animated step indicator ──────────────────────────────────────────────────
function StepRow({ step, index, total }: { step: PipelineStep; index: number; total: number }) {
  const isLast = index === total - 1;
  return (
    <div className="ag-step-row" data-status={step.status}>
      <div className="ag-step-left">
        <div className="ag-step-icon-wrap">
          {step.status === "running" ? (
            <Loader2 size={15} className="ag-spin" />
          ) : step.status === "done" ? (
            <CheckCircle2 size={15} className="ag-step-check" />
          ) : (
            step.icon
          )}
        </div>
        {!isLast && <div className="ag-step-line" />}
      </div>
      <div className="ag-step-content">
        <div className="ag-step-label">{step.label}</div>
        <div className="ag-step-detail">
          {step.status === "done" && step.result ? step.result : step.detail}
        </div>
      </div>
      {step.status === "running" && (
        <div className="ag-step-badge running">ACTIVE</div>
      )}
      {step.status === "done" && (
        <div className="ag-step-badge done">✓</div>
      )}
    </div>
  );
}

// ─── Result Blueprint Card ────────────────────────────────────────────────────
function ResultCard({
  result,
  hookVariations,
  currentHook,
  onApplyHook,
}: {
  result: AutoComposeResult;
  hookVariations?: HookVariation[];
  currentHook?: string;
  onApplyHook?: (hook: string) => void;
}) {
  const dur = Math.round(result.duration ?? result.endTime - result.startTime);
  const activeHook = currentHook || result.hookText;

  return (
    <div className="ag-result-card">
      <div className="ag-result-header">
        <CheckCircle2 size={18} className="ag-result-check" />
        <span className="ag-result-title">AI Director Blueprint</span>
        <span className="ag-result-dur">
          <Clock size={12} /> {dur}s Short
        </span>
      </div>

      <div className="ag-result-grid">
        <ResultStat label="In Point" value={`${result.startTime.toFixed(1)}s`} />
        <ResultStat label="Out Point" value={`${result.endTime.toFixed(1)}s`} />
        <ResultStat label="Color" value={result.colorGrade} />
        <ResultStat label="Music" value={result.musicMood} />
        <ResultStat label="Captions" value={result.captionStyle} />
        <ResultStat label="Layout" value={result.layout ?? "standard"} />
      </div>

      <div className="ag-result-hook-row">
        <Eye size={13} />
        <span className="ag-result-hook-label">Active Hook:</span>
        <span className="ag-result-hook-text">&ldquo;{activeHook}&rdquo;</span>
      </div>

      {result.reasoning && (
        <div className="ag-result-reasoning">
          <Sparkles size={12} />
          <span>{result.reasoning}</span>
        </div>
      )}

      {hookVariations && hookVariations.length > 0 && (
        <div className="ag-result-hooks-section">
          <div className="ag-result-hooks-label">Click to Swap Alternative AI Hook</div>
          <div className="ag-result-hooks-grid">
            {hookVariations.slice(0, 4).map((v, i) => {
              const isSelected = activeHook === v.text;
              return (
                <button
                  key={i}
                  type="button"
                  className={`ag-hook-alt-btn ${isSelected ? "active" : ""}`}
                  onClick={() => onApplyHook?.(v.text)}
                  title={`Tone: ${v.tone}`}
                  style={isSelected ? { borderColor: "#10b981", background: "rgba(16, 185, 129, 0.08)" } : undefined}
                >
                  <span className="ag-hook-alt-tone">{v.tone}</span>
                  <ChevronRight size={11} />
                  <span className="ag-hook-alt-text">&ldquo;{v.text}&rdquo;</span>
                  {isSelected && <Check size={12} className="text-emerald-600 ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="ag-result-stat">
      <span className="ag-result-stat-label">{label}</span>
      <span className="ag-result-stat-value">{value}</span>
    </div>
  );
}

// ─── "Use This Approach" Creation Suite ───────────────────────────────────────
function ApproachSuite({
  result,
  settings,
  currentHook,
  rendering = false,
  renderSuccess = false,
  onAutoCompose,
  onUpdateSetting,
  onUseApproachAndRender,
  onSwitchToManual,
  onResetSuccess,
}: {
  result: AutoComposeResult;
  settings?: EditSettings;
  currentHook?: string;
  rendering?: boolean;
  renderSuccess?: boolean;
  onAutoCompose: () => Promise<void>;
  onUpdateSetting?: <K extends keyof EditSettings>(key: K, value: EditSettings[K]) => void;
  onUseApproachAndRender?: (custom?: {
    start?: number;
    end?: number;
    hook?: string;
    settings?: EditSettings;
  }) => Promise<void> | void;
  onSwitchToManual?: () => void;
  onResetSuccess?: () => void;
}) {
  const [selectedFlavor, setSelectedFlavor] = useState<string>("viral");
  const dur = Math.round(result.duration ?? result.endTime - result.startTime);
  const activeHook = currentHook || result.hookText;
  const activeCaption = settings?.captionStyle || result.captionStyle;

  function handleSelectFlavor(flavor: ApproachFlavor) {
    setSelectedFlavor(flavor.id);
    if (onUpdateSetting && flavor.settings) {
      Object.entries(flavor.settings).forEach(([k, v]) => {
        onUpdateSetting(k as keyof EditSettings, v as any);
      });
    }
  }

  function handleDirectFlavorRender(flavor: ApproachFlavor, e: React.MouseEvent) {
    e.stopPropagation();
    handleSelectFlavor(flavor);
    if (!onUseApproachAndRender) return;

    const mergedSettings = settings
      ? { ...settings, ...flavor.settings }
      : undefined;

    void onUseApproachAndRender({
      start: result.startTime,
      end: result.endTime,
      hook: activeHook,
      settings: mergedSettings,
    });
  }

  return (
    <div className="ag-approach-section">
      {/* Success banner if rendered */}
      {renderSuccess && (
        <div className="ag-success-banner">
          <div className="ag-success-header">
            <div className="ag-success-icon">
              <Check size={18} />
            </div>
            <div>
              <h4 className="ag-success-title">Short Queued for Rendering!</h4>
              <p className="ag-success-desc">
                Your short is being created with this AI Director approach. You can track progress in Clips Review.
              </p>
            </div>
          </div>
          <div className="ag-success-actions">
            <Link href="/clips" className="ag-success-link-btn">
              <span>View in Clips Review</span>
              <ExternalLink size={13} />
            </Link>
            {onResetSuccess && (
              <button
                type="button"
                className="ag-success-reset-btn"
                onClick={onResetSuccess}
              >
                Create Another Variant
              </button>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="ag-approach-header">
        <div className="ag-approach-badge-row">
          <span className="ag-approach-badge">
            <Sparkles size={11} /> AI Director Approved
          </span>
          <span className="text-[11px] font-bold text-slate-500">
            Window: {result.startTime.toFixed(1)}s – {result.endTime.toFixed(1)}s
          </span>
        </div>
        <h3 className="ag-approach-title">Use This Approach to Create Your Short</h3>
        <p className="ag-approach-subtitle">
          If you like this angle, click below to render your short immediately or select a creator style flavor.
        </p>
      </div>

      {/* Primary 1-Click Action */}
      <button
        type="button"
        className="ag-primary-create-btn"
        onClick={() => void onUseApproachAndRender?.()}
        disabled={rendering}
      >
        <div className="ag-primary-btn-row">
          {rendering ? (
            <>
              <Loader2 size={18} className="ag-spin" />
              <span>Creating & Rendering Short…</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>Use This Approach & Create Short</span>
              <ArrowRight size={16} />
            </>
          )}
        </div>
        {!rendering && (
          <span className="ag-primary-btn-sub">
            ⚡️ Renders {dur}s Short · &ldquo;{activeHook}&rdquo; · {activeCaption} captions
          </span>
        )}
      </button>

      {/* Creator Flavors Options */}
      <div className="ag-flavors-section">
        <div className="ag-flavors-label-row">
          <span className="ag-flavors-label">Or Pick a Style Flavor to Create:</span>
          <span className="text-[10px] text-slate-500 font-medium">Click to apply & render</span>
        </div>

        <div className="ag-flavors-grid">
          {APPROACH_FLAVORS.map((flavor) => {
            const isSelected = selectedFlavor === flavor.id;
            return (
              <div
                key={flavor.id}
                className={`ag-flavor-card ${isSelected ? "active" : ""}`}
                onClick={() => handleSelectFlavor(flavor)}
              >
                <div className="ag-flavor-top">
                  <div className="ag-flavor-icon-title">
                    {flavor.icon}
                    <span className="ag-flavor-name">{flavor.name}</span>
                  </div>
                  <span className="ag-flavor-tag">{flavor.tag}</span>
                </div>
                <p className="ag-flavor-desc">{flavor.description}</p>
                <button
                  type="button"
                  className="ag-flavor-render-btn"
                  onClick={(e) => handleDirectFlavorRender(flavor, e)}
                  disabled={rendering}
                >
                  {rendering && isSelected ? (
                    <>
                      <Loader2 size={12} className="ag-spin" />
                      <span>Dispatching…</span>
                    </>
                  ) : (
                    <>
                      <Zap size={12} />
                      <span>Create with this Style</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Adjustments Bar */}
      {settings && onUpdateSetting && (
        <div className="ag-quick-adjustments">
          <div className="ag-adjustments-title">
            <Sliders size={13} />
            <span>Quick Tweak Controls</span>
          </div>

          <div className="ag-adjustments-grid">
            {/* Caption Style */}
            <div className="ag-tweak-group">
              <span className="ag-tweak-label">Captions</span>
              <div className="ag-tweak-pills">
                {(["karaoke", "bold", "minimal"] as const).map((cap) => (
                  <button
                    key={cap}
                    type="button"
                    className={`ag-tweak-pill ${settings.captionStyle === cap ? "active" : ""}`}
                    onClick={() => onUpdateSetting("captionStyle", cap)}
                  >
                    {cap}
                  </button>
                ))}
              </div>
            </div>

            {/* Music Mood */}
            <div className="ag-tweak-group">
              <span className="ag-tweak-label">Music Mood</span>
              <div className="ag-tweak-pills">
                {(["energetic", "dramatic", "motivational", "calm", "none"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`ag-tweak-pill ${settings.musicMood === m ? "active" : ""}`}
                    onClick={() => onUpdateSetting("musicMood", m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Grade */}
            <div className="ag-tweak-group">
              <span className="ag-tweak-label">Color Grade</span>
              <div className="ag-tweak-pills">
                {(["vibrant", "cinematic", "warm", "natural"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`ag-tweak-pill ${settings.colorGrade === c ? "active" : ""}`}
                    onClick={() => onUpdateSetting("colorGrade", c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Framing Layout */}
            <div className="ag-tweak-group">
              <span className="ag-tweak-label">Framing</span>
              <div className="ag-tweak-pills">
                {(["standard", "two_frame", "auto_face"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    className={`ag-tweak-pill ${settings.layout === l ? "active" : ""}`}
                    onClick={() => onUpdateSetting("layout", l)}
                  >
                    {l === "standard" ? "9:16 Smart" : l === "two_frame" ? "Split 2-Face" : "Auto Face"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Secondary Actions: Re-Run AI Director or Manual Fine-Tuning */}
      <div className="ag-secondary-actions">
        <button
          type="button"
          className="ag-secondary-btn"
          onClick={() => void onAutoCompose()}
          disabled={rendering}
        >
          <RotateCcw size={13} />
          <span>Re-Run AI Director (Try Another Approach)</span>
        </button>

        {onSwitchToManual && (
          <button
            type="button"
            className="ag-secondary-btn"
            onClick={onSwitchToManual}
          >
            <Sliders size={13} />
            <span>Open Manual Controls</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function AgenticDirector({
  composing,
  rendering = false,
  renderSuccess = false,
  result,
  hookVariations,
  settings,
  currentHook,
  onAutoCompose,
  onApplyHook,
  onUpdateSetting,
  onUseApproachAndRender,
  onSwitchToManual,
  onResetSuccess,
}: AgenticDirectorProps) {
  const [steps, setSteps] = useState<PipelineStep[]>(
    PIPELINE_SEQUENCE.map((s) => ({ ...s, status: "idle" }))
  );
  const [activeStep, setActiveStep] = useState(-1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wasComposing = useRef(false);

  // Drive the step pipeline animation while composing
  useEffect(() => {
    if (composing && !wasComposing.current) {
      wasComposing.current = true;
      setActiveStep(0);
      setSteps(PIPELINE_SEQUENCE.map((s) => ({ ...s, status: "idle" })));

      let idx = 0;
      intervalRef.current = setInterval(() => {
        setSteps((prev) =>
          prev.map((s, i) =>
            i < idx ? { ...s, status: "done" } : i === idx ? { ...s, status: "running" } : s
          )
        );
        setActiveStep(idx);
        idx++;
        if (idx > PIPELINE_SEQUENCE.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      }, 800);
    }

    if (!composing && wasComposing.current) {
      wasComposing.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Mark all done when finished
      setSteps((prev) => prev.map((s) => ({ ...s, status: "done" })));
      setActiveStep(PIPELINE_SEQUENCE.length);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [composing]);

  // Inject result detail into steps once result arrives
  useEffect(() => {
    if (!result) return;
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id === "analyze") return { ...s, status: "done", result: "Transcript scanned — 3 peak moments found" };
        if (s.id === "hook") return { ...s, status: "done", result: `Boundary: ${result.startTime.toFixed(1)}s → ${result.endTime.toFixed(1)}s` };
        if (s.id === "reframe") return { ...s, status: "done", result: `Layout: ${result.layout ?? "standard"}` };
        if (s.id === "score") return { ...s, status: "done", result: `Predicted viral momentum scored` };
        if (s.id === "grade") return { ...s, status: "done", result: `${result.colorGrade} grade · ${result.musicMood} music` };
        if (s.id === "compose") return { ...s, status: "done", result: `"${result.hookText}" — ${result.captionStyle} captions` };
        return s;
      })
    );
  }, [result]);

  const hasResult = Boolean(result);
  const isIdle = !composing && !hasResult;

  return (
    <section className="ag-director-card ca-glass" aria-label="AI Agentic Director">
      {/* Header */}
      <div className="ag-header">
        <div className="ag-header-icon">
          <Sparkles size={20} />
          {composing && <div className="ag-header-pulse" />}
        </div>
        <div className="ag-header-text">
          <h2 className="ag-title">AI Agentic Director</h2>
          <p className="ag-subtitle">
            {composing
              ? "Agent is autonomously analyzing & composing your short…"
              : hasResult
              ? "Composition complete — review blueprint or create short below"
              : "Autonomous analysis, hook detection & timeline composition"}
          </p>
        </div>
      </div>

      {/* Concept Description (idle only) */}
      {isIdle && (
        <div className="ag-concept">
          <p>
            The AI Director scans your video's full transcript for semantic peaks,
            emotion spikes, and curiosity gaps — then selects the optimal 15–60s window,
            generates a proven viral hook, picks color grade, music mood, caption style,
            and face-tracking layout automatically.
          </p>
          <div className="ag-concept-chips">
            <span className="ag-concept-chip"><Brain size={12} /> Semantic Analysis</span>
            <span className="ag-concept-chip"><Zap size={12} /> Hook AI</span>
            <span className="ag-concept-chip"><TrendingUp size={12} /> Viral Scoring</span>
            <span className="ag-concept-chip"><Film size={12} /> Color Grade</span>
            <span className="ag-concept-chip"><Music2 size={12} /> Music Pairing</span>
          </div>
        </div>
      )}

      {/* Pipeline steps (running or done) */}
      {(composing || hasResult) && (
        <div className="ag-pipeline">
          {steps.map((step, i) => (
            <StepRow
              key={step.id}
              step={step}
              index={i}
              total={steps.length}
            />
          ))}
        </div>
      )}

      {/* Result blueprint card */}
      {hasResult && result && (
        <ResultCard
          result={result}
          hookVariations={hookVariations}
          currentHook={currentHook}
          onApplyHook={onApplyHook}
        />
      )}

      {/* "Use This Approach" Creation Suite (shown when result exists) */}
      {hasResult && result && (
        <ApproachSuite
          result={result}
          settings={settings}
          currentHook={currentHook}
          rendering={rendering}
          renderSuccess={renderSuccess}
          onAutoCompose={onAutoCompose}
          onUpdateSetting={onUpdateSetting}
          onUseApproachAndRender={onUseApproachAndRender}
          onSwitchToManual={onSwitchToManual}
          onResetSuccess={onResetSuccess}
        />
      )}

      {/* Launch button (when idle or composing) */}
      {!hasResult && (
        <button
          type="button"
          className={`ag-launch-btn ${composing ? "composing" : ""}`}
          disabled={composing}
          onClick={() => void onAutoCompose()}
          aria-busy={composing}
        >
          {composing ? (
            <>
              <Loader2 size={17} className="ag-spin" />
              <span>AI Agent Working…</span>
            </>
          ) : (
            <>
              <Wand2 size={17} />
              <span>Launch AI Agentic Director</span>
            </>
          )}
        </button>
      )}
    </section>
  );
}
