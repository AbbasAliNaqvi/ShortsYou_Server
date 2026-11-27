"use client";
/* External creator and Supabase assets are intentionally rendered without Next's image proxy. */
/* eslint-disable @next/next/no-img-element */

import { memo, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDownToLine,
  Check,
  Eye,
  Loader2,
  Play,
  SlidersHorizontal,
  Trash2,
  WandSparkles,
} from "lucide-react";
import type { Clip, Video } from "@/lib/api";
import { formatDuration } from "@/lib/formatters";
import { ImageGeneration, type ImageGenerationStatus } from "@/components/agents/image-generation";

const RENDER_STEPS = [
  "Fetching source video…",
  "Transcribing audio…",
  "Analyzing viral moments…",
  "Generating hook & captions…",
  "Editing & framing 9:16…",
  "Rendering 4K short…",
  "Finalizing & syncing…",
];

export interface ClipCardProps {
  clip: Clip;
  video?: Video;
  selected: boolean;
  busy: boolean;
  onSelect: () => void;
  onExport: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onPreview?: (clip: Clip) => void;
  index: number;
}

export const ClipCard = memo(
  function ClipCard({
    clip,
    video,
    selected,
    busy,
    onSelect,
    onExport,
    onDownload,
    onDelete,
    onPreview,
    index,
  }: ClipCardProps) {
    const image =
      clip.selectedThumbnail || clip.thumbnailOptions?.[0] || video?.thumbnailUrl;
    const title =
      clip.originalHook ||
      clip.selectedHook ||
      clip.transcriptText ||
      "High-saliency moment";

    const isRendered =
      ["exported", "published"].includes(clip.status) || Boolean(clip.supabaseShortUrl);
    const isRendering = ["editing", "queued", "processing"].includes(clip.status);

    const [renderProgress, setRenderProgress] = useState(2);

    useEffect(() => {
      if (!isRendering) return;
      const durationMs = Math.round((240 + Math.random() * 30) * 1000); // 4:00 - 4:30 min
      const startedAt = clip.createdAt ? new Date(clip.createdAt).getTime() : Date.now();
      const update = () => {
        const elapsed = Math.max(0, Date.now() - startedAt);
        const pct = Math.min(95, Math.max(2, Math.round((elapsed / durationMs) * 95)));
        setRenderProgress(pct);
      };
      update();
      const id = setInterval(update, 1000);
      return () => clearInterval(id);
    }, [isRendering, clip.createdAt]);

    const stepIndex = Math.min(
      RENDER_STEPS.length - 1,
      Math.floor((renderProgress / 100) * RENDER_STEPS.length)
    );

    const genStatus: ImageGenerationStatus = !isRendering
      ? "complete"
      : renderProgress < 20
      ? "queued"
      : renderProgress < 75
      ? "generating"
      : "refining";

    return (
      <article
        className={`ca-clip-card ca-glass ${selected ? "is-selected" : ""}`}
      >
        {/* 9:14 Phone Video Poster */}
        <div
          className="ca-clip-media-box"
          onClick={() => onPreview && onPreview(clip)}
          role="button"
          tabIndex={0}
          title={isRendered ? "Click to preview short" : "Click to view details"}
        >
          {isRendering ? (
            <div className="absolute inset-0 z-10">
              <ImageGeneration
                status={genStatus}
                progress={renderProgress}
                size="fluid"
                aspectRatio="9 / 14"
                resolution=""
                interactive
                showStatus={false}
                className="size-full"
                mediaClassName="size-full rounded-none border-0"
              >
                {image ? (
                  <img src={image} alt="" className="size-full object-cover" loading="lazy" />
                ) : (
                  <div className={`ca-clip-art-fallback art-${index % 4}`}>
                    <Play size={28} />
                  </div>
                )}
              </ImageGeneration>
            </div>
          ) : image ? (
            <img
              src={image}
              alt=""
              className="ca-clip-poster-img"
              loading="lazy"
            />
          ) : (
            <div className={`ca-clip-art-fallback art-${index % 4}`}>
              <Play size={28} />
            </div>
          )}

          <div className="ca-clip-media-gradient" />

          {/* Selection Checkbox */}
          <label
            className={`ca-clip-checkbox-label ${selected ? "checked" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={selected}
              onChange={onSelect}
              className="ca-clip-checkbox-input"
            />
            <span className="ca-clip-checkbox-custom">
              {selected && <Check size={11} strokeWidth={3} />}
            </span>
          </label>

          {/* Viral Score Pill */}
          {clip.viralScore > 0 && (
            <span className="ca-clip-score-pill z-30">
              {Math.round(clip.viralScore)}
            </span>
          )}

          {/* Hover Play / Preview Overlay */}
          {!isRendering && (
            <div className="ca-clip-hover-overlay">
              <div className="ca-clip-hover-play-btn">
                {isRendered ? <Play size={20} fill="currentColor" /> : <Eye size={18} />}
              </div>
            </div>
          )}

          {/* Poster Caption Overlay */}
          <div className="ca-clip-caption-overlay">
            {title.slice(0, 90)}
          </div>

          {/* Waveform & Duration Bar */}
          <div className="ca-clip-media-bottom">
            <div className="ca-clip-wave-bars">
              <span className="ca-wave-bar" />
              <span className="ca-wave-bar" />
              <span className="ca-wave-bar" />
              <span className="ca-wave-bar" />
            </div>
            <span className="ca-clip-duration-tag">
              {formatDuration(clip.durationSeconds)}
            </span>
          </div>
        </div>

        {/* Card Details */}
        <div className="ca-clip-info-wrap">
          <div className="ca-clip-source-row">
            <span
              className="ca-clip-video-name"
              title={video?.title ?? "Processed source"}
            >
              {video?.title?.slice(0, 24) ?? "Processed source"}
            </span>
            <span className="ca-clip-category-pill">
              {clip.category || "Viral"}
            </span>
          </div>

          {/* Progress Bar Below Video & Above Details */}
          {isRendering && (
            <div className="pb-2.5">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-200 truncate pr-2">
                  {RENDER_STEPS[stepIndex]}
                </span>
                <span className="font-bold text-amber-500 shrink-0">
                  {renderProgress}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200/80 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 transition-all duration-700 ease-out"
                  style={{ width: `${renderProgress}%` }}
                />
              </div>
            </div>
          )}

          <h3 className="ca-clip-headline-text" title={title}>
            {title.slice(0, 100)}
          </h3>

          <p className="ca-clip-status-line">
            <strong className={isRendered ? "text-emerald-500" : isRendering ? "text-amber-500" : ""}>
              {isRendering ? "Rendering 4K…" : isRendered ? "Ready to Download" : clip.status}
            </strong>
            <span>·</span>
            <span>{clip.semanticLabels?.slice(0, 2).join(" · ") || "AI-created"}</span>
          </p>

          {/* Target Platforms */}
          <div className="ca-clip-platforms-row">
            <span>Shorts</span>
            <span>TikTok</span>
            <span>Reels</span>
          </div>

          {/* Action Buttons */}
          <div className="ca-clip-action-buttons">
            <button
              type="button"
              className={`ca-clip-btn primary ${isRendering ? "btn-rendering" : ""}`}
              onClick={onExport}
              disabled={busy || isRendering}
            >
              {busy || isRendering ? (
                <Loader2 className="spin" size={13} />
              ) : (
                <WandSparkles size={13} />
              )}
              <span>
                {isRendering
                  ? "AI rendering…"
                  : isRendered
                  ? "Re-render"
                  : "Create Short"}
              </span>
            </button>

            <button
              type="button"
              className="ca-clip-btn download"
              onClick={onDownload}
              disabled={busy || !isRendered}
              title={isRendered ? "Download vertical MP4" : "Render short before downloading"}
            >
              <ArrowDownToLine size={13} />
              <span>Download</span>
            </button>

            <button
              type="button"
              className="ca-clip-delete-btn"
              onClick={onDelete}
              disabled={busy}
              aria-label="Remove clip"
              title="Remove clip"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </article>
    );
  },
  (prev, next) =>
    prev.clip.id === next.clip.id &&
    prev.clip.status === next.clip.status &&
    prev.clip.viralScore === next.clip.viralScore &&
    prev.clip.supabaseShortUrl === next.clip.supabaseShortUrl &&
    prev.selected === next.selected &&
    prev.busy === next.busy &&
    prev.video?.id === next.video?.id &&
    prev.video?.title === next.video?.title
);
