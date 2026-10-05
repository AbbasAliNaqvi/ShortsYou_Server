"use client";

import { FormEvent } from "react";
import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import { LiquidGlassHeroGraphic } from "./LiquidGlassHeroGraphic";
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

export function HeroBanner({
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
    <motion.div
      className="ca-hero-card ca-glass"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Concentric Wireframe Orbit Rings */}
      <div className="ca-hero-rings" aria-hidden="true">
        <svg viewBox="0 0 600 600" className="ca-hero-rings-svg">
          <circle cx="300" cy="300" r="140" fill="none" stroke="rgba(245, 158, 11, 0.15)" strokeWidth="1" />
          <circle cx="300" cy="300" r="210" fill="none" stroke="rgba(14, 165, 233, 0.12)" strokeWidth="1" />
          <circle cx="300" cy="300" r="280" fill="none" stroke="rgba(168, 85, 247, 0.10)" strokeWidth="1" strokeDasharray="4 6" />
        </svg>
      </div>

      {/* Liquid Glass AI Engine Graphic */}
      <div className="ca-hero-visual-container" aria-hidden="true">
        <LiquidGlassHeroGraphic />
      </div>

      <div className="ca-hero-body">
        <motion.span
          className="ca-hero-eyebrow"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Bot size={12} /> AI-Powered Shorts Engine
        </motion.span>
        <motion.h1
          className="ca-hero-headline"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          Optimize<br />Your Metrics
        </motion.h1>
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
    </motion.div>
  );
}
