"use client";

import type { ReactNode } from "react";
import { Clapperboard } from "lucide-react";
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

export function VideoSection({
  title,
  empty,
  videos,
  onSelect,
  onDelete,
  action,
  disabled = false,
}: VideoSectionProps) {
  const metaLabel = `${videos.length} ${videos.length === 1 ? "video" : "videos"}`;

  return (
    <section className="ca-video-section">
      <SectionTitle title={title} meta={metaLabel} action={action} />

      {videos.length > 0 ? (
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
      ) : (
        <EmptyState
          text={empty}
          icon={Clapperboard}
          className="ca-video-empty-state"
        />
      )}
    </section>
  );
}
