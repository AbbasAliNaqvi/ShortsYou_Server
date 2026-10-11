"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Clapperboard, WandSparkles } from "lucide-react";
import type { Video } from "@/lib/api";
import { formatDuration } from "@/lib/formatters";
import { EmptyState } from "@/components/Layout";

export interface EditorVideoPickerGridProps {
  videos: Video[];
  onSelectVideo: (video: Video) => void;
}

export function EditorVideoPickerGrid({ videos, onSelectVideo }: EditorVideoPickerGridProps) {
  if (videos.length === 0) {
    return (
      <EmptyState
        text="Add a video before editing. Sync your channel or select a creator video from Discover."
        icon={Clapperboard}
        action={
          <Link href="/videos" className="ca-empty-action-link">
            <span>Go to Videos</span>
            <ArrowRight size={14} />
          </Link>
        }
      />
    );
  }

  return (
    <div className="ca-editor-picker-grid">
      {videos.map((video) => {
        const isOwn = !video.sourceChannelId || video.sourceType === "own";

        return (
          <motion.article
            key={video.id}
            className="ca-editor-video-card ca-glass"
            onClick={() => onSelectVideo(video)}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {/* Thumbnail */}
            <div className="ca-editor-thumb-wrap">
              {video.thumbnailUrl ? (
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="ca-editor-thumb-img"
                  loading="lazy"
                />
              ) : (
                <div className="ca-editor-thumb-placeholder">
                  <Clapperboard size={32} />
                </div>
              )}

              {/* Hover overlay hint */}
              <div className="ca-editor-thumb-overlay">
                <span className="ca-editor-overlay-badge">
                  <WandSparkles size={14} />
                  <span>Edit in Timeline</span>
                </span>
              </div>

              {/* Duration badge */}
              {video.durationSeconds > 0 && (
                <span className="ca-video-duration-pill">
                  {formatDuration(video.durationSeconds)}
                </span>
              )}

              {/* Source badge */}
              <span className={`ca-editor-source-pill ${isOwn ? "source-own" : "source-creator"}`}>
                {isOwn ? "Your Channel" : "Selected Creator"}
              </span>
            </div>

            {/* Video Details */}
            <div className="ca-editor-card-body">
              <h3 className="ca-editor-card-title" title={video.title}>
                {video.title}
              </h3>
            </div>

            {/* Action button */}
            <div className="ca-editor-card-action">
              <span>Open Editor</span>
              <ArrowRight size={14} />
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
