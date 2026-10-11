"use client";
/* eslint-disable @next/next/no-img-element */

import { motion } from "framer-motion";
import { ChevronDown, Download, MoreHorizontal, Play, RefreshCw } from "lucide-react";
import type { Clip, Video } from "@/lib/api";
import { formatDuration } from "@/lib/formatters";
import { EmptyState } from "@/components/Layout/EmptyState";

const fallbackThumbs = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCbxGgdgyq3gfBMdpPdrUwSGMFYT8Je22R6K5NLudSv-tQSwWhd2kLdw1j8KpZJrYHJTyAgBOxrGn6Pd2fbyBycRDvbTFjU8Mp4tdGa1TlPLYossyPzeTaQGiDBuWwu80MUFX-wn3wPph_CNEAMGZXAS9czZdvFoGSg8RWgb3vNyhFp9Or6rHEFQ-tcWsn0p3qR4g4oZo4iGawYZ64mavBpf7ljI6d43Lcza3_zBmen4ejUt_vO3KHs",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBHiTExBHrxUrsYBNiUSvkGp2yOfc2dwHvXRaSGDLBcpX30E1hjR7xkWr6fih9VUZiKIOfKliZyWPOW87ojjgvrCudlZRpBETkTA8eHK73UQh-ttEV5ECNQ7HeolEKsckr98hTS_QNBkZ6wbbW7zNR3HxcXYI4HZLEgjJW8IoQ0cxvLdYxu9jgIQB5luVUPZa8c4tp2lQeo5DdLfsmlS3ByJhZpc1YLnzRRKdNM6TJTO-I6W3jw-c8U",
];

export interface RecommendationsTableProps {
  clips: Clip[];
  videos: Video[];
  exportingClip: string | null;
  onCreateShort: (clipId: string) => void;
}

export function RecommendationsTable({
  clips,
  videos,
  exportingClip,
  onCreateShort,
}: RecommendationsTableProps) {
  return (
    <motion.section
      className="ca-bottom-table-panel ca-glass"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="ca-table-top-bar">
        <h2>Your top videos in this period</h2>
        <motion.button
          className="ca-filter-pill-btn"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          <span>Popularity</span>
          <ChevronDown size={14} />
        </motion.button>
      </div>

      <div className="ca-table-col-headers">
        <span>Video</span>
        <span>Views</span>
        <span>Average view duration</span>
      </div>

      <div className="ca-table-rows-container">
        {clips.length > 0 ? (
          clips.map((clip, index) => {
            const video = videos.find((item) => item.id === clip.videoId);
            const thumb =
              clip.selectedThumbnail ||
              clip.thumbnailOptions?.[0] ||
              video?.thumbnailUrl ||
              fallbackThumbs[index % fallbackThumbs.length];
            const rendering = exportingClip === clip.id || clip.status === "editing";
            const rendered = ["exported", "published"].includes(clip.status);

            return (
              <motion.div
                className="ca-table-row ca-glass"
                key={clip.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                whileHover={{
                  scale: 1.008,
                  y: -2,
                  boxShadow: "0 14px 35px rgba(0, 0, 0, 0.5)",
                }}
              >
                {/* Video Info Column */}
                <div className="ca-row-media-cell">
                  <div className="ca-row-thumb-box">
                    <img src={thumb} alt="" />
                    <div className="ca-row-play-badge">
                      <Play size={10} fill="#ffffff" />
                    </div>
                  </div>
                  <div className="ca-row-copy-box">
                    <h3>
                      {clip.originalHook ||
                        clip.selectedHook ||
                        clip.transcriptText.slice(0, 56) ||
                        "AI Detected Viral Moment"}
                    </h3>
                    <div className="ca-row-cat-tag">
                      <Play size={10} />
                      <span>{clip.category ? clip.category.toUpperCase() : "VIRAL SHORT"}</span>
                    </div>
                  </div>
                </div>

                {/* Views Column */}
                <div className="ca-row-views-cell">
                  <i className="ca-dot ca-dot--yellow" />
                  <span>{Math.round((clip.viralScore * 250) / 10) / 10}k views</span>
                </div>

                {/* Duration Column */}
                <div className="ca-row-duration-cell">
                  <i className="ca-dot ca-dot--green" />
                  <span>
                    {formatDuration(clip.durationSeconds)} ({Math.round(clip.viralScore * 0.68)}%)
                  </span>
                </div>

                {/* Sparkline Column */}
                <div className="ca-row-sparkline-cell">
                  <svg viewBox="0 0 80 20" className="ca-row-sparkline-svg">
                    <path
                      d={
                        index % 2 === 0
                          ? "M 0 15 Q 20 4 40 12 T 80 6"
                          : "M 0 10 Q 20 18 40 6 T 80 12"
                      }
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                {/* Action Column */}
                <div className="ca-row-action-cell">
                  <motion.button
                    className="ca-row-action-btn"
                    onClick={() => onCreateShort(clip.id)}
                    disabled={rendering}
                    title={
                      rendered
                        ? "Download Short"
                        : rendering
                        ? "Rendering Short..."
                        : "Create Short"
                    }
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.92 }}
                  >
                    {rendering ? (
                      <RefreshCw className="spin" size={14} />
                    ) : rendered ? (
                      <Download size={15} />
                    ) : (
                      <MoreHorizontal size={18} />
                    )}
                  </motion.button>
                </div>
              </motion.div>
            );
          })
        ) : (
          <EmptyState text="Your AI-created shorts will appear here. Paste a YouTube URL above to get started." />
        )}
      </div>
    </motion.section>
  );
}
