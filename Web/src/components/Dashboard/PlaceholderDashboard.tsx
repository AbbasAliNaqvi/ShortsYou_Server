"use client";
/* External creator and Supabase assets are intentionally rendered without Next's image proxy. */
/* eslint-disable @next/next/no-img-element */

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bot,
  ChevronRight,
  Clapperboard,
  Copy,
  Download,
  LogOut,
  Menu,
  Play,
  RefreshCw,
  Send,
  Settings2,
  Sparkles,
  Terminal,
  TrendingUp,
  Video as VideoIcon,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import { api, type Clip, type Job, type PublicVideo, type User, type Video } from "@/lib/api";
import { notify } from "@/components/Notifications/NotificationCenter";

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



export function PlaceholderDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeNav, setActiveNav] = useState("Studio");
  const [menuOpen, setMenuOpen] = useState(false);
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

  const recommendations = [...clips]
    .sort((a, b) => b.viralScore - a.viralScore)
    .slice(0, 4);

  const activeJobs = jobs.filter(
    (j) => !["completed", "failed"].includes(j.status),
  );
  const avgViralScore =
    clips.length > 0
      ? Math.round(clips.reduce((s, c) => s + c.viralScore, 0) / clips.length)
      : 0;
  const totalClipsRendered = clips.filter((c) =>
    ["exported", "published"].includes(c.status),
  ).length;

  function signOut() {
    localStorage.removeItem("shortsyou_jwt");
    router.push("/login");
  }

  async function handleAutoCreate(event: FormEvent) {
    event.preventDefault();
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token || !sourceUrl.trim()) return;

    // If not a URL, search for videos
    if (!/^https?:\/\//i.test(sourceUrl.trim())) {
      try {
        setVideoResults(await api.searchVideos(token, sourceUrl.trim()));
        setNotice("Select a video and let AI create your shorts automatically.");
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "No videos found.");
      }
      return;
    }

    setCreating(true);
    setNotice("Starting your AI creation pipeline\u2026");
    try {
      const result = await api.autoCreateIngest(token, sourceUrl.trim());
      setSourceUrl("");
      setNotice(
        `${result.title} \u2014 AI is creating your shorts! Transcription \u2192 Analysis \u2192 Hook Generation \u2192 Auto-Export. Check back in a few minutes.`,
      );
      notify(
        "AI Auto-Create Started",
        "Your shorts are being created automatically. AI will transcribe, find viral moments, generate hooks, and render your shorts.",
        "success",
      );
      await loadDashboard();
    } catch (ingestError) {
      setNotice(
        ingestError instanceof Error
          ? ingestError.message
          : "Unable to start AI Auto-Create.",
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
        `https://youtube.com/watch?v=${video.youtubeVideoId}`,
      );
      setVideoResults([]);
      setSourceUrl("");
      setNotice(
        `${result.title} \u2014 AI Auto-Create in progress! Your shorts will appear below when ready.`,
      );
      notify(
        "AI Auto-Create Started",
        `${video.title} is being processed. AI will find the best moments and create ready-to-download shorts.`,
        "success",
      );
      await loadDashboard();
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Unable to queue this video.",
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
          {/* Bento hero grid */}
          <div className="sy-bento-grid">
            {/* Hero card - left large column */}
            <div className="sy-hero-card sy-glass">
              <div className="sy-hero-glow" aria-hidden="true" />
              <div className="sy-hero-body">
                <span className="sy-kicker">
                  <Bot size={11} /> AI-Powered Shorts Engine
                </span>
                <h1 className="sy-hero-headline">
                  AI Creates<br />
                  <em>Your Shorts.</em>
                </h1>
                <p className="sy-hero-subtext">
                  Paste any YouTube video. AI transcribes, finds viral moments,
                  writes scroll-stopping hooks, and renders production-ready shorts.
                </p>
                <IngestPanel
                  sourceUrl={sourceUrl}
                  notice={notice}
                  creating={creating}
                  onChange={setSourceUrl}
                  onCopy={copySource}
                  onSubmit={handleAutoCreate}
                />
              </div>
              {!loading && (
                <div className="sy-stats-row">
                  <StatsOverview
                    videoCount={videos.length}
                    clipCount={clips.length}
                    renderedCount={totalClipsRendered}
                    activeJobCount={activeJobs.length}
                    avgViralScore={avgViralScore}
                  />
                </div>
              )}
            </div>

            {/* Right column - stacked mini-cards */}
            <div className="sy-side-stack">
              <div className="sy-side-card sy-glass">
                <PipelineStatus jobs={activeJobs} videos={videos} />
              </div>
              <div className="sy-side-card sy-glass">
                <div className="sy-side-card-header">
                  <span className="sy-side-label">
                    <i className="sy-dot sy-dot--amber" />
                    Active Jobs
                  </span>
                  <b className="sy-side-count">{activeJobs.length} running</b>
                </div>
                {activeJobs.length > 0 ? (
                  <div className="sy-job-chips">
                    {activeJobs.slice(0, 3).map((job) => (
                      <div key={job.jobId} className="sy-job-chip">
                        <Zap size={10} />
                        <span>{job.stage || job.status}</span>
                        <b>{Math.round(job.progress * 100)}%</b>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="sy-empty-hint">No active jobs \u2014 paste a URL above.</p>
                )}
              </div>
            </div>
          </div>

          {/* Video search results */}
          {videoResults.length > 0 && (
            <section className="video-search-results sy-section-gap">
              <div>
                <span>Choose a video for AI Auto-Create</span>
                <button onClick={() => setVideoResults([])}>Clear</button>
              </div>
              {videoResults.map((video) => (
                <article key={video.youtubeVideoId}>
                  <img src={video.thumbnailUrl} alt="" />
                  <section>
                    <small>
                      {video.durationSeconds
                        ? `${Math.floor(video.durationSeconds / 60)}:${String(video.durationSeconds % 60).padStart(2, "0")}`
                        : "YouTube video"}
                    </small>
                    <h3>{video.title}</h3>
                    <p>{video.description}</p>
                  </section>
                  <button onClick={() => void ingestSearchResult(video)}>
                    <Zap size={14} /> AI Auto-Create
                  </button>
                </article>
              ))}
            </section>
          )}

          {/* Bottom sections */}
          <div className="sy-section-gap">
            {!loading && (
              <Recommendations
                clips={recommendations}
                videos={videos}
                exportingClip={exportingClip}
                onCreateShort={createShort}
              />
            )}
            {error && (
              <div className="dashboard-error sy-glass" style={{ padding: "16px 20px", borderRadius: 16 }}>
                {error} <Link href="/login">Return to sign in</Link>
              </div>
            )}
            {loading ? (
              <LoadingDashboard />
            ) : (
              <>
                <Jobs jobs={jobs} videos={videos} />
                <ProductionShelf videos={videos.slice(0, 4)} clips={clips} />
              </>
            )}
          </div>
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
    <header className="workspace-header sy-topbar">
      <button
        className="rail-toggle"
        onClick={onMenu}
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>
      <h2 className="sy-topbar-title">Creator Studio</h2>
      <div className="workspace-status">
        <i /> AI Auto-Creation Engine Active <span>|</span> System Nominal
      </div>
      <div className="workspace-actions sy-topbar-actions">
        <span className="workspace-email">{email ?? "Loading session"}</span>
        <button onClick={onRefresh} aria-label="Refresh dashboard" className="sy-icon-btn">
          <RefreshCw size={16} className={refreshing ? "spin" : ""} />
        </button>
        <button onClick={onSignOut} aria-label="Sign out" className="sy-icon-btn">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}

function IngestPanel({
  sourceUrl,
  notice,
  creating,
  onChange,
  onCopy,
  onSubmit,
}: {
  sourceUrl: string;
  notice: string;
  creating: boolean;
  onChange: (value: string) => void;
  onCopy: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <section className="sy-ingest">
      <div className="sy-ingest-eyebrow">
        <Zap size={11} />
        <span>AI Auto-Create</span>
        <span className="api-ready">
          <Bot size={9} /> ENGINE READY
        </span>
      </div>
      <form className="sy-ingest-form" onSubmit={onSubmit}>
        <div className="sy-ingest-input-wrap">
          <input
            className="sy-ingest-input"
            value={sourceUrl}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Paste YouTube URL or search by topic\u2026"
          />
          <button type="button" onClick={onCopy} aria-label="Copy source URL" className="sy-ingest-copy">
            <Copy size={12} />
          </button>
        </div>
        <button className="sy-ingest-submit" type="submit" disabled={creating || !sourceUrl.trim()}>
          {creating ? (
            <RefreshCw className="spin" size={14} />
          ) : (
            <Zap size={14} />
          )}
          {creating ? "Starting AI\u2026" : "Create Shorts"}
        </button>
      </form>
      {notice && <p className="workspace-notice sy-ingest-notice">{notice}</p>}
    </section>
  );
}

function Jobs({ jobs, videos }: { jobs: Job[]; videos: Video[] }) {
  const active = jobs.filter(
    (job) => !["completed", "failed"].includes(job.status),
  );

  function StageIcon({ stage }: { stage: string }) {
    if (stage.includes("download") || stage.includes("preparing")) return <Download size={12} />;
    if (stage.includes("transcrib")) return <Activity size={12} />;
    if (stage.includes("analyz")) return <Bot size={12} />;
    if (stage.includes("auto_create") || stage.includes("auto_export")) return <WandSparkles size={12} />;
    if (stage.includes("export") || stage.includes("render")) return <VideoIcon size={12} />;
    return <Zap size={12} />;
  }

  return (
    <section className="workspace-section">
      <SectionTitle
        title="AI Creation Pipeline"
        meta={`${active.length} active AI job${active.length !== 1 ? "s" : ""}`}
      />
      <div className="job-grid">
        {active.slice(0, 4).map((job) => {
          const video = videos.find((item) => item.id === job.videoId);
          return (
            <article className="job-card" key={job.jobId}>
              <div className="job-top">
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <StageIcon stage={job.stage || job.status} /> {job.stage || job.status}
                </span>
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
                  <h3>{video?.title ?? "AI is processing your video"}</h3>
                  <p>
                    Job {job.jobId.slice(0, 8)} \u00b7 {job.clipsFound} clips found
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
        <EmptyState text="No active AI jobs. Paste a YouTube URL above and let AI create your shorts." />
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
        title="Your top shorts this period"
        meta={`${clips.length} shorts crafted by AI`}
      />
      {clips.length > 0 && (
        <div className="sy-table-header">
          <span>Clip</span>
          <span>Viral Score</span>
          <span>Duration</span>
          <span>Action</span>
        </div>
      )}
      <div className="sy-table-list">
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
          const playableURL = clip.supabaseShortUrl || clip.supabaseRawClipUrl;
          return (
            <div className="sy-glass-row" key={clip.id}>
              <div className="sy-table-clip">
                <div className="sy-table-thumb">
                  {playableURL ? (
                    <video
                      src={playableURL}
                      playsInline
                      preload="metadata"
                      poster={thumb}
                    />
                  ) : (
                    <img src={thumb} alt="" />
                  )}
                </div>
                <div className="sy-table-clip-info">
                  <p className="sy-table-clip-title">
                    {clip.originalHook ||
                      clip.selectedHook ||
                      clip.transcriptText.slice(0, 72) ||
                      "High-saliency moment detected by AI"}
                  </p>
                  <small className="sy-table-clip-meta">
                    {clip.category ? `AI ${clip.category.toUpperCase()}` : "AI DISCOVERY"}
                  </small>
                </div>
              </div>
              <div className="sy-table-score">
                <i className="sy-dot sy-dot--yellow" />
                <span>{Math.round(clip.hookScore || clip.viralScore)}%</span>
              </div>
              <div className="sy-table-dur">
                {formatDuration(clip.durationSeconds)}
              </div>
              <div className="sy-table-action">
                <button
                  className="sy-action-btn"
                  onClick={() => onCreateShort(clip.id)}
                  disabled={rendering}
                >
                  {rendering ? (
                    <RefreshCw className="spin" size={13} />
                  ) : rendered ? (
                    <Download size={13} />
                  ) : (
                    <Zap size={13} />
                  )}
                  {rendered ? "Download" : rendering ? "Rendering\u2026" : "Create"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {clips.length === 0 && (
        <EmptyState text="Your AI-created shorts will appear here. Paste a YouTube URL above to get started." />
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
        title="Source Library"
        meta="Videos processed by the AI engine"
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
                  <b>
                    {videoClips.length} AI-created clip{videoClips.length !== 1 ? "s" : ""}
                  </b>
                  <span>{video.processingStatus}</span>
                </div>
                <h3>{video.title}</h3>
                <p>
                  {video.description ||
                    "AI-analyzed with viral moment detection, hook generation, and auto-rendering."}
                </p>
                <div className="production-actions">
                  <Link href="/clips">
                    <Clapperboard size={14} />
                    Review AI shorts
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
        <EmptyState text="No videos yet. Paste a YouTube URL above \u2014 AI will create your shorts automatically." />
      )}
    </section>
  );
}

function StatsOverview({
  videoCount,
  clipCount,
  renderedCount,
  activeJobCount,
  avgViralScore,
}: {
  videoCount: number;
  clipCount: number;
  renderedCount: number;
  activeJobCount: number;
  avgViralScore: number;
}) {
  const stats = [
    { icon: VideoIcon, label: "Source Videos", value: videoCount, sub: "Ingested", dotColor: "sy-dot--blue" },
    { icon: Clapperboard, label: "AI Clips", value: clipCount, sub: "Detected", dotColor: "sy-dot--yellow" },
    { icon: Download, label: "Rendered", value: renderedCount, sub: "Ready", dotColor: "sy-dot--green" },
    { icon: Activity, label: "Active Jobs", value: activeJobCount, sub: "Processing", dotColor: "sy-dot--amber" },
    { icon: TrendingUp, label: "Avg Viral Score", value: avgViralScore, sub: "/ 100", dotColor: "sy-dot--pink" },
  ];
  return (
    <div className="sy-stats-inner">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="sy-stat-block">
            <div className="sy-stat-icon-wrap">
              <Icon size={13} />
            </div>
            <strong className="sy-stat-value">{s.value}</strong>
            <span className="sy-stat-label">
              <i className={`sy-dot ${s.dotColor}`} />
              {s.label}
            </span>
            <div className="sy-stat-bar">
              <div
                className="sy-stat-bar-fill"
                style={{ width: `${Math.min(100, s.value > 0 ? 100 : 0)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PipelineStatus({ jobs, videos }: { jobs: Job[]; videos: Video[] }) {
  const stages = [
    { key: "download", label: "Ingest", icon: Download },
    { key: "transcrib", label: "Transcribe", icon: Activity },
    { key: "analyz", label: "Analyze", icon: Bot },
    { key: "auto_create", label: "Hook Gen", icon: WandSparkles },
    { key: "export", label: "Render", icon: VideoIcon },
  ];

  function stageIndex(stage: string) {
    const idx = stages.findIndex((s) => stage.includes(s.key));
    return idx >= 0 ? idx : 0;
  }

  return (
    <div className="sy-pipeline">
      <div className="sy-side-card-header">
        <span className="sy-side-label">
          <i className="sy-dot sy-dot--green sy-dot--pulse" />
          Live Pipeline
        </span>
        <span className="sy-side-count">{jobs.length} active</span>
      </div>
      <div className="sy-pipeline-track">
        {stages.map((s, i) => {
          const Icon = s.icon;
          const activeHere = jobs.some(
            (j) => stageIndex(j.stage || j.status) === i,
          );
          return (
            <div
              key={s.key}
              className={`sy-pipeline-node${activeHere ? " active" : ""}`}
            >
              <span className="sy-pipeline-icon">
                <Icon size={13} />
              </span>
              <span className="sy-pipeline-label">{s.label}</span>
              {i < stages.length - 1 && (
                <span className="sy-pipeline-connector" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>
      <div className="premium-pipeline-jobs">
        {jobs.slice(0, 3).map((job) => {
          const video = videos.find((v) => v.id === job.videoId);
          return (
            <div key={job.jobId} className="premium-job-chip">
              <b>{Math.round(job.progress * 100)}%</b>
              <span>{job.stage || job.status}</span>
              {video && <small>{video.title}</small>}
            </div>
          );
        })}
      </div>
    </div>
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
      <span>Loading your AI studio data...</span>
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
function formatDuration(value: number) {
  return `${Math.floor(value / 60)}:${String(Math.round(value % 60)).padStart(2, "0")}`;
}
