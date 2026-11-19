"use client";
/* eslint-disable @next/next/no-img-element */

import { memo, useMemo, useState } from "react";
import Link from "next/link";
import { Award, ChevronRight, Play, Film, ExternalLink } from "lucide-react";
import type { Clip, Video } from "@/lib/api";
import { formatDuration } from "@/lib/formatters";

export interface TopClipsLeaderboardProps {
  clips: Clip[];
  videos?: Video[];
}

function getScore(c: Clip): number {
  if (typeof c.viralScore === "number" && c.viralScore > 0) {
    return c.viralScore > 1 ? Math.round(c.viralScore) : Math.round(c.viralScore * 100);
  }
  if (typeof c.hookScore === "number" && c.hookScore > 0) {
    return c.hookScore > 1 ? Math.round(c.hookScore) : Math.round(c.hookScore * 100);
  }
  return 75;
}

export const TopClipsLeaderboard = memo(function TopClipsLeaderboard({
  clips,
  videos = [],
}: TopClipsLeaderboardProps) {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const videoMap = useMemo(() => {
    const map = new Map<string, Video>();
    for (const v of videos) {
      if (v.id) map.set(v.id, v);
      if (v.youtubeVideoId) map.set(v.youtubeVideoId, v);
    }
    return map;
  }, [videos]);

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return "bg-amber-100 text-amber-900 border-amber-300";
      case 1:
        return "bg-slate-200 text-slate-800 border-slate-300";
      case 2:
        return "bg-orange-100 text-orange-900 border-orange-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const resolveUrl = (rawUrl?: string | null): string | null => {
    if (!rawUrl || typeof rawUrl !== "string") return null;
    const url = rawUrl.trim();
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
      return url;
    }
    if (url.startsWith("/")) {
      const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";
      return `${apiHost}${url}`;
    }
    return url;
  };

  const getThumbnailUrl = (clip: Clip): string | null => {
    // 1. Clip's own selected thumbnail
    if (clip.selectedThumbnail && clip.selectedThumbnail.trim() !== "") {
      return resolveUrl(clip.selectedThumbnail);
    }

    // 2. Any option in thumbnailOptions
    if (clip.thumbnailOptions && clip.thumbnailOptions.length > 0) {
      const first = clip.thumbnailOptions.find((t) => t && typeof t === "string" && t.trim() !== "");
      if (first) return resolveUrl(first);
    }

    // 3. Directly on clip object
    const rawThumb = (clip as unknown as { thumbnailUrl?: string }).thumbnailUrl;
    if (rawThumb && typeof rawThumb === "string" && rawThumb.trim() !== "") {
      return resolveUrl(rawThumb);
    }

    // 4. From matching parent video in videoMap
    if (clip.videoId && videoMap.has(clip.videoId)) {
      const parentVideo = videoMap.get(clip.videoId);
      if (parentVideo?.thumbnailUrl && parentVideo.thumbnailUrl.trim() !== "") {
        return resolveUrl(parentVideo.thumbnailUrl);
      }
      if (parentVideo?.youtubeVideoId) {
        return `https://img.youtube.com/vi/${parentVideo.youtubeVideoId}/hqdefault.jpg`;
      }
    }

    // 5. If clip.videoId is an 11-character YouTube video ID
    if (clip.videoId && /^[a-zA-Z0-9_-]{11}$/.test(clip.videoId)) {
      return `https://img.youtube.com/vi/${clip.videoId}/hqdefault.jpg`;
    }

    // Return null to render crisp 9:16 gradient poster with category label & film icon
    return null;
  };

  const getCategoryGradient = (index: number) => {
    const gradients = [
      "from-indigo-600 via-purple-600 to-indigo-900",
      "from-rose-600 via-pink-600 to-purple-900",
      "from-amber-600 via-orange-600 to-rose-900",
      "from-cyan-600 via-teal-600 to-blue-900",
    ];
    return gradients[index % gradients.length];
  };

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-900 border border-amber-200">
              <Award size={12} className="text-amber-600" aria-hidden="true" />
              Virality Leaderboard
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight sm:text-xl">
            Top Performing Clips
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Ranked by audience hold rate and composite viral potential.
          </p>
        </div>

        <Link
          href="/clips"
          className="cursor-pointer inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-900 transition shrink-0"
        >
          <span>View all</span>
          <ChevronRight size={14} aria-hidden="true" />
        </Link>
      </div>

      {/* Ranked Clips List */}
      <div className="space-y-3">
        {clips.map((clip, index) => {
          const title =
            clip.selectedHook ||
            clip.originalHook ||
            clip.transcriptText ||
            "High-engagement moment";
          const rawThumbnail = getThumbnailUrl(clip);
          const hasError = imageErrors[clip.id];
          const thumbnail = !hasError ? rawThumbnail : null;
          const score = getScore(clip);

          return (
            <div
              key={clip.id}
              className="group flex items-center gap-3.5 rounded-xl border border-slate-200/80 bg-white p-3 transition-all duration-150 hover:border-slate-300 hover:shadow-xs"
            >
              {/* Rank Badge */}
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-extrabold ${getRankBadge(
                  index
                )}`}
              >
                #{index + 1}
              </div>

              {/* 9:16 Vertical Video Thumbnail Card */}
              <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-900 border border-slate-200 shadow-2xs">
                {thumbnail ? (
                  <img
                    src={thumbnail}
                    alt={title}
                    referrerPolicy="no-referrer"
                    onError={() => {
                      setImageErrors((prev) => ({ ...prev, [clip.id]: true }));
                    }}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  /* Stylized Category Gradient Poster when image is unavailable or loading */
                  <div
                    className={`flex h-full w-full flex-col items-center justify-between p-1.5 bg-gradient-to-br ${getCategoryGradient(
                      index
                    )} text-white`}
                  >
                    <span className="text-[9px] font-extrabold uppercase tracking-widest opacity-80 truncate max-w-full">
                      {clip.category || "Short"}
                    </span>
                    <Film size={16} className="opacity-90 my-auto" aria-hidden="true" />
                    <span className="text-[8px] font-bold opacity-75">9:16</span>
                  </div>
                )}

                {/* Duration Overlay */}
                <div className="absolute bottom-1 right-1 rounded-sm bg-black/75 px-1 py-0.2 text-[9px] font-bold text-white backdrop-blur-xs">
                  {formatDuration(clip.durationSeconds || 30)}
                </div>

                {/* Hover Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  <Play size={12} fill="currentColor" aria-hidden="true" />
                </div>
              </div>

              {/* Clip Metadata */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3
                    className="text-xs font-bold text-slate-900 truncate"
                    title={title}
                  >
                    {title}
                  </h3>
                  <span className="shrink-0 rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-extrabold text-indigo-800 border border-indigo-200">
                    Score {score}
                  </span>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-medium">
                  <span className="capitalize font-semibold text-slate-700">
                    {clip.status || "Ready"}
                  </span>
                  <span>•</span>
                  <span>{formatDuration(clip.durationSeconds || 30)}</span>
                  {clip.category && (
                    <>
                      <span>•</span>
                      <span className="capitalize text-slate-700 font-semibold truncate max-w-[110px]">
                        {clip.category.replace(/_/g, " ")}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Link: Open in Editor */}
              <Link
                href={`/editor/${clip.id}`}
                className="cursor-pointer shrink-0 rounded-lg p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                title="Open in Studio Editor"
                aria-label={`Open clip in editor: ${title}`}
              >
                <ExternalLink size={13} aria-hidden="true" />
              </Link>
            </div>
          );
        })}

        {clips.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500">
            <Award size={20} className="mb-1.5 text-amber-500" aria-hidden="true" />
            <p className="text-xs font-bold text-slate-800">No clips processed yet</p>
            <span className="text-[11px] text-slate-500">
              Process videos to view your top-ranked retention hooks.
            </span>
          </div>
        )}
      </div>
    </section>
  );
});
