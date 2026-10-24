"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDownToLine,
  Play,
  SlidersHorizontal,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react";
import type { Clip, Video } from "@/lib/api";
import { formatDuration } from "@/lib/formatters";

export interface ClipPreviewModalProps {
  clip: Clip | null;
  video?: Video;
  onClose: () => void;
  onDownload: (clipId: string) => void;
  onExport: (clipId: string) => void;
  busy?: boolean;
}

export function ClipPreviewModal({
  clip,
  video,
  onClose,
  onDownload,
  onExport,
  busy = false,
}: ClipPreviewModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (clip) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [clip, onClose]);

  if (!clip) return null;

  const isRendered =
    ["exported", "published"].includes(clip.status) || Boolean(clip.supabaseShortUrl);
  const title =
    clip.selectedHook || clip.originalHook || clip.transcriptText || "Short Moment";

  return (
    <AnimatePresence>
      <div className="ca-modal-backdrop" onClick={onClose}>
        <motion.div
          className="ca-clip-preview-dialog ca-glass"
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="ca-preview-modal-header">
            <div className="ca-preview-modal-title-group">
              <span className="ca-preview-modal-badge">
                <Sparkles size={12} />
                <span>AI Short Preview</span>
              </span>
              <h2 className="ca-preview-modal-title">{title}</h2>
              {video?.title && (
                <span className="ca-preview-modal-source">Source: {video.title}</span>
              )}
            </div>

            <button
              type="button"
              className="ca-preview-modal-close"
              onClick={onClose}
              aria-label="Close preview"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body: 9:16 Video Player Container */}
          <div className="ca-preview-modal-body">
            <div className="ca-preview-player-wrap">
              {isRendered && clip.supabaseShortUrl ? (
                <video
                  src={clip.supabaseShortUrl}
                  controls
                  autoPlay
                  playsInline
                  className="ca-preview-video-element"
                />
              ) : (
                <div className="ca-preview-placeholder">
                  <Play size={48} className="text-white/40" />
                  <p className="ca-preview-placeholder-text">
                    This short has not been rendered into 9:16 vertical video yet.
                  </p>
                  <button
                    type="button"
                    className="ca-preview-render-cta"
                    onClick={() => onExport(clip.id)}
                    disabled={busy}
                  >
                    <WandSparkles size={14} />
                    <span>Render 9:16 Short Now</span>
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar Details */}
            <div className="ca-preview-sidebar">
              <div className="ca-preview-stat-card">
                <span className="ca-preview-stat-label">Viral Score</span>
                <strong className="ca-preview-stat-value text-amber-500">
                  {Math.round(clip.viralScore)} / 100
                </strong>
              </div>

              <div className="ca-preview-stat-card">
                <span className="ca-preview-stat-label">Duration</span>
                <strong className="ca-preview-stat-value">
                  {formatDuration(clip.durationSeconds)}
                </strong>
              </div>

              <div className="ca-preview-stat-card">
                <span className="ca-preview-stat-label">Status</span>
                <strong className="ca-preview-stat-value capitalize text-emerald-500">
                  {clip.status}
                </strong>
              </div>

              {clip.transcriptText && (
                <div className="ca-preview-transcript-box">
                  <span className="ca-preview-box-label">Transcript Snippet</span>
                  <p className="ca-preview-transcript-text">{clip.transcriptText}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="ca-preview-actions-column">
                {isRendered && (
                  <button
                    type="button"
                    className="ca-preview-action-btn btn-primary"
                    onClick={() => onDownload(clip.id)}
                    disabled={busy}
                  >
                    <ArrowDownToLine size={14} />
                    <span>Download MP4</span>
                  </button>
                )}

                <Link
                  href={`/editor/${clip.videoId}?clipId=${clip.id}`}
                  className="ca-preview-action-btn btn-secondary"
                  onClick={onClose}
                >
                  <SlidersHorizontal size={14} />
                  <span>Open in Timeline Editor</span>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
