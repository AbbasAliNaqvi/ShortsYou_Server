"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, Calendar, Flame, Lightbulb, Sparkles, Target, Users } from "lucide-react";
import type { AudiencePersonasResponse, Clip, ContentGap, ModelAccuracy, TrendForecast } from "@/lib/api";

export interface AnalyticsInsightsGridProps {
  clips: Clip[];
  contentGaps?: ContentGap[];
  forecasts?: TrendForecast[];
  personas?: AudiencePersonasResponse | null;
  accuracy?: ModelAccuracy | null;
}

export const AnalyticsInsightsGrid = memo(function AnalyticsInsightsGrid({
  clips,
  contentGaps = [],
  forecasts = [],
  personas = null,
  accuracy = null,
}: AnalyticsInsightsGridProps) {
  const insights = useMemo(() => {
    const list = [];

    // 1. Content Gaps / Viral Opportunity
    if (contentGaps.length > 0) {
      const topGap = contentGaps[0];
      list.push({
        icon: Flame,
        title: "Untapped Content Opportunity",
        value: `${Math.round(topGap.opportunityScore * 100)}% Opportunity Index`,
        text: `High audience demand detected for "${topGap.topic}" with ${Math.round(topGap.trendScore * 100)}% market trend velocity.`,
        accent: "#059669",
      });
    } else if (clips.length > 0) {
      const avgDuration = (clips.reduce((acc, c) => acc + c.durationSeconds, 0) / clips.length).toFixed(1);
      list.push({
        icon: Target,
        title: "Library Average Duration",
        value: `${avgDuration}s Average Pacing`,
        text: `Calculated across ${clips.length} analyzed clips in your workspace library.`,
        accent: "#d97706",
      });
    } else {
      list.push({
        icon: Target,
        title: "Content Gap Telemetry",
        value: "Awaiting Clip Ingestion",
        text: "Process your first video to enable algorithmic blue-ocean content gap detection.",
        accent: "#d97706",
      });
    }

    // 2. Trend Forecast / Prophet Time-Series
    if (forecasts.length > 0) {
      const topForecast = forecasts[0];
      const peakDate = topForecast.peakPredictionDate
        ? new Date(topForecast.peakPredictionDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })
        : "Upcoming Cycle";
      list.push({
        icon: Calendar,
        title: `Algorithmic Trend Peak: ${topForecast.topic}`,
        value: `Surge Window: ${peakDate}`,
        text: `Prophet time-series models project peak distribution score (${Math.round((topForecast.peakPredictedScore || 0.9) * 100)} pts) for this category.`,
        accent: "#0284c7",
      });
    } else {
      list.push({
        icon: Calendar,
        title: "Publishing Window Telemetry",
        value: "Connect YouTube Channel",
        text: "Audience activity heatmaps calibrate automatically from your YouTube Analytics token.",
        accent: "#4f46e5",
      });
    }

    // 3. Audience Personas or Model Accuracy
    if (personas && personas.personas && personas.personas.length > 0) {
      const topPersona = personas.personas[0];
      list.push({
        icon: Users,
        title: `Core Audience Cohort: ${topPersona.name}`,
        value: `${Math.round(topPersona.percentOfAudience * 100)}% Audience Density`,
        text: `Top engaged category: ${topPersona.topEngagedCategories?.[0] || "Viral Hooks"} with ${Math.round(topPersona.engagementRate * 100)}% active retention.`,
        accent: "#db2777",
      });
    } else if (accuracy && accuracy.modelReady) {
      list.push({
        icon: BrainCircuit,
        title: "Creator AI Calibration",
        value: `${accuracy.labeledSamples} Clips Trained`,
        text: "Neural scoring weights have adapted to your unique speech velocity, hook structure, and audience drop-off rates.",
        accent: "#7c3aed",
      });
    } else {
      list.push({
        icon: Sparkles,
        title: "AI CPEP Model Training",
        value: `${accuracy?.labeledSamples ?? 0} / 10 Labeled Samples`,
        text: "Model calibration triggers automatically once 10 clips have measured 48h YouTube retention metrics.",
        accent: "#059669",
      });
    }

    return list;
  }, [clips, contentGaps, forecasts, personas, accuracy]);

  return (
    <motion.section
      className="ca-analytics-insights-section"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="ca-section-intro-line">
        <div className="ca-section-badge">
          <Lightbulb size={12} />
          <span>Algorithmic Optimization Recommendations</span>
        </div>
      </div>

      <div className="ca-insights-grid">
        {insights.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.article
              className="ca-insight-card ca-glass"
              key={item.title}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div className="ca-insight-top">
                <div
                  className="ca-insight-icon-wrap"
                  style={{ color: item.accent, backgroundColor: `${item.accent}14` }}
                >
                  <Icon size={18} />
                </div>
                <span className="ca-insight-step-chip">0{index + 1}</span>
              </div>

              <div className="ca-insight-body">
                <strong className="ca-insight-value">{item.value}</strong>
                <h3 className="ca-insight-title">{item.title}</h3>
                <p className="ca-insight-text">{item.text}</p>
              </div>
            </motion.article>
          );
        })}
      </div>
    </motion.section>
  );
});
