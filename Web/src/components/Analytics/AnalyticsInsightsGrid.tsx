"use client";

import { motion } from "framer-motion";
import { Calendar, Lightbulb, Sparkles, Target } from "lucide-react";
import type { Clip } from "@/lib/api";

export interface AnalyticsInsightsGridProps {
  clips: Clip[];
}

export function AnalyticsInsightsGrid({ clips }: AnalyticsInsightsGridProps) {
  const insights = [
    {
      icon: Target,
      title: "Optimal Hook Cut Duration",
      value: clips.length ? "Use Measured Clips" : "Awaiting Sample",
      text: "Your retention baseline becomes highly reliable once processed clips report actual audience hold.",
      accent: "#f59e0b",
    },
    {
      icon: Calendar,
      title: "Peak Publishing Hours",
      value: "Connect Platform Data",
      text: "The platform distribution matrix will surface audience density heatmaps once platform sync is enabled.",
      accent: "#6366f1",
    },
    {
      icon: Sparkles,
      title: "Kinetic Subtitle Impact",
      value: "Test & Compare Treatments",
      text: "Use clip exports and performance tags to identify which dynamic caption treatments lift completion rate.",
      accent: "#10b981",
    },
  ];

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
}
