"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import {
  RotateCcw,
  X,
  Sparkles,
  Flame,
  Volume2,
  VolumeX,
} from "lucide-react";

export interface SwipeControlsProps {
  canUndo: boolean;
  onUndo: () => void;
  onReject: () => void;
  onSuperCreate: () => void;
  onAccept: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  disabled?: boolean;
}

export const SwipeControls = memo(function SwipeControls({
  canUndo,
  onUndo,
  onReject,
  onSuperCreate,
  onAccept,
  isMuted,
  onToggleMute,
  disabled = false,
}: SwipeControlsProps) {
  return (
    <div className="swipe-controls-dock">
      {/* 1. REWIND / UNDO BUTTON */}
      <motion.button
        type="button"
        className={`swipe-ctrl-btn swipe-ctrl-rewind ${
          !canUndo || disabled ? "disabled" : ""
        }`}
        onClick={onUndo}
        disabled={!canUndo || disabled}
        title="Undo last swipe (Key: Z)"
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.9 }}
      >
        <RotateCcw size={18} />
      </motion.button>

      {/* 2. REJECT / PASS BUTTON (Red X) */}
      <motion.button
        type="button"
        className={`swipe-ctrl-btn swipe-ctrl-reject ${disabled ? "disabled" : ""}`}
        onClick={onReject}
        disabled={disabled}
        title="Pass / Reject (Key: ← or A)"
        whileHover={{ scale: 1.16 }}
        whileTap={{ scale: 0.88 }}
      >
        <X size={26} strokeWidth={2.8} />
      </motion.button>

      {/* 3. SUPER CREATE BUTTON (Cyan Sparkles) */}
      <motion.button
        type="button"
        className={`swipe-ctrl-btn swipe-ctrl-super ${disabled ? "disabled" : ""}`}
        onClick={onSuperCreate}
        disabled={disabled}
        title="Super Create & Edit (Key: ↑ or W)"
        whileHover={{ scale: 1.14 }}
        whileTap={{ scale: 0.9 }}
      >
        <Sparkles size={20} />
      </motion.button>

      {/* 4. ACCEPT / CREATE BUTTON (Green Flame) */}
      <motion.button
        type="button"
        className={`swipe-ctrl-btn swipe-ctrl-accept ${disabled ? "disabled" : ""}`}
        onClick={onAccept}
        disabled={disabled}
        title="Accept & Create Short (Key: → or D)"
        whileHover={{ scale: 1.18 }}
        whileTap={{ scale: 0.88 }}
      >
        <Flame size={28} className="fill-current" />
      </motion.button>

      {/* 5. AUDIO SOUND TOGGLE */}
      <motion.button
        type="button"
        className="swipe-ctrl-btn swipe-ctrl-sound"
        onClick={onToggleMute}
        title={isMuted ? "Unmute audio (Key: M)" : "Mute audio (Key: M)"}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.9 }}
      >
        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </motion.button>
    </div>
  );
});
