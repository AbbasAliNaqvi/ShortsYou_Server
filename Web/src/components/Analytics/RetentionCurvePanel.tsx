"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Activity, Sparkles } from "lucide-react";
import type { Clip } from "@/lib/api";

export interface RetentionCurvePanelProps {
  clips: Clip[];
}

/**
 * RetentionCurvePanel — Performance-optimized version.
 *
 * Key changes (zero visual difference):
 *  1. Wrapped in React.memo — the SVG chart is expensive to repaint;
 *     memoization ensures it only re-renders when the `clips` array reference
 *     actually changes (i.e. after a data refresh), not on every analytics
 *     page state update (e.g. range picker change before data arrives).
 *  2. SVG gradient `<defs>` are rendered only once per component instance
 *     and are structurally pure (no dynamic values) — they are safe to memo.
 *  3. All Framer Motion properties (`opacity`, `y`) are GPU-composited and
 *     never trigger layout recalculation.
 */
export const RetentionCurvePanel = memo(function RetentionCurvePanel({
  clips,
}: RetentionCurvePanelProps) {
  const points = clips.length
    ? clips
        .slice(0, 8)
        .map(
          (clip, index) =>
            `${index * 70 + 20},${225 - Math.min(170, clip.hookScore * 1.9)}`
        )
        .join(" ")
    : "20,50 95,95 170,135 250,165 330,185 420,202 510,215 560,222";

  // Build polygon area for smooth gradient fill under the line
  const areaPoints = `${points} 560,245 20,245`;

  return (
    <motion.article
      className="ca-retention-panel ca-glass"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <div className="ca-panel-header">
        <div className="ca-panel-header-text">
          <div className="ca-panel-badge-row">
            <span className="ca-panel-badge">
              <Activity size={13} />
              Audience Fall-Off Telemetry
            </span>
            <span className="ca-live-baseline-tag">LIVE BASELINE</span>
          </div>
          <h2 className="ca-panel-title">Hook Retention Curve &amp; Decay Analysis</h2>
          <p className="ca-panel-subtitle">
            Second-by-second audience retention benchmarked across your processed video shorts.
          </p>
        </div>
      </div>

      <div className="ca-retention-chart-container">
        <div className="ca-chart-y-axis">
          <span>100%</span>
          <span>75%</span>
          <span>50%</span>
          <span>25%</span>
          <span>0%</span>
        </div>

        <div className="ca-chart-svg-wrap">
          <svg
            viewBox="0 0 580 260"
            preserveAspectRatio="none"
            className="ca-retention-svg"
          >
            <defs>
              <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.22" />
                <stop offset="85%" stopColor="#f59e0b" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="60%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines */}
            <line x1="20" y1="20" x2="560" y2="20" stroke="rgba(15, 23, 42, 0.12)" strokeDasharray="4 4" />
            <line x1="20" y1="75" x2="560" y2="75" stroke="rgba(15, 23, 42, 0.12)" strokeDasharray="4 4" />
            <line x1="20" y1="130" x2="560" y2="130" stroke="rgba(15, 23, 42, 0.12)" strokeDasharray="4 4" />
            <line x1="20" y1="185" x2="560" y2="185" stroke="rgba(15, 23, 42, 0.12)" strokeDasharray="4 4" />
            <line x1="20" y1="245" x2="560" y2="245" stroke="rgba(15, 23, 42, 0.18)" strokeWidth="1.5" />

            {/* Benchmark Industry Median Curve */}
            <path
              d="M20 48 C100 80 170 135 260 168 C360 198 460 212 560 228"
              fill="none"
              stroke="#64748b"
              strokeDasharray="6 6"
              strokeWidth="2.5"
            />

            {/* Shaded Area Fill Under Curve */}
            <polygon points={areaPoints} fill="url(#curveGradient)" />

            {/* Active Measured Curve Polyline */}
            <polyline
              points={points}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <div className="ca-chart-x-axis">
            <span>0:00 Hook</span>
            <span>0:03</span>
            <span>0:15 Argument</span>
            <span>0:30 Tension</span>
            <span>0:60 Payoff</span>
          </div>
        </div>
      </div>

      <div className="ca-analytics-callout-banner">
        <div className="ca-callout-icon">
          <Sparkles size={17} />
        </div>
        <div className="ca-callout-text">
          <strong>Peak Retention Correlator:</strong>{" "}
          <span>
            {clips.length
              ? "Your current sample is being measured against actual clip hook scores."
              : "Process and publish clips to establish your first measured virality baseline."}
          </span>
        </div>
      </div>
    </motion.article>
  );
});
