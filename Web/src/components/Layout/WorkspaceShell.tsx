"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import FallingColorBackground from "@/components/LiquidGlass/FallingColorBackground";
import { WorkspaceHeader, type WorkspaceHeaderProps } from "./WorkspaceHeader";

export interface WorkspaceShellProps extends WorkspaceHeaderProps {
  children: ReactNode;
  contentClassName?: string;
  showBackground?: boolean;
}

export function WorkspaceShell({
  children,
  contentClassName = "",
  showBackground = true,
  ...headerProps
}: WorkspaceShellProps) {
  return (
    <main className="workspace-page ca-canvas-container">
      {/* Dynamic Animated Liquid Glass Multi-Directional Waves & Ambient Glows */}
      {showBackground && <FallingColorBackground />}

      <div className="workspace-main ca-main-viewport">
        {/* Upper Header Bar & Controls */}
        <WorkspaceHeader {...headerProps} />

        {/* Content Area with smooth entrance animation */}
        <motion.div
          className={`workspace-content ca-dashboard-content ${contentClassName}`}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      </div>
    </main>
  );
}
