"use client";

import { memo } from "react";
import type { LucideIcon } from "lucide-react";

export interface AnalyticsKpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  note: string;
  trend: string;
  trendType?: "live" | "positive" | "warning" | "neutral" | "purple";
  iconVariant?: "indigo" | "cyan" | "amber" | "emerald" | "purple";
}

export const AnalyticsKpiCard = memo(function AnalyticsKpiCard({
  icon: Icon,
  label,
  value,
  note,
  trend,
  trendType = "neutral",
  iconVariant = "indigo",
}: AnalyticsKpiCardProps) {
  const getBadgeStyle = () => {
    switch (trendType) {
      case "live":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "positive":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "warning":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "purple":
        return "bg-purple-50 text-purple-800 border-purple-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getIconStyle = () => {
    switch (iconVariant) {
      case "cyan":
        return "bg-cyan-50 border-cyan-100 text-cyan-700";
      case "amber":
        return "bg-amber-50 border-amber-100 text-amber-700";
      case "emerald":
        return "bg-emerald-50 border-emerald-100 text-emerald-700";
      case "purple":
        return "bg-purple-50 border-purple-100 text-purple-700";
      default:
        return "bg-indigo-50 border-indigo-100 text-indigo-700";
    }
  };

  return (
    <div className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-sm">
      {/* Top Header: Icon & Badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${getIconStyle()} transition-transform duration-200 group-hover:scale-105`}
        >
          <Icon size={18} aria-hidden="true" />
        </div>

        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getBadgeStyle()}`}
        >
          {trendType === "live" && (
            <span
              className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"
              aria-hidden="true"
            />
          )}
          {trend}
        </span>
      </div>

      {/* Metric Body */}
      <div className="my-1">
        <span className="block text-xs font-semibold text-slate-500 tracking-wide uppercase">
          {label}
        </span>
        <strong className="mt-1 block text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          {value}
        </strong>
      </div>

      {/* Subtext Context Note */}
      <div className="mt-3 border-t border-slate-100 pt-2.5 text-xs font-medium text-slate-500">
        {note}
      </div>
    </div>
  );
});
