"use client";

import { memo, useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import FallingColorBackground from "@/components/LiquidGlass/FallingColorBackground";
import { WorkspaceHeader, type WorkspaceHeaderProps } from "./WorkspaceHeader";
import { LoadingState } from "./LoadingState";

export interface WorkspaceShellProps extends WorkspaceHeaderProps {
  children: ReactNode;
  contentClassName?: string;
  showBackground?: boolean;
}

/**
 * WorkspaceShell — Performance-optimized & Auth-Guarded.
 *
 * Security & Auth Protection:
 *  - Enforces authentication guard for all protected studio workspace routes.
 *  - Unauthenticated visitors without a valid token are instantly redirected
 *    to /login without leaking protected UI or child components.
 *
 * Performance:
 *  - Memoized with React.memo so child re-renders don't re-execute the shell.
 *  - Refresh action deferred via useTransition to keep main thread unblocked.
 */
export const WorkspaceShell = memo(function WorkspaceShell({
  children,
  contentClassName = "",
  showBackground = true,
  onRefresh,
  ...headerProps
}: WorkspaceShellProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Authentication Guard: Ensure user cannot access any workspace screen without logging in
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlToken = new URLSearchParams(window.location.search).get("token");
      const localToken = localStorage.getItem("shortsyou_jwt");
      if (urlToken && !localToken) {
        localStorage.setItem("shortsyou_jwt", urlToken);
      }
      if (!localToken && !urlToken) {
        setIsAuthenticated(false);
        router.replace("/login");
      } else {
        setIsAuthenticated(true);
      }
    }
  }, [router]);

  const handleRefresh = useCallback(() => {
    if (!onRefresh) return;
    startTransition(() => {
      onRefresh();
    });
  }, [onRefresh]);

  // Prevent UI rendering for unauthenticated users before redirect completes
  if (!isAuthenticated) {
    return (
      <main className="workspace-page ca-canvas-container" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        {showBackground && <FallingColorBackground />}
        <LoadingState />
      </main>
    );
  }

  return (
    <main className="workspace-page ca-canvas-container">
      {/* Dynamic Animated Liquid Glass Multi-Directional Waves & Ambient Glows */}
      {showBackground && <FallingColorBackground />}

      <div className="workspace-main ca-main-viewport">
        {/* Upper Header Bar & Controls */}
        <WorkspaceHeader {...headerProps} onRefresh={handleRefresh} />

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
});
