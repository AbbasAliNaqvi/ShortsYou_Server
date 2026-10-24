"use client";

import { memo, type FormEvent } from "react";
import dynamic from "next/dynamic";
import { Bot } from "lucide-react";
import { IngestPanel } from "./IngestPanel";
import { StatsOverview } from "./StatsOverview";

// Dynamically import heavy client-only animated graphic with ssr: false
// and lightweight layout-preserving skeleton to prevent CLS
const LiquidGlassHeroGraphic = dynamic(
  () => import("./LiquidGlassHeroGraphic").then((m) => m.LiquidGlassHeroGraphic),
  {
    ssr: false,
    loading: () => (
      <div
        className="ca-liquid-graphic-wrap"
        style={{ minHeight: "280px" }}
        aria-hidden="true"
      />
    ),
  }
);

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
    <div
      className="ca-hero-card ca-glass"
    >
      {/* Concentric Wireframe Orbit Rings */}
      <div className="ca-hero-rings" aria-hidden="true">
        <svg viewBox="0 0 600 600" className="ca-hero-rings-svg">
          <circle cx="300" cy="300" r="140" fill="none" stroke="rgba(245, 158, 11, 0.15)" strokeWidth="1" />
          <circle cx="300" cy="300" r="210" fill="none" stroke="rgba(14, 165, 233, 0.12)" strokeWidth="1" />
          <circle cx="300" cy="300" r="280" fill="none" stroke="rgba(168, 85, 247, 0.10)" strokeWidth="1" strokeDasharray="4 6" />
        </svg>
      </div>

      {/* Liquid Glass AI Engine Graphic (Client-only code-split) */}
      <div className="ca-hero-visual-container" aria-hidden="true">
        <LiquidGlassHeroGraphic />
      </div>

      <div className="ca-hero-body">
        <span
          className="ca-hero-eyebrow"
        >
          <Bot size={12} /> AI-Powered Shorts Engine
        </span>
        <h1
          className="ca-hero-headline"
        >
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
