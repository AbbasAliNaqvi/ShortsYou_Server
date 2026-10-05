"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Clapperboard, Send, Sparkles } from "lucide-react";
import type { Clip, Video } from "@/lib/api";
import { SectionTitle } from "@/components/Layout/SectionTitle";
import { EmptyState } from "@/components/Layout/EmptyState";

export interface ProductionShelfProps {
  videos: Video[];
  clips: Clip[];
}

export function ProductionShelf({ videos, clips }: ProductionShelfProps) {
  return (
    <section className="ca-shelf-panel ca-glass" id="videos">
      <SectionTitle
        title="Source Library"
        meta="Videos processed by the AI engine"
      />
      <div className="production-list">
        {videos.map((video) => {
          const videoClips = clips.filter((clip) => clip.videoId === video.id);
          const status = video.processingStatus || "ready";
          return (
            <motion.article
              className="production-card ca-glass"
              key={video.id}
              whileHover={{ y: -3, scale: 1.008 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
            >
              <div className="production-thumb">
                {video.thumbnailUrl ? (
                  <img src={video.thumbnailUrl} alt={video.title} />
                ) : (
                  <div className="ca-thumb-fallback">
                    <Clapperboard size={26} className="ca-thumb-fallback-icon" />
                  </div>
                )}
                <span className={`ca-thumb-badge ca-status-${status}`}>{status}</span>
              </div>
              <div className="production-copy">
                <div className="production-tags">
                  <span className="ca-tag-clips-count">
                    <Sparkles size={11} />
                    {videoClips.length} AI-created clip{videoClips.length !== 1 ? "s" : ""}
                  </span>
                  <span className={`ca-status-pill ca-status-${status}`}>
                    {status}
                  </span>
                </div>
                <h3>{video.title}</h3>
                <p>
                  {video.description ||
                    "AI-analyzed with viral moment detection, hook generation, and auto-rendering."}
                </p>
                <div className="production-actions">
                  <Link href="/clips" className="ca-prod-btn-primary">
                    <Clapperboard size={14} />
                    Review AI shorts
                  </Link>
                  <Link href="/clips" className="ca-prod-btn-secondary">
                    <Send size={14} />
                    Publish pack
                  </Link>
                  <Link href="/clips" className="ca-prod-btn-icon" aria-label="Open clip review">
                    <ChevronRight size={15} />
                  </Link>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
      {videos.length === 0 && (
        <EmptyState text="No videos yet. Paste a YouTube URL above — AI will create your shorts automatically." />
      )}
    </section>
  );
}
