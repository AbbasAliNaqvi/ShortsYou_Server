"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { motion } from "framer-motion";

export const BackgroundGradient = ({
  children,
  className,
  containerClassName,
  animate = true,
}: {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  animate?: boolean;
}) => {
  const variants = {
    initial: {
      backgroundPosition: "0 50%",
    },
    animate: {
      backgroundPosition: ["0 50%", "100% 50%", "0 50%"],
    },
  };

  return (
    <div className={cn("relative p-[1.5px] group rounded-3xl", containerClassName)}>
      <motion.div
        variants={animate ? variants : undefined}
        initial={animate ? "initial" : undefined}
        animate={animate ? "animate" : undefined}
        transition={
          animate
            ? {
                duration: 6,
                repeat: Infinity,
                repeatType: "reverse",
              }
            : undefined
        }
        style={{
          backgroundSize: animate ? "300% 300%" : undefined,
        }}
        className={cn(
          "absolute inset-0 rounded-3xl z-[1] opacity-40 group-hover:opacity-80 blur-lg transition duration-500",
          "bg-[radial-gradient(circle_farthest-side_at_0_100%,#06b6d4,transparent),radial-gradient(circle_farthest-side_at_100%_0,#8b5cf6,transparent),radial-gradient(circle_farthest-side_at_100%_100%,#ec4899,transparent),radial-gradient(circle_farthest-side_at_0_0,#3b82f6,#0f172a)]"
        )}
      />
      <div className={cn("relative z-10 rounded-3xl", className)}>{children}</div>
    </div>
  );
};
