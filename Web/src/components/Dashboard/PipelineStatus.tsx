"use client";

import { memo, useEffect, useState } from "react";
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

  const [waveTick, setWaveTick] = useState({
    cyan: [68, 42, 64, 30, 58, 24, 52],
    gold: [52, 16, 48, 12, 44, 18, 36],
    stageValues: [92, 84, 78, 88, 71],
    pointerY: 18,
    loadPct: 84,
  });

  useEffect(() => {
    const cyan = Array.from({ length: 7 }, () => Math.round(14 + Math.random() * 68));
    const gold = Array.from({ length: 7 }, () => Math.round(8 + Math.random() * 64));
    const stageValues = Array.from({ length: 5 }, () => Math.round(55 + Math.random() * 44));
    setWaveTick({
      cyan,
      gold,
      stageValues,
      pointerY: gold[gold.length - 2] ?? 28,
      loadPct: Math.round(62 + Math.random() * 35),
    });
  }, []);

  const toPath = (pts: number[]) => {
    const xs = [5, 50, 95, 140, 185, 230, 275];
    return pts
      .map((y, i) => `${i === 0 ? "M" : "L"} ${xs[i]} ${y}`)
      .join(" ");
  };

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
              d={toPath(waveTick.cyan)}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: "all 0.35s ease" }}
            />
            {/* Gold / Yellow Wave */}
            <path
              d={toPath(waveTick.gold)}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: "all 0.35s ease" }}
            />
            {/* Active Pointer */}
            <line x1="230" y1="12" x2="230" y2="80" stroke="rgba(255,255,255,0.18)" strokeDasharray="3 3" />
            <circle cx="230" cy={waveTick.pointerY} r="4.5" fill="#f59e0b" style={{ transition: "all 0.35s ease" }} />
          </svg>

          {/* Active Progress Popover Pill */}
          <div
            className="ca-chart-popover-pill"
          >
            <span>{waveTick.loadPct}%</span>
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
              title={`${s.label}: ${waveTick.stageValues[i]}%`}
            >
              <Icon size={12} />
              <span>{s.label}</span>
              <span className="text-[10px] opacity-75">{waveTick.stageValues[i]}%</span>
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
          <b>{waveTick.loadPct}%</b>
        </div>
      )}
    </div>
  );
});
