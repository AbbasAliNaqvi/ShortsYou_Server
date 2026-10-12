"use client";

import React, { memo } from "react";

// Cascading fluid wave ribbons with individual multi-directional trajectories, gradients, and speeds
const WAVES = [
  {
    id: "wave-amber",
    trajectoryClass: "wave-trajectory-diag-left",
    gradientId: "grad-amber",
    stop1: "#f59e0b",
    stop2: "#fbbf24",
    stop3: "rgba(245, 158, 11, 0)",
    opacity: 0.55,
    duration: "17s",
    delay: "0s",
    blur: "20px",
    height: 460,
    path: "M0,100 C360,220, 680,20, 1020,160 C1340,290, 1560,70, 1800,180 L1800,480 L0,480 Z",
  },
  {
    id: "wave-indigo",
    trajectoryClass: "wave-trajectory-diag-right",
    gradientId: "grad-indigo",
    stop1: "#6366f1",
    stop2: "#a855f7",
    stop3: "rgba(99, 102, 241, 0)",
    opacity: 0.52,
    duration: "22s",
    delay: "-6s",
    blur: "24px",
    height: 480,
    path: "M0,140 C280,30, 590,240, 920,80 C1220,-30, 1520,220, 1800,110 L1800,520 L0,520 Z",
  },
  {
    id: "wave-cyan",
    trajectoryClass: "wave-trajectory-side-left",
    gradientId: "grad-cyan",
    stop1: "#06b6d4",
    stop2: "#3b82f6",
    stop3: "rgba(6, 182, 212, 0)",
    opacity: 0.48,
    duration: "19s",
    delay: "-11s",
    blur: "22px",
    height: 430,
    path: "M0,80 C340,230, 640,40, 960,170 C1280,310, 1560,90, 1800,140 L1800,460 L0,460 Z",
  },
  {
    id: "wave-rose",
    trajectoryClass: "wave-trajectory-side-right",
    gradientId: "grad-rose",
    stop1: "#f43f5e",
    stop2: "#ec4899",
    stop3: "rgba(244, 63, 94, 0)",
    opacity: 0.50,
    duration: "24s",
    delay: "-15s",
    blur: "24px",
    height: 470,
    path: "M0,160 C320,50, 620,260, 940,110 C1260,-40, 1540,190, 1800,160 L1800,500 L0,500 Z",
  },
  {
    id: "wave-emerald",
    trajectoryClass: "wave-trajectory-serpentine",
    gradientId: "grad-emerald",
    stop1: "#10b981",
    stop2: "#14b8a6",
    stop3: "rgba(16, 185, 129, 0)",
    opacity: 0.46,
    duration: "20s",
    delay: "-8s",
    blur: "26px",
    height: 450,
    path: "M0,110 C380,20, 710,230, 1040,80 C1360,-60, 1600,180, 1800,130 L1800,470 L0,470 Z",
  },
  {
    id: "wave-gold",
    trajectoryClass: "wave-trajectory-cross-drift",
    gradientId: "grad-gold",
    stop1: "#eab308",
    stop2: "#fb923c",
    stop3: "rgba(234, 179, 8, 0)",
    opacity: 0.48,
    duration: "18s",
    delay: "-13s",
    blur: "20px",
    height: 420,
    path: "M0,90 C300,240, 600,50, 920,180 C1240,320, 1550,60, 1800,150 L1800,450 L0,450 Z",
  },
  {
    id: "wave-purple",
    trajectoryClass: "wave-trajectory-diag-left",
    gradientId: "grad-purple",
    stop1: "#8b5cf6",
    stop2: "#c084fc",
    stop3: "rgba(139, 92, 246, 0)",
    opacity: 0.48,
    duration: "21s",
    delay: "-9s",
    blur: "22px",
    height: 440,
    path: "M0,130 C350,10, 650,220, 970,90 C1250,-20, 1500,210, 1800,120 L1800,480 L0,480 Z",
  },
  {
    id: "wave-coral",
    trajectoryClass: "wave-trajectory-side-left",
    gradientId: "grad-coral",
    stop1: "#fb7185",
    stop2: "#f59e0b",
    stop3: "rgba(251, 113, 133, 0)",
    opacity: 0.45,
    duration: "16s",
    delay: "-4s",
    blur: "20px",
    height: 410,
    path: "M0,100 C310,230, 590,30, 890,160 C1190,280, 1420,80, 1800,140 L1800,460 L0,460 Z",
  },
] as const;

/**
 * FallingColorBackground — Performance-optimized version.
 *
 * Key changes vs. original (zero visual difference):
 *  1. Wrapped in React.memo — parent re-renders (WorkspaceShell state changes)
 *     no longer re-render this subtree at all; wave/glow DOM is truly static.
 *  2. Ambient glow divs promoted to their own GPU composite layer via
 *     `transform: translateZ(0)` (injected via the `ambient-composite` class
 *     in the performance CSS additions). This prevents background blurs from
 *     being repainted on every scroll or interaction.
 *  3. `will-change: transform` is already set on `.falling-wave-ribbon` in
 *     the existing CSS — left as-is.
 *  4. No functional or visual changes.
 */
const FallingColorBackground = memo(function FallingColorBackground() {
  return (
    <>
      {/* Rich Multi-color Ambient Background Lighting */}
      <div className="ambient-glow-left-warm ambient-composite" />
      <div className="ambient-glow-top-right ambient-composite" />
      <div className="ambient-glow-bottom ambient-composite" />
      <div className="ambient-glow-rose ambient-composite" />
      <div className="ambient-glow-emerald ambient-composite" />

      {/* Cascading Multi-directional Color Waves Container */}
      <div className="falling-waves-container" aria-hidden="true">
        {WAVES.map((w) => (
          <div
            key={w.id}
            className={`falling-wave-ribbon ${w.trajectoryClass}`}
            style={{
              height: `${w.height}px`,
              filter: `blur(${w.blur})`,
              opacity: w.opacity,
              animationDuration: w.duration,
              animationDelay: w.delay,
            }}
          >
            <svg
              className="wave-svg-graphic"
              viewBox="0 0 1800 480"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id={w.gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={w.stop1} stopOpacity="0.85" />
                  <stop offset="50%" stopColor={w.stop2} stopOpacity="0.45" />
                  <stop offset="100%" stopColor={w.stop3} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={w.path} fill={`url(#${w.gradientId})`} />
            </svg>
          </div>
        ))}
      </div>
    </>
  );
});

export default FallingColorBackground;
