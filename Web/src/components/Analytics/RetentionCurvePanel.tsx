"use client";

import { motion } from "framer-motion";
import { Activity, Sparkles } from "lucide-react";
import type { Clip } from "@/lib/api";

export interface RetentionCurvePanelProps {
  clips: Clip[];
}

export function RetentionCurvePanel({ clips }: { clips: Clip[] }) {
  const points = clips.length
    ? clips
        .slice(0, 8)
        .map(
          (clip, index) =>
            `${index * 70 + 20},${210 - Math.min(160, clip.hookScore * 1.8)}`
        )
        .join(" ")
    : "20,45 95,85 170,120 250,150 330,170 420,188 510,200 560,208";

  // Build polygon area for smooth gradient fill under the line
  const areaPoints = `${points} 560,230 20,230`;

  return (
    <motion.article
      className="ca-retention-panel ca-glass"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="ca-panel-header">
        <div className="ca-panel-header-text">
          <div className="ca-panel-badge-row">
            <span className="ca-panel-badge">
              <Activity size={12} />
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
            viewBox="0 0 580 240"
            preserveAspectRatio="none"
            className="ca-retention-svg"
          >
            <defs>
              <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                <stop offset="80%" stopColor="#f59e0b" stopOpacity="0.02" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="60%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines */}
            <line x1="20" y1="20" x2="560" y2="20" stroke="rgba(15, 23, 42, 0.05)" strokeDasharray="3 3" />
            <line x1="20" y1="75" x2="560" y2="75" stroke="rgba(15, 23, 42, 0.05)" strokeDasharray="3 3" />
            <line x1="20" y1="130" x2="560" y2="130" stroke="rgba(15, 23, 42, 0.05)" strokeDasharray="3 3" />
            <line x1="20" y1="185" x2="560" y2="185" stroke="rgba(15, 23, 42, 0.05)" strokeDasharray="3 3" />
            <line x1="20" y1="230" x2="560" y2="230" stroke="rgba(15, 23, 42, 0.08)" />

            {/* Benchmark Industry Median Curve */}
            <path
              d="M20 42 C100 70 170 125 260 155 C360 185 460 198 560 214"
              fill="none"
              stroke="#94a3b8"
              strokeDasharray="5 5"
              strokeWidth="2"
            />

            {/* Shaded Area Fill Under Curve */}
            <polygon points={areaPoints} fill="url(#curveGradient)" />

            {/* Active Measured Curve Polyline */}
            <polyline
              points={points}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="3.5"
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
          <Sparkles size={16} />
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
}
