"use client";
/* eslint-disable @next/next/no-img-element */

import { memo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Clapperboard,
  Compass,
  Link2,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import type { Video } from "@/lib/api";
import { formatDuration } from "@/lib/formatters";

function YouTubeIcon({ size = 10, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export interface VideoCardProps {
  video: Video;
  onSelect: (video: Video) => void;
  onDelete: (video: Video) => void;
  disabled?: boolean;
}

export const VideoCard = memo(
  function VideoCard({ video, onSelect, onDelete, disabled = false }: VideoCardProps) {
    const rawStatus = (video.processingStatus || "pending").toLowerCase();
    const isCompleted = rawStatus === "completed" || rawStatus === "ready";
    const isDownloading = rawStatus === "downloading";
    const isTranscribing = rawStatus === "transcribing";
    const isAnalyzing = rawStatus === "analyzing";
    const isFailed = rawStatus === "failed";
    const isProcessing =
      rawStatus === "processing" ||
      rawStatus === "pending" ||
      isDownloading ||
      isTranscribing ||
      isAnalyzing;

    // Detect Source Type
    const isDirect = video.sourceType === "direct" || video.sourceChannelId === "direct";
    const isChannel = !video.sourceChannelId || video.sourceType === "own";
    const isDiscover = !isDirect && !isChannel;

    // Detect if newly added within the last 24 hours
    const isNew = video.createdAt
      ? Date.now() - new Date(video.createdAt).getTime() < 24 * 60 * 60 * 1000
      : false;

    return (
      <motion.article
        className="ca-video-card ca-glass"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        layout
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

          {/* Source Badge (Top Left) */}
          <div className="ca-video-badge-group-left">
            {isDirect ? (
              <span className="ca-source-pill pill-direct" title="Imported by URL">
                <Link2 size={10} />
                <span>Imported</span>
              </span>
            ) : isChannel ? (
              <span className="ca-source-pill pill-channel" title="Channel Video">
                <YouTubeIcon size={10} />
                <span>Channel</span>
              </span>
            ) : (
              <span className="ca-source-pill pill-discover" title="From Discover">
                <Compass size={10} />
                <span>Discover</span>
              </span>
            )}

            {/* "NEW" glowing badge */}
            {isNew && (
              <span className="ca-video-new-pill" title="Recently added to Studio">
                NEW
              </span>
            )}
          </div>

          {/* Duration Badge (Bottom Right) */}
          {video.durationSeconds > 0 && (
            <span className="ca-video-duration-pill">
              {formatDuration(video.durationSeconds)}
            </span>
          )}

          {/* Processing Status Badge (Top Right) */}
          <div className="ca-video-badge-group-right">
            {isCompleted ? (
              <span className="ca-video-status-pill status-ready">
                <CheckCircle2 size={11} />
                <span>Ready to Clip</span>
              </span>
            ) : isDownloading ? (
              <span className="ca-video-status-pill status-downloading">
                <Loader2 size={11} className="spin" />
                <span>Downloading…</span>
              </span>
            ) : isTranscribing ? (
              <span className="ca-video-status-pill status-transcribing">
                <Loader2 size={11} className="spin" />
                <span>Transcribing…</span>
              </span>
            ) : isAnalyzing ? (
              <span className="ca-video-status-pill status-analyzing">
                <Loader2 size={11} className="spin" />
                <span>Finding Moments…</span>
              </span>
            ) : isFailed ? (
              <span className="ca-video-status-pill status-failed">
                <AlertCircle size={11} />
                <span>Failed</span>
              </span>
            ) : isProcessing ? (
              <span className="ca-video-status-pill status-processing">
                <Loader2 size={11} className="spin" />
                <span>Processing…</span>
              </span>
            ) : (
              <span className="ca-video-status-pill status-default">
                <span className="ca-status-dot" />
                <span>{rawStatus}</span>
              </span>
            )}

            {/* Clips Detected Badge */}
            {typeof video.clipsDetected === "number" && video.clipsDetected > 0 && (
              <span
                className="ca-video-clips-pill"
                title={`${video.clipsDetected} AI clips discovered and ready for export`}
              >
                <Sparkles size={11} />
                <span>{video.clipsDetected} clips</span>
              </span>
            )}
          </div>
        </div>

        {/* Video Content & Title */}
        <div className="ca-video-card-body">
          <h3 className="ca-video-card-title" title={video.title}>
            {video.title}
          </h3>

          <div className="ca-video-card-meta-row">
            {video.publishedAt && (
              <span className="ca-video-card-date">
                Published {new Date(video.publishedAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
            {video.createdAt && (
              <span className="ca-video-card-added" title="Added to ShortsYou">
                Added {new Date(video.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
          </div>
        </div>

        {/* Card Actions */}
        <div className="ca-video-card-actions">
          {isProcessing ? (
            <button
              type="button"
              className="ca-video-create-btn btn-processing"
              disabled={true}
            >
              <Loader2 size={14} className="spin" />
              <span>Analyzing Video…</span>
            </button>
          ) : isFailed ? (
            <motion.button
              type="button"
              className="ca-video-create-btn btn-retry"
              onClick={() => onSelect(video)}
              disabled={disabled}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
            >
              <RefreshCw size={14} />
              <span>Retry AI Generation</span>
            </motion.button>
          ) : (
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
          )}

          {/* Link to Editor */}
          <Link
            href={`/editor/${video.id}`}
            className="ca-video-edit-btn"
            title="Open in Studio Timeline Editor"
          >
            <SlidersHorizontal size={14} />
          </Link>

          {/* Remove Button */}
          <motion.button
            type="button"
            className="ca-video-remove-btn"
            onClick={() => onDelete(video)}
            disabled={disabled}
            aria-label={`Remove ${video.title}`}
            title="Remove video from Studio"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
          >
            <Trash2 size={15} />
          </motion.button>
        </div>
      </motion.article>
    );
  },
  (prev, next) =>
    prev.video.id === next.video.id &&
    prev.video.processingStatus === next.video.processingStatus &&
    prev.video.clipsDetected === next.video.clipsDetected &&
    prev.video.updatedAt === next.video.updatedAt &&
    prev.disabled === next.disabled &&
    prev.onSelect === next.onSelect &&
    prev.onDelete === next.onDelete
);
