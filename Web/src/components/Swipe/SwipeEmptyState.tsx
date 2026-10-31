"use client";

import { memo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, RotateCcw, ShoppingBag, ArrowRight } from "lucide-react";

export interface SwipeEmptyStateProps {
  acceptedCount: number;
  totalSwiped: number;
  onReset: () => void;
}

export const SwipeEmptyState = memo(function SwipeEmptyState({
  acceptedCount,
  totalSwiped,
  onReset,
}: SwipeEmptyStateProps) {
  return (
    <motion.div
      className="swipe-empty-card"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="swipe-empty-sparkle-glow">
        <Sparkles size={40} className="text-amber-400" />
      </div>

      <h3 className="swipe-empty-title">You&apos;re All Caught Up!</h3>
      <p className="swipe-empty-desc">
        You&apos;ve reviewed all suggested viral short moments in this session.
      </p>

      {/* Session stats */}
      <div className="swipe-empty-stats">
        <div className="swipe-empty-stat">
          <span className="swipe-empty-stat-num text-emerald-400">
            {acceptedCount}
          </span>
          <span className="swipe-empty-stat-label">Accepted Shorts</span>
        </div>
        <div className="swipe-empty-divider" />
        <div className="swipe-empty-stat">
          <span className="swipe-empty-stat-num text-rose-400">
            {totalSwiped - acceptedCount}
          </span>
          <span className="swipe-empty-stat-label">Passed</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="swipe-empty-actions">
        <button
          type="button"
          className="swipe-empty-btn-reset"
          onClick={onReset}
        >
          <RotateCcw size={16} />
          <span>Swipe Again</span>
        </button>

        <Link href="/clips" className="swipe-empty-btn-clips">
          <ShoppingBag size={16} />
          <span>Review Created Clips</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </motion.div>
  );
});
