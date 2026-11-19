"use client";

import { memo } from "react";
import { Download, Eye, Sparkles, TrendingUp } from "lucide-react";
import { compactNumber } from "@/lib/formatters";

export interface AnalyticsHeroBannerProps {
  range: string;
  onRangeChange: (range: string) => void;
  onExportReport: () => void;
  clipCount: number;
  totalViews: number;
  avgHookScore?: number;
}

const RANGES = [
  { key: "24h", label: "Last 24 Hours" },
  { key: "7d", label: "Last 7 Days" },
  { key: "30d", label: "Last 30 Days" },
  { key: "all", label: "All Time" },
];

export const AnalyticsHeroBanner = memo(function AnalyticsHeroBanner({
  range,
  onRangeChange,
  onExportReport,
  clipCount,
  totalViews,
  avgHookScore = 0,
}: AnalyticsHeroBannerProps) {
  return (
    <section
      className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-7"
      aria-labelledby="analytics-heading"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        {/* Left Info */}
        <div className="max-w-2xl space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
              Live Studio Telemetry
            </span>
            <span className="text-xs font-medium text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">Shorts &amp; Reels Analytics</span>
          </div>

          <h1
            id="analytics-heading"
            className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl"
          >
            Virality &amp; Audience Retention
          </h1>

          <p className="text-sm leading-relaxed text-slate-600">
            Second-by-second viewer hold rates, hook performance benchmarks, and audience retention metrics across your processed short-form videos.
          </p>
        </div>

        {/* Right Summary Chips */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-2 text-xs text-slate-700 shadow-2xs">
            <Sparkles size={14} className="text-amber-500 shrink-0" aria-hidden="true" />
            <span>
              <strong className="font-bold text-slate-900">{clipCount}</strong> Analyzed Clips
            </span>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/70 px-3.5 py-2 text-xs text-indigo-950 shadow-2xs">
            <Eye size={14} className="text-indigo-600 shrink-0" aria-hidden="true" />
            <span>
              <strong className="font-bold text-indigo-950">{compactNumber(totalViews)}</strong> Tracked Views
            </span>
          </div>

          {avgHookScore > 0 && (
            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3.5 py-2 text-xs text-emerald-950 shadow-2xs">
              <TrendingUp size={14} className="text-emerald-600 shrink-0" aria-hidden="true" />
              <span>
                <strong className="font-bold text-emerald-950">{avgHookScore.toFixed(0)}%</strong> Avg Hook Hold
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Controls Bar: Segmented Date Filter & Export Action */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        {/* Segmented Filter Pills */}
        <div
          role="tablist"
          aria-label="Analytics date range filter"
          className="inline-flex items-center rounded-xl border border-slate-200/90 bg-slate-50/90 p-1 text-xs font-semibold text-slate-600 shadow-inner"
        >
          {RANGES.map(({ key, label }) => {
            const isActive = range === key;
            return (
              <button
                key={key}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => onRangeChange(key)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                  isActive
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Export Report Action */}
        <button
          type="button"
          onClick={onExportReport}
          className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          aria-label="Export performance analytics report"
        >
          <Download size={14} className="text-slate-500" aria-hidden="true" />
          <span>Export Analytics Report</span>
        </button>
      </div>
    </section>
  );
});
