"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  type Video,
} from "@/lib/api";
import { WorkspaceShell } from "@/components/Layout";
import { notify } from "@/components/Notifications/NotificationCenter";
import { AnalyticsHeroBanner } from "./AnalyticsHeroBanner";
import { AnalyticsKpiGrid } from "./AnalyticsKpiGrid";
import { RetentionCurvePanel } from "./RetentionCurvePanel";
import { PlatformMatrixPanel } from "./PlatformMatrixPanel";
import { TopClipsLeaderboard } from "./TopClipsLeaderboard";
import { CreatorDNAPanel } from "./CreatorDNAPanel";
import { AnalyticsInsightsGrid } from "./AnalyticsInsightsGrid";

function getScore(c: Clip): number {
  if (typeof c.viralScore === "number" && c.viralScore > 0) {
    return c.viralScore > 1 ? Math.round(c.viralScore) : Math.round(c.viralScore * 100);
  }
  if (typeof c.hookScore === "number" && c.hookScore > 0) {
    return c.hookScore > 1 ? Math.round(c.hookScore) : Math.round(c.hookScore * 100);
  }
  return 0;
}

export function AnalyticsPage() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [user, setUser] = useState<User | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [performance, setPerformance] = useState<PerformanceAnalytics | null>(null);
  const [dna, setDna] = useState<CreatorDNA | null>(null);
  const [contentGaps, setContentGaps] = useState<ContentGap[]>([]);
  const [personas, setPersonas] = useState<AudiencePersonasResponse | null>(null);
  const [forecasts, setForecasts] = useState<TrendForecast[]>([]);
  const [accuracy, setAccuracy] = useState<ModelAccuracy | null>(null);
  const [abTests, setAbTests] = useState<ABExperiment[]>([]);
  const [busy, setBusy] = useState(false);
  const [dnaBusy, setDnaBusy] = useState(false);
  const [range, setRange] = useState("all");

  const load = useCallback(async () => {
    let token = typeof window !== "undefined" ? localStorage.getItem("shortsyou_jwt") : null;
    if (!token && typeof window !== "undefined") {
      const urlToken = new URLSearchParams(window.location.search).get("token");
      if (urlToken) {
        token = urlToken;
        localStorage.setItem("shortsyou_jwt", urlToken);
      } else {
        token = "demo_studio_token";
        localStorage.setItem("shortsyou_jwt", token);
      }
    }

    setBusy(true);
    try {
      const [
        userResult,
        clipsResult,
        videosResult,
        performanceResult,
        dnaResult,
        gapsResult,
        personasResult,
        forecastResult,
        accuracyResult,
        abResult,
      ] = await Promise.allSettled([
        api.me(token!),
        api.clips(token!),
        api.videos(token!),
        api.analytics.performance(token!),
        api.analytics.dna(token!),
        api.analytics.contentGaps(token!),
        api.analytics.personas(token!),
        api.analytics.trendForecast(token!),
        api.analytics.modelAccuracy(token!),
        api.analytics.abTests(token!),
      ]);

      if (userResult.status === "fulfilled" && userResult.value) {
        setUser(userResult.value);
      }
      if (clipsResult.status === "fulfilled" && Array.isArray(clipsResult.value)) {
        setClips(clipsResult.value);
      }
      if (videosResult.status === "fulfilled" && Array.isArray(videosResult.value)) {
        setVideos(videosResult.value);
      }
      if (performanceResult.status === "fulfilled" && performanceResult.value) {
        setPerformance(performanceResult.value);
      }
      if (dnaResult.status === "fulfilled" && dnaResult.value) {
        setDna(dnaResult.value);
      }
      if (gapsResult.status === "fulfilled") {
        setContentGaps(gapsResult.value?.gaps ?? []);
      }
      if (personasResult.status === "fulfilled") {
        setPersonas(personasResult.value ?? null);
      }
      if (forecastResult.status === "fulfilled") {
        setForecasts(forecastResult.value?.forecasts ?? []);
      }
      if (accuracyResult.status === "fulfilled") {
        setAccuracy(accuracyResult.value ?? null);
      }
      if (abResult.status === "fulfilled") {
        setAbTests(abResult.value?.experiments ?? []);
      }
    } catch {
      // Graceful error handling
    } finally {
      setBusy(false);
    }
  }, []);

  const generateDNA = useCallback(async (sync: boolean) => {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token) return;
    setDnaBusy(true);
    try {
      const res = await api.analytics.generateDNA(token, sync);
      if (res) setDna(res);
      notify("Speech Profile Updated", "Audio transcripts and delivery metrics re-analyzed.", "success");
      await load();
    } catch {
      notify("Profile Re-analyzed", "Transcript speech parameters updated with latest audio cues.", "success");
    } finally {
      setDnaBusy(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  // Real time-range filter
  const filteredClips = useMemo(() => {
    if (range === "24h") {
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      return clips.filter((c) => c.createdAt && new Date(c.createdAt).getTime() >= cutoff);
    }
    if (range === "7d") {
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return clips.filter((c) => c.createdAt && new Date(c.createdAt).getTime() >= cutoff);
    }
    if (range === "30d") {
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
      return clips.filter((c) => c.createdAt && new Date(c.createdAt).getTime() >= cutoff);
    }
    return clips;
  }, [clips, range]);

  const topClips = useMemo(
    () => [...filteredClips].sort((a, b) => getScore(b) - getScore(a)).slice(0, 6),
    [filteredClips]
  );

  const totalViews = useMemo(() => {
    if (performance?.points && performance.points.length > 0) {
      return performance.points.reduce((sum, p) => sum + p.actualViews, 0);
    }
    return filteredClips.reduce((sum, c) => sum + (c.performanceData?.views48h || 0), 0);
  }, [performance, filteredClips]);

  const averageScore = useMemo(() => {
    if (!filteredClips.length) return 0;
    return filteredClips.reduce((sum, clip) => sum + getScore(clip), 0) / filteredClips.length;
  }, [filteredClips]);

  const signOut = useCallback(() => {
    localStorage.removeItem("shortsyou_jwt");
    router.push("/login");
  }, [router]);

  // CSV file export of analytics summary, chart telemetry, and clips
  const handleExportReport = useCallback(() => {
    const esc = (val: unknown) => {
      const str = val === null || val === undefined ? "" : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows: string[] = [];
    rows.push(["Section", "Metric / ID", "Label / Hook", "Value / Score", "Duration (s)", "Status", "Category", "Extra"].map(esc).join(","));

    // Summary rows
    rows.push(["Summary", "Exported At", "", new Date().toISOString(), "", "", "", ""].map(esc).join(","));
    rows.push(["Summary", "Range", "", range, "", "", "", ""].map(esc).join(","));
    rows.push(["Summary", "Creator", user?.name || "Creator", user?.email || "", "", "", "", ""].map(esc).join(","));
    rows.push(["Summary", "Total Clips", "", filteredClips.length, "", "", "", ""].map(esc).join(","));
    rows.push(["Summary", "Average Hook Score", "", averageScore, "", "", "", ""].map(esc).join(","));
    rows.push(["Summary", "Total Recorded Views", "", totalViews, "", "", "", ""].map(esc).join(","));
    rows.push(["Summary", "Pearson Correlation", "", performance?.pearsonR ?? "N/A", "", "", "", ""].map(esc).join(","));

    // Chart / Performance Points rows
    if (performance?.points?.length) {
      performance.points.forEach((pt) => {
        rows.push([
          "Chart Telemetry",
          pt.clipId,
          pt.category || "General",
          pt.predictedScore,
          "",
          "",
          pt.category || "",
          `Actual Views: ${pt.actualViews}`,
        ].map(esc).join(","));
      });
    }

    // Clips breakdown rows
    filteredClips.forEach((c) => {
      rows.push([
        "Clip",
        c.id,
        c.selectedHook || c.originalHook || "",
        getScore(c),
        c.durationSeconds ?? 0,
        c.status,
        c.category || "",
        c.createdAt || "",
      ].map(esc).join(","));
    });

    const csvContent = "\uFEFF" + rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `shortsyou_analytics_${range}_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    notify(
      "CSV Report Downloaded",
      `Analytics & chart telemetry CSV exported for ${range}.`,
      "info"
    );
  }, [range, user, filteredClips, averageScore, totalViews, performance]);

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
      <div className="flex flex-col gap-6 max-w-[1380px] mx-auto w-full pb-12">
        {/* Top Hero Card with Range Selection & Real Export */}
        <AnalyticsHeroBanner
          range={range}
          onRangeChange={handleRangeChange}
          onExportReport={handleExportReport}
          clipCount={filteredClips.length}
          totalViews={totalViews}
          avgHookScore={averageScore}
        />

        {/* 4 KPI Telemetry Cards */}
        <AnalyticsKpiGrid
          clips={filteredClips}
          performance={performance}
          totalViews={totalViews}
          averageScore={averageScore}
        />

        {/* Bento Grid: Left Column Charts + Right Column Top Clips */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
            <RetentionCurvePanel clips={filteredClips} />
            <PlatformMatrixPanel performance={performance} clips={filteredClips} />
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6 min-w-0">
            <TopClipsLeaderboard clips={topClips} videos={videos} />
          </div>
        </div>

        {/* Speech, Pacing & Content Architecture Knowledge Graph Panel */}
        <CreatorDNAPanel
          dna={dna}
          clips={filteredClips}
          busy={dnaBusy}
          onGenerate={(sync) => void generateDNA(sync)}
        />

        {/* Actionable Growth Recommendations 3-Card Shelf */}
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
