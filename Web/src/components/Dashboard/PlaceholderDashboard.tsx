"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCurrentUser,
  useVideos,
  useClips,
  useJobs,
  useDailyReels,
  useExportClipMutation,
  queryKeys,
} from "@/lib/tanstack";
import { api, type PublicVideo } from "@/lib/api";
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
  const queryClient = useQueryClient();
  const [, startTransition] = useTransition();

  const [token, setToken] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [videoResults, setVideoResults] = useState<PublicVideo[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState("");
  const [exportingClip, setExportingClip] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramToken = params.get("token");
    if (paramToken) {
      localStorage.setItem("shortsyou_jwt", paramToken);
      window.history.replaceState({}, document.title, "/dashboard");
      setToken(paramToken);
    } else {
      const stored = localStorage.getItem("shortsyou_jwt") || sessionStorage.getItem("shortsyou_jwt");
      if (stored) {
        localStorage.setItem("shortsyou_jwt", stored);
        setToken(stored);
      } else {
        router.replace("/login");
      }
    }
  }, [router]);

  // TanStack Queries for high-performance reactive caching and zero redundant network waterfalls
  const { data: user = null } = useCurrentUser(token);
  const { data: videos = [], isLoading: videosLoading, error: videosError } = useVideos(token);
  const { data: clips = [], isLoading: clipsLoading, error: clipsError } = useClips(token);
  const { data: dailyReels = [], isLoading: reelsLoading } = useDailyReels(token);
  const { data: jobs = [] } = useJobs(token, 10_000);

  const exportMutation = useExportClipMutation(token);

  const loading = Boolean(token) && (videosLoading || clipsLoading || reelsLoading);
  const error = videosError || clipsError ? "The studio API is unavailable. Check that the Go server is running." : "";

  const loadDashboard = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.clips.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

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
    queryClient.clear();
    router.push("/login");
  }, [router, queryClient]);

  const handleSourceUrlChange = useCallback((val: string) => {
    startTransition(() => {
      setSourceUrl(val);
    });
  }, []);

  const handleAutoCreate = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
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
        void queryClient.invalidateQueries({ queryKey: queryKeys.videos.all });
        void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
      } catch (ingestError) {
        setNotice(
          ingestError instanceof Error ? ingestError.message : "Unable to start AI Auto-Create."
        );
      } finally {
        setCreating(false);
      }
    },
    [sourceUrl, token, queryClient]
  );

  const ingestSearchResult = useCallback(
    async (video: PublicVideo) => {
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
        void queryClient.invalidateQueries({ queryKey: queryKeys.videos.all });
        void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
      } catch (err) {
        setNotice(err instanceof Error ? err.message : "Unable to queue this video.");
      }
    },
    [token, queryClient]
  );

  const copySource = useCallback(() => {
    void navigator.clipboard?.writeText(sourceUrl);
    setNotice("Source URL copied.");
  }, [sourceUrl]);

  const createShort = useCallback(
    async (clipId: string) => {
      if (!token) return;
      setExportingClip(clipId);
      setNotice("Creating your short...");
      try {
        await exportMutation.mutateAsync(clipId);
        setNotice("Short rendering started. It will appear as downloadable when ready.");
      } catch (createError) {
        setNotice(
          createError instanceof Error ? createError.message : "Unable to create this short."
        );
      } finally {
        setExportingClip(null);
      }
    },
    [token, exportMutation]
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
