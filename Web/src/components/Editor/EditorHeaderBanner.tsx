"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Info, LoaderCircle, Sparkles, WandSparkles, X } from "lucide-react";
import { formatDuration } from "@/lib/formatters";

export interface EditorHeaderBannerProps {
  title: string;
  duration: number;
  clipLength: number;
  rendering: boolean;
  notice?: string;
  onRender: () => void;
  onClearNotice?: () => void;
}

export function EditorHeaderBanner({
  title,
  duration,
  clipLength,
  rendering,
  notice,
  onRender,
  onClearNotice,
}: EditorHeaderBannerProps) {
  return (
    <motion.section
      className="ca-editor-header-banner ca-glass"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="ca-banner-left">
        <span className="ca-banner-kicker">
          <Sparkles size={12} />
          <span>Timeline & Framing Studio</span>
        </span>
        <h1 className="ca-banner-title" title={title}>
          {title}
        </h1>
        <div className="ca-banner-meta">
          <span className="ca-banner-pill">
            Source: <strong>{formatDuration(duration)}</strong>
          </span>
          <span className="ca-banner-pill ca-banner-pill-accent">
            Selected Short: <strong>{formatDuration(clipLength)}</strong>
          </span>
        </div>
      </div>

      <div className="ca-banner-right">
        <motion.button
          type="button"
          className="ca-banner-render-btn"
          onClick={onRender}
          disabled={rendering}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
        >
          {rendering ? (
            <>
              <LoaderCircle className="spin" size={16} />
              <span>Starting render…</span>
            </>
          ) : (
            <>
              <WandSparkles size={16} />
              <span>Create Short</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Notice alert */}
      <AnimatePresence>
        {notice && (
          <motion.div
            className="ca-notice-banner ca-glass ca-editor-notice-wrap"
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -6, height: 0 }}
          >
            <div className="ca-notice-content">
              <Info size={16} className="ca-notice-icon" />
              <span className="ca-notice-text">{notice}</span>
            </div>
            {onClearNotice && (
              <button
                type="button"
                className="ca-notice-dismiss"
                onClick={onClearNotice}
                aria-label="Dismiss notice"
              >
                <X size={14} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
