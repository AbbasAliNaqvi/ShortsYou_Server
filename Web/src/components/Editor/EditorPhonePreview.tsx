"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Clapperboard, Loader2, Pause, Play, Volume2, VolumeX, WandSparkles } from "lucide-react";
import type { EditSettings, Video } from "@/lib/api";
import { formatDuration } from "@/lib/formatters";

export interface EditorPhonePreviewProps {
  video: Video;
  hasPlayablePreview: boolean;
  previewStart: number;
  hook: string;
  layout: string;
  start: number;
  end: number;
  duration: number;
  settings?: EditSettings;
  isPlaying?: boolean;
  isMuted?: boolean;
  rendering?: boolean;
  onTogglePlay?: () => void;
  onToggleMute?: () => void;
  onRender?: () => void;
  onSetStartBound: (val: number) => void;
  onSetEndBound: (val: number) => void;
}

const GRADE_FILTERS: Record<string, string> = {
  vibrant: "saturate(1.25) contrast(1.06)",
  cinematic: "contrast(1.14) saturate(0.88) sepia(0.08)",
  warm: "sepia(0.16) saturate(1.14) brightness(1.02)",
  cool: "hue-rotate(-8deg) saturate(1.04) contrast(1.04)",
  natural: "none",
};

export function EditorPhonePreview({
  video,
  hasPlayablePreview,
  previewStart,
  hook,
  layout,
  start,
  end,
  settings,
  isPlaying = false,
  isMuted = true,
  rendering = false,
  onTogglePlay,
  onToggleMute,
  onRender,
}: EditorPhonePreviewProps) {
  const [miniCollapsed, setMiniCollapsed] = useState(false);
  const [crossfading, setCrossfading] = useState(false);
  const [renderPct, setRenderPct] = useState(12);

  const colorGrade = settings?.colorGrade ?? "vibrant";
  const captionStyle = settings?.captionStyle ?? "karaoke";
  const musicMood = settings?.musicMood ?? "energetic";
  const backgroundStyle = settings?.backgroundStyle ?? "crop";
  const clipLength = Math.max(0, end - start);

  // 150ms calm crossfade when preview styling or hook changes
  useEffect(() => {
    setCrossfading(true);
    const id = setTimeout(() => setCrossfading(false), 150);
    return () => clearTimeout(id);
  }, [hook, colorGrade, captionStyle, layout, backgroundStyle]);

  // Plain progress bar inside Create button while rendering
  useEffect(() => {
    if (!rendering) {
      setRenderPct(12);
      return;
    }
    const id = setInterval(() => {
      setRenderPct((p) => (p < 90 ? p + 12 : p));
    }, 350);
    return () => clearInterval(id);
  }, [rendering]);

  const layoutLabel =
    layout === "auto_face"
      ? "Auto face"
      : layout === "two_frame"
      ? "Two faces"
      : layout === "multi_face"
      ? "Multi-faces"
      : "Smart portrait";

  const displayHook = (hook || "Your opening hook appears here").trim();
  const hookFontSize = displayHook.length > 42 ? "13px" : "15px";

  return (
    <div className="ss-left-col">
      {/* Mobile / Tablet collapsible header */}
      <button
        type="button"
        className="ss-mobile-preview-toggle"
        onClick={() => setMiniCollapsed((v) => !v)}
        aria-expanded={!miniCollapsed}
      >
        <span>Live 9:16 Preview ({formatDuration(clipLength)})</span>
        {miniCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>

      {/* Live Phone Preview Card */}
      {!miniCollapsed && (
        <section className="ca-glass ss-panel ss-phone-card" aria-label="Live 9:16 Short Preview">
          <div className="ss-phone-shell">
            <div className="ss-phone-viewport">
              <div
                className="ss-phone-media"
                style={{
                  filter: GRADE_FILTERS[colorGrade] ?? "none",
                  opacity: crossfading ? 0.72 : 1,
                }}
              >
                {hasPlayablePreview && isPlaying ? (
                  <iframe
                    key={`${video.youtubeVideoId}-${Math.floor(previewStart)}-${isMuted}`}
                    src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(
                      video.youtubeVideoId!
                    )}?start=${Math.floor(previewStart)}&autoplay=1&mute=${
                      isMuted ? 1 : 0
                    }&controls=0&rel=0&modestbranding=1`}
                    title={`Preview of ${video.title}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                ) : video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    style={{
                      objectFit: backgroundStyle === "blur" ? "contain" : "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "grid",
                      placeItems: "center",
                      color: "#64748b",
                    }}
                  >
                    <Clapperboard size={40} />
                  </div>
                )}
              </div>

              <div className="ss-phone-scrim" />

              {/* Hook Text Overlay — Safe Zone, Max 2 Lines */}
              <div className="ss-phone-hook-safe">
                <div className="ss-phone-hook-box" style={{ fontSize: hookFontSize }}>
                  {displayHook}
                </div>
              </div>

              {/* Live Caption Style Preview */}
              <div className="ss-phone-caption-safe">
                {captionStyle === "karaoke" && (
                  <div className="ss-caption-karaoke">
                    WATCH <mark>THIS</mark> PART
                  </div>
                )}
                {captionStyle === "bold" && (
                  <div className="ss-caption-bold">WATCH THIS PART</div>
                )}
                {captionStyle === "minimal" && (
                  <div className="ss-caption-minimal">Watch this part</div>
                )}
              </div>
            </div>
          </div>

          {/* Play / Pause & Mute Controls Below Phone */}
          <div className="ss-phone-controls">
            <button
              type="button"
              className="ss-btn-secondary"
              onClick={onTogglePlay}
              style={{ flex: 1 }}
              aria-label={isPlaying ? "Pause preview" : "Play preview"}
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} />}
              <span>{isPlaying ? "Pause" : "Play preview"}</span>
            </button>

            <button
              type="button"
              className="ss-btn-secondary"
              onClick={onToggleMute}
              aria-label={isMuted ? "Unmute preview" : "Mute preview"}
              aria-pressed={!isMuted}
              style={{ padding: "8px 12px" }}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
          </div>
        </section>
      )}

      {/* "Your Short" Summary Card + THE ONLY Primary CTA */}
      <section className="ca-glass ss-panel ss-summary-card" aria-label="Your Short summary">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 className="ss-card-title">Your Short</h2>
          <span className="ss-meta-mono">{formatDuration(clipLength)}</span>
        </div>

        <dl className="ss-summary-rows">
          <div className="ss-summary-row">
            <dt>Duration</dt>
            <dd className="ss-meta-mono">{formatDuration(start)} → {formatDuration(end)}</dd>
          </div>
          <div className="ss-summary-row">
            <dt>Hook</dt>
            <dd title={displayHook}>{displayHook}</dd>
          </div>
          <div className="ss-summary-row">
            <dt>Style</dt>
            <dd>{colorGrade}</dd>
          </div>
          <div className="ss-summary-row">
            <dt>Music</dt>
            <dd>{musicMood}</dd>
          </div>
          <div className="ss-summary-row">
            <dt>Captions</dt>
            <dd>{captionStyle}</dd>
          </div>
          <div className="ss-summary-row">
            <dt>Framing</dt>
            <dd>{layoutLabel}</dd>
          </div>
        </dl>

        <button
          type="button"
          className="ss-btn-primary"
          onClick={onRender}
          disabled={rendering}
          style={{ width: "100%" }}
        >
          {rendering && <span className="ss-btn-progress" style={{ width: `${renderPct}%` }} />}
          {rendering ? <Loader2 size={16} className="ss-spin" /> : <WandSparkles size={16} />}
          <span>{rendering ? "Creating Short…" : "Create Short"}</span>
        </button>
      </section>
    </div>
  );
}
