"use client";

import { useMotionValue, motion, useMotionTemplate } from "framer-motion";
import React, { MouseEvent as ReactMouseEvent } from "react";
import { cn } from "@/lib/utils";

export interface CardSpotlightProps extends React.HTMLAttributes<HTMLDivElement> {
  radius?: number;
  color?: string;
  children: React.ReactNode;
}

export const CardSpotlight = ({
  children,
  radius = 350,
  color = "rgba(6, 182, 212, 0.09)",
  className,
  ...props
}: CardSpotlightProps) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: ReactMouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className={cn(
        "group/spotlight relative overflow-hidden rounded-[26px] p-6 transition-all duration-300",
        "bg-white/85 backdrop-blur-[30px] border border-white/90 shadow-[0_20px_48px_-12px_rgba(15,23,42,0.05),0_4px_14px_-2px_rgba(15,23,42,0.02)]",
        className
      )}
      onMouseMove={handleMouseMove}
      {...props}
    >
      {/* Dynamic Aceternity Radial Spotlight on Mouse Hover */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[26px] opacity-0 transition duration-300 group-hover/spotlight:opacity-100 z-0"
        style={{
          backgroundColor: color,
          maskImage: useMotionTemplate`
            radial-gradient(
              ${radius}px circle at ${mouseX}px ${mouseY}px,
              white,
              transparent 80%
            )
          `,
          WebkitMaskImage: useMotionTemplate`
            radial-gradient(
              ${radius}px circle at ${mouseX}px ${mouseY}px,
              white,
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};
