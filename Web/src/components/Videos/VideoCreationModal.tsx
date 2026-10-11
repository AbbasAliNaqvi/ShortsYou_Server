"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Clapperboard,
  Info,
  Loader2,
  SlidersHorizontal,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import type { Video } from "@/lib/api";
import { formatDuration } from "@/lib/formatters";

export interface VideoCreationModalProps {
  video: Video | null;
  mode: "choose" | "transcription" | "manual";
  start: string;
  end: string;
  hook: string;
  busy: boolean;
  onClose: () => void;
  onSetMode: (mode: "choose" | "transcription" | "manual") => void;
  onSetStart: (val: string) => void;
  onSetEnd: (val: string) => void;
  onSetHook: (val: string) => void;
  onAiAutoCreate: () => void;
  onCustomEditor: () => void;
  onAiGenerate: () => void;
  onQuickGenerateWithoutTranscription: () => void;
  onManualGenerate: () => void;
}

export function VideoCreationModal({
  video,
  mode,
  start,
  end,
  hook,
  busy,
  onClose,
  onSetMode,
  onSetStart,
  onSetEnd,
  onSetHook,
  onAiAutoCreate,
  onCustomEditor,
  onAiGenerate,
  onQuickGenerateWithoutTranscription,
  onManualGenerate,
}: VideoCreationModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [busy, onClose]);

  if (!video) return null;

  return (
    <AnimatePresence>
      <div
        className="ca-modal-backdrop"
        role="presentation"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget && !busy) onClose();
        }}
      >
        <motion.section
          className="ca-video-modal-dialog ca-glass"
          role="dialog"
          aria-modal="true"
          aria-labelledby="short-creation-title"
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 14 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Header Bar */}
          <div className="ca-modal-header">
            <div className="ca-modal-header-info">
              <span className="ca-modal-tag">Target Video</span>
              <h3 className="ca-modal-video-title" title={video.title}>
                {video.title}
              </h3>
              {video.durationSeconds > 0 && (
                <span className="ca-modal-duration">
                  Duration: {formatDuration(video.durationSeconds)}
                </span>
              )}
            </div>

            <button
              type="button"
              className="ca-modal-close-btn"
              onClick={onClose}
              disabled={busy}
              aria-label="Close dialog"
            >
              <X size={17} />
            </button>
          </div>

          {/* Mode 1: Choose Creation Path */}
          {mode === "choose" && (
            <div className="ca-modal-body">
              <h2 id="short-creation-title" className="ca-modal-title">
                How would you like to create this short?
              </h2>

              <div className="ca-modal-options-list">
                {/* 1. AI Auto-Create (Recommended) */}
                <motion.button
                  type="button"
                  className="ca-modal-option-card ca-option-highlighted"
                  disabled={busy}
                  onClick={onAiAutoCreate}
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="ca-option-icon ca-icon-zap">
                    <Zap size={20} />
                  </div>
                  <div className="ca-option-copy">
                    <div className="ca-option-title-row">
                      <strong>AI Auto-Create</strong>
                      <span className="ca-badge-recommended">Recommended</span>
                    </div>
                    <p>
                      One click. AI transcribes, detects viral moments, generates hooks,
                      and renders your shorts automatically.
                    </p>
                  </div>
                </motion.button>

                {/* 2. Custom Editor */}
                <motion.button
                  type="button"
                  className="ca-modal-option-card"
                  disabled={busy}
                  onClick={onCustomEditor}
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="ca-option-icon">
                    <Clapperboard size={20} />
                  </div>
                  <div className="ca-option-copy">
                    <strong>Custom Editor</strong>
                    <p>Fine-tune layout, faces, captions, music, and polish in the timeline.</p>
                  </div>
                </motion.button>

                {/* 3. AI Clip Detection Only */}
                <motion.button
                  type="button"
                  className="ca-modal-option-card"
                  disabled={busy}
                  onClick={() => onSetMode("transcription")}
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="ca-option-icon">
                    <WandSparkles size={20} />
                  </div>
                  <div className="ca-option-copy">
                    <strong>AI Clip Detection Only</strong>
                    <p>Let AI find the best moments without auto-rendering.</p>
                  </div>
                </motion.button>

                {/* 4. Manual Trim & Hook */}
                <motion.button
                  type="button"
                  className="ca-modal-option-card"
                  disabled={busy}
                  onClick={() => onSetMode("manual")}
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="ca-option-icon">
                    <SlidersHorizontal size={20} />
                  </div>
                  <div className="ca-option-copy">
                    <strong>Manual Timestamp Trim</strong>
                    <p>Specify exact start/end seconds and write custom hooks.</p>
                  </div>
                </motion.button>
              </div>
            </div>
          )}

          {/* Mode 2: Transcription Options */}
          {mode === "transcription" && (
            <div className="ca-modal-body">
              <h2 id="short-creation-title" className="ca-modal-title">
                Do you want transcription?
              </h2>

              <div className="ca-modal-callout ca-glass">
                <Info size={16} className="ca-callout-icon" />
                <p>
                  Transcription lets AI find the best moments, but requires your
                  transcription service callback to be reachable.
                </p>
              </div>

              <div className="ca-modal-options-list">
                <motion.button
                  type="button"
                  className="ca-modal-option-card ca-option-highlighted"
                  disabled={busy}
                  onClick={onAiGenerate}
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="ca-option-icon ca-icon-sparkle">
                    {busy ? <Loader2 size={20} className="spin" /> : <WandSparkles size={20} />}
                  </div>
                  <div className="ca-option-copy">
                    <strong>
                      {busy ? "Starting AI generation…" : "Yes, transcribe and analyze"}
                    </strong>
                    <p>Use AI to detect and generate the strongest clips.</p>
                  </div>
                </motion.button>

                <motion.button
                  type="button"
                  className="ca-modal-option-card"
                  disabled={busy}
                  onClick={onQuickGenerateWithoutTranscription}
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="ca-option-icon">
                    <Clapperboard size={20} />
                  </div>
                  <div className="ca-option-copy">
                    <strong>Create without transcription</strong>
                    <p>
                      Render a quick clip from the first {end} seconds — no external callback
                      needed.
                    </p>
                  </div>
                </motion.button>
              </div>

              <div className="ca-modal-footer">
                <button
                  type="button"
                  className="ca-modal-back-btn"
                  disabled={busy}
                  onClick={() => onSetMode("choose")}
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
              </div>
            </div>
          )}

          {/* Mode 3: Manual Trim Form */}
          {mode === "manual" && (
            <div className="ca-modal-body">
              <h2 id="short-creation-title" className="ca-modal-title">
                Create your own short
              </h2>

              <div className="ca-modal-form-grid">
                <label className="ca-form-label">
                  <span>Start second</span>
                  <input
                    type="number"
                    min="0"
                    className="ca-form-input"
                    value={start}
                    onChange={(e) => onSetStart(e.target.value)}
                    disabled={busy}
                  />
                </label>

                <label className="ca-form-label">
                  <span>End second</span>
                  <input
                    type="number"
                    min="1"
                    className="ca-form-input"
                    value={end}
                    onChange={(e) => onSetEnd(e.target.value)}
                    disabled={busy}
                  />
                </label>
              </div>

              <label className="ca-form-label ca-form-label-full">
                <span>Hook text (optional)</span>
                <input
                  type="text"
                  className="ca-form-input"
                  value={hook}
                  onChange={(e) => onSetHook(e.target.value)}
                  placeholder="Your opening caption"
                  disabled={busy}
                />
              </label>

              <div className="ca-modal-footer ca-modal-footer-split">
                <button
                  type="button"
                  className="ca-modal-back-btn"
                  disabled={busy}
                  onClick={() => onSetMode("choose")}
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>

                <motion.button
                  type="button"
                  className="ca-modal-primary-btn"
                  disabled={busy}
                  onClick={onManualGenerate}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {busy ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      <span>Rendering…</span>
                    </>
                  ) : (
                    <span>Create Short</span>
                  )}
                </motion.button>
              </div>
            </div>
          )}
        </motion.section>
      </div>
    </AnimatePresence>
  );
}
