"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Film, Info, Send, Sparkles, X } from "lucide-react";

export interface ClipsHeroBannerProps {
  clipCount: number;
  selectedCount: number;
  busy: boolean;
  notice?: string;
  onClearNotice?: () => void;
  onExportSelected: () => void;
  onPublishSelected: () => void;
}

export function ClipsHeroBanner({
  clipCount,
  selectedCount,
  busy,
  notice,
  onClearNotice,
  onExportSelected,
  onPublishSelected,
}: ClipsHeroBannerProps) {
  return (
    <motion.section
      className="ca-clips-hero ca-glass"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="ca-clips-hero-content">
        <div className="ca-clips-hero-text">
          <div className="ca-clips-eyebrow">
            <Sparkles size={13} />
            <span>AI-Created Shorts · {clipCount} ready</span>
          </div>

          <h1 className="ca-clips-headline">
            Your AI-Created <em>Shorts Collection</em>
          </h1>

          <p className="ca-clips-subtext">
            Every short here was intelligently found, scored, and crafted by our AI engine.
            Review, polish, and publish your strongest moments.
          </p>
        </div>

        <div className="ca-clips-actions-cluster">
          <Link href="/videos" className="ca-clips-link-btn">
            <Film size={14} />
            <span>Source videos</span>
          </Link>

          <button
            type="button"
            className="ca-clips-action-btn"
            disabled={selectedCount === 0 || busy}
            onClick={onExportSelected}
          >
            <Download size={14} />
            <span>Export selected ({selectedCount})</span>
          </button>

          <button
            type="button"
            className="ca-clips-action-btn ca-btn-primary"
            disabled={selectedCount === 0 || busy}
            onClick={onPublishSelected}
          >
            <Send size={14} />
            <span>Publish Selected ({selectedCount})</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {notice && (
          <motion.div
            className="ca-notice-banner ca-glass"
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.2 }}
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
