"use client";
/* eslint-disable @next/next/no-img-element */

import { memo, useMemo, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Clapperboard, Send, Sparkles } from "lucide-react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import type { Clip, Video } from "@/lib/api";
import { SectionTitle } from "@/components/Layout/SectionTitle";
import { EmptyState } from "@/components/Layout/EmptyState";

export interface ProductionShelfProps {
  videos: Video[];
  clips: Clip[];
}

export interface ProductionCardProps {
  video: Video;
  clipsCount: number;
}

const ProductionCard = memo(function ProductionCard({ video, clipsCount }: ProductionCardProps) {
  const status = video.processingStatus || "ready";

  return (
    <motion.article
      className="production-card ca-glass"
      whileHover={{ y: -3, scale: 1.008 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
    >
      <div className="production-thumb">
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt={video.title} loading="lazy" />
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
            {clipsCount} AI-created clip{clipsCount !== 1 ? "s" : ""}
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
});

export const ProductionShelf = memo(function ProductionShelf({ videos, clips }: ProductionShelfProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Pre-index clips count by videoId for O(1) lookups instead of O(N*M) filtering per render
  const clipCountsByVideo = useMemo(() => {
    const map = new Map<string, number>();
    for (const clip of clips) {
      map.set(clip.videoId, (map.get(clip.videoId) ?? 0) + 1);
    }
    return map;
  }, [clips]);

  // Virtualize when list contains more than 4 items to keep the DOM light
  const isVirtualized = videos.length > 4;

  const virtualizer = useWindowVirtualizer({
    count: isVirtualized ? videos.length : 0,
    estimateSize: () => 148,
    overscan: 3,
    scrollMargin: parentRef.current?.offsetTop ?? 0,
  });

  return (
    <section className="ca-shelf-panel ca-glass" id="videos">
      <SectionTitle
        title="Source Library"
        meta="Videos processed by the AI engine"
      />
      <div className="production-list" ref={parentRef}>
        {videos.length > 0 ? (
          isVirtualized ? (
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const video = videos[virtualRow.index];
                const clipsCount = clipCountsByVideo.get(video.id) ?? 0;
                return (
                  <div
                    key={video.id}
                    ref={virtualizer.measureElement}
                    data-index={virtualRow.index}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${
                        virtualRow.start - (virtualizer.options.scrollMargin ?? 0)
                      }px)`,
                    }}
                  >
                    <ProductionCard video={video} clipsCount={clipsCount} />
                  </div>
                );
              })}
            </div>
          ) : (
            videos.map((video) => (
              <ProductionCard
                key={video.id}
                video={video}
                clipsCount={clipCountsByVideo.get(video.id) ?? 0}
              />
            ))
          )
        ) : (
          <EmptyState text="No videos yet. Paste a YouTube URL above — AI will create your shorts automatically." />
        )}
      </div>
    </section>
  );
});
