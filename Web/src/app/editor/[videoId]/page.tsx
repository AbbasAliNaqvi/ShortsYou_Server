"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Clapperboard } from "lucide-react";
import { api, type EditSettings, type User, type Video } from "@/lib/api";
import { notify } from "@/components/Notifications/NotificationCenter";
import { WorkspaceShell, LoadingState, EmptyState } from "@/components/Layout";
import dynamic from "next/dynamic";
import { EditorHeaderBanner } from "@/components/Editor/EditorHeaderBanner";
import { EditorControlPanel } from "@/components/Editor/EditorControlPanel";

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
  const [notice, setNotice] = useState("");

  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(30);
  const [hook, setHook] = useState("");
  const [previewStart, setPreviewStart] = useState(0);
  const [composing, setComposing] = useState(false);
  const [composeReasoning, setComposeReasoning] = useState("");

  const [settings, setSettings] = useState<EditSettings>({
    backgroundStyle: "crop",
    colorGrade: "vibrant",
    musicMood: "energetic",
    captionStyle: "karaoke",
    layout: "standard",
    removeSilences: true,
    removeFillers: true,
  });

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
      .catch(() => {
        setNotice("We couldn't load this video.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [params.videoId, router]);

  const duration = video?.durationSeconds ?? 0;
  const clipLength = useMemo(() => Math.max(0, end - start), [start, end]);
  const hasPlayablePreview = Boolean(video?.youtubeVideoId);
  const layout = settings.layout ?? "standard";

  function update<K extends keyof EditSettings>(key: K, value: EditSettings[K]) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
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

  async function handleAutoCompose() {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token || !video) return;
    setComposing(true);
    setNotice("AI Agent is analyzing footage, peak emotional moments, and viral hooks…");
    try {
      const res = await api.autoCompose(token, video.id);
      setStart(res.startTime);
      setPreviewStart(res.startTime);
      setEnd(res.endTime);
      if (res.hookText) setHook(res.hookText);
      if (res.captionStyle) update("captionStyle", res.captionStyle);
      if (res.colorGrade) update("colorGrade", res.colorGrade);
      if (res.musicMood) update("musicMood", res.musicMood);
      if (res.backgroundStyle) update("backgroundStyle", res.backgroundStyle);
      if (res.layout) update("layout", res.layout);
      setComposeReasoning(res.reasoning);
      notify("AI Agent Tuned Short", res.reasoning, "success");
      setNotice(`AI Agent tuned: ${Math.round(res.duration)}s short with "${res.hookText}"`);
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
    return await api.generateHooks(token, video.id, hook);
  }

  async function render() {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token || !video) return;

    if (start < 0 || end <= start || (duration && end > duration)) {
      const rangeErr = "Choose a valid in-video range.";
      setNotice(rangeErr);
      notify("Invalid Range", rangeErr, "error");
      return;
    }

    setRendering(true);
    setNotice("");

    try {
      await api.createManualShort(token, video.id, start, end, hook, settings);
      const successMsg = "Render started. Your finished short will appear in Clips Review.";
      setNotice(successMsg);
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
      title="Custom Short Studio"
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
          {/* Top Banner with Video Details & Create Action */}
          <EditorHeaderBanner
            title={video.title}
            duration={duration}
            clipLength={clipLength}
            rendering={rendering}
            notice={notice}
            onRender={() => void render()}
            onClearNotice={() => setNotice("")}
          />

          {/* Two-Column Editor Grid: Preview on Left, Settings on Right */}
          <div className="ca-editor-two-col-grid">
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

            <EditorControlPanel
              settings={settings}
              layout={layout}
              hook={hook}
              onUpdate={update}
              onSetHook={setHook}
              onAutoCompose={handleAutoCompose}
              composing={composing}
              composeReasoning={composeReasoning}
              onFetchHookVariations={handleFetchHookVariations}
            />
          </div>
        </div>
      )}
    </WorkspaceShell>
  );
}
