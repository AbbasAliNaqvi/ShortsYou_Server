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

  // Real time-range filter
  const filteredClips = useMemo(() => {
    if (range === "24h") {
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      return clips.filter((c) => new Date(c.createdAt).getTime() >= cutoff);
    }
    if (range === "7d") {
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return clips.filter((c) => new Date(c.createdAt).getTime() >= cutoff);
    }
    if (range === "30d") {
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
      return clips.filter((c) => new Date(c.createdAt).getTime() >= cutoff);
    }
    return clips;
  }, [clips, range]);

  const topClips = useMemo(
    () => [...filteredClips].sort((a, b) => b.hookScore - a.hookScore).slice(0, 4),
    [filteredClips]
  );

  const totalViews = useMemo(
    () => performance?.points.reduce((sum, point) => sum + point.actualViews, 0) ?? 0,
    [performance]
  );

  const averageScore = useMemo(
    () => (filteredClips.length ? filteredClips.reduce((sum, clip) => sum + clip.hookScore, 0) / filteredClips.length : 0),
    [filteredClips]
  );

  const signOut = useCallback(() => {
    localStorage.removeItem("shortsyou_jwt");
    router.push("/login");
  }, [router]);

  // Real JSON file export of telemetry
  const handleExportReport = useCallback(() => {
    const reportData = {
      exportedAt: new Date().toISOString(),
      range,
      user: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
      },
      summary: {
        totalClips: filteredClips.length,
        averageHookScore: averageScore,
        totalRecordedViews: totalViews,
        pearsonCorrelation: performance?.pearsonR ?? null,
      },
      clips: filteredClips.map((c) => ({
        id: c.id,
        hook: c.selectedHook || c.originalHook,
        hookScore: c.hookScore,
        duration: c.durationSeconds,
        status: c.status,
        category: c.category,
        createdAt: c.createdAt,
      })),
      creatorDNA: dna
        ? {
            dominantEmotion: dna.emotionalRange?.dominantEmotion,
            speechWPM: dna.speechProfile?.avgWpm,
            topWords: dna.vocabularyProfile?.topWords,
            topicDistribution: dna.topicDistribution,
          }
        : null,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `shortsyou_analytics_report_${range}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    notify(
      "Report Exported",
      `Algorithmic telemetry report downloaded for ${range}.`,
      "info"
    );
  }, [range, user, filteredClips, averageScore, totalViews, performance, dna]);

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
        {/* Top Hero Card with Range Selection & Real Export */}
        <AnalyticsHeroBanner
          range={range}
          onRangeChange={handleRangeChange}
          onExportReport={handleExportReport}
          clipCount={filteredClips.length}
          totalViews={totalViews}
        />

        {/* 4 KPI Telemetry Cards */}
        <AnalyticsKpiGrid
          clips={filteredClips}
          performance={performance}
          totalViews={totalViews}
          averageScore={averageScore}
        />

        <CreatorDNAPanel dna={dna} busy={dnaBusy} onGenerate={(sync) => void generateDNA(sync)} />

        {/* Bento Two-Column Section: Recharts Area & Bar Panels + Right Leaderboard */}
        <div className="ca-analytics-bento-grid">
          <div className="ca-analytics-charts-column">
            <RetentionCurvePanel clips={filteredClips} />
            <PlatformMatrixPanel performance={performance} />
          </div>

          <div className="ca-analytics-sidebar-column">
            <TopClipsLeaderboard clips={topClips} />
          </div>
        </div>

        {/* Optimization Insights 3-Card Shelf */}
        <AnalyticsInsightsGrid
          clips={filteredClips}
          contentGaps={contentGaps}
          forecasts={forecasts}
          personas={personas}
          accuracy={accuracy}
        />
      </div>
    </WorkspaceShell>
  );
}
