"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Clapperboard,
  Compass,
  Info,
  Link2,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";

export interface VideosIntroBannerProps {
  totalCount: number;
  ownCount: number;
  importedCount?: number;
  pickedCount: number;
  processingCount?: number;
  notice?: string;
  onClearNotice?: () => void;
}

export function VideosIntroBanner({
  totalCount,
  ownCount,
  importedCount = 0,
  pickedCount,
  processingCount = 0,
  notice,
  onClearNotice,
}: VideosIntroBannerProps) {
  return (
    <motion.div
      className="ca-videos-hero ca-glass"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="ca-videos-hero-top">
        <span className="ca-videos-eyebrow">
          <Bot size={13} />
          <span>AI Shorts Factory</span>
        </span>

        {/* Live metric chips from real state */}
        <div className="ca-videos-stat-chips">
          <span className="ca-stat-chip">
            <Clapperboard size={12} />
            <strong>{ownCount}</strong> Channel
          </span>

          {importedCount > 0 && (
            <span className="ca-stat-chip">
              <Link2 size={12} />
              <strong>{importedCount}</strong> Imported URL
            </span>
          )}

          {pickedCount > 0 && (
            <span className="ca-stat-chip">
              <Compass size={12} />
              <strong>{pickedCount}</strong> Discover
            </span>
          )}

          {processingCount > 0 && (
            <span className="ca-stat-chip ca-stat-chip-processing">
              <Loader2 size={12} className="spin" />
              <strong>{processingCount}</strong> Processing
            </span>
          )}

          <span className="ca-stat-chip ca-stat-chip-accent">
            <Sparkles size={12} />
            <strong>{totalCount}</strong> Total in Studio
          </span>
        </div>
      </div>

      <h1 className="ca-videos-headline">
        Your Videos. AI Creates the Shorts.
      </h1>

      <p className="ca-videos-subtext">
        Import any YouTube link or pick from your channel. AI discovers high-engagement
        moments, synthesizes dynamic hooks, aligns SFX, and exports viral shorts in seconds.
      </p>

      {/* Dynamic Notification / Notice Banner */}
      <AnimatePresence>
        {notice && (
          <motion.div
            className="ca-notice-banner ca-glass"
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.25 }}
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
    </motion.div>
  );
}
