"use client";

import { motion } from "framer-motion";
import { BarChart3, Film, Radio, Zap } from "lucide-react";
import type { Clip, Video } from "@/lib/api";

export interface ClipsMetricsOverviewProps {
  clips: Clip[];
  videos: Video[];
}

export function ClipsMetricsOverview({ clips, videos }: ClipsMetricsOverviewProps) {
  const peakScore = clips.length
    ? Math.round(Math.max(0, ...clips.map((c) => c.viralScore)))
    : 0;
  const readyCount = clips.filter((c) => ["exported", "published"].includes(c.status)).length;
  const publishedCount = clips.filter((c) => c.status === "published").length;

  const metrics = [
    {
      icon: Film,
      label: "AI-Created Shorts",
      value: `${clips.length}`,
      note: `${videos.length} source videos processed`,
      color: "#f59e0b",
    },
    {
      icon: Zap,
      label: "Peak Hook Saliency",
      value: `${peakScore}%`,
      note: "Highest ranked viral moment",
      color: "#ef4444",
    },
    {
      icon: Radio,
      label: "Ready Exports",
      value: `${readyCount}`,
      note: "Ready for social distribution",
      color: "#10b981",
    },
    {
      icon: BarChart3,
      label: "Published",
      value: `${publishedCount}`,
      note: "Analytics tracking live",
      color: "#6366f1",
    },
  ];

  return (
    <motion.section
      className="ca-clips-metrics-grid"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <motion.article
            key={metric.label}
            className="ca-clips-metric-card ca-glass"
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
          >
            <div className="ca-clips-metric-top">
              <div
                className="ca-clips-metric-icon"
                style={{ color: metric.color, backgroundColor: `${metric.color}15` }}
              >
                <Icon size={17} />
              </div>
              <span className="ca-clips-metric-note">{metric.note}</span>
            </div>

            <strong className="ca-clips-metric-value">{metric.value}</strong>
            <span className="ca-clips-metric-label">{metric.label}</span>
          </motion.article>
        );
      })}
    </motion.section>
  );
}
