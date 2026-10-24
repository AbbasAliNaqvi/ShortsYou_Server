"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clapperboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api, type Clip, type User, type Video } from "@/lib/api";
import { notify } from "@/components/Notifications/NotificationCenter";
import { WorkspaceShell } from "@/components/Layout";
import { ClipsHeroBanner } from "./ClipsHeroBanner";
import { ClipsMetricsOverview } from "./ClipsMetricsOverview";
import { ClipsFilterBar } from "./ClipsFilterBar";
import { ClipCard } from "./ClipCard";
import { ClipPreviewModal } from "./ClipPreviewModal";

export function ClipsReviewPage() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [clips, setClips] = useState<Clip[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideoId, setSelectedVideoId] = useState("all");
  const [sortBy, setSortBy] = useState("viral_desc");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [previewClip, setPreviewClip] = useState<Clip | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const refresh = useCallback(async (silent = false) => {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token) {
      router.replace("/login");
      return;
    }
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
      if (!silent) {
        const msg = error instanceof Error ? error.message : "Unable to refresh clips.";
        setNotice(msg);
      }
    }
  }, [router]);

  useEffect(() => {
    queueMicrotask(() => void refresh());
  }, [refresh]);

  // Check if any clip is currently rendering or queued
  const hasRenderingClips = useMemo(() => {
    return clips.some((c) => {
      const st = (c.status || "").toLowerCase();
      return st === "editing" || st === "queued" || st === "processing";
    });
  }, [clips]);

  // Background Auto-Polling when clips are rendering
  useEffect(() => {
    if (hasRenderingClips) {
      if (!pollIntervalRef.current) {
        pollIntervalRef.current = setInterval(() => {
          void refresh(true);
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
  }, [hasRenderingClips, refresh]);

  // Indexed video map for fast lookup
  const videoMap = useMemo(() => {
    const map = new Map<string, Video>();
    for (const v of videos) map.set(v.id, v);
    return map;
  }, [videos]);

  // Pre-calculate tab counts
  const counts = useMemo(() => {
    let ready = 0;
    let detected = 0;
    let rendering = 0;
    let viral = 0;
    let narrative = 0;

    for (const c of clips) {
      const st = (c.status || "").toLowerCase();
      if (st === "exported" || st === "published" || Boolean(c.supabaseShortUrl)) {
        ready++;
      } else if (st === "editing" || st === "queued" || st === "processing") {
        rendering++;
      } else if (st === "detected") {
        detected++;
      }

      if (c.category === "viral") viral++;
      else if (c.category === "narrative") narrative++;
    }

    return {
      total: clips.length,
      ready,
      detected,
      rendering,
      viral,
      narrative,
    };
  }, [clips]);

  // Filtered & Sorted clips
  const visible = useMemo(() => {
    let result = [...clips];

    // 1. Status / Category Filter
    if (filter === "ready") {
      result = result.filter(
        (c) =>
          ["exported", "published"].includes(c.status) || Boolean(c.supabaseShortUrl)
      );
    } else if (filter === "rendering") {
      result = result.filter((c) =>
        ["editing", "queued", "processing"].includes(c.status)
      );
    } else if (filter === "detected") {
      result = result.filter((c) => c.status === "detected");
    } else if (filter === "viral" || filter === "narrative") {
      result = result.filter((c) => c.category === filter);
    }

    // 2. Video Picker Filter
    if (selectedVideoId !== "all") {
      result = result.filter((c) => c.videoId === selectedVideoId);
    }

    // 3. Search Query Filter
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((c) => {
        const title = (c.originalHook || c.selectedHook || "").toLowerCase();
        const transcript = (c.transcriptText || "").toLowerCase();
        const videoTitle = (videoMap.get(c.videoId)?.title || "").toLowerCase();
        return (
          title.includes(q) || transcript.includes(q) || videoTitle.includes(q)
        );
      });
    }

    // 4. Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "viral_asc":
          return (a.viralScore || 0) - (b.viralScore || 0);
        case "newest":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case "duration_desc":
          return (b.durationSeconds || 0) - (a.durationSeconds || 0);
        case "duration_asc":
          return (a.durationSeconds || 0) - (b.durationSeconds || 0);
        case "viral_desc":
        default:
          return (b.viralScore || 0) - (a.viralScore || 0);
      }
    });

    return result;
  }, [clips, filter, selectedVideoId, searchQuery, sortBy, videoMap]);

  const handleFilterChange = useCallback((newFilter: string) => {
    startTransition(() => {
      setFilter(newFilter);
    });
  }, []);

  const exportClip = useCallback(
    async (clipId: string) => {
      const token = localStorage.getItem("shortsyou_jwt");
      if (!token) return;
      setBusy(clipId);
      setNotice("Queueing 4K export with AI effects & captions…");
      try {
        await api.exportClip(token, clipId);
        notify(
          "Export Queued",
          "AI is now rendering your 9:16 short. It will automatically update when finished.",
          "info"
        );
        setNotice("AI is rendering your short. This card will update live once finished.");
        await refresh(true);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Export failed.";
        setNotice(msg);
        notify("Export Error", msg, "error");
      } finally {
        setBusy(null);
      }
    },
    [refresh]
  );

  const publishClip = useCallback(
    async (clipId: string) => {
      const token = localStorage.getItem("shortsyou_jwt");
      if (!token) return;
      setBusy(clipId);
      setNotice("Publishing clip…");
      try {
        await api.publishClip(token, clipId);
        notify("Clip Published", "Short published and analytics tracking initiated.", "success");
        setNotice("Clip published and analytics collection scheduled.");
        await refresh(true);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Publish failed.";
        setNotice(msg);
        notify("Publish Error", msg, "error");
      } finally {
        setBusy(null);
      }
    },
    [refresh]
  );

  const downloadClip = useCallback(async (clipId: string) => {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token) return;
    setBusy(clipId);
    try {
      const result = await api.downloadClip(token, clipId);
      if (result.downloadUrl) {
        window.open(result.downloadUrl, "_blank", "noopener,noreferrer");
        notify("Download Started", "Opening high-resolution vertical MP4.", "success");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Download is not ready yet.";
      setNotice(msg);
      notify("Download Error", msg, "error");
    } finally {
      setBusy(null);
    }
  }, []);

  const removeClip = useCallback(
    async (clip: Clip) => {
      const token = localStorage.getItem("shortsyou_jwt");
      if (!token || !window.confirm("Remove this short from your library?")) return;
      setBusy(clip.id);
      try {
        await api.deleteClip(token, clip.id);
        setSelected((ids) => ids.filter((id) => id !== clip.id));
        notify("Clip Removed", "The short was deleted.", "info");
        await refresh(true);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Could not remove the clip.";
        setNotice(msg);
        notify("Delete Failed", msg, "error");
      } finally {
        setBusy(null);
      }
    },
    [refresh]
  );

  const publishSelected = useCallback(async () => {
    for (const clipId of selected) await publishClip(clipId);
    setSelected([]);
  }, [selected, publishClip]);

  const exportSelected = useCallback(async () => {
    for (const clipId of selected) await exportClip(clipId);
    setSelected([]);
  }, [selected, exportClip]);

  const signOut = useCallback(() => {
    localStorage.removeItem("shortsyou_jwt");
    router.push("/login");
  }, [router]);

  const toggleSelectClip = useCallback((clipId: string) => {
    setSelected((current) =>
      current.includes(clipId)
        ? current.filter((id) => id !== clipId)
        : [...current, clipId]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelected((current) =>
      current.length === visible.length ? [] : visible.map((clip) => clip.id)
    );
  }, [visible]);

  function resetFilters() {
    setFilter("all");
    setSearchQuery("");
    setSelectedVideoId("all");
    setSortBy("viral_desc");
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

        {/* Filter Toolbar, Search, and Video Picker */}
        <ClipsFilterBar
          filter={filter}
          onFilterChange={handleFilterChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedVideoId={selectedVideoId}
          onVideoChange={setSelectedVideoId}
          sortBy={sortBy}
          onSortChange={setSortBy}
          videos={videos}
          counts={counts}
          allSelected={selected.length === visible.length && visible.length > 0}
          onToggleSelectAll={toggleSelectAll}
          onResetFilters={resetFilters}
        />

        {/* Main Clips Grid with Fluid Framer Motion Grid (Virtualizer removed for stability) */}
        {visible.length > 0 ? (
          <motion.div className="ca-clips-grid" layout>
            <AnimatePresence mode="popLayout">
              {visible.map((clip, index) => (
                <ClipCard
                  key={clip.id}
                  clip={clip}
                  video={videoMap.get(clip.videoId)}
                  selected={selected.includes(clip.id)}
                  busy={busy === clip.id}
                  onSelect={() => toggleSelectClip(clip.id)}
                  onExport={() => void exportClip(clip.id)}
                  onDownload={() => void downloadClip(clip.id)}
                  onDelete={() => void removeClip(clip)}
                  onPreview={(c) => setPreviewClip(c)}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="ca-clips-empty-canvas ca-glass">
            <Clapperboard size={36} className="ca-empty-icon" />
            <h2>
              {searchQuery
                ? `No clips match "${searchQuery}"`
                : filter !== "all"
                ? `No clips with filter "${filter}"`
                : "No AI-created shorts yet"}
            </h2>
            <p>
              {searchQuery || filter !== "all"
                ? "Try adjusting your search query or reset the filters."
                : "Select a video from Your Videos or Targeted Videos and let AI generate viral shorts for you."}
            </p>
            {searchQuery || filter !== "all" ? (
              <button
                type="button"
                className="ca-empty-primary-btn"
                onClick={resetFilters}
              >
                Reset Filters
              </button>
            ) : (
              <Link href="/videos" className="ca-empty-primary-btn">
                Browse Videos
              </Link>
            )}
          </div>
        )}

        {/* In-App Clip Video Preview Modal */}
        <ClipPreviewModal
          clip={previewClip}
          video={previewClip ? videoMap.get(previewClip.videoId) : undefined}
          onClose={() => setPreviewClip(null)}
          onDownload={(id) => void downloadClip(id)}
          onExport={(id) => void exportClip(id)}
          busy={busy !== null}
        />
      </div>
    </WorkspaceShell>
  );
}
