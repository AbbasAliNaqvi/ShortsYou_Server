"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Award, ChevronRight, Play, Sparkles } from "lucide-react";
import type { Clip } from "@/lib/api";
import { formatDuration } from "@/lib/formatters";

export interface TopClipsLeaderboardProps {
  clips: Clip[];
}

export function TopClipsLeaderboard({ clips }: TopClipsLeaderboardProps) {
  return (
    <motion.article
      className="ca-leaderboard-panel ca-glass"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="ca-panel-header">
        <div className="ca-panel-header-text">
          <div className="ca-panel-badge-row">
            <span className="ca-panel-badge">
              <Award size={12} />
              Virality Leaderboard
            </span>
          </div>
          <h2 className="ca-panel-title">Top Performing Extracted Clips</h2>
          <p className="ca-panel-subtitle">Ranked by composite hook score and audience retention yield.</p>
        </div>
        <Link href="/clips" className="ca-view-all-link">
          <span>View all</span>
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="ca-leaderboard-list">
        {clips.map((clip, index) => {
          const title =
            clip.originalHook ||
            clip.selectedHook ||
            clip.transcriptText ||
            "High-saliency moment";
          const thumbnail =
            clip.selectedThumbnail ||
            clip.thumbnailOptions?.[0];

          return (
            <motion.div
              className="ca-leader-row ca-glass"
              key={clip.id}
              whileHover={{ x: 3, transition: { duration: 0.15 } }}
            >
              <div className="ca-leader-rank-badge">
                #{index + 1}
              </div>

              <div className="ca-leader-thumb-wrap">
                {thumbnail ? (
                  <img src={thumbnail} alt="" className="ca-leader-thumb-img" />
                ) : (
                  <div className="ca-leader-thumb-fallback">
                    <Sparkles size={16} />
                  </div>
                )}
                <span className="ca-leader-thumb-overlay">
                  <Play size={10} fill="currentColor" />
                </span>
              </div>

              <div className="ca-leader-content">
                <div className="ca-leader-headline-row">
                  <h3 className="ca-leader-clip-title" title={title}>
                    {title.slice(0, 56)}
                  </h3>
                  <span className="ca-leader-score-pill">
                    Hook {clip.hookScore.toFixed(1)}
                  </span>
                </div>

                <div className="ca-leader-meta-row">
                  <span className="ca-leader-status-tag">{clip.status}</span>
                  <span className="ca-leader-dot" />
                  <span className="ca-leader-duration">
                    {formatDuration(clip.durationSeconds)}
                  </span>
                  {clip.category && (
                    <>
                      <span className="ca-leader-dot" />
                      <span className="ca-leader-category">{clip.category}</span>
                    </>
                  )}
                </div>

                <div className="ca-leader-actions-row">
                  <Link href="/clips" className="ca-leader-action-btn">
                    <span>Inspect Curve</span>
                    <ArrowUpRight size={11} />
                  </Link>
                  <Link href="/clips" className="ca-leader-action-btn accent">
                    <span>Re-Polish</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          );
        })}

        {clips.length === 0 && (
          <div className="ca-leaderboard-empty">
            <Sparkles size={20} className="ca-empty-icon" />
            <p>No measured clips yet.</p>
            <span>Process videos to populate hook scores.</span>
          </div>
        )}
      </div>
    </motion.article>
  );
}
