"use client";

import { memo } from "react";
import type { ReactNode } from "react";
import { Clapperboard } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { Video } from "@/lib/api";
import { SectionTitle, EmptyState } from "@/components/Layout";
import { VideoCard } from "./VideoCard";

export interface VideoSectionProps {
  title?: string;
  empty?: string;
  videos: Video[];
  onSelect: (video: Video) => void;
  onDelete: (video: Video) => void;
  action?: ReactNode;
  disabled?: boolean;
  emptyAction?: ReactNode;
}

export const VideoSection = memo(function VideoSection({
  title,
  empty = "No videos found.",
  videos,
  onSelect,
  onDelete,
  action,
  disabled = false,
  emptyAction,
}: VideoSectionProps) {
  const metaLabel = `${videos.length} ${videos.length === 1 ? "video" : "videos"}`;

  return (
    <section className="ca-video-section">
      {title && <SectionTitle title={title} meta={metaLabel} action={action} />}

      {videos.length > 0 ? (
        <motion.div className="ca-video-grid" layout>
          <AnimatePresence mode="popLayout">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onSelect={onSelect}
                onDelete={onDelete}
                disabled={disabled}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <EmptyState
          text={empty}
          icon={Clapperboard}
          className="ca-video-empty-state"
          action={emptyAction}
        />
      )}
    </section>
  );
});
