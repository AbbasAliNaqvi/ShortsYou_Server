"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { api, type Clip, type PerformanceAnalytics, type User } from "@/lib/api";
import { WorkspaceShell } from "@/components/Layout";
import { notify } from "@/components/Notifications/NotificationCenter";
import {
  AnalyticsHeroBanner,
  AnalyticsKpiGrid,
  TopClipsLeaderboard,
  AnalyticsInsightsGrid,
} from "@/components/Analytics";

// Dynamically import heavy client-only charting components with ssr: false
// and layout-preserving skeleton fallbacks to prevent CLS
const RetentionCurvePanel = dynamic(
  () => import("@/components/Analytics/RetentionCurvePanel").then((m) => m.RetentionCurvePanel),
  {
    ssr: false,
    loading: () => (
      <div
        className="ca-retention-panel ca-glass"
        style={{ minHeight: "380px" }}
        aria-hidden="true"
      />
    ),
  }
);

const PlatformMatrixPanel = dynamic(
  () => import("@/components/Analytics/PlatformMatrixPanel").then((m) => m.PlatformMatrixPanel),
  {
    ssr: false,
    loading: () => (
      <div
        className="ca-matrix-panel ca-glass"
        style={{ minHeight: "280px" }}
        aria-hidden="true"
      />
    ),
  }
);

export function AnalyticsPage() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [user, setUser] = useState<User | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [performance, setPerformance] = useState<PerformanceAnalytics | null>(null);
  const [busy, setBusy] = useState(true);
  const [range, setRange] = useState("7d");

  const load = useCallback(async () => {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token) {
      setBusy(false);
      router.replace("/login");
      return;
    }
    setBusy(true);
    const [userResult, clipsResult, performanceResult] = await Promise.allSettled([
      api.me(token),
      api.clips(token),
      api.analytics.performance(token),
    ]);

    if (userResult.status === "fulfilled") setUser(userResult.value);
    if (clipsResult.status === "fulfilled") setClips(clipsResult.value);
    if (performanceResult.status === "fulfilled") setPerformance(performanceResult.value);
    setBusy(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  const topClips = useMemo(
    () => [...clips].sort((a, b) => b.hookScore - a.hookScore).slice(0, 4),
    [clips]
  );

  const totalViews = useMemo(
    () => performance?.points.reduce((sum, point) => sum + point.actualViews, 0) ?? 0,
    [performance]
  );

  const averageScore = useMemo(
    () => (clips.length ? clips.reduce((sum, clip) => sum + clip.hookScore, 0) / clips.length : 0),
    [clips]
  );

  const signOut = useCallback(() => {
    localStorage.removeItem("shortsyou_jwt");
    router.push("/login");
  }, [router]);

  const handleExportReport = useCallback(() => {
    notify(
      "Report Exported",
      `Algorithmic telemetry report generated for ${range}.`,
      "info"
    );
  }, [range]);

  const handleRangeChange = useCallback((newRange: string) => {
    startTransition(() => {
      setRange(newRange);
    });
  }, []);

  return (
    <WorkspaceShell
      title="Virality Analytics"
      user={user}
      refreshing={busy}
      onRefresh={load}
      onSignOut={signOut}
    >
      <div className="ca-analytics-container">
        {/* Top Hero Card with Range Selection & Export */}
        <AnalyticsHeroBanner
          range={range}
          onRangeChange={handleRangeChange}
          onExportReport={handleExportReport}
          clipCount={clips.length}
          totalViews={totalViews}
        />

        {/* 4 KPI Telemetry Cards */}
        <AnalyticsKpiGrid
          clips={clips}
          performance={performance}
          totalViews={totalViews}
          averageScore={averageScore}
        />

        {/* Bento Two-Column Section: Left Charts + Right Leaderboard */}
        <div className="ca-analytics-bento-grid">
          <div className="ca-analytics-charts-column">
            <RetentionCurvePanel clips={clips} />
            <PlatformMatrixPanel performance={performance} />
          </div>

          <div className="ca-analytics-sidebar-column">
            <TopClipsLeaderboard clips={topClips} />
          </div>
        </div>

        {/* Optimization Insights 3-Card Shelf */}
        <AnalyticsInsightsGrid clips={clips} />
      </div>
    </WorkspaceShell>
  );
}
