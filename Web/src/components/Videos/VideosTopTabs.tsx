"use client";

import { motion } from "framer-motion";
import { Clapperboard, Layers, Target } from "lucide-react";

export type VideosTopTab = "your_videos" | "targeted_videos" | "all";

export interface VideosTopTabsProps {
  activeTab: VideosTopTab;
  onChange: (tab: VideosTopTab) => void;
  yourCount: number;
  targetedCount: number;
  allCount: number;
}

export function VideosTopTabs({
  activeTab,
  onChange,
  yourCount,
  targetedCount,
  allCount,
}: VideosTopTabsProps) {
  const tabs = [
    {
      id: "your_videos" as const,
      label: "Your Videos",
      subtitle: "Connected YouTube Channel",
      icon: Clapperboard,
      count: yourCount,
      color: "#ef4444",
    },
    {
      id: "targeted_videos" as const,
      label: "Targeted Videos",
      subtitle: "Imported URLs & Targeted Videos",
      icon: Target,
      count: targetedCount,
      color: "#6366f1",
    },
    {
      id: "all" as const,
      label: "All Videos",
      subtitle: "Complete Studio Library",
      icon: Layers,
      count: allCount,
      color: "#10b981",
    },
  ];

  return (
    <div className="ca-videos-top-tabs-wrap ca-glass">
      <div className="ca-videos-top-tabs" role="tablist">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`ca-video-top-tab-btn ${isActive ? "is-active" : ""}`}
              onClick={() => onChange(tab.id)}
            >
              {isActive && (
                <motion.div
                  className="ca-top-tab-active-pill"
                  layoutId="activeTopTabIndicator"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}

              <div className="ca-top-tab-content">
                <div
                  className="ca-top-tab-icon"
                  style={{
                    color: isActive ? "#ffffff" : tab.color,
                    backgroundColor: isActive ? tab.color : `${tab.color}16`,
                  }}
                >
                  <Icon size={16} />
                </div>

                <div className="ca-top-tab-text">
                  <div className="ca-top-tab-title-row">
                    <span className="ca-top-tab-title">{tab.label}</span>
                    <span
                      className={`ca-top-tab-count-badge ${
                        isActive ? "badge-active" : ""
                      }`}
                    >
                      {tab.count}
                    </span>
                  </div>
                  <span className="ca-top-tab-subtitle">{tab.subtitle}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
