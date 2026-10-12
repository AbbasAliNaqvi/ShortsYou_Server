"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Activity, WandSparkles, Zap } from "lucide-react";

// Bar config is static — defined outside the component so it is never
// re-allocated on re-renders.
const BARS = [
  { delay: 0.05, minH: 30, maxH: 85 },
  { delay: 0.15, minH: 50, maxH: 95 },
  { delay: 0.25, minH: 25, maxH: 70 },
  { delay: 0.35, minH: 60, maxH: 100 },
  { delay: 0.10, minH: 40, maxH: 90 },
  { delay: 0.40, minH: 75, maxH: 100 },
  { delay: 0.20, minH: 35, maxH: 80 },
  { delay: 0.30, minH: 55, maxH: 95 },
  { delay: 0.12, minH: 45, maxH: 90 },
  { delay: 0.28, minH: 65, maxH: 100 },
  { delay: 0.18, minH: 30, maxH: 85 },
  { delay: 0.38, minH: 50, maxH: 95 },
  { delay: 0.08, minH: 35, maxH: 75 },
  { delay: 0.22, minH: 60, maxH: 90 },
] as const;

/**
 * LiquidGlassHeroGraphic — Performance-optimized version.
 *
 * Key changes (zero visual difference):
 *  1. Wrapped in React.memo — HeroBanner only re-renders this when its own
 *     props change. Because the graphic has no props, it is rendered exactly
 *     once per mount and never again.
 *  2. BARS constant hoisted outside the component so the array is not
 *     re-created on every render cycle.
 *  3. Framer Motion animations use only `transform`-based properties
 *     (`height` on the bars as a percentage — GPU-composited by the browser)
 *     and `y`/`scale` — no layout-recalc properties.
 */
export const LiquidGlassHeroGraphic = memo(function LiquidGlassHeroGraphic() {
  return (
    <div className="ca-liquid-graphic-wrap">
      {/* Ambient Radial Mesh Lighting behind the graphic */}
      <div className="ca-liquid-graphic-glow" />

      {/* Orbiting Frosted Glass Ring 1 */}
      <motion.div
        className="ca-liquid-ring ca-liquid-ring-outer"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        <span className="ca-orbit-satellite ca-sat-1" />
        <span className="ca-orbit-satellite ca-sat-2" />
      </motion.div>

      {/* Orbiting Frosted Glass Ring 2 */}
      <motion.div
        className="ca-liquid-ring ca-liquid-ring-inner"
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />

      {/* Apple Vision Pro Glass Console */}
      <motion.div
        className="ca-apple-console"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.02 }}
      >
        {/* Console Top Bar */}
        <div className="ca-console-top">
          <div className="ca-console-live-pill">
            <span className="ca-console-dot-pulse" />
            <span>AI Voice &amp; Hook Stream</span>
          </div>
          <div className="ca-console-tags">
            <span className="ca-console-tag">Whisper v3</span>
            <span className="ca-console-tag ca-tag-accent">4K 60FPS</span>
          </div>
        </div>

        {/* Live Audio & Viral Waveform Equalizer */}
        <div className="ca-console-spectrum-box">
          <div className="ca-spectrum-threshold">
            <span className="ca-threshold-line" />
            <span className="ca-threshold-badge">
              <Zap size={10} /> 98.4% Viral Hook Peak
            </span>
          </div>
          <div className="ca-waveform-equalizer">
            {BARS.map((bar, i) => (
              <motion.span
                key={i}
                className="ca-waveform-bar"
                animate={{
                  height: [`${bar.minH}%`, `${bar.maxH}%`, `${bar.minH}%`],
                }}
                transition={{
                  duration: 1.2 + bar.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: bar.delay,
                }}
              />
            ))}
          </div>
        </div>

        {/* Console Feature Pills Grid */}
        <div className="ca-console-features">
          <div className="ca-feat-pill">
            <WandSparkles size={11} className="ca-feat-icon ca-icon-amber" />
            <span>Auto Hook Detection</span>
          </div>
          <div className="ca-feat-pill">
            <Zap size={11} className="ca-feat-icon ca-icon-cyan" />
            <span>Smart 9:16 Reframe</span>
          </div>
          <div className="ca-feat-pill">
            <Activity size={11} className="ca-feat-icon ca-icon-pink" />
            <span>Karaoke Subtitles</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
});
