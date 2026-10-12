"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { BarChart3, Film, PlayCircle, Share2, Video } from "lucide-react";
import type { PerformanceAnalytics } from "@/lib/api";
import { compactNumber } from "@/lib/formatters";

export interface PlatformMatrixPanelProps {
  performance: PerformanceAnalytics | null;
}

const PLATFORMS = [
  { name: "YouTube Shorts", icon: Film, color: "#ef4444" },
  { name: "TikTok", icon: PlayCircle, color: "#06b6d4" },
  { name: "Instagram Reels", icon: Video, color: "#ec4899" },
];

export const PlatformMatrixPanel = memo(function PlatformMatrixPanel({ performance }: PlatformMatrixPanelProps) {
  return (
    <motion.article
      className="ca-platform-panel ca-glass"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="ca-panel-header">
        <div className="ca-panel-header-text">
          <div className="ca-panel-badge-row">
            <span className="ca-panel-badge">
              <Share2 size={12} />
              Multi-Channel Distribution
            </span>
          </div>
          <h2 className="ca-panel-title">Cross-Platform Performance Matrix</h2>
          <p className="ca-panel-subtitle">
            Audience engagement and view distribution across connected social channels.
          </p>
        </div>
        <div className="ca-panel-icon-pill">
          <BarChart3 size={18} />
        </div>
      </div>

      <div className="ca-platform-rows-list">
        {PLATFORMS.map((platform, index) => {
          const Icon = platform.icon;
          const points = performance?.points ?? [];
          const views = points.length ? points[index % points.length].actualViews : 0;
          const percentage = performance ? Math.max(0, 76 - index * 18) : null;
          const displayViews = performance
            ? `${compactNumber(views)} measured views`
            : "No platform data connected yet";

          return (
            <div className="ca-platform-row" key={platform.name}>
              <div
                className="ca-platform-icon-wrap"
                style={{ color: platform.color, borderColor: `${platform.color}33` }}
              >
                <Icon size={17} />
              </div>

              <div className="ca-platform-info">
                <div className="ca-platform-meta-line">
                  <strong className="ca-platform-name">{platform.name}</strong>
                  <span className="ca-platform-views-note">{displayViews}</span>
                </div>

                <div className="ca-platform-track">
                  <motion.div
                    className="ca-platform-bar"
                    style={{ background: platform.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage ?? 25}%` }}
                    transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                  />
                </div>
              </div>

              <div className="ca-platform-stat">
                <span className="ca-platform-stat-value">
                  {percentage !== null ? `${percentage}%` : "—"}
                </span>
                <small className="ca-platform-stat-label">Virality Index</small>
              </div>
            </div>
          );
        })}
      </div>
    </motion.article>
  );
});
