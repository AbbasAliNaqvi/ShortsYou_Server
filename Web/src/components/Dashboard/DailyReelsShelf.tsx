"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Flame,
  Play,
  Sliders,
  Download,
  Loader2,
  CheckCircle2,
  Clock,
  ExternalLink,
  TrendingUp,
  Zap,
  Star,
} from "lucide-react";
import type { DailyReel, Clip, Video } from "@/lib/api";
import { ClipPreviewModal } from "@/components/Clips/ClipPreviewModal";

export interface DailyReelsShelfProps {
  reels: DailyReel[];
  loading?: boolean;
  exportingClip: string | null;
  onExportClip: (clipId: string) => Promise<void>;
}

const RANK_EMOJIS = ["🥇", "🥈", "🥉", "4", "5"];
const CATEGORY_COLORS: Record<string, string> = {
  "curiosity_gap": "#f59e0b",
  "emotion_peak": "#ec4899",
  "debate_climax": "#8b5cf6",
  "laugh_moment": "#10b981",
  "viral_hook": "#3b82f6",
};

function getCategoryColor(category: string): string {
  const lower = category.toLowerCase().replace(/[\s-]/g, "_");
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return "#7c3aed";
}

export function DailyReelsShelf({
  reels,
  loading = false,
  exportingClip,
  onExportClip,
}: DailyReelsShelfProps) {
  const [selectedPreview, setSelectedPreview] = useState<DailyReel | null>(null);

  if (!loading && reels.length === 0) {
    return null;
  }

  return (
    <section className="drs-root" aria-label="Daily AI Auto-Generated Reels">
      {/* Section header */}
      <div className="drs-header">
        <div className="drs-header-left">
          <div className="drs-badge">
            <Sparkles size={13} className="drs-sparkle" />
            <span>AI CURATED TODAY · DAILY 5</span>
          </div>
          <h2 className="drs-title">
            Today&apos;s AI Viral Picks
            <span className="drs-title-accent"> for You</span>
          </h2>
          <p className="drs-subtitle">
            High-converting moments auto-detected from your videos, hook-optimized & curated
            by AI based on your Creator DNA and content preferences.
          </p>
        </div>
        <div className="drs-header-right">
          <div className="drs-meta-chips">
            <div className="drs-meta-chip">
              <Zap size={12} />
              <span>Personalized to you</span>
            </div>
            <div className="drs-meta-chip">
              <TrendingUp size={12} />
              <span>Viral score ranked</span>
            </div>
          </div>
          <Link href="/clips" className="drs-view-all">
            <span>View All Clips</span>
            <ExternalLink size={13} />
          </Link>
        </div>
      </div>

      {/* Cards grid */}
      <div className="drs-grid">
        {loading
          ? Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="drs-skeleton" />
            ))
          : reels.slice(0, 5).map((reel, index) => {
              const isExporting = exportingClip === reel.id;
              const isReady = reel.status === "exported" || reel.status === "published";
              const viralPct = Math.round(
                reel.viralScore > 1 ? reel.viralScore : reel.viralScore * 100
              );
              const catColor = getCategoryColor(reel.category || "");
              const isTop3 = index < 3;

              return (
                <article key={reel.id} className={`drs-card ${isTop3 ? "drs-card-featured" : ""}`}>
                  {/* Vertical 9:16 Thumbnail */}
                  <div
                    className="drs-thumb"
                    onClick={() => setSelectedPreview(reel)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedPreview(reel)}
                    aria-label={`Preview: ${reel.hookText}`}
                  >
                    {reel.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={reel.thumbnailUrl}
                        alt={reel.hookText || reel.videoTitle}
                        className="drs-thumb-img"
                        loading="lazy"
                      />
                    ) : (
                      <div className="drs-thumb-placeholder">
                        <Play size={24} />
                      </div>
                    )}

                    {/* Gradient overlay */}
                    <div className="drs-thumb-overlay" />

                    {/* Rank */}
                    <div className="drs-rank">
                      {index < 3 ? RANK_EMOJIS[index] : `#${index + 1}`}
                    </div>

                    {/* Play button */}
                    <div className="drs-play-btn">
                      <Play size={16} fill="currentColor" />
                    </div>

                    {/* Viral score */}
                    <div className="drs-score">
                      <Flame size={11} />
                      <span>{viralPct}</span>
                    </div>

                    {/* Duration */}
                    <div className="drs-dur">
                      <Clock size={10} />
                      <span>{Math.round(reel.durationSeconds || 30)}s</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="drs-content">
                    <span
                      className="drs-category"
                      style={{ color: catColor, borderColor: `${catColor}30`, background: `${catColor}10` }}
                    >
                      {reel.category || "Viral Moment"}
                    </span>

                    <h3 className="drs-hook" title={reel.hookText}>
                      &ldquo;{reel.hookText || reel.videoTitle}&rdquo;
                    </h3>

                    {reel.reasoning && (
                      <p className="drs-reason" title={reel.reasoning}>
                        {reel.reasoning}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="drs-actions">
                      {isReady ? (
                        <button
                          type="button"
                          className="drs-action-btn drs-action-success"
                          onClick={() => setSelectedPreview(reel)}
                        >
                          <CheckCircle2 size={13} />
                          <span>Ready</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={`drs-action-btn drs-action-primary ${isExporting ? "drs-loading" : ""}`}
                          disabled={isExporting}
                          onClick={() => void onExportClip(reel.id)}
                        >
                          {isExporting ? (
                            <>
                              <Loader2 size={13} className="drs-spin" />
                              <span>Rendering…</span>
                            </>
                          ) : (
                            <>
                              <Download size={13} />
                              <span>1-Click Render</span>
                            </>
                          )}
                        </button>
                      )}

                      <Link
                        href={`/editor/${reel.videoId}?clipId=${reel.id}`}
                        className="drs-edit-btn"
                        title="Customize in AI Studio"
                      >
                        <Sliders size={13} />
                      </Link>
                    </div>
                  </div>

                  {/* Top rank glow */}
                  {index === 0 && (
                    <div className="drs-top1-badge">
                      <Star size={11} fill="currentColor" /> Top Pick
                    </div>
                  )}
                </article>
              );
            })}
      </div>

      {/* Preview modal */}
      {selectedPreview &&
        (() => {
          const previewClip: Clip = {
            id: selectedPreview.id,
            videoId: selectedPreview.videoId,
            userId: "",
            startTime: selectedPreview.startTime,
            endTime: selectedPreview.endTime,
            durationSeconds: selectedPreview.durationSeconds,
            viralScore: selectedPreview.viralScore,
            genericPredictionScore: selectedPreview.viralScore,
            personalizedPredictionScore: selectedPreview.viralScore,
            hookScore: selectedPreview.viralScore,
            transcriptText: selectedPreview.hookText,
            selectedHook: selectedPreview.hookText,
            originalHook: selectedPreview.hookText,
            status: selectedPreview.status,
            category: selectedPreview.category,
            createdAt: new Date().toISOString(),
            selectedThumbnail: selectedPreview.thumbnailUrl,
            supabaseShortUrl: selectedPreview.playableUrl,
            editSettings: {
              backgroundStyle: "crop",
              colorGrade: "vibrant",
              musicMood: "energetic",
              captionStyle: "karaoke",
              layout: "standard",
              removeSilences: false,
              removeFillers: false,
            },
          };

          const previewVideo: Video = {
            id: selectedPreview.videoId,
            title: selectedPreview.videoTitle,
            thumbnailUrl: selectedPreview.thumbnailUrl,
            durationSeconds: selectedPreview.durationSeconds,
            processingStatus: "ready",
            clipsDetected: 1,
            viewCount: 0,
            publishedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          return (
            <ClipPreviewModal
              clip={previewClip}
              video={previewVideo}
              onClose={() => setSelectedPreview(null)}
              onDownload={() => {
                if (selectedPreview.playableUrl) {
                  window.open(selectedPreview.playableUrl, "_blank");
                }
              }}
              onExport={(clipId) => onExportClip(clipId)}
              busy={exportingClip === selectedPreview.id}
            />
          );
        })()}
    </section>
  );
}
