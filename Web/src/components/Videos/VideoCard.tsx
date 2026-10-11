"use client";
/* eslint-disable @next/next/no-img-element */

import { motion } from "framer-motion";
import { Clapperboard, Sparkles, Trash2, Zap } from "lucide-react";
import type { Video } from "@/lib/api";
import { formatDuration } from "@/lib/formatters";

export interface VideoCardProps {
  video: Video;
  onSelect: (video: Video) => void;
  onDelete: (video: Video) => void;
  disabled?: boolean;
}

export function VideoCard({ video, onSelect, onDelete, disabled = false }: VideoCardProps) {
  const isCompleted = video.processingStatus === "completed" || video.processingStatus === "ready";
  const isProcessing = video.processingStatus === "processing" || video.processingStatus === "pending";

  return (
    <motion.article
      className="ca-video-card ca-glass"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* 16:9 Thumbnail Container */}
      <div className="ca-video-thumb-wrap">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="ca-video-thumb-img"
            loading="lazy"
          />
        ) : (
          <div className="ca-video-thumb-placeholder">
            <Clapperboard size={32} />
          </div>
        )}

        {/* Duration Badge */}
        {video.durationSeconds > 0 && (
          <span className="ca-video-duration-pill">
            {formatDuration(video.durationSeconds)}
          </span>
        )}

        {/* Processing Status Badge */}
        {video.processingStatus && (
          <span
            className={`ca-video-status-pill ${
              isCompleted
                ? "status-ready"
                : isProcessing
                ? "status-processing"
                : "status-default"
            }`}
          >
            <span className="ca-status-dot" />
            {video.processingStatus}
          </span>
        )}

        {/* Clips Detected Badge */}
        {typeof video.clipsDetected === "number" && video.clipsDetected > 0 && (
          <span className="ca-video-clips-pill" title={`${video.clipsDetected} AI clips detected`}>
            <Sparkles size={11} />
            {video.clipsDetected} clips
          </span>
        )}
      </div>

      {/* Video Content & Title */}
      <div className="ca-video-card-body">
        <h3 className="ca-video-card-title" title={video.title}>
          {video.title}
        </h3>
        {video.publishedAt && (
          <span className="ca-video-card-date">
            {new Date(video.publishedAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </div>

      {/* Card Actions */}
      <div className="ca-video-card-actions">
        <motion.button
          type="button"
          className="ca-video-create-btn"
          onClick={() => onSelect(video)}
          disabled={disabled}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
        >
          <Zap size={14} />
          <span>AI Create Short</span>
        </motion.button>

        <motion.button
          type="button"
          className="ca-video-remove-btn"
          onClick={() => onDelete(video)}
          disabled={disabled}
          aria-label={`Remove ${video.title}`}
          title="Remove video"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
        >
          <Trash2 size={15} />
        </motion.button>
      </div>
    </motion.article>
  );
}
