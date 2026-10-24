"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  api,
  type ABExperiment,
  type AudiencePersonasResponse,
  type Clip,
  type ContentGap,
  type CreatorDNA,
  type ModelAccuracy,
  type PerformanceAnalytics,
  type TrendForecast,
  type User,
} from "@/lib/api";
import { WorkspaceShell } from "@/components/Layout";
import { notify } from "@/components/Notifications/NotificationCenter";
import { AnalyticsHeroBanner } from "./AnalyticsHeroBanner";
import { AnalyticsKpiGrid } from "./AnalyticsKpiGrid";
import { TopClipsLeaderboard } from "./TopClipsLeaderboard";
import { AnalyticsInsightsGrid } from "./AnalyticsInsightsGrid";
import { CreatorDNAPanel } from "./CreatorDNAPanel";

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
  const [dna, setDna] = useState<CreatorDNA | null>(null);
  const [contentGaps, setContentGaps] = useState<ContentGap[]>([]);
  const [personas, setPersonas] = useState<AudiencePersonasResponse | null>(null);
  const [forecasts, setForecasts] = useState<TrendForecast[]>([]);
  const [accuracy, setAccuracy] = useState<ModelAccuracy | null>(null);
  const [abTests, setAbTests] = useState<ABExperiment[]>([]);
  const [busy, setBusy] = useState(true);
  const [dnaBusy, setDnaBusy] = useState(false);
  const [range, setRange] = useState("7d");

  const load = useCallback(async () => {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token) {
      setBusy(false);
      router.replace("/login");
      return;
    }
    setBusy(true);
    const [
      userResult,
      clipsResult,
      performanceResult,
      dnaResult,
      gapsResult,
      personasResult,
      forecastResult,
      accuracyResult,
      abResult,
    ] = await Promise.allSettled([
      api.me(token),
      api.clips(token),
      api.analytics.performance(token),
      api.analytics.dna(token),
      api.analytics.contentGaps(token),
      api.analytics.personas(token),
      api.analytics.trendForecast(token),
      api.analytics.modelAccuracy(token),
      api.analytics.abTests(token),
    ]);

    if (userResult.status === "fulfilled") setUser(userResult.value);
    if (clipsResult.status === "fulfilled") setClips(clipsResult.value);
    if (performanceResult.status === "fulfilled") setPerformance(performanceResult.value);
    if (dnaResult.status === "fulfilled") setDna(dnaResult.value);
    if (gapsResult.status === "fulfilled") setContentGaps(gapsResult.value?.gaps ?? []);
    if (personasResult.status === "fulfilled") setPersonas(personasResult.value ?? null);
    if (forecastResult.status === "fulfilled") setForecasts(forecastResult.value?.forecasts ?? []);
    if (accuracyResult.status === "fulfilled") setAccuracy(accuracyResult.value ?? null);
    if (abResult.status === "fulfilled") setAbTests(abResult.value?.experiments ?? []);
    setBusy(false);
  }, [router]);

  const generateDNA = useCallback(async (sync: boolean) => {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token) return;
    setDnaBusy(true);
    try {
      const res = await api.analytics.generateDNA(token, sync);
      if (res) setDna(res);
      notify("Creator DNA Synthesized", "Your creative genome has been successfully calculated.", "success");
      await load();
    } catch (error) {
      notify("Creator DNA failed", error instanceof Error ? error.message : "Unable to generate DNA.", "error");
    } finally {
      setDnaBusy(false);
    }
  }, [load]);

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

        <CreatorDNAPanel dna={dna} busy={dnaBusy} onGenerate={(sync) => void generateDNA(sync)} />

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
        <AnalyticsInsightsGrid
          clips={clips}
          contentGaps={contentGaps}
          forecasts={forecasts}
          personas={personas}
          accuracy={accuracy}
        />
      </div>
    </WorkspaceShell>
  );
}
