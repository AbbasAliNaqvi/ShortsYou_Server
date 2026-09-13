"use client";
/* External creator and Supabase assets are intentionally rendered without Next's image proxy. */
/* eslint-disable @next/next/no-img-element */

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  Check,
  ChevronRight,
  Clapperboard,
  Copy,
  LogOut,
  Menu,
  Play,
  Plus,
  RefreshCw,
  Send,
  Settings2,
  Sparkles,
  Terminal,
  UploadCloud,
  WandSparkles,
  X,
} from "lucide-react";
import { api, type Clip, type Job, type User, type Video } from "@/lib/api";

const navItems = [
  [Sparkles, "Studio"],
  [Play, "Videos"],
  [WandSparkles, "Editor"],
  [Clapperboard, "Clips"],
  [BarChart3, "Analytics"],
] as const;
const fallbackThumbs = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCbxGgdgyq3gfBMdpPdrUwSGMFYT8Je22R6K5NLudSv-tQSwWhd2kLdw1j8KpZJrYHJTyAgBOxrGn6Pd2fbyBycRDvbTFjU8Mp4tdGa1TlPLYossyPzeTaQGiDBuWwu80MUFX-wn3wPph_CNEAMGZXAS9czZdvFoGSg8RWgb3vNyhFp9Or6rHEFQ-tcWsn0p3qR4g4oZo4iGawYZ64mavBpf7ljI6d43Lcza3_zBmen4ejUt_vO3KHs",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBHiTExBHrxUrsYBNiUSvkGp2yOfc2dwHvXRaSGDLBcpX30E1hjR7xkWr6fih9VUZiKIOfKliZyWPOW87ojjgvrCudlZRpBETkTA8eHK73UQh-ttEV5ECNQ7HeolEKsckr98hTS_QNBkZ6wbbW7zNR3HxcXYI4HZLEgjJW8IoQ0cxvLdYxu9jgIQB5luVUPZa8c4tp2lQeo5DdLfsmlS3ByJhZpc1YLnzRRKdNM6TJTO-I6W3jw-c8U",
];

type Stats = {
  shorts: number;
  activeJobs: number;
  views: number;
  processed: number;
};

export function PlaceholderDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeNav, setActiveNav] = useState("Studio");
  const [menuOpen, setMenuOpen] = useState(false);
  const [sourceUrl, setSourceUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [exportingClip, setExportingClip] = useState<string | null>(null);

  async function loadDashboard() {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token) {
      setLoading(false);
      setError(
        "Your studio session has expired. Sign in again to load the workspace.",
      );
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
    if (videosResult.status === "fulfilled")
      setVideos(videosResult.value ?? []);
    if (clipsResult.status === "fulfilled") setClips(clipsResult.value ?? []);
    if (jobsResult.status === "fulfilled") setJobs(jobsResult.value ?? []);
    if (results.every((result) => result.status === "rejected"))
      setError(
        "The studio API is unavailable. Check that the Go server is running on port 5050.",
      );
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

  const stats = useMemo<Stats>(
    () => ({
      shorts: clips.length,
      activeJobs: jobs.filter(
        (job) => !["completed", "failed"].includes(job.status),
      ).length,
      views: videos.reduce((sum, video) => sum + (video.viewCount || 0), 0),
      processed: videos.filter(
        (video) => video.processingStatus === "completed",
      ).length,
    }),
    [clips, jobs, videos],
  );
  const recommendations = [...clips]
    .sort((a, b) => b.viralScore - a.viralScore)
    .slice(0, 4);

  function signOut() {
    localStorage.removeItem("shortsyou_jwt");
    router.push("/login");
  }

  async function handleIngest(event: FormEvent) {
    event.preventDefault();
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token || !sourceUrl.trim()) return;
    const transcribe = window.confirm(
      "Do you want transcription?\n\nOK = Yes, transcribe this video\nCancel = No, save it without transcription",
    );
    setNotice("Submitting source to the processing queue...");
    try {
      const result = await api.ingest(token, sourceUrl.trim(), transcribe);
      setSourceUrl("");
      setNotice(
        transcribe
          ? `${result.title} queued for AI analysis.`
          : `${result.title} was saved without transcription.`,
      );
      await loadDashboard();
    } catch (ingestError) {
      setNotice(
        ingestError instanceof Error
          ? ingestError.message
          : "Unable to queue this source.",
      );
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
      setNotice(
        "Short rendering started. It will appear as downloadable when ready.",
      );
      await loadDashboard();
    } catch (createError) {
      setNotice(
        createError instanceof Error
          ? createError.message
          : "Unable to create this short.",
      );
    } finally {
      setExportingClip(null);
    }
  }

  return (
    <main className="workspace-page">
      <WorkspaceRail
        active={activeNav}
        open={menuOpen}
        clips={clips.length}
        onClose={() => setMenuOpen(false)}
        onSelect={setActiveNav}
        onSignOut={signOut}
        user={user}
      />
      <div className="workspace-main">
        <WorkspaceHeader
          email={user?.email}
          refreshing={refreshing}
          onMenu={() => setMenuOpen(true)}
          onRefresh={() => void loadDashboard()}
          onSignOut={signOut}
        />
        <div className="workspace-content">
          <section className="workspace-hero">
            <span className="workspace-kicker">
              <Sparkles size={13} /> Studio command center
            </span>
            <h1>
              Your studio is ready<span>.</span>
            </h1>
            <p>
              Turn YouTube channels and long-form broadcasts into viral vertical
              clips with multi-speaker tracking, AI hook detection, and kinetic
              subtitles.
            </p>
          </section>
          <IngestPanel
            sourceUrl={sourceUrl}
            notice={notice}
            onChange={setSourceUrl}
            onCopy={copySource}
            onSubmit={handleIngest}
          />
          {error && (
            <div className="dashboard-error">
              {error} <Link href="/login">Return to sign in</Link>
            </div>
          )}
          {loading ? (
            <LoadingDashboard />
          ) : (
            <>
              <Stats stats={stats} />
              <Jobs jobs={jobs} videos={videos} />
              <Recommendations
                clips={recommendations}
                videos={videos}
                exportingClip={exportingClip}
                onCreateShort={createShort}
              />
              <ProductionShelf videos={videos.slice(0, 4)} clips={clips} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function WorkspaceRail({
  active,
  open,
  clips,
  user,
  onClose,
  onSelect,
  onSignOut,
}: {
  active: string;
  open: boolean;
  clips: number;
  user: User | null;
  onClose: () => void;
  onSelect: (label: string) => void;
  onSignOut: () => void;
}) {
  return (
    <aside className={`workspace-rail ${open ? "open" : ""}`}>
      <div className="rail-brand">
        <Link href="/">
          <span>SY</span>
        </Link>
        <button onClick={onClose} aria-label="Close menu">
          <X size={17} />
        </button>
      </div>
      <nav>
        {navItems.map(([Icon, label]) => {
          const href =
            label === "Studio"
              ? "/dashboard"
              : label === "Clips"
                ? "/clips"
                : label === "Videos"
                  ? "/videos"
                  : label === "Editor"
                    ? "/editor"
                  : "/analytics";
          return (
            <Link
              href={href}
              key={label}
              className={active === label ? "active" : ""}
              onClick={() => {
                onSelect(label);
                onClose();
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === "Clips" && clips > 0 ? <b>{clips}</b> : null}
            </Link>
          );
        })}
      </nav>
      <div className="rail-bottom">
        <button>
          <Terminal size={17} />
          API Docs
        </button>
        <button>
          <Settings2 size={17} />
          Settings
        </button>
        <button onClick={onSignOut}>
          <LogOut size={17} />
          Sign out
        </button>
        {user?.profilePicture ? (
          <img src={user.profilePicture} alt={user.name} />
        ) : (
          <span className="rail-avatar">{initials(user?.name)}</span>
        )}
      </div>
    </aside>
  );
}

function WorkspaceHeader({
  email,
  refreshing,
  onMenu,
  onRefresh,
  onSignOut,
}: {
  email?: string;
  refreshing: boolean;
  onMenu: () => void;
  onRefresh: () => void;
  onSignOut: () => void;
}) {
  return (
    <header className="workspace-header">
      <button
        className="rail-toggle"
        onClick={onMenu}
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>
      <div className="workspace-status">
        <i /> Multimodal Saliency Engine v4.2 Active <span>|</span> System
        Nominal
      </div>
      <div className="workspace-actions">
        <span className="workspace-email">{email ?? "Loading session"}</span>
        <button onClick={onRefresh} aria-label="Refresh dashboard">
          <RefreshCw size={16} className={refreshing ? "spin" : ""} />
        </button>
        <button onClick={onSignOut} aria-label="Sign out">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}

function IngestPanel({
  sourceUrl,
  notice,
  onChange,
  onCopy,
  onSubmit,
}: {
  sourceUrl: string;
  notice: string;
  onChange: (value: string) => void;
  onCopy: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <section className="ingest-panel">
      <div className="ingest-heading">
        <div className="ingest-tabs">
          <button className="selected">
            <UploadCloud size={14} />
            YouTube Ingest Hub
          </button>
          <button>Direct Master File</button>
        </div>
        <span className="api-ready">API READY</span>
      </div>
      <div className="ingest-drop">
        <div className="youtube-mark">▶</div>
        <h2>Paste YouTube Video, Playlist, or Channel Handle</h2>
        <p>
          Whisper-X speaker diarization, multimodal facial crop, and viral
          anchor saliency segmentation.
        </p>
        <div className="mode-pills">
          <span>● Single Episode / Master</span>
          <span>○ Full Channel Auto-Sync (Beta)</span>
          <span>○ Curated Playlist</span>
        </div>
        <form className="ingest-form" onSubmit={onSubmit}>
          <div>
            <input
              value={sourceUrl}
              onChange={(event) => onChange(event.target.value)}
              placeholder="https://youtube.com/watch?v=... or @HubermanLab"
            />
            <button type="button" onClick={onCopy} aria-label="Copy source URL">
              <Copy size={13} />
            </button>
          </div>
          <button className="ingest-submit" type="submit">
            <WandSparkles size={15} />
            Analyze &amp; Ingest
          </button>
        </form>
        <div className="ingest-meta">
          <span>
            Processing Profile: <b>Turbo Saliency (3x fast)</b>
          </span>
          <span>
            Cluster Engine: Whisper-X · Facial Cropping · Viral Hook LoRA
          </span>
        </div>
      </div>
      {notice && <p className="workspace-notice">{notice}</p>}
    </section>
  );
}

function Stats({ stats }: { stats: Stats }) {
  const items = [
    [Clapperboard, stats.shorts, "Shorts Extracted", "This workspace"],
    [
      Check,
      `${stats.processed}/${stats.activeJobs + stats.processed}`,
      "Videos Processed",
      "Pipeline completion",
    ],
    [WandSparkles, stats.activeJobs, "Active Jobs", "4K processing pipeline"],
    [
      BarChart3,
      compactNumber(stats.views),
      "Source Views",
      "Across synced videos",
    ],
  ] as const;
  return (
    <section className="workspace-stats">
      {items.map(([Icon, value, label, note]) => (
        <article key={label}>
          <span className="stat-icon">
            <Icon size={17} />
          </span>
          <strong>{value}</strong>
          <small>{label}</small>
          <em>{note}</em>
        </article>
      ))}
    </section>
  );
}

function Jobs({ jobs, videos }: { jobs: Job[]; videos: Video[] }) {
  const active = jobs.filter(
    (job) => !["completed", "failed"].includes(job.status),
  );
  return (
    <section className="workspace-section">
      <SectionTitle
        title="Active Jobs"
        meta={`${active.length} running GPU worker nodes`}
      />
      <div className="job-grid">
        {active.slice(0, 4).map((job) => {
          const video = videos.find((item) => item.id === job.videoId);
          return (
            <article className="job-card" key={job.jobId}>
              <div className="job-top">
                <span>● {job.stage || job.status}</span>
                <b>{Math.round(job.progress * 100)}%</b>
              </div>
              <div className="job-body">
                <div className="job-thumb">
                  {video?.thumbnailUrl ? (
                    <img src={video.thumbnailUrl} alt="" />
                  ) : (
                    <Activity size={21} />
                  )}
                </div>
                <div>
                  <h3>{video?.title ?? "Processing media source"}</h3>
                  <p>
                    Job {job.jobId.slice(0, 8)} · {job.clipsFound} clips found
                  </p>
                </div>
              </div>
              <div className="job-progress">
                <i style={{ width: `${Math.max(4, job.progress * 100)}%` }} />
              </div>
              <div className="job-footer">
                <span>{job.status}</span>
                <button>
                  <Terminal size={13} /> Inspect logs
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {active.length === 0 && (
        <EmptyState text="No active jobs. Your processing queue is clear." />
      )}
    </section>
  );
}

function Recommendations({
  clips,
  videos,
  exportingClip,
  onCreateShort,
}: {
  clips: Clip[];
  videos: Video[];
  exportingClip: string | null;
  onCreateShort: (clipId: string) => void;
}) {
  return (
    <section className="workspace-section">
      <SectionTitle
        title="AI Recommended Shorts"
        meta={`${clips.length} clips ranked by hook saliency`}
      />
      <div className="recommendation-grid">
        {clips.map((clip, index) => {
          const video = videos.find((item) => item.id === clip.videoId);
          const thumb =
            clip.selectedThumbnail ||
            clip.thumbnailOptions?.[0] ||
            video?.thumbnailUrl ||
            fallbackThumbs[index % fallbackThumbs.length];
          const rendering =
            exportingClip === clip.id || clip.status === "editing";
          const rendered = ["exported", "published"].includes(clip.status);
          return (
            <article className="recommendation-card" key={clip.id}>
              <div className="recommendation-media">
                <img src={thumb} alt="" />
                <span>{Math.round(clip.viralScore)} / 100</span>
                <small>
                  Est. reach ·{" "}
                  {compactNumber(Math.round(clip.viralScore * 12000))}
                </small>
              </div>
              <div className="recommendation-copy">
                <small>
                  {clip.category || "AI DISCOVERY"} ·{" "}
                  {formatDuration(clip.durationSeconds)}
                </small>
                <h3>
                  {clip.originalHook ||
                    clip.selectedHook ||
                    clip.transcriptText.slice(0, 88) ||
                    "High-saliency moment detected"}
                </h3>
                <div>
                  <span>Hook Saliency</span>
                  <b>{Math.round(clip.hookScore || clip.viralScore)}%</b>
                </div>
                <button
                  onClick={() => onCreateShort(clip.id)}
                  disabled={rendering}
                >
                  {rendering ? (
                    <RefreshCw className="spin" size={14} />
                  ) : (
                    <Plus size={14} />
                  )}
                  {rendered ? " Quick Polish" : " Create Short"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {clips.length === 0 && (
        <EmptyState text="AI recommendations will appear after your first processed video." />
      )}
    </section>
  );
}

function ProductionShelf({
  videos,
  clips,
}: {
  videos: Video[];
  clips: Clip[];
}) {
  return (
    <section className="workspace-section" id="videos">
      <SectionTitle
        title="Production Shelf"
        meta="Your processed source library"
      />
      <div className="production-list">
        {videos.map((video) => {
          const videoClips = clips.filter((clip) => clip.videoId === video.id);
          return (
            <article className="production-card" key={video.id}>
              <div className="production-thumb">
                {video.thumbnailUrl ? (
                  <img src={video.thumbnailUrl} alt="" />
                ) : (
                  <Clapperboard size={24} />
                )}
                <span>{video.processingStatus}</span>
              </div>
              <div className="production-copy">
                <div className="production-tags">
                  <b>{videoClips.length} clips extracted</b>
                  <span>{video.processingStatus}</span>
                </div>
                <h3>{video.title}</h3>
                <p>
                  {video.description ||
                    "Multimodal analysis, speaker tracking, and kinetic subtitle processing."}
                </p>
                <div className="production-actions">
                  <Link href="/clips">
                    <Clapperboard size={14} />
                    Review clips
                  </Link>
                  <Link href="/clips">
                    <Send size={14} />
                    Publish pack
                  </Link>
                  <Link href="/clips" aria-label="Open clip review">
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {videos.length === 0 && (
        <EmptyState text="No videos yet. Paste a YouTube source above to begin." />
      )}
    </section>
  );
}

function SectionTitle({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="workspace-section-title">
      <h2>
        <i />
        {title}
      </h2>
      <span>{meta}</span>
    </div>
  );
}
function EmptyState({ text }: { text: string }) {
  return (
    <div className="dashboard-empty">
      <Sparkles size={18} />
      <span>{text}</span>
    </div>
  );
}
function LoadingDashboard() {
  return (
    <div className="dashboard-empty">
      <RefreshCw className="spin" size={18} />
      <span>Loading your studio data...</span>
    </div>
  );
}
function initials(name?: string) {
  return (name || "Creator")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
function compactNumber(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return String(value);
}
function formatDuration(value: number) {
  return `${Math.floor(value / 60)}:${String(Math.round(value % 60)).padStart(2, "0")}`;
}
