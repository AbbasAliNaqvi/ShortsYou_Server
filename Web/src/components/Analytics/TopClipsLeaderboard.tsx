"use client";
/* eslint-disable @next/next/no-img-element */

import { memo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Award, ChevronRight, Play, Sparkles } from "lucide-react";
import type { Clip } from "@/lib/api";
import { formatDuration } from "@/lib/formatters";
import { CardSpotlight } from "@/components/ui/card-spotlight";

export interface TopClipsLeaderboardProps {
  clips: Clip[];
}

export const TopClipsLeaderboard = memo(function TopClipsLeaderboard({ clips }: TopClipsLeaderboardProps) {
  return (
    <CardSpotlight
      radius={380}
      color="rgba(245, 158, 11, 0.07)"
      className="ca-leaderboard-panel ca-glass"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
              <Award size={12} />
              Virality Leaderboard
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Top Performing Extracted Clips
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Ranked by composite hook score and audience retention yield.
          </p>
        </div>
        <Link
          href="/clips"
          className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 transition"
        >
          <span>View all</span>
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="space-y-3">
        {clips.map((clip, index) => {
          const title =
            clip.selectedHook ||
            clip.originalHook ||
            clip.transcriptText ||
            "High-saliency moment";
          const thumbnail =
            clip.selectedThumbnail ||
            clip.thumbnailOptions?.[0];

          return (
            <motion.div
              className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-3 transition hover:border-amber-300 hover:shadow-sm"
              key={clip.id}
              whileHover={{ x: 3, transition: { duration: 0.15 } }}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-100/70 border border-amber-200 text-xs font-bold text-amber-800">
                #{index + 1}
              </div>

              <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200 shadow-sm">
                {thumbnail ? (
                  <img src={thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <Sparkles size={14} />
                  </div>
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-black/25 text-white opacity-0 transition hover:opacity-100">
                  <Play size={10} fill="currentColor" />
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold text-slate-800 truncate" title={title}>
                    {title}
                  </h3>
                  <span className="shrink-0 rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-800 border border-cyan-200">
                    Hook {clip.hookScore.toFixed(0)}
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                  <span className="capitalize">{clip.status}</span>
                  <span>•</span>
                  <span>{formatDuration(clip.durationSeconds)}</span>
                  {clip.category && (
                    <>
                      <span>•</span>
                      <span className="capitalize text-slate-700">{clip.category.replace(/_/g, " ")}</span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {clips.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500">
            <Sparkles size={20} className="mb-1.5 text-amber-500" />
            <p className="text-xs font-bold text-slate-800">No measured clips yet</p>
            <span className="text-[11px] text-slate-500">Process videos to rank your hook performance.</span>
          </div>
        )}
      </div>
    </CardSpotlight>
  );
});
