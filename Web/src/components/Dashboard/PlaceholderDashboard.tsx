"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, type Clip, type Job, type PublicVideo, type User, type Video } from "@/lib/api";
import { notify } from "@/components/Notifications/NotificationCenter";
import { WorkspaceShell, LoadingState } from "@/components/Layout";
import {
  HeroBanner,
  PipelineStatus,
  VideoSearchResults,
  RecommendationsTable,
  JobsShelf,
  ProductionShelf,
} from "@/components/Dashboard";

export function PlaceholderDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [sourceUrl, setSourceUrl] = useState("");
  const [videoResults, setVideoResults] = useState<PublicVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [exportingClip, setExportingClip] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function loadDashboard() {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token) {
      setLoading(false);
      setError("Your studio session has expired. Sign in again to load the workspace.");
      return;
    }
    setRefreshing(true);
    setError("");
    const results = await Promise.allSettled([
      api.me(token),
      api.videos(token),
      api.clips(token),
      api.jobs(token),
    ]);
    const [userResult, videosResult, clipsResult, jobsResult] = results;
    if (userResult.status === "fulfilled") setUser(userResult.value);
    if (videosResult.status === "fulfilled") setVideos(videosResult.value ?? []);
    if (clipsResult.status === "fulfilled") setClips(clipsResult.value ?? []);
    if (jobsResult.status === "fulfilled") setJobs(jobsResult.value ?? []);
    if (results.every((result) => result.status === "rejected"))
      setError("The studio API is unavailable. Check that the Go server is running on port 5050.");
    setLoading(false);
    setRefreshing(false);
  }

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
  }, []);

  const recommendations = [...clips]
    .sort((a, b) => b.viralScore - a.viralScore)
    .slice(0, 4);

  const activeJobs = jobs.filter((j) => !["completed", "failed"].includes(j.status));
  const avgViralScore =
    clips.length > 0
      ? Math.round(clips.reduce((s, c) => s + c.viralScore, 0) / clips.length)
      : 0;
  const totalClipsRendered = clips.filter((c) =>
    ["exported", "published"].includes(c.status)
  ).length;

  function signOut() {
    localStorage.removeItem("shortsyou_jwt");
    router.push("/login");
  }

  async function handleAutoCreate(event: FormEvent) {
    event.preventDefault();
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token || !sourceUrl.trim()) return;

    if (!/^https?:\/\//i.test(sourceUrl.trim())) {
      try {
        setVideoResults(await api.searchVideos(token, sourceUrl.trim()));
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
  }

  async function ingestSearchResult(video: PublicVideo) {
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
  }

  function copySource() {
    void navigator.clipboard?.writeText(sourceUrl);
    setNotice("Source URL copied.");
  }

  async function createShort(clipId: string) {
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
  }

  return (
    <WorkspaceShell
      title="Channel Analytics"
      user={user}
      refreshing={refreshing}
      onRefresh={() => void loadDashboard()}
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
          onChangeSourceUrl={setSourceUrl}
          onCopySourceUrl={copySource}
          onSubmitAutoCreate={handleAutoCreate}
        />

        <div className="ca-side-stack">
          <PipelineStatus jobs={activeJobs} videos={videos} avgScore={avgViralScore} />
        </div>
      </div>

      {/* YouTube Video Search Results If Active */}
      <VideoSearchResults
        results={videoResults}
        onSelect={(v) => void ingestSearchResult(v)}
        onClear={() => setVideoResults([])}
      />

      {/* Bottom Table: "Your top videos in this period" */}
      <RecommendationsTable
        clips={recommendations}
        videos={videos}
        exportingClip={exportingClip}
        onCreateShort={(clipId) => void createShort(clipId)}
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
          <ProductionShelf videos={videos.slice(0, 4)} clips={clips} />
        </div>
      )}
    </WorkspaceShell>
  );
}
