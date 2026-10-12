"use client";
/* eslint-disable @next/next/no-img-element */

import { memo, useMemo, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Clapperboard, LoaderCircle, Play } from "lucide-react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
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

interface PublicVideoCardProps {
  video: PublicVideo;
  isSelected: boolean;
  busy: boolean;
  onToggleSelect: (videoId: string) => void;
  onQueueVideos: (videoIds: string[]) => void;
}

const PublicVideoCard = memo(function PublicVideoCard({
  video,
  isSelected,
  busy,
  onToggleSelect,
  onQueueVideos,
}: PublicVideoCardProps) {
  return (
    <motion.article
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
});

export const CreatorVideoCatalog = memo(function CreatorVideoCatalog({
  videos,
  selected,
  busy,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onQueueVideos,
}: CreatorVideoCatalogProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(3);

  // Responsive column detection for virtualized grid
  useEffect(() => {
    const updateColumns = () => {
      const width = parentRef.current?.offsetWidth ?? (typeof window !== "undefined" ? window.innerWidth - 120 : 1200);
      const cols = Math.max(1, Math.floor((width + 16) / (280 + 16)));
      setColumnCount(cols);
    };
    updateColumns();
    window.addEventListener("resize", updateColumns, { passive: true });
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  const isVirtualized = videos.length > 8;

  const chunkedRows = useMemo(() => {
    if (!isVirtualized) return [];
    const rows: PublicVideo[][] = [];
    for (let i = 0; i < videos.length; i += columnCount) {
      rows.push(videos.slice(i, i + columnCount));
    }
    return rows;
  }, [videos, columnCount, isVirtualized]);

  const virtualizer = useWindowVirtualizer({
    count: isVirtualized ? chunkedRows.length : 0,
    estimateSize: () => 360,
    overscan: 2,
    scrollMargin: parentRef.current?.offsetTop ?? 0,
  });

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

      <div ref={parentRef}>
        {isVirtualized ? (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const rowVideos = chunkedRows[virtualRow.index] ?? [];
              return (
                <div
                  key={virtualRow.index}
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
                  <div className="ca-public-video-grid" style={{ marginBottom: "16px" }}>
                    {rowVideos.map((video) => (
                      <PublicVideoCard
                        key={video.youtubeVideoId}
                        video={video}
                        isSelected={selected.includes(video.youtubeVideoId)}
                        busy={busy}
                        onToggleSelect={onToggleSelect}
                        onQueueVideos={onQueueVideos}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="ca-public-video-grid">
            {videos.map((video) => (
              <PublicVideoCard
                key={video.youtubeVideoId}
                video={video}
                isSelected={selected.includes(video.youtubeVideoId)}
                busy={busy}
                onToggleSelect={onToggleSelect}
                onQueueVideos={onQueueVideos}
              />
            ))}
          </div>
        )}
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
});
