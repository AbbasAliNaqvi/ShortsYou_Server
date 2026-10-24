"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type User, type Video } from "@/lib/api";
import { notify } from "@/components/Notifications/NotificationCenter";
import { WorkspaceShell, LoadingState } from "@/components/Layout";
import dynamic from "next/dynamic";
import {
  VideosIntroBanner,
  VideoSection,
  VideosQuickIngest,
  VideosFilterBar,
  VideosTopTabs,
  type VideosTopTab,
  type VideoSourceFilter,
  type VideoStatusFilter,
} from "@/components/Videos";

const VideoCreationModal = dynamic(
  () => import("@/components/Videos/VideoCreationModal").then((m) => m.VideoCreationModal),
  { ssr: false }
);

export default function VideosPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selected, setSelected] = useState<Video | null>(null);
  const [mode, setMode] = useState<"choose" | "transcription" | "manual">("choose");
  const [start, setStart] = useState("0");
  const [end, setEnd] = useState("30");
  const [hook, setHook] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Top Tabs State: Your Videos vs Targeted Videos vs All
  const [activeTopTab, setActiveTopTab] = useState<VideosTopTab>("your_videos");

  // Sub-filters & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState<VideoSourceFilter>("all");
  const [selectedStatus, setSelectedStatus] = useState<VideoStatusFilter>("all");
  const [sortBy, setSortBy] = useState("recent");

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  async function load(silent = false) {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token) {
      setLoading(false);
      router.replace("/login");
      return;
    }
    if (!silent) setRefreshing(true);
    try {
      const [userData, videoData] = await Promise.allSettled([
        api.me(token),
        api.videos(token, sortBy),
      ]);
      if (userData.status === "fulfilled") setUser(userData.value);
      if (videoData.status === "fulfilled") setVideos(videoData.value ?? []);
    } catch {
      if (!silent) setNotice("Unable to load your videos.");
    } finally {
      if (!silent) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }

  // Initial load
  useEffect(() => {
    queueMicrotask(() => void load());
  }, [sortBy]);

  // Check if any video is active in processing
  const hasActiveVideos = useMemo(() => {
    return videos.some((v) => {
      const st = (v.processingStatus || "").toLowerCase();
      return (
        st === "pending" ||
        st === "downloading" ||
        st === "transcribing" ||
        st === "analyzing" ||
        st === "processing"
      );
    });
  }, [videos]);

  // Automatic Background Polling when active videos exist
  useEffect(() => {
    if (hasActiveVideos) {
      if (!pollIntervalRef.current) {
        pollIntervalRef.current = setInterval(() => {
          void load(true);
        }, 4000);
      }
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [hasActiveVideos]);

  // Sync YouTube channel
  async function syncOwnVideos() {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token) return;
    setSyncing(true);
    try {
      const result = await api.syncVideos(token);
      const msg = `${result.synced} channel video${result.synced === 1 ? "" : "s"} synced. Newly synced videos are now in your library.`;
      setNotice(msg);
      notify("Channel Synced", msg, "success");
      await load(true);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Could not sync your YouTube videos.";
      setNotice(errMsg);
      notify("Sync Failed", errMsg, "error");
    } finally {
      setSyncing(false);
    }
  }

  function open(video: Video) {
    setSelected(video);
    setMode("choose");
    setStart("0");
    setEnd(String(Math.min(30, Math.max(1, video.durationSeconds || 30))));
    setHook("");
  }

  async function aiAutoCreate() {
    if (!selected) return;
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token) return;
    setBusy(true);
    try {
      const r = await api.autoCreate(token, selected.id);
      const msg = `${selected.title}: ${r.message}. Your AI-created shorts will appear in Clips Review.`;
      setNotice(msg);
      notify("AI Auto-Create Started", msg, "success");
      setSelected(null);
      await load(true);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Could not start AI Auto-Create.";
      setNotice(errMsg);
      notify("Auto-Create Error", errMsg, "error");
    } finally {
      setBusy(false);
    }
  }

  async function aiGenerate() {
    if (!selected) return;
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token) return;
    setBusy(true);
    try {
      const r = await api.generateVideo(token, selected.id);
      const msg = `${selected.title}: ${r.message}. AI clips will appear in Clips Review.`;
      setNotice(msg);
      notify("AI Generation Queued", msg, "success");
      setSelected(null);
      await load(true);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Could not start AI generation.";
      setNotice(errMsg);
      notify("Generation Failed", errMsg, "error");
    } finally {
      setBusy(false);
    }
  }

  async function manualGenerate() {
    if (!selected) return;
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token) return;
    setBusy(true);
    try {
      await api.createManualShort(token, selected.id, Number(start), Number(end), hook);
      const msg = "Your manual short is rendering. Open Clips Review to download it when ready.";
      setNotice(msg);
      notify("Manual Short Queued", msg, "success");
      setSelected(null);
      await load(true);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Could not create the short.";
      setNotice(errMsg);
      notify("Creation Failed", errMsg, "error");
    } finally {
      setBusy(false);
    }
  }

  async function quickGenerateWithoutTranscription() {
    if (!selected) return;
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token) return;
    setBusy(true);
    try {
      await api.createManualShort(token, selected.id, 0, Number(end), hook);
      const msg = "Your quick clip is rendering without transcription. Open Clips Review to download it when ready.";
      setNotice(msg);
      notify("Quick Clip Queued", msg, "success");
      setSelected(null);
      await load(true);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Could not create the short.";
      setNotice(errMsg);
      notify("Creation Failed", errMsg, "error");
    } finally {
      setBusy(false);
    }
  }

  async function removeVideo(video: Video) {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token || !window.confirm(`Remove "${video.title}" and all of its clips?`)) return;
    setBusy(true);
    try {
      await api.deleteVideo(token, video.id);
      const msg = "Video and its related clips removed.";
      setNotice(msg);
      notify("Video Removed", msg, "info");
      await load(true);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Could not remove the video.";
      setNotice(errMsg);
      notify("Removal Failed", errMsg, "error");
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    localStorage.removeItem("shortsyou_jwt");
    router.push("/login");
  }

  // Pre-calculate category counts for top tabs & filter pills
  const counts = useMemo(() => {
    let imported = 0;
    let channel = 0;
    let discover = 0;
    let ready = 0;
    let processing = 0;
    let failed = 0;

    for (const v of videos) {
      const isDirect = v.sourceType === "direct" || v.sourceChannelId === "direct";
      const isChannel = !v.sourceChannelId || v.sourceType === "own";
      if (isDirect) imported++;
      else if (isChannel) channel++;
      else discover++;

      const st = (v.processingStatus || "").toLowerCase();
      if (st === "completed" || st === "ready") ready++;
      else if (st === "failed") failed++;
      else if (
        st === "pending" ||
        st === "downloading" ||
        st === "transcribing" ||
        st === "analyzing" ||
        st === "processing"
      ) {
        processing++;
      }
    }

    return {
      total: videos.length,
      channel,
      targeted: imported + discover,
      imported,
      discover,
      ready,
      processing,
      failed,
    };
  }, [videos]);

  // Compute filtered & sorted videos
  const filteredVideos = useMemo(() => {
    let result = [...videos];

    // 1. Top Tab Level Filter
    if (activeTopTab === "your_videos") {
      result = result.filter(
        (v) => !v.sourceChannelId || v.sourceType === "own"
      );
    } else if (activeTopTab === "targeted_videos") {
      result = result.filter(
        (v) =>
          v.sourceType === "direct" ||
          v.sourceChannelId === "direct" ||
          (v.sourceChannelId && v.sourceType !== "own")
      );
    }

    // 2. Sub-source Filter (if specifically chosen)
    if (selectedSource === "direct") {
      result = result.filter(
        (v) => v.sourceType === "direct" || v.sourceChannelId === "direct"
      );
    } else if (selectedSource === "own") {
      result = result.filter(
        (v) => !v.sourceChannelId || v.sourceType === "own"
      );
    } else if (selectedSource === "public") {
      result = result.filter(
        (v) =>
          v.sourceChannelId &&
          v.sourceType !== "own" &&
          v.sourceType !== "direct" &&
          v.sourceChannelId !== "direct"
      );
    }

    // 3. Status Filter
    if (selectedStatus === "ready") {
      result = result.filter(
        (v) => v.processingStatus === "completed" || v.processingStatus === "ready"
      );
    } else if (selectedStatus === "processing") {
      result = result.filter((v) => {
        const st = (v.processingStatus || "").toLowerCase();
        return (
          st === "pending" ||
          st === "downloading" ||
          st === "transcribing" ||
          st === "analyzing" ||
          st === "processing"
        );
      });
    } else if (selectedStatus === "failed") {
      result = result.filter((v) => v.processingStatus === "failed");
    }

    // 4. Search Query Filter
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (v) =>
          v.title?.toLowerCase().includes(q) ||
          v.description?.toLowerCase().includes(q)
      );
    }

    // 5. Client-side Sort fallback/guarantee (newest additions at top)
    result.sort((a, b) => {
      switch (sortBy) {
        case "published_desc":
          return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
        case "published_asc":
          return new Date(a.publishedAt || 0).getTime() - new Date(b.publishedAt || 0).getTime();
        case "clips_desc":
          return (b.clipsDetected || 0) - (a.clipsDetected || 0);
        case "duration_desc":
          return (b.durationSeconds || 0) - (a.durationSeconds || 0);
        case "duration_asc":
          return (a.durationSeconds || 0) - (b.durationSeconds || 0);
        case "recent":
        default: {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (timeA !== timeB) return timeB - timeA;
          return (b.id || "").localeCompare(a.id || "");
        }
      }
    });

    return result;
  }, [videos, activeTopTab, selectedSource, selectedStatus, searchQuery, sortBy]);

  function resetFilters() {
    setSearchQuery("");
    setSelectedSource("all");
    setSelectedStatus("all");
    setSortBy("recent");
  }

  return (
    <WorkspaceShell
      title="Your Videos"
      subtitle="AI Shorts Factory"
      user={user}
      refreshing={syncing || busy || refreshing}
      onRefresh={() => void load()}
      onSignOut={signOut}
    >
      {/* Intro Hero Banner with Live Metrics & Notice */}
      <VideosIntroBanner
        totalCount={counts.total}
        ownCount={counts.channel}
        importedCount={counts.imported}
        pickedCount={counts.discover}
        processingCount={counts.processing}
        notice={notice}
        onClearNotice={() => setNotice("")}
      />

      {/* Prominent Top Tabs: Your Videos vs Targeted Videos vs All */}
      <VideosTopTabs
        activeTab={activeTopTab}
        onChange={(tab) => {
          setActiveTopTab(tab);
          setSelectedSource("all");
        }}
        yourCount={counts.channel}
        targetedCount={counts.targeted}
        allCount={counts.total}
      />

      {/* Quick Ingest Panel: Show for Targeted Videos & All Videos */}
      {(activeTopTab === "targeted_videos" || activeTopTab === "all") && (
        <VideosQuickIngest
          onIngestSuccess={() => {
            void load(true);
          }}
          busy={busy || syncing}
        />
      )}

      {/* Advanced Filter, Search, and Sort Bar */}
      <VideosFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedSource={selectedSource}
        onSourceChange={setSelectedSource}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        sortBy={sortBy}
        onSortChange={setSortBy}
        counts={counts}
        onSync={() => void syncOwnVideos()}
        syncing={syncing}
        onRefresh={() => void load()}
        refreshing={refreshing}
        onResetFilters={resetFilters}
      />

      {loading ? (
        <LoadingState />
      ) : (
        <div className="ca-videos-sections-wrap">
          {/* Main Video Section with Responsive Grid & AnimatePresence */}
          <VideoSection
            videos={filteredVideos}
            onSelect={open}
            onDelete={(v) => void removeVideo(v)}
            disabled={busy || syncing}
            empty={
              searchQuery
                ? `No videos match "${searchQuery}". Try a different keyword.`
                : selectedStatus !== "all"
                ? `No videos with status "${selectedStatus}".`
                : activeTopTab === "your_videos"
                ? "No channel videos synced. Connect your YouTube channel and click 'Sync YouTube' to import your videos."
                : activeTopTab === "targeted_videos"
                ? "No targeted videos yet. Paste any YouTube URL above to target and import a video for AI shorts!"
                : "Your video library is empty. Paste a YouTube link above to start generating shorts!"
            }
          />
        </div>
      )}

      {/* Glassmorphic Video Creation Modal */}
      <VideoCreationModal
        video={selected}
        mode={mode}
        start={start}
        end={end}
        hook={hook}
        busy={busy}
        onClose={() => setSelected(null)}
        onSetMode={setMode}
        onSetStart={setStart}
        onSetEnd={setEnd}
        onSetHook={setHook}
        onAiAutoCreate={() => void aiAutoCreate()}
        onCustomEditor={() => {
          if (selected) router.push(`/editor/${selected.id}`);
        }}
        onAiGenerate={() => void aiGenerate()}
        onQuickGenerateWithoutTranscription={() => void quickGenerateWithoutTranscription()}
        onManualGenerate={() => void manualGenerate()}
      />
    </WorkspaceShell>
  );
}
