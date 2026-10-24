"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { User } from "@/lib/api";
import { api } from "@/lib/api";

export interface PointerTheme {
  name: string;
  fill: string;
  stroke: string;
  pillBg: string;
  hoverBg: string;
  glow: string;
  hoverGlow: string;
}

export const POINTER_THEMES: PointerTheme[] = [
  {
    name: "Electric Cyan",
    fill: "#0284c7",
    stroke: "#38bdf8",
    pillBg: "#0284c7",
    hoverBg: "#0369a1",
    glow: "rgba(2, 132, 199, 0.55)",
    hoverGlow: "rgba(2, 132, 199, 0.8)",
  },
  {
    name: "Cyber Violet",
    fill: "#7c3aed",
    stroke: "#c084fc",
    pillBg: "#7c3aed",
    hoverBg: "#6d28d9",
    glow: "rgba(124, 58, 237, 0.55)",
    hoverGlow: "rgba(124, 58, 237, 0.8)",
  },
  {
    name: "Hot Magenta",
    fill: "#db2777",
    stroke: "#f472b6",
    pillBg: "#db2777",
    hoverBg: "#be185d",
    glow: "rgba(219, 39, 119, 0.55)",
    hoverGlow: "rgba(219, 39, 119, 0.8)",
  },
  {
    name: "Neon Emerald",
    fill: "#059669",
    stroke: "#34d399",
    pillBg: "#059669",
    hoverBg: "#047857",
    glow: "rgba(5, 150, 105, 0.55)",
    hoverGlow: "rgba(5, 150, 105, 0.8)",
  },
  {
    name: "Sunset Orange",
    fill: "#ea580c",
    stroke: "#fb923c",
    pillBg: "#ea580c",
    hoverBg: "#c2410c",
    glow: "rgba(234, 88, 12, 0.55)",
    hoverGlow: "rgba(234, 88, 12, 0.8)",
  },
  {
    name: "Crimson Flame",
    fill: "#e11d48",
    stroke: "#fb7185",
    pillBg: "#e11d48",
    hoverBg: "#be123c",
    glow: "rgba(225, 29, 72, 0.55)",
    hoverGlow: "rgba(225, 29, 72, 0.8)",
  },
  {
    name: "Deep Indigo",
    fill: "#4f46e5",
    stroke: "#818cf8",
    pillBg: "#4f46e5",
    hoverBg: "#4338ca",
    glow: "rgba(79, 70, 229, 0.55)",
    hoverGlow: "rgba(79, 70, 229, 0.8)",
  },
  {
    name: "Electric Aqua",
    fill: "#0d9488",
    stroke: "#2dd4bf",
    pillBg: "#0d9488",
    hoverBg: "#0f766e",
    glow: "rgba(13, 148, 136, 0.55)",
    hoverGlow: "rgba(13, 148, 136, 0.8)",
  },
];

export interface CreatorPointerProps {
  user?: User | null;
}

export function CreatorPointer({ user }: CreatorPointerProps) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<PointerTheme>(POINTER_THEMES[0]);
  const [isVisible, setIsVisible] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [currentUser, setCurrentUser] = useState<User | null>(user ?? null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;

    // Pick a new, fresh color on every refresh
    try {
      const prevIdx = Number(sessionStorage.getItem("shortsyou_pointer_theme_idx") ?? "-1");
      let nextIdx = Math.floor(Math.random() * POINTER_THEMES.length);
      if (nextIdx === prevIdx) {
        nextIdx = (nextIdx + 1) % POINTER_THEMES.length;
      }
      sessionStorage.setItem("shortsyou_pointer_theme_idx", String(nextIdx));
      setTheme(POINTER_THEMES[nextIdx]);
    } catch {
      setTheme(POINTER_THEMES[Math.floor(Math.random() * POINTER_THEMES.length)]);
    }

    if (window.matchMedia("(pointer: coarse)").matches) return;

    // Enable global cursor: none so custom pointer is the only cursor
    document.documentElement.classList.add("custom-cursor-active");

    return () => {
      document.documentElement.classList.remove("custom-cursor-active");
    };
  }, []);

  // Sync user prop
  useEffect(() => {
    if (user) {
      setCurrentUser(user);
      try {
        localStorage.setItem("shortsyou_user", JSON.stringify(user));
      } catch {}
    }
  }, [user]);

  // Read cached user or fetch from api.me
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!currentUser) {
      const cached = localStorage.getItem("shortsyou_user");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && (parsed.name || parsed.email)) {
            setCurrentUser(parsed);
          }
        } catch {}
      }

      const token = localStorage.getItem("shortsyou_jwt");
      if (token) {
        api.me(token)
          .then((data) => {
            if (data && (data.name || data.email)) {
              setCurrentUser(data);
              try {
                localStorage.setItem("shortsyou_user", JSON.stringify(data));
              } catch {}
            }
          })
          .catch(() => {});
      }
    }

    const handleUserUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<User>;
      if (customEvent.detail) {
        setCurrentUser(customEvent.detail);
      }
    };
    window.addEventListener("shortsyou_user_updated", handleUserUpdate);
    return () => {
      window.removeEventListener("shortsyou_user_updated", handleUserUpdate);
    };
  }, [currentUser]);

  // Zero-latency hardware-synchronized tracking of mouse coordinates
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const handlePointerMove = (e: PointerEvent) => {
      const clientX = e.clientX;
      const clientY = e.clientY;

      if (!isVisible) setIsVisible(true);

      // Check if hovering interactive clickable element
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = Boolean(
          target.closest("button, a, input, select, textarea, [role='button'], [onclick], .ca-glass-circle-btn")
        );
        setIsHovering(interactive);
      }

      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }

      frameRef.current = requestAnimationFrame(() => {
        setPos({ x: clientX, y: clientY });
        frameRef.current = null;
      });
    };

    const handlePointerDown = () => setIsClicking(true);
    const handlePointerUp = () => setIsClicking(false);

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isVisible]);

  if (!mounted) return null;
  if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
    return null;
  }

  const displayName =
    currentUser?.name ||
    currentUser?.channelName ||
    (currentUser?.email ? currentUser.email.split("@")[0] : "Abbas Ali");

  const avatarUrl = currentUser?.profilePicture;

  return (
    <AnimatePresence>
      {isVisible && (
        <div
          className="fixed top-0 left-0 pointer-events-none z-[9999999] select-none will-change-transform"
          style={{
            transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
          }}
        >
          <motion.div
            animate={{
              scale: isClicking ? 0.88 : isHovering ? 1.08 : 1,
            }}
            transition={{ duration: 0.1, ease: "easeOut" }}
            className="relative"
          >
            {/* Aceternity directional cursor arrow */}
            <svg
              viewBox="0 0 16 16"
              className="h-6 w-6 -translate-x-[11px] -translate-y-[9px] -rotate-[70deg] transform"
              style={{
                filter: `drop-shadow(0 2px 10px ${theme.glow})`,
              }}
              height="1em"
              width="1em"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103z"
                fill={theme.fill}
                stroke={theme.stroke}
                strokeWidth="1.2"
              />
            </svg>

            {/* Aceternity Pill with Logged-in User Name & Avatar */}
            <div
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-white shadow-xl backdrop-blur-md transition-all duration-150"
              style={{
                backgroundColor: isHovering ? theme.hoverBg : theme.pillBg,
                boxShadow: isHovering
                  ? `0 6px 22px ${theme.hoverGlow}, 0 0 0 1px rgba(255, 255, 255, 0.4)`
                  : `0 4px 16px ${theme.glow}, 0 0 0 1px rgba(255, 255, 255, 0.25)`,
                transform: "translate(6px, 4px)",
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-4 h-4 rounded-full object-cover border border-white/60"
                />
              ) : (
                <span className="w-4 h-4 rounded-full bg-white/25 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                  {displayName.charAt(0)}
                </span>
              )}
              <span className="tracking-wide text-[11px] font-medium">{displayName}</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
