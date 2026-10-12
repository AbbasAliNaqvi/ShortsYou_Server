"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clapperboard } from "lucide-react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { api, type Clip, type User, type Video } from "@/lib/api";
import { WorkspaceShell } from "@/components/Layout";
import { ClipsHeroBanner } from "./ClipsHeroBanner";
import { ClipsMetricsOverview } from "./ClipsMetricsOverview";
import { ClipsFilterBar } from "./ClipsFilterBar";
import { ClipCard } from "./ClipCard";

export function ClipsReviewPage() {
  const router = useRouter();
  const parentRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();

  const [clips, setClips] = useState<Clip[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [columnCount, setColumnCount] = useState(4);

  const refresh = useCallback(async () => {
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
      setNotice(
        error instanceof Error ? error.message : "Unable to refresh clips."
      );
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void refresh());
  }, [refresh]);

  // Responsive column detection for virtualized grid chunking
  useEffect(() => {
    const updateColumns = () => {
      const width = parentRef.current?.offsetWidth ?? (typeof window !== "undefined" ? window.innerWidth - 120 : 1200);
      // minmax(215px, 1fr) with 16px gap
      const cols = Math.max(1, Math.floor((width + 16) / (215 + 16)));
      setColumnCount(cols);
    };
    updateColumns();
    window.addEventListener("resize", updateColumns, { passive: true });
    return () => window.removeEventListener("resize", updateColumns);
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

  // O(1) indexed video map lookup instead of O(N) Array.find on every card
  const videoMap = useMemo(() => {
    const map = new Map<string, Video>();
    for (const v of videos) map.set(v.id, v);
    return map;
  }, [videos]);

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
    },
    [refresh]
  );

  const publishClip = useCallback(
    async (clipId: string) => {
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
    },
    [refresh]
  );

  const downloadClip = useCallback(async (clipId: string) => {
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
  }, []);

  const removeClip = useCallback(
    async (clip: Clip) => {
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

  // Chunk visible items into grid rows for row-level virtualization
  const isVirtualized = visible.length > 8;
  const chunkedRows = useMemo(() => {
    if (!isVirtualized) return [];
    const rows: Clip[][] = [];
    for (let i = 0; i < visible.length; i += columnCount) {
      rows.push(visible.slice(i, i + columnCount));
    }
    return rows;
  }, [visible, columnCount, isVirtualized]);

  const virtualizer = useWindowVirtualizer({
    count: isVirtualized ? chunkedRows.length : 0,
    estimateSize: () => 440,
    overscan: 2,
    scrollMargin: parentRef.current?.offsetTop ?? 0,
  });

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
          onFilterChange={handleFilterChange}
          allSelected={selected.length === visible.length && visible.length > 0}
          onToggleSelectAll={toggleSelectAll}
          totalCount={clips.length}
        />

        {/* Main Clips Grid with window-level row virtualization */}
        {visible.length > 0 ? (
          <div ref={parentRef}>
            {isVirtualized ? (
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const rowClips = chunkedRows[virtualRow.index] ?? [];
                  const startIndex = virtualRow.index * columnCount;

                  return (
                    <div
                      key={virtualRow.index}
                      ref={virtualizer.measureElement}
                      data-index={virtualRow.index}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateY(${
                          virtualRow.start - (virtualizer.options.scrollMargin ?? 0)
                        }px)`,
                      }}
                    >
                      <div className="ca-clips-grid" style={{ marginBottom: "16px" }}>
                        {rowClips.map((clip, colIndex) => {
                          const globalIndex = startIndex + colIndex;
                          return (
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
                              index={globalIndex}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="ca-clips-grid">
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
                    index={index}
                  />
                ))}
              </div>
            )}
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
