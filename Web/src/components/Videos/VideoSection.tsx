"use client";

import { memo, useRef, useEffect, useState, useMemo } from "react";
import type { ReactNode } from "react";
import { Clapperboard } from "lucide-react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import type { Video } from "@/lib/api";
import { SectionTitle, EmptyState } from "@/components/Layout";
import { VideoCard } from "./VideoCard";

export interface VideoSectionProps {
  title: string;
  empty: string;
  videos: Video[];
  onSelect: (video: Video) => void;
  onDelete: (video: Video) => void;
  action?: ReactNode;
  disabled?: boolean;
}

export const VideoSection = memo(function VideoSection({
  title,
  empty,
  videos,
  onSelect,
  onDelete,
  action,
  disabled = false,
}: VideoSectionProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const metaLabel = `${videos.length} ${videos.length === 1 ? "video" : "videos"}`;
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
    const rows: Video[][] = [];
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

  return (
    <section className="ca-video-section">
      <SectionTitle title={title} meta={metaLabel} action={action} />

      {videos.length > 0 ? (
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
                    <div className="ca-video-grid" style={{ marginBottom: "16px" }}>
                      {rowVideos.map((video) => (
                        <VideoCard
                          key={video.id}
                          video={video}
                          onSelect={onSelect}
                          onDelete={onDelete}
                          disabled={disabled}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="ca-video-grid">
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onSelect={onSelect}
                  onDelete={onDelete}
                  disabled={disabled}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          text={empty}
          icon={Clapperboard}
          className="ca-video-empty-state"
        />
      )}
    </section>
  );
});
