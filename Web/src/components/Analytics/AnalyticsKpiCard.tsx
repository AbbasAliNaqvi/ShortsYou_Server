"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

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
  return (
    <motion.article
      className="ca-analytics-kpi-card ca-glass"
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <div className="ca-kpi-head">
        <div className="ca-kpi-icon-wrap">
          <Icon size={18} />
        </div>
        <span className="ca-kpi-label">{label}</span>
      </div>

      <div className="ca-kpi-body">
        <strong className="ca-kpi-val">{value}</strong>
      </div>

      <div className="ca-kpi-foot">
        <span className="ca-kpi-note">{note}</span>
        <span className={`ca-kpi-trend-badge ${trendType}`}>{trend}</span>
      </div>
    </motion.article>
  );
});
