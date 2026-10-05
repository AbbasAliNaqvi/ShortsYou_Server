"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { api, type User, type Video } from "@/lib/api";
import { notify } from "@/components/Notifications/NotificationCenter";
import { WorkspaceShell, LoadingState } from "@/components/Layout";
import {
  VideosIntroBanner,
  VideoSection,
  VideoCreationModal,
} from "@/components/Videos";

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

  async function load() {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const [userData, videoData] = await Promise.allSettled([
        api.me(token),
        api.videos(token),
      ]);
      if (userData.status === "fulfilled") setUser(userData.value);
      if (videoData.status === "fulfilled") setVideos(videoData.value ?? []);
    } catch {
      setNotice("Unable to load your videos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => void load());
  }, []);

  async function syncOwnVideos() {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token) return;
    setSyncing(true);
    try {
      const result = await api.syncVideos(token);
      const msg = `${result.synced} channel video${result.synced === 1 ? "" : "s"} synced. Choose one below to create a short.`;
      setNotice(msg);
      notify("Channel Synced", msg, "success");
      await load();
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
      await load();
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
      await load();
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
      await load();
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
      await load();
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
      await load();
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

  const own = videos.filter((v) => !v.sourceChannelId || v.sourceType === "own");
  const picked = videos.filter((v) => v.sourceChannelId && v.sourceType !== "own");

  const syncButton = (
    <motion.button
      type="button"
      className="ca-video-sync-btn"
      onClick={() => void syncOwnVideos()}
      disabled={syncing || busy}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
    >
      <RefreshCw className={syncing ? "spin" : ""} size={14} />
      <span>{syncing ? "Syncing Channel…" : "Sync my YouTube videos"}</span>
    </motion.button>
  );

  return (
    <WorkspaceShell
      title="Your Videos"
      subtitle="AI Shorts Factory"
      user={user}
      refreshing={syncing || busy}
      onRefresh={() => void load()}
      onSignOut={signOut}
    >
      {/* Intro Hero Banner with Live Metrics & Notice */}
      <VideosIntroBanner
        totalCount={videos.length}
        ownCount={own.length}
        pickedCount={picked.length}
        notice={notice}
        onClearNotice={() => setNotice("")}
      />

      {loading ? (
        <LoadingState />
      ) : (
        <div className="ca-videos-sections-wrap">
          {/* Section 1: Your YouTube Channel Videos */}
          <VideoSection
            title="Your Videos"
            empty="Sync your connected YouTube channel to see videos here."
            videos={own}
            onSelect={open}
            onDelete={(v) => void removeVideo(v)}
            action={syncButton}
            disabled={busy || syncing}
          />

          {/* Section 2: Selected Videos from Discover */}
          <VideoSection
            title="Selected Videos"
            empty="Choose videos from creators in Discover, then create a short here."
            videos={picked}
            onSelect={open}
            onDelete={(v) => void removeVideo(v)}
            disabled={busy || syncing}
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
