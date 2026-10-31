"use client";
/* eslint-disable @next/next/no-img-element */

import { memo, useEffect, useRef, useState, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  PanInfo,
} from "framer-motion";
import {
  Check,
  Flame,
  Volume2,
  VolumeX,
  Play,
  Wand2,
  X,
  Sparkles,
  Info,
  Clock,
  Send,
  Sliders,
} from "lucide-react";
import type { SwipeDirection, SwipeItem } from "./types";

export interface SwipeCardProps {
  item: SwipeItem;
  index: number; // 0 = active top card, 1 = behind, 2 = far behind
  isMuted: boolean;
  onToggleMute: () => void;
  onSwipe: (direction: SwipeDirection) => void;
  onOpenDetails: (item: SwipeItem) => void;
  onInstantEdit: (item: SwipeItem) => void;
  isProcessingAction?: boolean;
}

export const SwipeCard = memo(function SwipeCard({
  item,
  index,
  isMuted,
  onToggleMute,
  onSwipe,
  onOpenDetails,
  onInstantEdit,
  isProcessingAction = false,
}: SwipeCardProps) {
  const isTop = index === 0;
  const isSecond = index === 1;
  const isThird = index === 2;

  // Video playback reference & state
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Framer Motion motion values for 120fps hardware-accelerated drag with zero React state updates
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Dynamic transforms based on drag offset
  const rotate = useTransform(x, [-260, 260], [-16, 16]);
  const cardOpacity = useTransform(
    x,
    [-340, -220, 0, 220, 340],
    [0.2, 0.9, 1, 0.9, 0.2]
  );

  // Dynamic opacity transforms for Tinder action stamps
  const acceptStampOpacity = useTransform(x, [35, 120], [0, 1]);
  const acceptStampScale = useTransform(x, [35, 120], [0.85, 1.05]);

  const rejectStampOpacity = useTransform(x, [-35, -120], [0, 1]);
  const rejectStampScale = useTransform(x, [-35, -120], [0.85, 1.05]);

  const superStampOpacity = useTransform(y, [-35, -120], [0, 1]);
  const superStampScale = useTransform(y, [-35, -120], [0.85, 1.05]);

  // Autoplay management for active card
  useEffect(() => {
    if (!isTop) {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      return;
    }

    const video = videoRef.current;
    if (video) {
      video.muted = isMuted;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Autoplay with sound may be blocked by browser policy, fallback to muted
            video.muted = true;
            video.play().then(() => setIsPlaying(true)).catch(() => {});
          });
      }
    }
  }, [isTop, isMuted]);

  // Synchronize mute changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      const video = videoRef.current;
      if (!video) return;
      if (video.paused) {
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      } else {
        video.pause();
        setIsPlaying(false);
      }
    },
    []
  );

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration || !progressRef.current) return;
    const pct = (video.currentTime / video.duration) * 100;
    progressRef.current.style.width = `${pct}%`;
  }, []);

  // Drag finish evaluation: left = reject, right = accept, up = instant edit
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!isTop) return;
      const swipeThreshold = 120;
      const velocityThreshold = 400;

      if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
        // Fly out to the right (Accept / Create)
        animate(x, 600, { duration: 0.28, ease: "easeOut" }).then(() => {
          onSwipe("right");
        });
      } else if (
        info.offset.x < -swipeThreshold ||
        info.velocity.x < -velocityThreshold
      ) {
        // Fly out to the left (Reject / Pass)
        animate(x, -600, { duration: 0.28, ease: "easeOut" }).then(() => {
          onSwipe("left");
        });
      } else if (
        info.offset.y < -swipeThreshold ||
        info.velocity.y < -velocityThreshold
      ) {
        // Fly out to the top (Super Edit)
        animate(y, -600, { duration: 0.28, ease: "easeOut" }).then(() => {
          onSwipe("up");
        });
      } else {
        // Spring smoothly back to center
        animate(x, 0, { type: "spring", stiffness: 450, damping: 28 });
        animate(y, 0, { type: "spring", stiffness: 450, damping: 28 });
      }
    },
    [isTop, onSwipe, x, y]
  );

  // Background stack layered styling (mimicking the reference image depth)
  const stackStyle = isTop
    ? {
        zIndex: 30,
        cursor: "grab",
      }
    : isSecond
    ? {
        zIndex: 20,
        transform: "translateY(16px) scale(0.94) rotate(3.2deg)",
        opacity: 0.72,
        pointerEvents: "none" as const,
        filter: "brightness(0.85) contrast(0.95)",
      }
    : isThird
    ? {
        zIndex: 10,
        transform: "translateY(30px) scale(0.88) rotate(-3.5deg)",
        opacity: 0.38,
        pointerEvents: "none" as const,
        filter: "brightness(0.7) blur(0.5px)",
      }
    : {
        display: "none",
      };

  return (
    <motion.div
      className="swipe-card-root"
      style={{
        ...stackStyle,
        ...(isTop ? { x, y, rotate, opacity: cardOpacity } : {}),
      }}
      drag={isTop ? true : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: "grabbing" }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Dynamic Tinder Decision Stamps Overlay */}
      {isTop && (
        <>
          {/* ACCEPT / CREATE SHORT STAMP (Right Swipe) */}
          <motion.div
            className="swipe-stamp-badge swipe-stamp-accept"
            style={{
              opacity: acceptStampOpacity,
              scale: acceptStampScale,
            }}
          >
            <div className="swipe-stamp-inner">
              <Check size={24} strokeWidth={3.5} />
              <span>CREATE SHORT</span>
            </div>
          </motion.div>

          {/* REJECT / PASS STAMP (Left Swipe) */}
          <motion.div
            className="swipe-stamp-badge swipe-stamp-reject"
            style={{
              opacity: rejectStampOpacity,
              scale: rejectStampScale,
            }}
          >
            <div className="swipe-stamp-inner">
              <X size={24} strokeWidth={3.5} />
              <span>PASS</span>
            </div>
          </motion.div>

          {/* SUPER EDIT STAMP (Up Swipe) */}
          <motion.div
            className="swipe-stamp-badge swipe-stamp-super"
            style={{
              opacity: superStampOpacity,
              scale: superStampScale,
            }}
          >
            <div className="swipe-stamp-inner">
              <Sparkles size={24} strokeWidth={3} />
              <span>SUPER CREATE</span>
            </div>
          </motion.div>
        </>
      )}

      {/* CARD CONTENT CONTAINER */}
      <div className="swipe-card-shell">
        {/* TOP FLOATING BUBBLE (Exact match to reference image pill with icon & "You" cursor tag) */}
        <div className="swipe-card-top-bubble">
          <div className="swipe-bubble-pill">
            <span className="swipe-bubble-text">
              {item.viralScore >= 95
                ? "This is amazing, let's make it fill and push it to production"
                : `AI detected ${item.viralScore}% viral hook. Ready to auto-render.`}
            </span>
            <div className="swipe-bubble-icons">
              <span className="swipe-bubble-emoji">✨</span>
              <span className="swipe-bubble-at">@</span>
              <span className="swipe-bubble-dot-indicator" />
              <button
                className="swipe-bubble-send-btn"
                title="Super Generate"
                onClick={(e) => {
                  e.stopPropagation();
                  onInstantEdit(item);
                }}
              >
                <Send size={12} />
              </button>
            </div>
          </div>

          {/* Reference Image "You" cursor tag */}
          <div className="swipe-card-you-cursor">
            <svg
              className="swipe-cursor-arrow"
              viewBox="0 0 16 16"
              width="14"
              height="14"
              fill="none"
            >
              <path
                d="M1 1L6.5 14.5L8.5 9.5L13.5 7.5L1 1Z"
                fill="#facc15"
                stroke="#18181b"
                strokeWidth="1.2"
              />
            </svg>
            <span className="swipe-cursor-label">You</span>
          </div>
        </div>

        {/* CENTER VIDEO & GRAPHIC CANVAS */}
        <div className="swipe-video-frame" onClick={togglePlay}>
          {/* Looping Video Player */}
          {item.playableUrl ? (
            <video
              ref={videoRef}
              src={item.playableUrl}
              poster={item.thumbnailUrl}
              className="swipe-video-player"
              loop
              playsInline
              preload={isTop || isSecond ? "auto" : "metadata"}
              onTimeUpdate={handleTimeUpdate}
            />
          ) : (
            <img
              src={item.thumbnailUrl}
              alt={item.hookText}
              className="swipe-video-player swipe-video-thumb"
            />
          )}

          {/* Subtle Vector Curve Overlay (Matching the geometric vector graphic in the reference image) */}
          <div className="swipe-vector-nodes-overlay">
            <svg
              viewBox="0 0 200 240"
              className="swipe-vector-svg"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Linked geometric loops matching the reference image graphic */}
              <circle
                cx="100"
                cy="70"
                r="36"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <circle
                cx="100"
                cy="140"
                r="36"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="1.5"
              />
              <circle
                cx="135"
                cy="140"
                r="28"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1.5"
              />
              <circle cx="135" cy="112" r="3" fill="#facc15" />
              <circle cx="163" cy="140" r="3" fill="#facc15" />
              <circle cx="135" cy="168" r="3" fill="#facc15" />
              <circle cx="107" cy="140" r="3" fill="#facc15" />
            </svg>
          </div>

          {/* Top Video Gradient Shadow & Badges */}
          <div className="swipe-video-gradient-top">
            {/* Category Chip */}
            <div className="swipe-cat-badge">
              <Flame size={12} className="text-amber-400" />
              <span>{item.category.replace(/_/g, " ").toUpperCase()}</span>
            </div>

            {/* Audio & Sound Toggle */}
            <div className="swipe-audio-cluster">
              <button
                type="button"
                className="swipe-icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMute();
                }}
                title={isMuted ? "Unmute audio" : "Mute audio"}
              >
                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>

              <button
                type="button"
                className="swipe-icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetails(item);
                }}
                title="AI Viral Breakdown"
              >
                <Info size={15} />
              </button>
            </div>
          </div>

          {/* Center Play/Pause Pulsing Watermark (visible briefly when paused) */}
          {!isPlaying && isTop && (
            <div className="swipe-play-indicator">
              <Play size={28} className="translate-x-0.5" />
            </div>
          )}

          {/* Scrubbing Timeline Progress Line */}
          <div className="swipe-video-progress-bar">
            <div
              ref={progressRef}
              className="swipe-progress-fill"
              style={{ width: "0%" }}
            />
          </div>
        </div>

        {/* BOTTOM METADATA & CTA ACTION (Matching reference image typography & "Get started" button) */}
        <div className="swipe-card-footer">
          {/* Viral Score & Duration Chips */}
          <div className="swipe-chips-row">
            <span className="swipe-chip-score">
              <Flame size={13} />
              <span>{item.viralScore}/100 VIRAL INDEX</span>
            </span>
            <span className="swipe-chip-dur">
              <Clock size={12} />
              <span>{item.durationSeconds}s</span>
            </span>
            {item.audioTrackTitle && (
              <span className="swipe-chip-audio">
                <span className="swipe-wave-bar bar-1" />
                <span className="swipe-wave-bar bar-2" />
                <span className="swipe-wave-bar bar-3" />
                <span>{item.audioTrackTitle}</span>
              </span>
            )}
          </div>

          {/* Large Title (Hook) */}
          <h2 className="swipe-card-title">{item.hookText}</h2>

          {/* Subtitle / Rationale */}
          <p className="swipe-card-desc">{item.reasoning}</p>

          {/* Primary CTA Button ("Get started" pill button from reference image) */}
          <div className="swipe-cta-container">
            <button
              type="button"
              className="swipe-get-started-btn"
              onClick={(e) => {
                e.stopPropagation();
                onSwipe("right");
              }}
              disabled={isProcessingAction}
            >
              {isProcessingAction ? (
                <>
                  <Wand2 size={16} className="animate-spin" />
                  <span>Queueing Short…</span>
                </>
              ) : (
                <>
                  <span>Create Short</span>
                  <Sparkles size={15} />
                </>
              )}
            </button>

            <button
              type="button"
              className="swipe-edit-trigger-btn"
              onClick={(e) => {
                e.stopPropagation();
                onInstantEdit(item);
              }}
              title="Customize Hook, Music & Captions"
            >
              <Sliders size={15} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
