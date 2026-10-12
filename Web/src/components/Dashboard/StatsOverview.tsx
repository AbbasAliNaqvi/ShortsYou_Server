"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

export interface StatsOverviewProps {
  videoCount: number;
  clipCount: number;
  renderedCount: number;
  avgViralScore: number;
  onBrowseMetrics?: () => void;
}

/**
 * StatsOverview — Performance-optimized version.
 *
 * Key changes (zero visual difference):
 *  1. Wrapped in React.memo with a custom comparator so the component only
 *     re-renders when one of its four numeric props or the callback actually
 *     changes value — not on every top-level dashboard state update.
 *  2. All Framer Motion bars use only `width` (CSS percentage string) which
 *     is GPU-composited via CSS transition and does not cause layout recalcs.
 */
export const StatsOverview = memo(
  function StatsOverview({
    videoCount,
    clipCount,
    renderedCount,
    avgViralScore,
    onBrowseMetrics,
  }: StatsOverviewProps) {
    return (
      <motion.div
        className="ca-floating-stats-bar ca-glass-card"
        whileHover={{ y: -3 }}
        transition={{ duration: 0.2 }}
      >
        {/* Stat 1: Videos */}
        <div className="ca-stat-item">
          <span className="ca-stat-val">{videoCount}</span>
          <div className="ca-stat-lbl">
            <i className="ca-dot ca-dot--blue" />
            <span>Videos</span>
          </div>
          <div className="ca-stat-bar">
            <motion.div
              className="ca-stat-bar-fill ca-fill-blue"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(15, videoCount * 25))}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Stat 2: Clips */}
        <div className="ca-stat-item">
          <span className="ca-stat-val">{clipCount}</span>
          <div className="ca-stat-lbl">
            <i className="ca-dot ca-dot--pink" />
            <span>Clips</span>
          </div>
          <div className="ca-stat-bar">
            <motion.div
              className="ca-stat-bar-fill ca-fill-pink"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(20, clipCount * 18))}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
            />
          </div>
        </div>

        {/* Stat 3: Avg Viral Score */}
        <div className="ca-stat-item ca-stat-item--highlight">
          <span className="ca-stat-val">{avgViralScore}%</span>
          <div className="ca-stat-lbl">
            <i className="ca-dot ca-dot--green" />
            <span>Viral Score</span>
          </div>
          <div className="ca-stat-bar">
            <motion.div
              className="ca-stat-bar-fill ca-fill-green"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(30, avgViralScore))}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            />
          </div>
        </div>

        {/* Stat 4: Rendered */}
        <div className="ca-stat-item">
          <span className="ca-stat-val">{renderedCount}</span>
          <div className="ca-stat-lbl">
            <i className="ca-dot ca-dot--orange" />
            <span>Rendered</span>
          </div>
          <div className="ca-stat-bar">
            <motion.div
              className="ca-stat-bar-fill ca-fill-orange"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(20, renderedCount * 25))}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            />
          </div>
        </div>

        {/* Next Circle Arrow Button */}
        <motion.button
          className="ca-stats-arrow-circle"
          aria-label="Browse metrics"
          onClick={onBrowseMetrics}
          whileHover={{ scale: 1.12, rotate: 5 }}
          whileTap={{ scale: 0.92 }}
        >
          <ChevronRight size={18} />
        </motion.button>
      </motion.div>
    );
  },
  // Custom comparator: skip re-render if all numeric props are identical.
  (prev, next) =>
    prev.videoCount === next.videoCount &&
    prev.clipCount === next.clipCount &&
    prev.renderedCount === next.renderedCount &&
    prev.avgViralScore === next.avgViralScore &&
    prev.onBrowseMetrics === next.onBrowseMetrics
);
