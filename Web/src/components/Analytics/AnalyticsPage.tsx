"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type Clip, type PerformanceAnalytics, type User } from "@/lib/api";
import { WorkspaceShell } from "@/components/Layout";
import { notify } from "@/components/Notifications/NotificationCenter";
import {
  AnalyticsHeroBanner,
  AnalyticsKpiGrid,
  RetentionCurvePanel,
  PlatformMatrixPanel,
  TopClipsLeaderboard,
  AnalyticsInsightsGrid,
} from "@/components/Analytics";

export function AnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [performance, setPerformance] = useState<PerformanceAnalytics | null>(null);
  const [busy, setBusy] = useState(true);
  const [range, setRange] = useState("7d");

  async function load() {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token) {
      setBusy(false);
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
  }

  useEffect(() => {
    queueMicrotask(() => void load());
  }, []);

  const topClips = useMemo(
    () => [...clips].sort((a, b) => b.hookScore - a.hookScore).slice(0, 4),
    [clips]
  );
  const totalViews =
    performance?.points.reduce((sum, point) => sum + point.actualViews, 0) ?? 0;
  const averageScore = clips.length
    ? clips.reduce((sum, clip) => sum + clip.hookScore, 0) / clips.length
    : 0;

  function signOut() {
    localStorage.removeItem("shortsyou_jwt");
    router.push("/login");
  }

  function handleExportReport() {
    const reportData = {
      timestamp: new Date().toISOString(),
      range,
      userEmail: user?.email,
      totalClipsAnalyzed: clips.length,
      totalImpressions: totalViews,
      averageHookRetention: averageScore.toFixed(2),
      viralityVelocityIndex: clips.length ? Math.min(100, Math.round(averageScore)) : 0,
      topClips: topClips.map((c) => ({
        id: c.id,
        hook: c.originalHook || c.selectedHook || c.transcriptText,
        hookScore: c.hookScore,
        viralScore: c.viralScore,
        status: c.status,
      })),
      platforms: ["YouTube Shorts", "TikTok", "Instagram Reels"],
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `virality-analytics-report-${range}.json`;
    a.click();
    URL.revokeObjectURL(url);

    notify(
      "Report Exported",
      `Exported algorithmic telemetry report for ${range}.`,
      "success"
    );
  }

  return (
    <WorkspaceShell
      title="Virality Analytics"
      user={user}
      refreshing={busy}
      onRefresh={() => void load()}
      onSignOut={signOut}
    >
      <div className="ca-analytics-container">
        {/* Top Hero Card with Range Selection & Export */}
        <AnalyticsHeroBanner
          range={range}
          onRangeChange={(newRange) => {
            setRange(newRange);
            notify("Range Updated", `Telemetry scope filtered to ${newRange}.`, "info");
          }}
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
