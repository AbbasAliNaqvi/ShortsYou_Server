"use client";

import { memo } from "react";
import { Eye, Gauge, TrendingUp, Zap } from "lucide-react";
import type { PerformanceAnalytics, Clip } from "@/lib/api";
import { compactNumber } from "@/lib/formatters";
import { AnalyticsKpiCard } from "./AnalyticsKpiCard";

export interface AnalyticsKpiGridProps {
  clips: Clip[];
  performance: PerformanceAnalytics | null;
  totalViews: number;
  averageScore: number;
}

function getScore(c: Clip): number {
  if (typeof c.viralScore === "number" && c.viralScore > 0) {
    return c.viralScore > 1 ? Math.round(c.viralScore) : Math.round(c.viralScore * 100);
  }
  if (typeof c.hookScore === "number" && c.hookScore > 0) {
    return c.hookScore > 1 ? Math.round(c.hookScore) : Math.round(c.hookScore * 100);
  }
  return 0;
}

export const AnalyticsKpiGrid = memo(function AnalyticsKpiGrid({
  clips,
  performance,
  totalViews,
  averageScore,
}: AnalyticsKpiGridProps) {
  const eliteClips = clips.filter((c) => getScore(c) >= 75);
  const eliteCount = eliteClips.length;
  const elitePercent = clips.length ? Math.round((eliteCount / clips.length) * 100) : 0;

  const pearsonR = performance?.pearsonR;
  const hasCorrelation = typeof pearsonR === "number" && !isNaN(pearsonR);

  let correlationValue = "Calibrating";
  let correlationTrend = "Pending Data";
  let correlationTrendType: "positive" | "warning" | "neutral" = "neutral";

  if (hasCorrelation) {
    correlationValue = `r = ${pearsonR.toFixed(2)}`;
    if (pearsonR >= 0.7) {
      correlationTrend = "High Accuracy";
      correlationTrendType = "positive";
    } else if (pearsonR >= 0.4) {
      correlationTrend = "Moderate Fit";
      correlationTrendType = "positive";
    } else {
      correlationTrend = "Low Baseline";
      correlationTrendType = "warning";
    }
  }

  const hookHoldDiff = averageScore > 0 ? averageScore - 64 : 0;
  const hookHoldTrend =
    averageScore > 0
      ? `${hookHoldDiff >= 0 ? "+" : ""}${hookHoldDiff.toFixed(1)}% vs. avg`
      : "No clips yet";

  return (
    <section
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      aria-label="Key Performance Indicators"
    >
      <AnalyticsKpiCard
        icon={Eye}
        label="Tracked Views"
        value={totalViews > 0 ? compactNumber(totalViews) : "0"}
        note="Across connected social channels"
        trend={totalViews > 0 ? "Live Sync" : "Awaiting Views"}
        trendType={totalViews > 0 ? "live" : "neutral"}
        iconVariant="indigo"
      />

      <AnalyticsKpiCard
        icon={Gauge}
        label="Avg 3s Hook Retention"
        value={averageScore > 0 ? `${averageScore.toFixed(1)}%` : "—"}
        note="Hold rate past initial 3s hook"
        trend={hookHoldTrend}
        trendType={averageScore > 0 && hookHoldDiff >= 0 ? "positive" : "neutral"}
        iconVariant="cyan"
      />

      <AnalyticsKpiCard
        icon={Zap}
        label="High-Virality Clips"
        value={`${eliteCount} / ${clips.length}`}
        note="Clips scoring 75+ hook potential"
        trend={clips.length > 0 ? `${elitePercent}% High Tier` : "0% Tier"}
        trendType={eliteCount > 0 ? "positive" : "neutral"}
        iconVariant="amber"
      />

      <AnalyticsKpiCard
        icon={TrendingUp}
        label="Predictive Accuracy"
        value={correlationValue}
        note="Score correlation to 48h view yield"
        trend={correlationTrend}
        trendType={correlationTrendType}
        iconVariant="purple"
      />
    </section>
  );
});
