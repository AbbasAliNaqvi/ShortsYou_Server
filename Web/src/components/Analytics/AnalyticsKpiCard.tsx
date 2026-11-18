"use client";

import { memo } from "react";
import type { LucideIcon } from "lucide-react";
import { CardSpotlight } from "@/components/ui/card-spotlight";

export interface AnalyticsKpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  note: string;
  trend: string;
  trendType?: "live" | "neutral" | "positive" | "warning";
}

export const AnalyticsKpiCard = memo(function AnalyticsKpiCard({
  icon: Icon,
  label,
  value,
  note,
  trend,
  trendType = "neutral",
}: AnalyticsKpiCardProps) {
  const getBadgeStyle = () => {
    switch (trendType) {
      case "live":
        return "bg-cyan-50 text-cyan-800 border border-cyan-200";
      case "positive":
        return "bg-emerald-50 text-emerald-800 border border-emerald-200";
      case "warning":
        return "bg-amber-50 text-amber-800 border border-amber-200";
      default:
        return "bg-slate-100 text-slate-600 border border-slate-200";
    }
  };

  return (
    <CardSpotlight
      radius={280}
      color="rgba(2, 132, 199, 0.06)"
      className="ca-analytics-kpi-card ca-glass flex flex-col justify-between !p-5"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-700 shadow-sm">
          <Icon size={19} />
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getBadgeStyle()}`}>
          {trendType === "live" && <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-cyan-600 animate-pulse" />}
          {trend}
        </span>
      </div>

      <div className="my-1">
        <span className="block text-xs font-semibold text-slate-500 mb-0.5">
          {label}
        </span>
        <strong className="text-2xl font-extrabold tracking-tight text-slate-900">
          {value}
        </strong>
      </div>

      <div className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-500 font-medium">
        {note}
      </div>
    </CardSpotlight>
  );
});
