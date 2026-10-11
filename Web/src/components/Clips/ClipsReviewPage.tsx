"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clapperboard } from "lucide-react";
import { api, type Clip, type User, type Video } from "@/lib/api";
import { WorkspaceShell } from "@/components/Layout";
import {
  ClipsHeroBanner,
  ClipsMetricsOverview,
  ClipsFilterBar,
  ClipCard,
} from "@/components/Clips";

export function ClipsReviewPage() {
  const router = useRouter();
  const [clips, setClips] = useState<Clip[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  async function refresh() {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token) return;
    try {
      const [userResult, clipsResult, videosResult] = await Promise.all([
        api.me(token),
        api.clips(token),
        api.videos(token),
      ]);
      setUser(userResult);
      setClips(clipsResult ?? []);
      setVideos(videosResult ?? []);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Unable to refresh clips."
      );
    }
  }

  useEffect(() => {
    queueMicrotask(() => void refresh());
  }, []);

  const visible = useMemo(
    () =>
      clips.filter(
        (clip) =>
          filter === "all" ||
          (filter === "ready"
            ? ["detected", "exported"].includes(clip.status)
            : clip.category === filter)
      ),
    [clips, filter]
  );

  const videoFor = (clip: Clip) =>
    videos.find((video) => video.id === clip.videoId);

  async function exportClip(clipId: string) {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token) return;
    setBusy(clipId);
    setNotice("Queueing 4K export...");
    try {
      await api.exportClip(token, clipId);
      setNotice("Export queued. The card will update after the worker finishes.");
      await refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setBusy(null);
    }
  }

  async function publishClip(clipId: string) {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token) return;
    setBusy(clipId);
    setNotice("Publishing clip...");
    try {
      await api.publishClip(token, clipId);
      setNotice("Clip published and analytics collection scheduled.");
      await refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Publish failed.");
    } finally {
      setBusy(null);
    }
  }

  async function downloadClip(clipId: string) {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token) return;
    setBusy(clipId);
    try {
      const result = await api.downloadClip(token, clipId);
      window.open(result.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Download is not ready yet."
      );
    } finally {
      setBusy(null);
    }
  }

  async function removeClip(clip: Clip) {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token || !window.confirm("Remove this clip?")) return;
    setBusy(clip.id);
    try {
      await api.deleteClip(token, clip.id);
      setSelected((ids) => ids.filter((id) => id !== clip.id));
      setNotice("Clip removed.");
      await refresh();
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Could not remove the clip."
      );
    } finally {
      setBusy(null);
    }
  }

  async function publishSelected() {
    for (const clipId of selected) await publishClip(clipId);
    setSelected([]);
  }

  async function exportSelected() {
    for (const clipId of selected) await exportClip(clipId);
    setSelected([]);
  }

  function signOut() {
    localStorage.removeItem("shortsyou_jwt");
    router.push("/login");
  }

  return (
    <WorkspaceShell
      title="Clips Review"
      user={user}
      refreshing={busy !== null}
      onRefresh={() => void refresh()}
      onSignOut={signOut}
    >
      <div className="ca-clips-page-container">
        {/* Top Hero Banner */}
        <ClipsHeroBanner
          clipCount={clips.length}
          selectedCount={selected.length}
          busy={busy !== null}
          notice={notice}
          onClearNotice={() => setNotice("")}
          onExportSelected={() => void exportSelected()}
          onPublishSelected={() => void publishSelected()}
        />

        {/* 4 Performance Metric Cards */}
        <ClipsMetricsOverview clips={clips} videos={videos} />

        {/* Filter Toolbar & Select All */}
        <ClipsFilterBar
          filter={filter}
          onFilterChange={setFilter}
          allSelected={selected.length === visible.length && visible.length > 0}
          onToggleSelectAll={() =>
            setSelected(
              selected.length === visible.length
                ? []
                : visible.map((clip) => clip.id)
            )
          }
          totalCount={clips.length}
        />

        {/* Main Clips Grid */}
        {visible.length > 0 ? (
          <div className="ca-clips-grid">
            {visible.map((clip, index) => (
              <ClipCard
                key={clip.id}
                clip={clip}
                video={videoFor(clip)}
                selected={selected.includes(clip.id)}
                busy={busy === clip.id}
                onSelect={() =>
                  setSelected((current) =>
                    current.includes(clip.id)
                      ? current.filter((id) => id !== clip.id)
                      : [...current, clip.id]
                  )
                }
                onExport={() => void exportClip(clip.id)}
                onDownload={() => void downloadClip(clip.id)}
                onDelete={() => void removeClip(clip)}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="ca-clips-empty-canvas ca-glass">
            <Clapperboard size={36} className="ca-empty-icon" />
            <h2>No AI-created shorts yet</h2>
            <p>
              Paste a YouTube URL in the Studio and let AI create your shorts
              automatically — they&apos;ll appear here when ready.
            </p>
            <Link href="/dashboard" className="ca-empty-primary-btn">
              Go to AI Studio
            </Link>
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
