"use client";

import { useEffect, useState, useRef } from "react";
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
];

export interface CreatorPointerProps {
  user?: User | null;
}

export function CreatorPointer({ user }: CreatorPointerProps) {
  const [theme, setTheme] = useState<PointerTheme>(POINTER_THEMES[0]);
  const [currentUser, setCurrentUser] = useState<User | null>(user ?? null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const idx = Math.floor(Math.random() * POINTER_THEMES.length);
      setTheme(POINTER_THEMES[idx]);
    } catch {}

    const token = localStorage.getItem("shortsyou_jwt");
    if (!token) {
      setCurrentUser(null);
      return;
    }

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

      api.me(token)
        .then((data) => {
          if (data && (data.name || data.email)) {
            setCurrentUser(data);
          }
        })
        .catch(() => {});
    }
  }, [currentUser]);

  // Zero-react-render mouse tracking: updates DOM transform directly via GPU
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let targetX = -100;
    let targetY = -100;

    const onPointerMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        if (pointerRef.current) {
          pointerRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
          if (pointerRef.current.style.opacity !== "1") {
            pointerRef.current.style.opacity = "1";
          }
        }
        rafRef.current = null;
      });
    };

    const onMouseLeave = () => {
      if (pointerRef.current) {
        pointerRef.current.style.opacity = "0";
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const displayName =
    currentUser?.name ||
    currentUser?.channelName ||
    (currentUser?.email ? currentUser.email.split("@")[0] : null);

  // If no user is logged in, don't render any trailing DOM
  if (!displayName) return null;

  const avatarUrl = currentUser?.profilePicture;

  return (
    <div
      ref={pointerRef}
      className="fixed top-0 left-0 pointer-events-none z-[9999999] select-none will-change-transform opacity-0 transition-opacity duration-150"
      style={{
        transform: "translate3d(-100px, -100px, 0)",
      }}
      aria-hidden="true"
    >
      <div
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-white shadow-xl backdrop-blur-md"
        style={{
          backgroundColor: theme.pillBg,
          boxShadow: `0 4px 16px ${theme.glow}, 0 0 0 1px rgba(255, 255, 255, 0.25)`,
          transform: "translate(12px, 12px)",
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
    </div>
  );
}
