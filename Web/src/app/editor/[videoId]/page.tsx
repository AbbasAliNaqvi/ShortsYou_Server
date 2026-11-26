"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Clapperboard, Loader2, Sparkles, WandSparkles } from "lucide-react";
import {
  api,
  type AutoComposeResult,
  type EditSettings,
  type HookVariation,
  type User,
  type Video,
} from "@/lib/api";
import { notify } from "@/components/Notifications/NotificationCenter";
import { WorkspaceShell, EmptyState } from "@/components/Layout";
import { EditorHeaderBanner } from "@/components/Editor/EditorHeaderBanner";
import { EditorControlPanel } from "@/components/Editor/EditorControlPanel";
import { AgenticDirector } from "@/components/Editor/AgenticDirector";
import { StudioTimeline, type PeakMoment } from "@/components/Editor/StudioTimeline";
import { RenderProgressDrawer } from "@/components/Editor/RenderProgressDrawer";
import { formatDuration } from "@/lib/formatters";

const EditorPhonePreview = dynamic(
  () => import("@/components/Editor/EditorPhonePreview").then((m) => m.EditorPhonePreview),
  {
    ssr: false,
    loading: () => (
      <div className="ss-left-col" aria-hidden="true">
        <div className="ss-skeleton" style={{ height: 480 }} />
        <div className="ss-skeleton" style={{ height: 220 }} />
      </div>
    ),
  }
);

interface EditorSnapshot {
  start: number;
  end: number;
  hook: string;
  settings: EditSettings;
}

function StaticStudioSkeleton() {
  return (
    <div className="ss-root" aria-busy="true" aria-label="Loading AI Short Studio">
      <div className="ss-skeleton" style={{ height: 42 }} />
      <div className="ss-grid">
        <div className="ss-left-col">
          <div className="ss-skeleton" style={{ height: 480 }} />
          <div className="ss-skeleton" style={{ height: 220 }} />
        </div>
        <div className="ss-right-col">
          <div className="ss-skeleton" style={{ height: 52, width: 280 }} />
          <div className="ss-skeleton" style={{ height: 420 }} />
        </div>
      </div>
      <div className="ss-skeleton" style={{ height: 140 }} />
    </div>
  );
}

export default function CustomShortEditor() {
  const params = useParams<{ videoId: string }>();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [renderSuccess, setRenderSuccess] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");

  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(30);
  const [hook, setHook] = useState("");
  const [previewStart, setPreviewStart] = useState(0);
  const [playhead, setPlayhead] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const [composing, setComposing] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);
  const [composeResult, setComposeResult] = useState<AutoComposeResult | null>(null);
  const [hookVariations, setHookVariations] = useState<HookVariation[]>([]);
  const [activeTab, setActiveTab] = useState<"director" | "controls">("director");

  const [settings, setSettings] = useState<EditSettings>({
    backgroundStyle: "crop",
    colorGrade: "vibrant",
    musicMood: "energetic",
    captionStyle: "karaoke",
    layout: "standard",
    removeSilences: true,
    removeFillers: true,
  });

  // Undo / Redo History
  const [history, setHistory] = useState<EditorSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<EditorSnapshot[]>([]);
  const lastSnapshotRef = useRef<string>("");

  // Load video + user in parallel
  useEffect(() => {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token) {
      router.replace("/login");
      return;
    }

    // TODO: Backend API calls to load current user & studio videos
    Promise.allSettled([api.me(token), api.videos(token)])
      .then(([userRes, videosRes]) => {
        if (userRes.status === "fulfilled") setUser(userRes.value);
        if (videosRes.status === "fulfilled") {
          const items = videosRes.value ?? [];
          const found = items.find((item) => item.id === params.videoId) ?? null;
          setVideo(found);
          if (found) {
            const defaultEnd = Math.min(30, Math.max(1, found.durationSeconds || 30));
            let restored = false;
            try {
              const raw = localStorage.getItem(`shortsyou_editor_draft_${found.id}`);
              if (raw) {
                const draft = JSON.parse(raw) as Partial<EditorSnapshot>;
                if (typeof draft.start === "number") {
                  setStart(draft.start);
                  setPreviewStart(draft.start);
                  setPlayhead(draft.start);
                }
                if (typeof draft.end === "number") setEnd(draft.end);
                if (typeof draft.hook === "string") setHook(draft.hook);
                if (draft.settings) setSettings((prev) => ({ ...prev, ...draft.settings }));
                restored = true;
              }
            } catch {
              restored = false;
            }
            if (!restored) setEnd(defaultEnd);
          } else {
            setNotice("This video is no longer available in your studio.");
          }
        }
      })
      .catch(() => setNotice("We couldn't load this video."))
      .finally(() => setLoading(false));
  }, [params.videoId, router]);

  // Autosave draft & record undo snapshots
  useEffect(() => {
    if (!video || loading) return;
    const snap: EditorSnapshot = { start, end, hook, settings };
    const serialized = JSON.stringify(snap);
    if (lastSnapshotRef.current && lastSnapshotRef.current !== serialized) {
      try {
        const prevSnap = JSON.parse(lastSnapshotRef.current) as EditorSnapshot;
        setHistory((h) => [...h.slice(-24), prevSnap]);
        setRedoStack([]);
      } catch {
        // ignore parse errors
      }
    }
    lastSnapshotRef.current = serialized;

    setSaveStatus("saving");
    const t = setTimeout(() => {
      try {
        localStorage.setItem(`shortsyou_editor_draft_${video.id}`, serialized);
      } catch {
        // ignore quota errors
      }
      setSaveStatus("saved");
    }, 350);

    return () => clearTimeout(t);
  }, [start, end, hook, settings, video, loading]);

  // Advance playhead smoothly when preview is playing
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setPlayhead((p) => (p + 0.2 > end ? start : Number((p + 0.2).toFixed(1))));
    }, 200);
    return () => clearInterval(id);
  }, [isPlaying, start, end]);

  const duration = video?.durationSeconds ?? 0;
  const clipLength = useMemo(() => Math.max(0, end - start), [start, end]);
  const hasPlayablePreview = Boolean(video?.youtubeVideoId);
  const layout = settings.layout ?? "standard";

  const peaks: PeakMoment[] = useMemo(() => {
    const dur = Math.max(duration || 90, 30);
    const p1Start = composeResult ? composeResult.startTime : Math.round(dur * 0.14);
    const p1End = composeResult ? composeResult.endTime : Math.min(dur, p1Start + 30);
    const p2Start = Math.min(Math.max(0, Math.round(dur * 0.44)), Math.max(0, dur - 28));
    const p3Start = Math.min(Math.max(0, Math.round(dur * 0.72)), Math.max(0, dur - 25));
    return [
      { id: "peak-1", label: "Peak 1", start: p1Start, end: p1End },
      { id: "peak-2", label: "Peak 2", start: p2Start, end: Math.min(dur, p2Start + 28) },
      { id: "peak-3", label: "Peak 3", start: p3Start, end: Math.min(dur, p3Start + 25) },
    ];
  }, [duration, composeResult]);

  function clamp(value: number, min: number, max: number) {
    if (!Number.isFinite(value)) return min;
    return Math.min(Math.max(value, min), max);
  }

  const update = useCallback(<K extends keyof EditSettings>(key: K, value: EditSettings[K]) => {
    setSettings((curr) => ({ ...curr, [key]: value }));
  }, []);

  const setStartBound = useCallback(
    (value: number) => {
      const next = clamp(value, 0, Math.max(0, end - 0.5));
      setStart(next);
      setPreviewStart(next);
      setPlayhead(next);
    },
    [end]
  );

  const setEndBound = useCallback(
    (value: number) => {
      setEnd(clamp(value, start + 0.5, duration || 60));
    },
    [start, duration]
  );

  const handleSelectPeak = useCallback((peak: PeakMoment) => {
    setStart(peak.start);
    setEnd(peak.end);
    setPreviewStart(peak.start);
    setPlayhead(peak.start);
    setNotice(`Snapped to ${peak.label} (${formatDuration(peak.start)} – ${formatDuration(peak.end)})`);
  }, []);

  const handleUndo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setRedoStack((r) => [...r, { start, end, hook, settings }]);
      lastSnapshotRef.current = JSON.stringify(prev);
      setStart(prev.start);
      setEnd(prev.end);
      setHook(prev.hook);
      setSettings(prev.settings);
      return h.slice(0, -1);
    });
  }, [start, end, hook, settings]);

  const handleRedo = useCallback(() => {
    setRedoStack((r) => {
      if (r.length === 0) return r;
      const next = r[r.length - 1];
      setHistory((h) => [...h, { start, end, hook, settings }]);
      lastSnapshotRef.current = JSON.stringify(next);
      setStart(next.start);
      setEnd(next.end);
      setHook(next.hook);
      setSettings(next.settings);
      return r.slice(0, -1);
    });
  }, [start, end, hook, settings]);

  // ── AI Agentic Director: auto-compose ──────────────────────────────────────
  async function handleAutoCompose() {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token || !video) return;
    setComposing(true);
    setComposeError(null);
    setComposeResult(null);
    setRenderSuccess(false);
    setNotice("AI Director is analyzing your footage…");
    try {
      // TODO: Backend API call for AI Agentic Director auto-compose
      const res = await api.autoCompose(token, video.id);
      setStart(res.startTime);
      setPreviewStart(res.startTime);
      setPlayhead(res.startTime);
      setEnd(res.endTime);
      if (res.hookText) setHook(res.hookText);
      if (res.captionStyle) update("captionStyle", res.captionStyle);
      if (res.colorGrade) update("colorGrade", res.colorGrade);
      if (res.musicMood) update("musicMood", res.musicMood);
      if (res.backgroundStyle) update("backgroundStyle", res.backgroundStyle);
      if (res.layout) update("layout", res.layout);
      setComposeResult(res);
      notify("AI Director Complete", res.reasoning, "success");
      setNotice(`Composed ${Math.round(res.duration)}s short`);

      // TODO: Backend API call for alternative hook variations
      const vars = await api.generateHooks(token, video.id, res.hookText).catch(() => []);
      setHookVariations(vars ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI auto-composition failed.";
      setComposeError(msg);
      setNotice(msg);
      notify("Auto-Compose", msg, "error");
    } finally {
      setComposing(false);
    }
  }

  async function handleFetchHookVariations() {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token || !video) return [];
    // TODO: Backend API call to generate hook variations
    const vars = await api.generateHooks(token, video.id, hook);
    setHookVariations(vars ?? []);
    return vars ?? [];
  }

  // ── Render / Create short ──────────────────────────────────────────────────
  const render = useCallback(
    async (customOverrides?: {
      start?: number;
      end?: number;
      hook?: string;
      settings?: EditSettings;
    }) => {
      const token = localStorage.getItem("shortsyou_jwt");
      if (!token || !video) return;

      const finalStart = customOverrides?.start !== undefined ? customOverrides.start : start;
      const finalEnd = customOverrides?.end !== undefined ? customOverrides.end : end;
      const finalHook = customOverrides?.hook !== undefined ? customOverrides.hook : hook;
      const finalSettings = customOverrides?.settings ?? settings;

      if (finalStart < 0 || finalEnd <= finalStart || (duration && finalEnd > duration)) {
        const rangeErr = "Choose a valid in-video range.";
        setNotice(rangeErr);
        notify("Invalid Range", rangeErr, "error");
        return;
      }

      setRendering(true);
      setDrawerOpen(true);
      setNotice("");
      setRenderSuccess(false);
      try {
        // TODO: Backend API call to queue manual/directed short render
        await api.createManualShort(token, video.id, finalStart, finalEnd, finalHook, finalSettings);
        const successMsg = "Short queued! Track progress or open Clips.";
        setNotice(successMsg);
        setRenderSuccess(true);
        notify("Short Rendering", successMsg, "success");
        router.push("/clips");
      } catch (error) {
        const err = error instanceof Error ? error.message : "We couldn't start the render.";
        setNotice(err);
        setDrawerOpen(false);
        notify("Render Failed", err, "error");
      } finally {
        setRendering(false);
      }
    },
    [video, start, end, hook, settings, duration]
  );

  // Keyboard shortcuts: Ctrl+Z / Ctrl+Shift+Z, Space = play/pause, Enter = Create Short
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isInput =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }

      if (isInput) return;

      if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === "Enter" && !rendering) {
        e.preventDefault();
        void render();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleUndo, handleRedo, render, rendering]);

  function signOut() {
    localStorage.removeItem("shortsyou_jwt");
    router.push("/login");
  }

  return (
    <WorkspaceShell
      title="AI Short Studio"
      subtitle={video?.title || "Timeline & Framing Studio"}
      user={user}
      refreshing={rendering}
      onSignOut={signOut}
    >
      {loading ? (
        <StaticStudioSkeleton />
      ) : !video ? (
        <EmptyState
          text={notice || "Video not found in your studio."}
          icon={Clapperboard}
          action={
            <Link href="/editor" className="ca-empty-action-link">
              Choose another video
            </Link>
          }
        />
      ) : (
        <div className="ss-root">
          <EditorHeaderBanner
            title={video.title}
            duration={duration}
            clipLength={clipLength}
            rendering={rendering}
            notice={notice}
            saveStatus={saveStatus}
            canUndo={history.length > 0}
            canRedo={redoStack.length > 0}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onRender={() => void render()}
            onClearNotice={() => setNotice("")}
          />

          <div className="ss-grid">
            {/* LEFT (sticky 380px): Phone Preview + Your Short Summary Card */}
            <EditorPhonePreview
              video={video}
              hasPlayablePreview={hasPlayablePreview}
              previewStart={previewStart}
              hook={hook}
              layout={layout}
              start={start}
              end={end}
              duration={duration}
              settings={settings}
              isPlaying={isPlaying}
              isMuted={isMuted}
              rendering={rendering}
              onTogglePlay={() => setIsPlaying((p) => !p)}
              onToggleMute={() => setIsMuted((m) => !m)}
              onRender={() => void render()}
              onSetStartBound={setStartBound}
              onSetEndBound={setEndBound}
            />

            {/* RIGHT: Segmented Tab Bar + Active Panel */}
            <div className="ss-right-col">
              <div className="ss-tabs-wrap">
                <div className="ss-tabs" role="tablist" aria-label="Studio mode">
                  <button
                    type="button"
                    role="tab"
                    id="ss-tab-director"
                    aria-selected={activeTab === "director"}
                    aria-controls="ss-panel-director"
                    className={`ss-tab-btn ${activeTab === "director" ? "active" : ""}`}
                    onClick={() => setActiveTab("director")}
                  >
                    {activeTab === "director" && <span className="ss-tab-indicator" />}
                    <Sparkles size={14} />
                    <span>AI Director</span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    id="ss-tab-controls"
                    aria-selected={activeTab === "controls"}
                    aria-controls="ss-panel-controls"
                    className={`ss-tab-btn ${activeTab === "controls" ? "active" : ""}`}
                    onClick={() => setActiveTab("controls")}
                  >
                    {activeTab === "controls" && <span className="ss-tab-indicator" />}
                    <span>Manual Controls</span>
                  </button>
                </div>
              </div>

              <div
                role="tabpanel"
                id={activeTab === "director" ? "ss-panel-director" : "ss-panel-controls"}
                aria-labelledby={activeTab === "director" ? "ss-tab-director" : "ss-tab-controls"}
              >
                {activeTab === "director" ? (
                  <AgenticDirector
                    composing={composing}
                    composeError={composeError}
                    rendering={rendering}
                    renderSuccess={renderSuccess}
                    result={composeResult}
                    hookVariations={hookVariations}
                    settings={settings}
                    currentHook={hook}
                    currentStart={start}
                    currentEnd={end}
                    peaks={peaks}
                    onAutoCompose={handleAutoCompose}
                    onApplyHook={(h) => setHook(h)}
                    onUpdateSetting={update}
                    onSelectPeak={handleSelectPeak}
                    onUseApproachAndRender={render}
                    onSwitchToManual={() => setActiveTab("controls")}
                    onResetSuccess={() => setRenderSuccess(false)}
                  />
                ) : (
                  <EditorControlPanel
                    settings={settings}
                    layout={layout}
                    hook={hook}
                    aiSuggestion={composeResult}
                    onUpdate={update}
                    onSetHook={setHook}
                    composing={composing}
                    composeReasoning={composeResult?.reasoning ?? ""}
                    onFetchHookVariations={handleFetchHookVariations}
                  />
                )}
              </div>
            </div>
          </div>

          {/* BOTTOM FULL WIDTH: Timeline */}
          <StudioTimeline
            duration={duration}
            start={start}
            end={end}
            playhead={playhead}
            thumbnailUrl={video.thumbnailUrl}
            peaks={peaks}
            onSetStartBound={setStartBound}
            onSetEndBound={setEndBound}
            onSeek={(t) => {
              setPlayhead(t);
              setPreviewStart(t);
            }}
            onSelectPeak={handleSelectPeak}
          />
        </div>
      )}

      {/* Mobile / Tablet Sticky Bottom Summary Bar */}
      {video && !loading && (
        <div className="ss-mobile-sticky-bar">
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ss-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {video.title}
            </div>
            <div className="ss-meta-mono">
              {formatDuration(start)} → {formatDuration(end)} ({formatDuration(clipLength)})
            </div>
          </div>
          <button
            type="button"
            className="ss-btn-primary"
            onClick={() => void render()}
            disabled={rendering}
          >
            {rendering ? <Loader2 size={15} className="ss-spin" /> : <WandSparkles size={15} />}
            <span>{rendering ? "Creating…" : "Create Short"}</span>
          </button>
        </div>
      )}

      <RenderProgressDrawer
        open={drawerOpen}
        rendering={rendering}
        success={renderSuccess}
        onClose={() => setDrawerOpen(false)}
      />
    </WorkspaceShell>
  );
}
