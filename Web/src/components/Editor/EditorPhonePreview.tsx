"use client";
/* eslint-disable @next/next/no-img-element */

import { Clapperboard, Play } from "lucide-react";
import type { Video } from "@/lib/api";
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
  onSetStartBound: (val: number) => void;
  onSetEndBound: (val: number) => void;
}

export function EditorPhonePreview({
  video,
  hasPlayablePreview,
  previewStart,
  hook,
  layout,
  start,
  end,
  duration,
  onSetStartBound,
  onSetEndBound,
}: EditorPhonePreviewProps) {
  const layoutLabel =
    layout === "auto_face"
      ? "ADAPTIVE FACE FRAMING"
      : layout.replace("_", " ").toUpperCase();

  return (
    <section className="ca-editor-preview-container ca-glass">
      {/* 9:16 Vertical Phone Mockup Preview */}
      <div className="ca-phone-frame">
        <div className="ca-phone-screen">
          {hasPlayablePreview ? (
            <iframe
              key={`${video.youtubeVideoId}-${Math.floor(previewStart)}`}
              src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(
                video.youtubeVideoId!
              )}?start=${Math.floor(previewStart)}&autoplay=0&rel=0&modestbranding=1`}
              title={`Preview of ${video.title}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="ca-phone-iframe"
            />
          ) : video.thumbnailUrl ? (
            <img src={video.thumbnailUrl} alt="" className="ca-phone-thumb-img" />
          ) : (
            <div className="ca-phone-placeholder">
              <Clapperboard size={48} />
            </div>
          )}

          {/* Scrim Overlay */}
          <div className="ca-phone-scrim" />

          {/* Hook text preview */}
          <div className="ca-phone-hook-text">
            <strong>{hook || "Your hook appears here"}</strong>
          </div>

          {/* Layout mode badge */}
          <span className="ca-phone-layout-tag">{layoutLabel}</span>
        </div>
      </div>

      {/* Preview status info */}
      <div className="ca-preview-status-pill">
        <Play size={13} />
        <span>
          {hasPlayablePreview
            ? "Source preview — use the timeline below to choose the cut"
            : "A stream preview is unavailable for this source; the selected range will still render."}
        </span>
      </div>

      {/* Timeline range controls */}
      <div className="ca-timeline-card ca-glass">
        <div className="ca-timeline-inputs">
          <label className="ca-timeline-field">
            <span>Start</span>
            <input
              type="number"
              min="0"
              max={Math.max(0, end - 0.1)}
              step="0.1"
              value={start}
              onChange={(e) => onSetStartBound(Number(e.target.value))}
            />
          </label>

          <div className="ca-timeline-separator">
            <span>to</span>
          </div>

          <label className="ca-timeline-field">
            <span>End</span>
            <input
              type="number"
              min="0.1"
              max={duration || undefined}
              step="0.1"
              value={end}
              onChange={(e) => onSetEndBound(Number(e.target.value))}
            />
          </label>
        </div>

        {/* Dual Range Sliders */}
        <div className="ca-timeline-sliders" aria-label="Selected clip range">
          <input
            aria-label="Clip start"
            type="range"
            min="0"
            max={duration || 60}
            step="0.1"
            value={start}
            onChange={(e) => onSetStartBound(Number(e.target.value))}
          />
          <input
            aria-label="Clip end"
            type="range"
            min="0.1"
            max={duration || 60}
            step="0.1"
            value={end}
            onChange={(e) => onSetEndBound(Number(e.target.value))}
          />
        </div>

        <div className="ca-timeline-footer">
          <small>
            Selected: <strong>{formatDuration(Math.max(0, end - start))}</strong>
          </small>
          <small>
            Choose the exact moment to turn into a vertical short.
          </small>
        </div>
      </div>
    </section>
  );
}
