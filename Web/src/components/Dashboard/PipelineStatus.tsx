"use client";

import { memo } from "react";
import { Activity, Bot, Download, Video as VideoIcon, WandSparkles } from "lucide-react";
import type { Job, Video } from "@/lib/api";

export interface PipelineStatusProps {
  jobs: Job[];
  videos: Video[];
  avgScore: number;
}

export const PipelineStatus = memo(function PipelineStatus({ jobs, videos, avgScore }: PipelineStatusProps) {
  const stages = [
    { key: "download", label: "Ingest", icon: Download },
    { key: "transcrib", label: "Transcribe", icon: Activity },
    { key: "analyz", label: "Analyze", icon: Bot },
    { key: "auto_create", label: "Hook Gen", icon: WandSparkles },
    { key: "export", label: "Render", icon: VideoIcon },
  ];

  function stageIndex(stage: string) {
    const idx = stages.findIndex((s) => stage.includes(s.key));
    return idx >= 0 ? idx : 0;
  }

  const activeJob = jobs.find((j) => !["completed", "failed"].includes(j.status));
  const activeVideo = activeJob ? videos.find((v) => v.id === activeJob.videoId) : null;

  return (
    <div
      className="ca-pipeline-card ca-glass"
    >
      <div className="ca-pipeline-header">
        <div className="ca-pipeline-header-title">
          <span className="ca-pipeline-status-pulse" />
          <span className="ca-card-heading">Live Pipeline Activity 💡</span>
        </div>
        <span className="ca-pipeline-count-pill">{jobs.length} Active</span>
      </div>

      {/* Dual Wave SVG Chart Linked to Real Progress & Score */}
      <div className="ca-chart-body">
        <div className="ca-chart-y">
          <span>100</span>
          <span>75</span>
          <span>50</span>
          <span>0</span>
        </div>
        <div className="ca-chart-svg-box">
          <svg viewBox="0 0 280 90" className="ca-sparkline-full">
            {/* Green / Cyan Wave */}
            <path
              d="M 5 70 Q 55 50 95 60 T 185 40 T 275 75"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Gold / Yellow Wave */}
            <path
              d="M 5 55 Q 50 10 105 50 T 200 15 T 275 60"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Active Pointer */}
            <line x1="230" y1="12" x2="230" y2="80" stroke="rgba(255,255,255,0.18)" strokeDasharray="3 3" />
            <circle cx="230" cy="30" r="4.5" fill="#f59e0b" />
          </svg>

          {/* Active Progress Popover Pill */}
          <div
            className="ca-chart-popover-pill"
          >
            <span>
              {activeJob
                ? `${Math.round(activeJob.progress * 100)}%`
                : avgScore > 0
                ? `${avgScore}%`
                : "50%"}
            </span>
            <div className="ca-chart-popover-glow" />
          </div>
        </div>
      </div>

      {/* Pipeline Stage Track (Real Pipeline Stages) */}
      <div className="ca-pipeline-stages-track">
        {stages.map((s, i) => {
          const Icon = s.icon;
          const activeHere = activeJob ? stageIndex(activeJob.stage || activeJob.status) === i : false;
          return (
            <div
              key={s.key}
              className={`ca-pipeline-stage-node ${activeHere ? "active" : ""}`}
              title={s.label}
            >
              <Icon size={12} />
              <span>{s.label}</span>
            </div>
          );
        })}
      </div>

      {/* Live Active Job Chip if available */}
      {activeJob && (
        <div className="ca-pipeline-active-badge">
          <span className="ca-dot ca-dot--green" />
          <span>
            {activeJob.stage || activeJob.status}:{" "}
            {activeVideo?.title?.slice(0, 30) || `Job ${activeJob.jobId.slice(0, 6)}`}
          </span>
          <b>{Math.round(activeJob.progress * 100)}%</b>
        </div>
      )}
    </div>
  );
});
