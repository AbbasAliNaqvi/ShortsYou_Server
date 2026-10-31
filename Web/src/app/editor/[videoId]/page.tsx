"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Clapperboard } from "lucide-react";
import {
  api,
  type AutoComposeResult,
  type EditSettings,
  type HookVariation,
  type User,
  type Video,
} from "@/lib/api";
import { notify } from "@/components/Notifications/NotificationCenter";
import { WorkspaceShell, LoadingState, EmptyState } from "@/components/Layout";
import dynamic from "next/dynamic";
import { EditorHeaderBanner } from "@/components/Editor/EditorHeaderBanner";
import { EditorControlPanel } from "@/components/Editor/EditorControlPanel";
import { AgenticDirector } from "@/components/Editor/AgenticDirector";

const EditorPhonePreview = dynamic(
  () => import("@/components/Editor/EditorPhonePreview").then((m) => m.EditorPhonePreview),
  {
    ssr: false,
    loading: () => (
      <section
        className="ca-editor-preview-container ca-glass"
        style={{ minHeight: "680px" }}
        aria-hidden="true"
      />
    ),
  }
);

export default function CustomShortEditor() {
  const params = useParams<{ videoId: string }>();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [renderSuccess, setRenderSuccess] = useState(false);
  const [notice, setNotice] = useState("");

  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(30);
  const [hook, setHook] = useState("");
  const [previewStart, setPreviewStart] = useState(0);
  const [composing, setComposing] = useState(false);
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

  // Load video + user in parallel
  useEffect(() => {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token) {
      router.replace("/login");
      return;
    }

    Promise.allSettled([api.me(token), api.videos(token)])
      .then(([userRes, videosRes]) => {
        if (userRes.status === "fulfilled") setUser(userRes.value);
        if (videosRes.status === "fulfilled") {
          const items = videosRes.value ?? [];
          const found = items.find((item) => item.id === params.videoId) ?? null;
          setVideo(found);
          if (found) {
            setEnd(Math.min(30, Math.max(1, found.durationSeconds || 30)));
          } else {
            setNotice("This video is no longer available in your studio.");
          }
        }
      })
      .catch(() => setNotice("We couldn't load this video."))
      .finally(() => setLoading(false));
  }, [params.videoId, router]);

  const duration = video?.durationSeconds ?? 0;
  const clipLength = useMemo(() => Math.max(0, end - start), [start, end]);
  const hasPlayablePreview = Boolean(video?.youtubeVideoId);
  const layout = settings.layout ?? "standard";

  function update<K extends keyof EditSettings>(key: K, value: EditSettings[K]) {
    setSettings((curr) => ({ ...curr, [key]: value }));
  }

  function clamp(value: number, min: number, max: number) {
    if (!Number.isFinite(value)) return min;
    return Math.min(Math.max(value, min), max);
  }

  function setStartBound(value: number) {
    const next = clamp(value, 0, Math.max(0, end - 0.1));
    setStart(next);
    setPreviewStart(next);
  }

  function setEndBound(value: number) {
    setEnd(clamp(value, start + 0.1, duration || 60));
  }

  // ── AI Agentic Director: auto-compose ──────────────────────────────────────
  async function handleAutoCompose() {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token || !video) return;
    setComposing(true);
    setComposeResult(null);
    setRenderSuccess(false);
    setNotice("AI Agentic Director is analyzing your footage…");
    try {
      const res = await api.autoCompose(token, video.id);
      // Apply all AI director settings to editor state
      setStart(res.startTime);
      setPreviewStart(res.startTime);
      setEnd(res.endTime);
      if (res.hookText) setHook(res.hookText);
      if (res.captionStyle) update("captionStyle", res.captionStyle);
      if (res.colorGrade) update("colorGrade", res.colorGrade);
      if (res.musicMood) update("musicMood", res.musicMood);
      if (res.backgroundStyle) update("backgroundStyle", res.backgroundStyle);
      if (res.layout) update("layout", res.layout);
      setComposeResult(res);
      notify("AI Director Complete", res.reasoning, "success");
      setNotice(`Composed: ${Math.round(res.duration)}s · "${res.hookText}"`);

      // Also fetch hook variations in background
      const vars = await api.generateHooks(token, video.id, res.hookText).catch(() => []);
      setHookVariations(vars ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI auto-composition failed.";
      setNotice(msg);
      notify("Auto-Compose", msg, "error");
    } finally {
      setComposing(false);
    }
  }

  async function handleFetchHookVariations() {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token || !video) return [];
    const vars = await api.generateHooks(token, video.id, hook);
    setHookVariations(vars ?? []);
    return vars ?? [];
  }

  // ── Render / Create short ──────────────────────────────────────────────────
  async function render(customOverrides?: {
    start?: number;
    end?: number;
    hook?: string;
    settings?: EditSettings;
  }) {
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
    setNotice("");
    setRenderSuccess(false);
    try {
      await api.createManualShort(token, video.id, finalStart, finalEnd, finalHook, finalSettings);
      const successMsg = "Render queued! Your short is being created with this approach and will appear in Clips Review.";
      setNotice(successMsg);
      setRenderSuccess(true);
      notify("Short Rendering", successMsg, "success");
    } catch (error) {
      const err = error instanceof Error ? error.message : "We couldn't start the render.";
      setNotice(err);
      notify("Render Failed", err, "error");
    } finally {
      setRendering(false);
    }
  }

  function signOut() {
    localStorage.removeItem("shortsyou_jwt");
    router.push("/login");
  }

  return (
    <WorkspaceShell
      title="AI Short Studio"
      subtitle={video?.title || "Timeline Editor"}
      user={user}
      refreshing={rendering}
      onSignOut={signOut}
    >
      {loading ? (
        <LoadingState />
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
        <div className="ca-editor-workspace-stack">
          {/* Top Banner */}
          <EditorHeaderBanner
            title={video.title}
            duration={duration}
            clipLength={clipLength}
            rendering={rendering}
            notice={notice}
            onRender={() => void render()}
            onClearNotice={() => setNotice("")}
          />

          {/* Main Editor Grid */}
          <div className="ca-editor-three-col-grid">
            {/* Col 1: Phone Preview + Timeline */}
            <EditorPhonePreview
              video={video}
              hasPlayablePreview={hasPlayablePreview}
              previewStart={previewStart}
              hook={hook}
              layout={layout}
              start={start}
              end={end}
              duration={duration}
              onSetStartBound={setStartBound}
              onSetEndBound={setEndBound}
            />

            {/* Col 2+3: Tab-switched — AI Director | Manual Controls */}
            <div className="ca-editor-right-panel">
              {/* Tab switcher */}
              <div className="ca-editor-tab-bar">
                <button
                  type="button"
                  className={`ca-editor-tab ${activeTab === "director" ? "active" : ""}`}
                  onClick={() => setActiveTab("director")}
                >
                  <span className="ca-tab-spark">✦</span> AI Director
                </button>
                <button
                  type="button"
                  className={`ca-editor-tab ${activeTab === "controls" ? "active" : ""}`}
                  onClick={() => setActiveTab("controls")}
                >
                  Manual Controls
                </button>
              </div>

              {/* Panel content */}
              {activeTab === "director" ? (
                <AgenticDirector
                  composing={composing}
                  rendering={rendering}
                  renderSuccess={renderSuccess}
                  result={composeResult}
                  hookVariations={hookVariations}
                  settings={settings}
                  currentHook={hook}
                  currentStart={start}
                  currentEnd={end}
                  onAutoCompose={handleAutoCompose}
                  onApplyHook={(h) => setHook(h)}
                  onUpdateSetting={update}
                  onUseApproachAndRender={render}
                  onSwitchToManual={() => setActiveTab("controls")}
                  onResetSuccess={() => setRenderSuccess(false)}
                />
              ) : (
                <EditorControlPanel
                  settings={settings}
                  layout={layout}
                  hook={hook}
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
      )}
    </WorkspaceShell>
  );
}
