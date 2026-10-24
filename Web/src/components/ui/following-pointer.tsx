"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValue } from "motion/react";
import { cn } from "@/lib/utils";

export const FollowerPointerCard = ({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string | React.ReactNode;
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const ref = React.useRef<HTMLDivElement>(null);
  const [isInside, setIsInside] = useState<boolean>(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (ref.current) {
      const currentRect = ref.current.getBoundingClientRect();
      x.set(e.clientX - currentRect.left);
      y.set(e.clientY - currentRect.top);
    }
  };

  const handleMouseLeave = () => {
    setIsInside(false);
  };

  const handleMouseEnter = () => {
    setIsInside(true);
  };

  return (
    <div
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      style={{
        cursor: "none",
      }}
      ref={ref}
      className={cn("relative", className)}
    >
      <AnimatePresence>
        {isInside && <FollowPointer x={x} y={y} title={title} />}
      </AnimatePresence>
      {children}
    </div>
  );
};

export const FollowPointer = ({
  x,
  y,
  title,
}: {
  x: any;
  y: any;
  title?: string | React.ReactNode;
}) => {
  const [currentName, setCurrentName] = useState<string>("Abbas Ali");
  const [currentAvatar, setCurrentAvatar] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("shortsyou_user");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed?.name) setCurrentName(parsed.name);
          if (parsed?.profilePicture) setCurrentAvatar(parsed.profilePicture);
        } catch {}
      }
    }
  }, []);

  const colors = [
    "#0284c7",
    "#7c3aed",
    "#db2777",
    "#059669",
    "#ea580c",
    "#e11d48",
    "#4f46e5",
    "#0d9488",
  ];
  const [currentColor, setCurrentColor] = useState<string>(colors[0]);

  useEffect(() => {
    setCurrentColor(colors[Math.floor(Math.random() * colors.length)]);
  }, []);

  return (
    <motion.div
      className="absolute z-50 h-4 w-4 rounded-full pointer-events-none"
      style={{
        top: y,
        left: x,
      }}
      initial={{
        scale: 1,
        opacity: 1,
      }}
      animate={{
        scale: 1,
        opacity: 1,
      }}
      exit={{
        scale: 0,
        opacity: 0,
      }}
    >
      <svg
        stroke="currentColor"
        fill="currentColor"
        strokeWidth="1"
        viewBox="0 0 16 16"
        className="h-6 w-6 -translate-x-[12px] -translate-y-[10px] -rotate-[70deg] transform drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
        style={{ color: currentColor }}
        height="1em"
        width="1em"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103z" />
      </svg>
      <motion.div
        style={{
          backgroundColor: currentColor,
        }}
        initial={{
          scale: 0.5,
          opacity: 0,
        }}
        animate={{
          scale: 1,
          opacity: 1,
        }}
        exit={{
          scale: 0.5,
          opacity: 0,
        }}
        className={
          "min-w-max rounded-full px-2.5 py-1 text-xs whitespace-nowrap text-white font-medium shadow-lg flex items-center gap-1.5"
        }
      >
        {title || (
          <div className="flex items-center gap-1.5">
            {currentAvatar ? (
              <img
                src={currentAvatar}
                alt={currentName}
                className="w-3.5 h-3.5 rounded-full object-cover border border-white/60"
              />
            ) : (
              <span className="w-3.5 h-3.5 rounded-full bg-white/25 flex items-center justify-center text-[9px] font-bold text-white uppercase">
                {currentName.charAt(0)}
              </span>
            )}
            <span>{currentName}</span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
