"use client";
/* External creator and Supabase assets are intentionally rendered without Next's image proxy. */
/* eslint-disable @next/next/no-img-element */

import { memo } from "react";
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
          {image ? (
            <img src={image} alt="" className="ca-clip-poster-img" loading="lazy" />
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
          <span className="ca-clip-score-pill">
            {Math.round(clip.viralScore)} / 100
          </span>

          {/* Hover Play / Preview Overlay */}
          <div className="ca-clip-hover-overlay">
            <div className="ca-clip-hover-play-btn">
              {isRendered ? <Play size={20} fill="currentColor" /> : <Eye size={18} />}
            </div>
          </div>

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

            {/* Direct Timeline Editor Button */}
            <Link
              href={`/editor/${clip.videoId}?clipId=${clip.id}`}
              className="ca-clip-editor-btn"
              title="Open in Timeline Editor"
            >
              <SlidersHorizontal size={13} />
            </Link>

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
