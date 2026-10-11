"use client";
/* eslint-disable @next/next/no-img-element */

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Clapperboard, LoaderCircle, Play } from "lucide-react";
import type { PublicVideo } from "@/lib/api";
import { compactNumber, formatDuration } from "@/lib/formatters";
import { SectionTitle } from "@/components/Layout";

export interface CreatorVideoCatalogProps {
  videos: PublicVideo[];
  selected: string[];
  busy: boolean;
  onToggleSelect: (videoId: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onQueueVideos: (videoIds: string[]) => void;
}

export function CreatorVideoCatalog({
  videos,
  selected,
  busy,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onQueueVideos,
}: CreatorVideoCatalogProps) {
  if (videos.length === 0) return null;

  const allSelected = selected.length === videos.length && videos.length > 0;

  const selectAllButton = (
    <motion.button
      type="button"
      className="ca-select-all-btn"
      onClick={allSelected ? onClearSelection : onSelectAll}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
    >
      <Check size={14} />
      <span>{selected.length ? `${selected.length} selected` : "Select all"}</span>
    </motion.button>
  );

  return (
    <section className="ca-creator-catalog-section">
      <SectionTitle
        title="Select specific videos"
        meta="Public video catalog"
        action={selectAllButton}
      />

      <div className="ca-public-video-grid">
        {videos.map((video) => {
          const isSelected = selected.includes(video.youtubeVideoId);

          return (
            <motion.article
              key={video.youtubeVideoId}
              className={`ca-public-video-card ca-glass ${isSelected ? "selected" : ""}`}
              onClick={() => onToggleSelect(video.youtubeVideoId)}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              {/* Thumbnail Container */}
              <div className="ca-public-thumb-wrap">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="ca-public-thumb-img"
                    loading="lazy"
                  />
                ) : (
                  <div className="ca-public-thumb-placeholder">
                    <Play size={24} />
                  </div>
                )}

                {/* Duration & Views Pills */}
                {video.durationSeconds > 0 && (
                  <span className="ca-video-duration-pill">
                    {formatDuration(video.durationSeconds)}
                  </span>
                )}

                {video.viewCount > 0 && (
                  <span className="ca-public-views-pill">
                    {compactNumber(video.viewCount)} views
                  </span>
                )}

                {/* Selection Checkmark Indicator */}
                <div className={`ca-thumb-checkbox ${isSelected ? "checked" : ""}`}>
                  {isSelected && <Check size={13} />}
                </div>
              </div>

              {/* Title & Body */}
              <div className="ca-public-card-body">
                <h3 className="ca-public-card-title" title={video.title}>
                  {video.title}
                </h3>
              </div>

              {/* Single Add Button */}
              <motion.button
                type="button"
                className="ca-single-add-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onQueueVideos([video.youtubeVideoId]);
                }}
                disabled={busy}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
              >
                <span>Add to Your Videos</span>
                <ArrowRight size={13} />
              </motion.button>
            </motion.article>
          );
        })}
      </div>

      {/* Floating Bottom Bulk Action Shelf */}
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            className="ca-floating-queue-bar ca-glass"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="ca-floating-queue-info">
              <span className="ca-floating-count">{selected.length}</span>
              <span className="ca-floating-label">
                video{selected.length === 1 ? "" : "s"} selected
              </span>
            </div>

            <div className="ca-floating-actions">
              <button
                type="button"
                className="ca-floating-clear-btn"
                onClick={onClearSelection}
                disabled={busy}
              >
                Cancel
              </button>

              <motion.button
                type="button"
                className="ca-floating-submit-btn"
                onClick={() => onQueueVideos(selected)}
                disabled={busy}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
              >
                {busy ? (
                  <>
                    <LoaderCircle className="spin" size={16} />
                    <span>Adding to videos…</span>
                  </>
                ) : (
                  <>
                    <Clapperboard size={16} />
                    <span>Add {selected.length} selected to Your Videos</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
