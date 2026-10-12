"use client";
/* eslint-disable @next/next/no-img-element */

import { memo } from "react";
import { motion } from "framer-motion";
import { Activity, Bot, Download, Terminal, Video as VideoIcon, WandSparkles, Zap } from "lucide-react";
import type { Job, Video } from "@/lib/api";
import { SectionTitle } from "@/components/Layout/SectionTitle";
import { EmptyState } from "@/components/Layout/EmptyState";

export interface JobsShelfProps {
  jobs: Job[];
  videos: Video[];
  onInspectLogs?: (job: Job) => void;
}

export const JobsShelf = memo(function JobsShelf({ jobs, videos, onInspectLogs }: JobsShelfProps) {
  const active = jobs.filter((job) => !["completed", "failed"].includes(job.status));

  function StageIcon({ stage }: { stage: string }) {
    if (stage.includes("download") || stage.includes("preparing")) return <Download size={12} />;
    if (stage.includes("transcrib")) return <Activity size={12} />;
    if (stage.includes("analyz")) return <Bot size={12} />;
    if (stage.includes("auto_create") || stage.includes("auto_export")) return <WandSparkles size={12} />;
    if (stage.includes("export") || stage.includes("render")) return <VideoIcon size={12} />;
    return <Zap size={12} />;
  }

  return (
    <section className="ca-shelf-panel ca-glass">
      <SectionTitle
        title="AI Creation Pipeline"
        meta={`${active.length} active AI job${active.length !== 1 ? "s" : ""}`}
      />
      <div className="job-grid">
        {active.slice(0, 4).map((job) => {
          const video = videos.find((item) => item.id === job.videoId);
          return (
            <motion.article
              className="job-card ca-glass"
              key={job.jobId}
              whileHover={{ y: -3, scale: 1.01 }}
            >
              <div className="job-top">
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <StageIcon stage={job.stage || job.status} /> {job.stage || job.status}
                </span>
                <b>{Math.round(job.progress * 100)}%</b>
              </div>
              <div className="job-body">
                <div className="job-thumb">
                  {video?.thumbnailUrl ? (
                    <img src={video.thumbnailUrl} alt="" loading="lazy" />
                  ) : (
                    <Activity size={21} />
                  )}
                </div>
                <div>
                  <h3>{video?.title ?? "AI is processing your video"}</h3>
                  <p>Job {job.jobId.slice(0, 8)} · {job.clipsFound} clips found</p>
                </div>
              </div>
              <div className="job-progress">
                <i style={{ width: `${Math.max(4, job.progress * 100)}%` }} />
              </div>
              <div className="job-footer">
                <span>{job.status}</span>
                <button type="button" onClick={() => onInspectLogs?.(job)}>
                  <Terminal size={13} /> Inspect logs
                </button>
              </div>
            </motion.article>
          );
        })}
      </div>
      {active.length === 0 && (
        <EmptyState text="No active AI jobs. Paste a YouTube URL above and let AI create your shorts." />
      )}
    </section>
  );
});
