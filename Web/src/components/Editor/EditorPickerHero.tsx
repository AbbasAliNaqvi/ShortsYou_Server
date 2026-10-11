"use client";

import { motion } from "framer-motion";
import { Clapperboard, Sparkles, WandSparkles } from "lucide-react";

export interface EditorPickerHeroProps {
  videoCount: number;
}

export function EditorPickerHero({ videoCount }: EditorPickerHeroProps) {
  return (
    <motion.section
      className="ca-editor-hero ca-glass"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="ca-editor-hero-top">
        <span className="ca-editor-kicker">
          <WandSparkles size={13} />
          <span>Custom Short Studio</span>
        </span>

        {videoCount > 0 && (
          <span className="ca-stat-chip">
            <Clapperboard size={12} />
            <strong>{videoCount}</strong> Available Video{videoCount === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <h1 className="ca-editor-headline">
        Choose footage,<br />
        <span className="ca-headline-gradient">then make it yours.</span>
      </h1>

      <p className="ca-editor-subtext">
        Select a saved video to set the exact moment, framing, face layout, captions, music,
        and finishing treatment before rendering your short.
      </p>
    </motion.section>
  );
}
