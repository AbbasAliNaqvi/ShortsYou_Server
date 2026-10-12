"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Eye, Gauge, Zap } from "lucide-react";
import type { PerformanceAnalytics, Clip } from "@/lib/api";
import { compactNumber } from "@/lib/formatters";
import { AnalyticsKpiCard } from "./AnalyticsKpiCard";

export interface AnalyticsKpiGridProps {
  clips: Clip[];
  performance: PerformanceAnalytics | null;
  totalViews: number;
  averageScore: number;
}

export const AnalyticsKpiGrid = memo(function AnalyticsKpiGrid({
  clips,
  performance,
  totalViews,
  averageScore,
}: AnalyticsKpiGridProps) {
  const viralityIndex = clips.length
    ? `${Math.min(100, Math.round(averageScore))}`
    : "--";

  const correlationTrend = performance?.pearsonR !== undefined
    ? `r ${performance.pearsonR.toFixed(2)}`
    : "No baseline";

  return (
    <motion.section
      className="ca-analytics-kpi-grid"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <AnalyticsKpiCard
        icon={Eye}
        label="Algorithmic Impressions"
        value={compactNumber(totalViews)}
        note="Actual views in connected data"
        trend="Live"
        trendType="live"
      />

      <AnalyticsKpiCard
        icon={Gauge}
        label="Average Hook Retention"
        value={`${averageScore.toFixed(1)}%`}
        note={`${clips.length} analyzed clips`}
        trend={averageScore ? "Measured" : "Waiting"}
        trendType={averageScore ? "positive" : "neutral"}
      />

      <AnalyticsKpiCard
        icon={Zap}
        label="Virality Velocity Index"
        value={viralityIndex}
        note="Composite hook score"
        trend={correlationTrend}
        trendType="neutral"
      />
    </motion.section>
  );
});
