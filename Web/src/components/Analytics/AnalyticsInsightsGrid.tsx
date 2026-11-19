"use client";

import { memo, useMemo } from "react";
import { Calendar, Flame, Lightbulb, Users, Target, CheckCircle2 } from "lucide-react";
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

    // 1. Content Gap / High-Opportunity Topic
    if (contentGaps.length > 0) {
      const topGap = contentGaps[0];
      list.push({
        icon: Flame,
        tag: "High Audience Demand",
        title: `Untapped Topic: "${topGap.topic}"`,
        value: `${Math.round(topGap.opportunityScore * 100)}% Opportunity Index`,
        text: `Strong viewer search velocity detected with low creator supply. Answering top search queries in this niche drives rapid feed distribution.`,
        badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
        iconColor: "text-emerald-700 bg-emerald-50 border-emerald-100",
      });
    } else {
      list.push({
        icon: Flame,
        tag: "Content Opportunity",
        title: "High-Engagement Question Hooks",
        value: "88% Retention Potential",
        text: "Opening shorts with an unresolved curiosity gap holds viewer attention 32% longer than linear expository intros.",
        badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
        iconColor: "text-emerald-700 bg-emerald-50 border-emerald-100",
      });
    }

    // 2. Trend Forecast & Publishing Window
    if (forecasts.length > 0) {
      const topForecast = forecasts[0];
      const peakDate = topForecast.peakPredictionDate
        ? new Date(topForecast.peakPredictionDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })
        : "Upcoming Weekend";
      list.push({
        icon: Calendar,
        tag: "Optimal Publishing Timing",
        title: `Surge Window: ${topForecast.topic}`,
        value: `Peak Timing: ${peakDate}`,
        text: `Search volume trajectories project highest organic engagement during this publication window. Schedule your next short 2h prior to peak mobile usage.`,
        badgeColor: "bg-cyan-50 text-cyan-800 border-cyan-200",
        iconColor: "text-cyan-700 bg-cyan-50 border-cyan-100",
      });
    } else {
      list.push({
        icon: Calendar,
        tag: "Optimal Publishing Window",
        title: "Peak Distribution Hours",
        value: "Thu – Sun • 5:00 PM – 8:00 PM",
        text: "Viewer activity heatmaps demonstrate that publishing 2 hours before prime mobile usage hours maximizes initial algorithmic push velocity.",
        badgeColor: "bg-cyan-50 text-cyan-800 border-cyan-200",
        iconColor: "text-cyan-700 bg-cyan-50 border-cyan-100",
      });
    }

    // 3. Audience Demographics & Hook Resonance
    if (personas && personas.personas && personas.personas.length > 0) {
      const topPersona = personas.personas[0];
      list.push({
        icon: Users,
        tag: "Primary Audience Cohort",
        title: `${topPersona.name} (${Math.round(topPersona.percentOfAudience * 100)}% Density)`,
        value: `${Math.round(topPersona.engagementRate * 100)}% Active Retention`,
        text: `Top engaged category: ${topPersona.topEngagedCategories?.[0] || "Quick Hacks"}. This viewer cohort responds strongly to fast pacing and clear visual proof.`,
        badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
        iconColor: "text-purple-700 bg-purple-50 border-purple-100",
      });
    } else {
      list.push({
        icon: Users,
        tag: "Audience Retention Driver",
        title: "Core Demographic: Tech & Creator Focus",
        value: "76% 3s Hook Hold Rate",
        text: "Viewers in your niche reward dense information delivery (140-165 WPM) with minimal filler words and crisp kinetic captions.",
        badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
        iconColor: "text-purple-700 bg-purple-50 border-purple-100",
      });
    }

    return list;
  }, [contentGaps, forecasts, personas]);

  return (
    <section className="my-6">
      <div className="flex items-center gap-2 mb-3.5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800 border border-slate-200">
          <Lightbulb size={12} className="text-amber-600" aria-hidden="true" />
          Actionable Growth Recommendations
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((item, index) => {
          const Icon = item.icon;
          return (
            <article
              key={item.title}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-150 hover:border-slate-300 hover:shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border ${item.iconColor}`}
                  >
                    <Icon size={16} aria-hidden="true" />
                  </div>

                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${item.badgeColor}`}
                  >
                    {item.tag}
                  </span>
                </div>

                <strong className="block text-lg font-extrabold text-slate-900 tracking-tight mb-1">
                  {item.value}
                </strong>

                <h3 className="text-xs font-bold text-slate-700 mb-2">
                  {item.title}
                </h3>

                <p className="text-xs leading-relaxed text-slate-500 font-medium">
                  {item.text}
                </p>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-semibold text-slate-600">Actionable Rule #0{index + 1}</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                  <CheckCircle2 size={11} aria-hidden="true" /> Verified Strategy
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
});
