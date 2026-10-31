"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Flame,
  Clock,
  Sparkles,
  TrendingUp,
  Brain,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import type { SwipeItem } from "./types";

export interface SwipeInsightsModalProps {
  item: SwipeItem | null;
  onClose: () => void;
  onAccept: (item: SwipeItem) => void;
  onEdit: (item: SwipeItem) => void;
}

export const SwipeInsightsModal = memo(function SwipeInsightsModal({
  item,
  onClose,
  onAccept,
  onEdit,
}: SwipeInsightsModalProps) {
  if (!item) return null;

  const scores = item.scores || {
    emotion: 0.92,
    semanticImpact: 0.95,
    speechEmphasis: 0.9,
    clarity: 0.94,
    novelty: 0.91,
    trendAlignment: 0.96,
  };

  return (
    <AnimatePresence>
      <div className="swipe-modal-backdrop" onClick={onClose}>
        <motion.div
          className="swipe-modal-dialog"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
        >
          {/* Header */}
          <div className="swipe-modal-header">
            <div className="swipe-modal-title-wrap">
              <span className="swipe-modal-badge">
                <Brain size={14} className="text-amber-400" />
                <span>AI VIRAL INTELLIGENCE</span>
              </span>
              <h3 className="swipe-modal-title">{item.hookText}</h3>
            </div>
            <button
              type="button"
              className="swipe-modal-close"
              onClick={onClose}
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="swipe-modal-body">
            {/* Quick Stats Pill Grid */}
            <div className="swipe-modal-stats-grid">
              <div className="swipe-stat-card">
                <span className="swipe-stat-label">Viral Index</span>
                <div className="swipe-stat-value text-amber-400">
                  <Flame size={18} />
                  <span>{item.viralScore}/100</span>
                </div>
              </div>
              <div className="swipe-stat-card">
                <span className="swipe-stat-label">Clip Length</span>
                <div className="swipe-stat-value text-cyan-400">
                  <Clock size={16} />
                  <span>{item.durationSeconds}s</span>
                </div>
              </div>
              <div className="swipe-stat-card">
                <span className="swipe-stat-label">Category</span>
                <div className="swipe-stat-value text-emerald-400">
                  <TrendingUp size={16} />
                  <span>{item.category.replace(/_/g, " ")}</span>
                </div>
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="swipe-modal-section">
              <h4 className="swipe-section-heading">
                <Sparkles size={14} className="text-amber-400" />
                <span>Algorithmic Retention Analysis</span>
              </h4>
              <p className="swipe-reasoning-text">{item.reasoning}</p>
            </div>

            {/* Granular Viral Vectors */}
            <div className="swipe-modal-section">
              <h4 className="swipe-section-heading">
                <TrendingUp size={14} className="text-cyan-400" />
                <span>Neural Engagement Vectors</span>
              </h4>
              <div className="swipe-vectors-list">
                <div className="swipe-vector-item">
                  <div className="swipe-vector-header">
                    <span>Hook Impact & Dopamine Peak</span>
                    <b>{Math.round(scores.emotion * 100)}%</b>
                  </div>
                  <div className="swipe-vector-bar">
                    <div
                      className="swipe-vector-fill bg-rose-500"
                      style={{ width: `${scores.emotion * 100}%` }}
                    />
                  </div>
                </div>

                <div className="swipe-vector-item">
                  <div className="swipe-vector-header">
                    <span>Speech Pacing & Cadence</span>
                    <b>{Math.round(scores.speechEmphasis * 100)}%</b>
                  </div>
                  <div className="swipe-vector-bar">
                    <div
                      className="swipe-vector-fill bg-amber-500"
                      style={{ width: `${scores.speechEmphasis * 100}%` }}
                    />
                  </div>
                </div>

                <div className="swipe-vector-item">
                  <div className="swipe-vector-header">
                    <span>Trend Alignment & Algorithm Fit</span>
                    <b>{Math.round(scores.trendAlignment * 100)}%</b>
                  </div>
                  <div className="swipe-vector-bar">
                    <div
                      className="swipe-vector-fill bg-emerald-500"
                      style={{ width: `${scores.trendAlignment * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="swipe-modal-tags">
                {item.tags.map((tag) => (
                  <span key={tag} className="swipe-modal-tag">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="swipe-modal-footer">
            <button
              type="button"
              className="swipe-modal-btn-edit"
              onClick={() => {
                onEdit(item);
                onClose();
              }}
            >
              <Sliders size={16} />
              <span>Open in Custom Editor</span>
            </button>
            <button
              type="button"
              className="swipe-modal-btn-accept"
              onClick={() => {
                onAccept(item);
                onClose();
              }}
            >
              <CheckCircle2 size={16} />
              <span>Accept & Create Short</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
});
