"use client";

import { motion } from "framer-motion";
import { Calendar, Download, Sparkles, Target } from "lucide-react";

export interface AnalyticsHeroBannerProps {
  range: string;
  onRangeChange: (range: string) => void;
  onExportReport: () => void;
  clipCount: number;
  totalViews: number;
}

const RANGES = [
  { key: "24h", label: "Last 24 Hours" },
  { key: "7d", label: "Last 7 Days" },
  { key: "30d", label: "Last 30 Days" },
];

export function AnalyticsHeroBanner({
  range,
  onRangeChange,
  onExportReport,
  clipCount,
  totalViews,
}: AnalyticsHeroBannerProps) {
  return (
    <motion.section
      className="ca-analytics-hero ca-glass"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="ca-analytics-hero-header">
        <div className="ca-analytics-hero-info">
          <div className="ca-analytics-eyebrow">
            <Target size={13} />
            <span>Algorithmic Telemetry</span>
          </div>

          <h1 className="ca-analytics-title">
            Virality &amp; Retention Analytics
          </h1>

          <p className="ca-analytics-desc">
            Real-time performance metrics, hook retention curves, and algorithmic distribution yield across your processed clips.
          </p>
        </div>

        <div className="ca-analytics-stat-chips">
          <span className="ca-stat-chip">
            <Sparkles size={12} />
            <strong>{clipCount}</strong> Analyzed Clips
          </span>
          <span className="ca-stat-chip ca-stat-chip-accent">
            <strong>{totalViews.toLocaleString()}</strong> Recorded Impressions
          </span>
        </div>
      </div>

      <div className="ca-analytics-controls-bar">
        <div className="ca-range-pill-group">
          {RANGES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`ca-range-btn ${range === key ? "active" : ""}`}
              onClick={() => onRangeChange(key)}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            className="ca-range-btn ca-range-custom-btn"
            onClick={() => onRangeChange("custom")}
          >
            <Calendar size={13} />
            <span>Custom Range</span>
          </button>
        </div>

        <motion.button
          type="button"
          className="ca-analytics-export-btn"
          onClick={onExportReport}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Download size={14} />
          <span>Export Report</span>
        </motion.button>
      </div>
    </motion.section>
  );
}
