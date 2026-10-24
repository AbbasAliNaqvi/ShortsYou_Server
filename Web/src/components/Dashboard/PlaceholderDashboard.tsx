"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { api, type Clip, type DailyReel, type Job, type PublicVideo, type User, type Video } from "@/lib/api";
import { notify } from "@/components/Notifications/NotificationCenter";
import { WorkspaceShell, LoadingState } from "@/components/Layout";
import { HeroBanner } from "./HeroBanner";
import { PipelineStatus } from "./PipelineStatus";
import { RecommendationsTable } from "./RecommendationsTable";
import { JobsShelf } from "./JobsShelf";
import { ProductionShelf } from "./ProductionShelf";
import { DailyReelsShelf } from "./DailyReelsShelf";

// Dynamically import VideoSearchResults (only mounted when search query returns items)
const VideoSearchResults = dynamic(
  () => import("@/components/Dashboard/VideoSearchResults").then((m) => m.VideoSearchResults),
  { ssr: false }
);

export function PlaceholderDashboard() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [user, setUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [dailyReels, setDailyReels] = useState<DailyReel[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [sourceUrl, setSourceUrl] = useState("");
  const [videoResults, setVideoResults] = useState<PublicVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [exportingClip, setExportingClip] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const loadDashboard = useCallback(async () => {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token) {
      setLoading(false);
      router.replace("/login");
      return;
    }
    setRefreshing(true);
    setError("");
    const results = await Promise.allSettled([
      api.me(token),
      api.videos(token),
      api.clips(token),
      api.jobs(token),
      api.dailyReels(token),
    ]);
    const [userResult, videosResult, clipsResult, jobsResult, dailyResult] = results;
    if (userResult.status === "fulfilled") {
      setUser(userResult.value);
      try {
        localStorage.setItem("shortsyou_user", JSON.stringify(userResult.value));
      } catch {}
    }
    if (videosResult.status === "fulfilled") setVideos(videosResult.value ?? []);
    if (clipsResult.status === "fulfilled") setClips(clipsResult.value ?? []);
    if (jobsResult.status === "fulfilled") setJobs(jobsResult.value ?? []);
    if (dailyResult.status === "fulfilled") setDailyReels(dailyResult.value ?? []);
    if (results.every((result) => result.status === "rejected"))
      setError("The studio API is unavailable. Check that the Go server is running on port 5050.");
    setLoading(false);
    setRefreshing(false);
  }, [router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("shortsyou_jwt", token);
      window.history.replaceState({}, document.title, "/dashboard");
    } else {
      const legacyToken = sessionStorage.getItem("shortsyou_jwt");
      if (legacyToken) {
        localStorage.setItem("shortsyou_jwt", legacyToken);
        sessionStorage.removeItem("shortsyou_jwt");
      }
    }
    queueMicrotask(() => void loadDashboard());
  }, [loadDashboard]);

  // Stabilize heavy computations with useMemo to isolate re-render cascades
  const recommendations = useMemo(
    () => [...clips].sort((a, b) => b.viralScore - a.viralScore).slice(0, 4),
    [clips]
  );

  const activeJobs = useMemo(
    () => jobs.filter((j) => !["completed", "failed"].includes(j.status)),
    [jobs]
  );

  const avgViralScore = useMemo(
    () =>
      clips.length > 0
        ? Math.round(clips.reduce((s, c) => s + c.viralScore, 0) / clips.length)
        : 0,
    [clips]
  );

  const totalClipsRendered = useMemo(
    () => clips.filter((c) => ["exported", "published"].includes(c.status)).length,
    [clips]
  );

  const displayedVideos = useMemo(() => videos.slice(0, 4), [videos]);

  const signOut = useCallback(() => {
    localStorage.removeItem("shortsyou_jwt");
    router.push("/login");
  }, [router]);

  const handleSourceUrlChange = useCallback((val: string) => {
    startTransition(() => {
      setSourceUrl(val);
    });
  }, []);

  const handleAutoCreate = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      const token = localStorage.getItem("shortsyou_jwt");
      if (!token || !sourceUrl.trim()) return;

      if (!/^https?:\/\//i.test(sourceUrl.trim())) {
        try {
          const searchResults = await api.searchVideos(token, sourceUrl.trim());
          setVideoResults(searchResults);
          setNotice("Select a video and let AI create your shorts automatically.");
        } catch (err) {
          setNotice(err instanceof Error ? err.message : "No videos found.");
        }
        return;
      }

      setCreating(true);
      setNotice("Starting your AI creation pipeline…");
      try {
        const result = await api.autoCreateIngest(token, sourceUrl.trim());
        setSourceUrl("");
        setNotice(`${result.title} — AI is creating your shorts! Check back in a few minutes.`);
        notify(
          "AI Auto-Create Started",
          "Your shorts are being created automatically. AI will transcribe, find viral moments, generate hooks, and render your shorts.",
          "success"
        );
        await loadDashboard();
      } catch (ingestError) {
        setNotice(
          ingestError instanceof Error ? ingestError.message : "Unable to start AI Auto-Create."
        );
      } finally {
        setCreating(false);
      }
    },
    [sourceUrl, loadDashboard]
  );

  const ingestSearchResult = useCallback(
    async (video: PublicVideo) => {
      const token = localStorage.getItem("shortsyou_jwt");
      if (!token) return;
      setNotice("AI Auto-Create started for this video...");
      try {
        const result = await api.autoCreateIngest(
          token,
          `https://youtube.com/watch?v=${video.youtubeVideoId}`
        );
        setVideoResults([]);
        setSourceUrl("");
        setNotice(`${result.title} — AI Auto-Create in progress! Your shorts will appear below when ready.`);
        notify("AI Auto-Create Started", `${video.title} is being processed.`, "success");
        await loadDashboard();
      } catch (err) {
        setNotice(err instanceof Error ? err.message : "Unable to queue this video.");
      }
    },
    [loadDashboard]
  );

  const copySource = useCallback(() => {
    void navigator.clipboard?.writeText(sourceUrl);
    setNotice("Source URL copied.");
  }, [sourceUrl]);

  const createShort = useCallback(
    async (clipId: string) => {
      const token = localStorage.getItem("shortsyou_jwt");
      if (!token) return;
      setExportingClip(clipId);
      setNotice("Creating your short...");
      try {
        await api.exportClip(token, clipId);
        setNotice("Short rendering started. It will appear as downloadable when ready.");
        await loadDashboard();
      } catch (createError) {
        setNotice(
          createError instanceof Error ? createError.message : "Unable to create this short."
        );
      } finally {
        setExportingClip(null);
      }
    },
    [loadDashboard]
  );

  const clearVideoResults = useCallback(() => setVideoResults([]), []);

  return (
    <WorkspaceShell
      title="Channel Analytics"
      user={user}
      refreshing={refreshing}
      onRefresh={loadDashboard}
      onSignOut={signOut}
    >
      {/* Bento Upper Grid (Hero Card + Pipeline Status) */}
      <div className="ca-bento-grid">
        <HeroBanner
          sourceUrl={sourceUrl}
          notice={notice}
          creating={creating}
          videoCount={videos.length}
          clipCount={clips.length}
          renderedCount={totalClipsRendered}
          avgViralScore={avgViralScore}
          onChangeSourceUrl={handleSourceUrlChange}
          onCopySourceUrl={copySource}
          onSubmitAutoCreate={handleAutoCreate}
          onBrowseMetrics={() => router.push("/analytics")}
        />

        <div className="ca-side-stack">
          <PipelineStatus jobs={activeJobs} videos={videos} avgScore={avgViralScore} />
        </div>
      </div>

      {/* YouTube Video Search Results If Active (Code-split dynamic component) */}
      <VideoSearchResults
        results={videoResults}
        onSelect={ingestSearchResult}
        onClear={clearVideoResults}
      />

      {/* Daily 5 AI Auto-Generated Reels Section */}
      <DailyReelsShelf
        reels={dailyReels}
        loading={loading}
        exportingClip={exportingClip}
        onExportClip={createShort}
      />

      {/* Bottom Table: "Your top videos in this period" */}
      <RecommendationsTable
        clips={recommendations}
        videos={videos}
        exportingClip={exportingClip}
        onCreateShort={createShort}
      />

      {error && (
        <div className="dashboard-error ca-glass">
          {error} <Link href="/login">Return to sign in</Link>
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : (
        <div className="ca-secondary-shelves">
          <JobsShelf jobs={jobs} videos={videos} />
          <ProductionShelf videos={displayedVideos} clips={clips} />
        </div>
      )}
    </WorkspaceShell>
  );
}
