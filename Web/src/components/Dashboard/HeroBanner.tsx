"use client";

import { memo, type FormEvent } from "react";
import { Bot } from "lucide-react";
import { IngestPanel } from "./IngestPanel";
import { StatsOverview } from "./StatsOverview";

export interface HeroBannerProps {
  sourceUrl: string;
  notice: string;
  creating: boolean;
  videoCount: number;
  clipCount: number;
  renderedCount: number;
  avgViralScore: number;
  onChangeSourceUrl: (val: string) => void;
  onCopySourceUrl: () => void;
  onSubmitAutoCreate: (event: FormEvent) => void;
  onBrowseMetrics?: () => void;
}

export const HeroBanner = memo(function HeroBanner({
  sourceUrl,
  notice,
  creating,
  videoCount,
  clipCount,
  renderedCount,
  avgViralScore,
  onChangeSourceUrl,
  onCopySourceUrl,
  onSubmitAutoCreate,
  onBrowseMetrics,
}: HeroBannerProps) {
  return (
    <div className="ca-hero-card ca-glass">
      {/* Warm amber accent glow behind the character */}
      <div className="ca-hero-glow" aria-hidden="true" />

      {/* Hero Character Image — positioned right, anchored to bottom */}
      <div className="ca-hero-visual-container" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-character-transparent.png"
          alt=""
          className="ca-hero-character-img"
        />
      </div>

      <div className="ca-hero-body">
        <span className="ca-hero-eyebrow">
          <Bot size={12} /> AI-Powered Shorts Engine
        </span>
        <h1 className="ca-hero-headline">
          Optimize<br />Your Metrics
        </h1>
        <p className="ca-hero-subtext">
          Paste any YouTube video. AI transcribes, finds viral moments,
          writes scroll-stopping hooks, and renders production-ready shorts.
        </p>

        <IngestPanel
          sourceUrl={sourceUrl}
          notice={notice}
          creating={creating}
          onChange={onChangeSourceUrl}
          onCopy={onCopySourceUrl}
          onSubmit={onSubmitAutoCreate}
        />
      </div>

      {/* Floating Overlay Glass Stats Bar */}
      <StatsOverview
        videoCount={videoCount}
        clipCount={clipCount}
        renderedCount={renderedCount}
        avgViralScore={avgViralScore}
        onBrowseMetrics={onBrowseMetrics}
      />
    </div>
  );
});
