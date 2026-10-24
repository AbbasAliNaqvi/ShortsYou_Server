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
} from "lucide-react";
import type { DailyReel, Clip, Video } from "@/lib/api";
import { ClipPreviewModal } from "@/components/Clips/ClipPreviewModal";

export interface DailyReelsShelfProps {
  reels: DailyReel[];
  loading?: boolean;
  exportingClip: string | null;
  onExportClip: (clipId: string) => Promise<void>;
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
    <section className="ca-daily-reels-shelf ca-glass" aria-label="Daily AI Auto-Generated Reels">
      <div className="ca-daily-header-row">
        <div className="ca-daily-title-group">
          <div className="ca-daily-badge">
            <Sparkles size={14} className="ca-sparkle-spin" />
            <span>AI AGENT AUTO-CURATED TODAY</span>
          </div>
          <h2 className="ca-daily-title">Daily 5 AI Viral Reels</h2>
          <p className="ca-daily-sub">
            High-converting moments automatically detected, hook-optimized, and framed for YouTube
            Shorts & Reels.
          </p>
        </div>

        <Link href="/clips" className="ca-daily-view-all">
          <span>View All Clips</span>
          <ExternalLink size={14} />
        </Link>
      </div>

      <div className="ca-daily-reels-grid">
        {loading
          ? Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="ca-daily-card-skeleton animate-pulse" />
            ))
          : reels.map((reel, index) => {
              const isExporting = exportingClip === reel.id;
              const isReady = reel.status === "exported" || reel.status === "published";
              const viralPct = Math.round(
                reel.viralScore > 1 ? reel.viralScore : reel.viralScore * 100
              );

              return (
                <article key={reel.id} className="ca-daily-card">
                  {/* 9:16 Vertical Thumbnail Preview */}
                  <div
                    className="ca-daily-thumb-wrap"
                    onClick={() => setSelectedPreview(reel)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Preview short: ${reel.hookText}`}
                  >
                    {reel.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={reel.thumbnailUrl}
                        alt={reel.hookText || reel.videoTitle}
                        className="ca-daily-thumb-img"
                        loading="lazy"
                      />
                    ) : (
                      <div className="ca-daily-thumb-placeholder" />
                    )}

                    <div className="ca-daily-thumb-overlay">
                      <div className="ca-daily-play-btn">
                        <Play size={18} fill="currentColor" />
                      </div>
                    </div>

                    {/* Viral Score Badge */}
                    <div className="ca-daily-score-badge">
                      <Flame size={12} className="text-amber-400" />
                      <span>{viralPct}</span>
                    </div>

                    {/* Duration Pill */}
                    <div className="ca-daily-dur-badge">
                      <Clock size={11} />
                      <span>{Math.round(reel.durationSeconds || 30)}s</span>
                    </div>

                    {/* Rank Badge */}
                    <div className="ca-daily-rank">#{index + 1}</div>
                  </div>

                  {/* Metadata Content */}
                  <div className="ca-daily-content">
                    <span className="ca-daily-category">
                      {reel.category || "Viral Moment"}
                    </span>

                    <h3 className="ca-daily-hook" title={reel.hookText}>
                      &ldquo;{reel.hookText || reel.videoTitle}&rdquo;
                    </h3>

                    <p className="ca-daily-reason" title={reel.reasoning}>
                      {reel.reasoning}
                    </p>

                    {/* Action Buttons */}
                    <div className="ca-daily-actions">
                      {isReady ? (
                        <button
                          type="button"
                          className="ca-daily-action-btn success"
                          onClick={() => setSelectedPreview(reel)}
                        >
                          <CheckCircle2 size={14} />
                          <span>Ready to Download</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={`ca-daily-action-btn primary ${isExporting ? "loading" : ""}`}
                          disabled={isExporting}
                          onClick={() => void onExportClip(reel.id)}
                        >
                          {isExporting ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              <span>Rendering 9:16…</span>
                            </>
                          ) : (
                            <>
                              <Download size={14} />
                              <span>1-Click Render</span>
                            </>
                          )}
                        </button>
                      )}

                      <Link
                        href={`/editor/${reel.videoId}?clipId=${reel.id}`}
                        className="ca-daily-action-icon-btn"
                        title="Customize in AI Studio"
                      >
                        <Sliders size={14} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
      </div>

      {/* In-Modal 9:16 Video Player Preview */}
      {selectedPreview && (() => {
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
            onDownload={(clipId) => {
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
