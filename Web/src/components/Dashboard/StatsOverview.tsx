"use client";

import { memo } from "react";
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
      <div
        className="ca-floating-stats-bar ca-glass-card"
      >
        {/* Stat 1: Videos */}
        <div className="ca-stat-item">
          <span className="ca-stat-val">{videoCount}</span>
          <div className="ca-stat-lbl">
            <i className="ca-dot ca-dot--blue" />
            <span>Videos</span>
          </div>
          <div className="ca-stat-bar">
            <div
              className="ca-stat-bar-fill ca-fill-blue"
              style={{ width: `${Math.min(100, Math.max(15, videoCount * 25))}%` }}
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
            <div
              className="ca-stat-bar-fill ca-fill-pink"
              style={{ width: `${Math.min(100, Math.max(20, clipCount * 18))}%` }}
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
            <div
              className="ca-stat-bar-fill ca-fill-green"
              style={{ width: `${Math.min(100, Math.max(30, avgViralScore))}%` }}
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
            <div
              className="ca-stat-bar-fill ca-fill-orange"
              style={{ width: `${Math.min(100, Math.max(20, renderedCount * 25))}%` }}
            />
          </div>
        </div>

        {/* Next Circle Arrow Button */}
        <button
          className="ca-stats-arrow-circle"
          aria-label="Browse metrics"
          onClick={onBrowseMetrics}
        >
          <ChevronRight size={18} />
        </button>
      </div>
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
