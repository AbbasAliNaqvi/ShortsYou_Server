"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDownToLine,
  Check,
  Copy,
  Edit3,
  ExternalLink,
  Film,
  Play,
  RefreshCw,
  Save,
  Send,
  Sparkles,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import type { Clip, Video } from "@/lib/api";
import { formatDuration } from "@/lib/formatters";

export interface ClipPreviewModalProps {
  clip: Clip | null;
  video?: Video;
  isOpen: boolean;
  busy: boolean;
  onClose: () => void;
  onExport: (clipId: string) => void;
  onDownload: (clipId: string) => void;
  onPublish: (clipId: string) => void;
  onSaveHook: (clipId: string, newHook: string) => Promise<void>;
}

export function ClipPreviewModal({
  clip,
  video,
  isOpen,
  busy,
  onClose,
  onExport,
  onDownload,
  onPublish,
  onSaveHook,
}: ClipPreviewModalProps) {
  const [editedHook, setEditedHook] = useState("");
  const [isEditingHook, setIsEditingHook] = useState(false);
  const [savingHook, setSavingHook] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  useEffect(() => {
    if (clip) {
      setEditedHook(
        clip.selectedHook || clip.originalHook || clip.transcriptText || ""
      );
      setIsEditingHook(false);
    }
  }, [clip]);

  // Handle ESC key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !clip) return null;

  const videoUrl = clip.supabaseShortUrl || clip.supabaseRawClipUrl;
  const poster =
    clip.selectedThumbnail || clip.thumbnailOptions?.[0] || video?.thumbnailUrl;
  const isRendered = ["exported", "published"].includes(clip.status);
  const isRendering = clip.status === "editing";

  async function handleSaveHookSubmit() {
    if (!clip || !editedHook.trim()) return;
    setSavingHook(true);
    try {
      await onSaveHook(clip.id, editedHook.trim());
      setIsEditingHook(false);
    } finally {
      setSavingHook(false);
    }
  }

  function copyTranscript() {
    if (!clip?.transcriptText) return;
    void navigator.clipboard.writeText(clip.transcriptText);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  }

  return (
    <AnimatePresence>
      <div className="ca-modal-backdrop" onClick={onClose}>
        <motion.div
          className="ca-preview-modal-dialog ca-glass"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Close Button */}
          <button
            type="button"
            className="ca-modal-close-btn"
            onClick={onClose}
            aria-label="Close preview modal"
          >
            <X size={18} />
          </button>

          <div className="ca-preview-modal-grid">
            {/* Left Column: 9:16 Video Player Container */}
            <div className="ca-preview-player-col">
              <div className="ca-phone-mockup-frame">
                {videoUrl ? (
                  <video
                    src={videoUrl}
                    poster={poster}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="ca-rendered-short-video"
                  />
                ) : (
                  <div className="ca-unrendered-preview-box">
                    {poster ? (
                      <img src={poster} alt="" className="ca-phone-poster-bg" />
                    ) : (
                      <div className="ca-phone-poster-art">
                        <Play size={48} />
                      </div>
                    )}
                    <div className="ca-unrendered-overlay">
                      <div className="ca-unrendered-badge">
                        <WandSparkles size={16} />
                        <span>Ready to Render</span>
                      </div>
                      <p className="ca-unrendered-text">
                        4K Vertical Short not rendered yet. Click <strong>Create Short</strong> to generate MP4 with kinetic captions and cinematic grade.
                      </p>
                    </div>
                  </div>
                )}

                <div className="ca-phone-duration-pill">
                  {formatDuration(clip.durationSeconds)}
                </div>
              </div>
            </div>

            {/* Right Column: Telemetry, Hook Editor & Transcript */}
            <div className="ca-preview-details-col">
              {/* Header Info */}
              <div className="ca-preview-header-info">
                <div className="ca-preview-tag-row">
                  <span className="ca-preview-cat-badge">
                    {clip.category || "Viral Moment"}
                  </span>
                  <span className="ca-preview-status-pill">
                    Status: {clip.status}
                  </span>
                </div>
                <h2 className="ca-preview-video-source">
                  {video?.title ?? "Processed Video Source"}
                </h2>
              </div>

              {/* Saliency & Hook Score Gauges */}
              <div className="ca-preview-scores-card ca-glass">
                <div className="ca-score-gauge-item">
                  <div className="ca-gauge-header">
                    <span className="ca-gauge-label">
                      <Zap size={13} className="text-amber-500" />
                      Virality Saliency
                    </span>
                    <strong className="ca-gauge-val">
                      {Math.round(clip.viralScore)}%
                    </strong>
                  </div>
                  <div className="ca-gauge-track">
                    <div
                      className="ca-gauge-fill viral"
                      style={{ width: `${Math.min(100, Math.max(10, clip.viralScore))}%` }}
                    />
                  </div>
                </div>

                <div className="ca-score-gauge-item">
                  <div className="ca-gauge-header">
                    <span className="ca-gauge-label">
                      <Sparkles size={13} className="text-rose-500" />
                      Hook Retention
                    </span>
                    <strong className="ca-gauge-val">
                      {clip.hookScore > 0 ? `${clip.hookScore.toFixed(1)}%` : "Calculated"}
                    </strong>
                  </div>
                  <div className="ca-gauge-track">
                    <div
                      className="ca-gauge-fill hook"
                      style={{ width: `${Math.min(100, Math.max(10, clip.hookScore || clip.viralScore))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Hook Text Editor */}
              <div className="ca-preview-hook-section ca-glass">
                <div className="ca-hook-section-header">
                  <div className="ca-hook-section-title">
                    <Edit3 size={14} />
                    <span>Selected Opening Hook</span>
                  </div>
                  {!isEditingHook && (
                    <button
                      type="button"
                      className="ca-edit-hook-btn"
                      onClick={() => setIsEditingHook(true)}
                    >
                      <span>Edit Hook</span>
                    </button>
                  )}
                </div>

                {isEditingHook ? (
                  <div className="ca-hook-edit-form">
                    <textarea
                      value={editedHook}
                      onChange={(e) => setEditedHook(e.target.value)}
                      rows={3}
                      className="ca-hook-textarea"
                      placeholder="Enter punchy opening hook sentence..."
                    />
                    <div className="ca-hook-edit-actions">
                      <button
                        type="button"
                        className="ca-cancel-hook-btn"
                        onClick={() => {
                          setEditedHook(clip.selectedHook || clip.originalHook || "");
                          setIsEditingHook(false);
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="ca-save-hook-btn"
                        onClick={() => void handleSaveHookSubmit()}
                        disabled={savingHook || !editedHook.trim()}
                      >
                        {savingHook ? (
                          <RefreshCw size={13} className="spin" />
                        ) : (
                          <Save size={13} />
                        )}
                        <span>Save Hook</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="ca-hook-display-text">{editedHook || "No hook text specified."}</p>
                )}
              </div>

              {/* Full Transcript Segment */}
              <div className="ca-preview-transcript-section ca-glass">
                <div className="ca-transcript-header">
                  <span className="ca-transcript-title">Spoken Transcript Moment</span>
                  <button
                    type="button"
                    className="ca-copy-transcript-btn"
                    onClick={copyTranscript}
                  >
                    {copiedTranscript ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedTranscript ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="ca-transcript-scroll-box">
                  <p className="ca-transcript-text">
                    {clip.transcriptText || "No transcript available for this clip segment."}
                  </p>
                </div>
              </div>

              {/* Semantic Labels */}
              {clip.semanticLabels && clip.semanticLabels.length > 0 && (
                <div className="ca-preview-labels-wrap">
                  {clip.semanticLabels.map((lbl) => (
                    <span key={lbl} className="ca-preview-label-tag">
                      #{lbl}
                    </span>
                  ))}
                </div>
              )}

              {/* Bottom Actions Cluster */}
              <div className="ca-preview-modal-footer">
                <motion.button
                  type="button"
                  className="ca-modal-action-btn primary"
                  onClick={() => onExport(clip.id)}
                  disabled={busy || isRendering}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {busy || isRendering ? (
                    <RefreshCw className="spin" size={14} />
                  ) : (
                    <WandSparkles size={14} />
                  )}
                  <span>
                    {isRendering
                      ? "Rendering in progress…"
                      : isRendered
                      ? "Re-render Short"
                      : "Create Short"}
                  </span>
                </motion.button>

                <motion.button
                  type="button"
                  className="ca-modal-action-btn download"
                  onClick={() => onDownload(clip.id)}
                  disabled={busy || !isRendered}
                  whileHover={isRendered ? { scale: 1.02 } : {}}
                  whileTap={isRendered ? { scale: 0.98 } : {}}
                >
                  <ArrowDownToLine size={14} />
                  <span>Download MP4</span>
                </motion.button>

                <motion.button
                  type="button"
                  className="ca-modal-action-btn publish"
                  onClick={() => onPublish(clip.id)}
                  disabled={busy || clip.status === "published"}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Send size={14} />
                  <span>{clip.status === "published" ? "Published" : "Publish"}</span>
                </motion.button>

                {clip.videoId && (
                  <Link
                    href={`/editor/${clip.videoId}`}
                    className="ca-modal-action-btn secondary"
                  >
                    <Film size={14} />
                    <span>Open Editor</span>
                    <ExternalLink size={12} />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
