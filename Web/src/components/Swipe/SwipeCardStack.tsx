"use client";

import { memo } from "react";
import { AnimatePresence } from "framer-motion";
import { SwipeCard } from "./SwipeCard";
import type { SwipeDirection, SwipeItem } from "./types";

export interface SwipeCardStackProps {
  items: SwipeItem[];
  currentIndex: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onSwipe: (direction: SwipeDirection) => void;
  onOpenDetails: (item: SwipeItem) => void;
  onInstantEdit: (item: SwipeItem) => void;
  isProcessingAction?: boolean;
}

export const SwipeCardStack = memo(function SwipeCardStack({
  items,
  currentIndex,
  isMuted,
  onToggleMute,
  onSwipe,
  onOpenDetails,
  onInstantEdit,
  isProcessingAction = false,
}: SwipeCardStackProps) {
  // Grab the current active card and the next 2 behind it for high-performance 3-card stack
  const visibleCards = items.slice(currentIndex, currentIndex + 3);

  return (
    <div className="swipe-stack-wrapper">
      {/* 1. TOP AMBIENT AMBER/GOLD NEON LIGHT BAR (Exact match to reference image above the cards) */}
      <div className="swipe-neon-ambient-bar" aria-hidden="true">
        <div className="swipe-neon-bar-core" />
        <div className="swipe-neon-bar-glow" />
      </div>

      {/* 2. DUAL CONCENTRIC GLOWING WHITE/NEON RINGS (Exact match to reference image background halos) */}
      <div className="swipe-neon-rings-backdrop" aria-hidden="true">
        {/* Left Glowing Halo Ring */}
        <div className="swipe-halo-ring swipe-halo-ring-left">
          <svg viewBox="0 0 400 400" width="380" height="380" fill="none">
            <circle
              cx="200"
              cy="200"
              r="170"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="4"
              strokeDasharray="400 240"
              strokeLinecap="round"
            />
            <circle
              cx="200"
              cy="200"
              r="170"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="10"
              filter="blur(8px)"
            />
          </svg>
        </div>

        {/* Right Glowing Halo Ring */}
        <div className="swipe-halo-ring swipe-halo-ring-right">
          <svg viewBox="0 0 400 400" width="380" height="380" fill="none">
            <circle
              cx="200"
              cy="200"
              r="170"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="4"
              strokeDasharray="400 240"
              strokeLinecap="round"
            />
            <circle
              cx="200"
              cy="200"
              r="170"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="10"
              filter="blur(8px)"
            />
          </svg>
        </div>
      </div>

      {/* 3. STACKED CARDS CONTAINER */}
      <div className="swipe-cards-stage">
        <AnimatePresence mode="popLayout">
          {visibleCards.map((item, stackIdx) => (
            <SwipeCard
              key={item.id}
              item={item}
              index={stackIdx}
              isMuted={isMuted}
              onToggleMute={onToggleMute}
              onSwipe={onSwipe}
              onOpenDetails={onOpenDetails}
              onInstantEdit={onInstantEdit}
              isProcessingAction={stackIdx === 0 && isProcessingAction}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
});
