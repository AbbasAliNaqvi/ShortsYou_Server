"use client";
/* External creator and Supabase assets are intentionally rendered without Next's image proxy. */
/* eslint-disable @next/next/no-img-element */

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Bot,
  ChevronDown,
  ChevronRight,
  Clapperboard,
  Copy,
  Download,
  LogOut,
  Mail,
  MoreHorizontal,
  Play,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Terminal,
  Video as VideoIcon,
  WandSparkles,
  Zap,
} from "lucide-react";
import { api, type Clip, type Job, type PublicVideo, type User, type Video } from "@/lib/api";
import { notify } from "@/components/Notifications/NotificationCenter";
import FallingColorBackground from "../LiquidGlass/FallingColorBackground";

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
      setError("Your studio session has expired. Sign in again to load the workspace.");
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
    if (videosResult.status === "fulfilled") setVideos(videosResult.value ?? []);
    if (clipsResult.status === "fulfilled") setClips(clipsResult.value ?? []);
    if (jobsResult.status === "fulfilled") setJobs(jobsResult.value ?? []);
    if (results.every((result) => result.status === "rejected"))
      setError("The studio API is unavailable. Check that the Go server is running on port 5050.");
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

  const activeJobs = jobs.filter((j) => !["completed", "failed"].includes(j.status));
  const avgViralScore =
    clips.length > 0
      ? Math.round(clips.reduce((s, c) => s + c.viralScore, 0) / clips.length)
      : 0;
  const totalClipsRendered = clips.filter((c) =>
    ["exported", "published"].includes(c.status)
  ).length;

  function signOut() {
    localStorage.removeItem("shortsyou_jwt");
    router.push("/login");
  }

  async function handleAutoCreate(event: FormEvent) {
    event.preventDefault();
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token || !sourceUrl.trim()) return;

    if (!/^https?:\/\//i.test(sourceUrl.trim())) {
      try {
        setVideoResults(await api.searchVideos(token, sourceUrl.trim()));
        setNotice("Select a video and let AI create your shorts automatically.");
      } catch (err) {
        setNotice(err instanceof Error ? err.message : "No videos found.");
      }
      return;
    }

    setCreating(true);
    setNotice("Starting your AI creation pipeline…");
    try {
      const result = await api.autoCreateIngest(token, sourceUrl.trim());
      setSourceUrl("");
      setNotice(`${result.title} — AI is creating your shorts! Check back in a few minutes.`);
      notify(
        "AI Auto-Create Started",
        "Your shorts are being created automatically. AI will transcribe, find viral moments, generate hooks, and render your shorts.",
        "success"
      );
      await loadDashboard();
    } catch (ingestError) {
      setNotice(
        ingestError instanceof Error ? ingestError.message : "Unable to start AI Auto-Create."
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
        `https://youtube.com/watch?v=${video.youtubeVideoId}`
      );
      setVideoResults([]);
      setSourceUrl("");
      setNotice(`${result.title} — AI Auto-Create in progress! Your shorts will appear below when ready.`);
      notify("AI Auto-Create Started", `${video.title} is being processed.`, "success");
      await loadDashboard();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Unable to queue this video.");
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
      setNotice("Short rendering started. It will appear as downloadable when ready.");
      await loadDashboard();
    } catch (createError) {
      setNotice(
        createError instanceof Error ? createError.message : "Unable to create this short."
      );
    } finally {
      setExportingClip(null);
    }
  }

  return (
    <main className="workspace-page ca-canvas-container">
      {/* Dynamic Animated Liquid Glass Multi-Directional Waves & Ambient Glows */}
      <FallingColorBackground />

      <div className="workspace-main ca-main-viewport">
        {/* Top Header Bar */}
        <WorkspaceHeader
          email={user?.email}
          user={user}
          refreshing={refreshing}
          onRefresh={() => void loadDashboard()}
          onSignOut={signOut}
        />

        <motion.div
          className="workspace-content ca-dashboard-content"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Bento Upper Grid (Hero Card + Pipeline Status) */}
          <div className="ca-bento-grid">
            {/* Left Hero Card (~65% width) - 100% Photo Free Liquid Glass */}
            <motion.div
              className="ca-hero-card ca-glass"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Concentric Wireframe Orbit Rings */}
              <div className="ca-hero-rings" aria-hidden="true">
                <svg viewBox="0 0 600 600" className="ca-hero-rings-svg">
                  <circle cx="300" cy="300" r="140" fill="none" stroke="rgba(245, 158, 11, 0.15)" strokeWidth="1" />
                  <circle cx="300" cy="300" r="210" fill="none" stroke="rgba(14, 165, 233, 0.12)" strokeWidth="1" />
                  <circle cx="300" cy="300" r="280" fill="none" stroke="rgba(168, 85, 247, 0.10)" strokeWidth="1" strokeDasharray="4 6" />
                </svg>
              </div>

              {/* Liquid Glass AI Engine Graphic (Replacing Photo) */}
              <div className="ca-hero-visual-container" aria-hidden="true">
                <LiquidGlassHeroGraphic />
              </div>

              <div className="ca-hero-body">
                <motion.span
                  className="ca-hero-eyebrow"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Bot size={12} /> AI-Powered Shorts Engine
                </motion.span>
                <motion.h1
                  className="ca-hero-headline"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  Optimize<br />Your Metrics
                </motion.h1>
                <p className="ca-hero-subtext">
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

              {/* Floating Overlay Glass Stats Bar (Real Data Bound) */}
              <StatsOverview
                videoCount={videos.length}
                clipCount={clips.length}
                renderedCount={totalClipsRendered}
                avgViralScore={avgViralScore}
              />
            </motion.div>

            {/* Right Column: Live Pipeline Status (Real Jobs & Stages Bound) */}
            <div className="ca-side-stack">
              <PipelineStatus jobs={activeJobs} videos={videos} avgScore={avgViralScore} />
            </div>
          </div>

          {/* YouTube Video Search Results If Active */}
          <AnimatePresence>
            {videoResults.length > 0 && (
              <motion.section
                className="video-search-results ca-glass ca-section-box"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="ca-search-bar-header">
                  <span>Choose a video for AI Auto-Create</span>
                  <button onClick={() => setVideoResults([])}>Clear</button>
                </div>
                <div className="ca-search-grid">
                  {videoResults.map((video) => (
                    <motion.article
                      key={video.youtubeVideoId}
                      className="ca-search-card ca-glass"
                      whileHover={{ scale: 1.02 }}
                    >
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
                    </motion.article>
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Bottom Table: "Your top videos in this period" (Real Clips Bound) */}
          <Recommendations
            clips={recommendations}
            videos={videos}
            exportingClip={exportingClip}
            onCreateShort={createShort}
          />

          {error && (
            <div className="dashboard-error ca-glass">
              {error} <Link href="/login">Return to sign in</Link>
            </div>
          )}

          {loading ? (
            <LoadingDashboard />
          ) : (
            <div className="ca-secondary-shelves">
              <Jobs jobs={jobs} videos={videos} />
              <ProductionShelf videos={videos.slice(0, 4)} clips={clips} />
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}

{/* Pure Apple Liquid Glass AI Studio Console - Clean, Spacious, No Colliding Badges */}
function LiquidGlassHeroGraphic() {
  return (
    <div className="ca-liquid-graphic-wrap">
      {/* Ambient Radial Mesh Lighting behind the graphic */}
      <div className="ca-liquid-graphic-glow" />

      {/* Orbiting Frosted Glass Ring 1 */}
      <motion.div
        className="ca-liquid-ring ca-liquid-ring-outer"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        <span className="ca-orbit-satellite ca-sat-1" />
        <span className="ca-orbit-satellite ca-sat-2" />
      </motion.div>

      {/* Orbiting Frosted Glass Ring 2 */}
      <motion.div
        className="ca-liquid-ring ca-liquid-ring-inner"
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />

      {/* Apple Vision Pro Glass Console */}
      <motion.div
        className="ca-apple-console"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.02 }}
      >
        {/* Console Top Bar */}
        <div className="ca-console-top">
          <div className="ca-console-live-pill">
            <span className="ca-console-dot-pulse" />
            <span>AI Voice & Hook Stream</span>
          </div>
          <div className="ca-console-tags">
            <span className="ca-console-tag">Whisper v3</span>
            <span className="ca-console-tag ca-tag-accent">4K 60FPS</span>
          </div>
        </div>

        {/* Live Audio & Viral Waveform Equalizer */}
        <div className="ca-console-spectrum-box">
          <div className="ca-spectrum-threshold">
            <span className="ca-threshold-line" />
            <span className="ca-threshold-badge">
              <Zap size={10} /> 98.4% Viral Hook Peak
            </span>
          </div>
          <div className="ca-waveform-equalizer">
            {[
              { delay: 0.05, minH: 30, maxH: 85 },
              { delay: 0.15, minH: 50, maxH: 95 },
              { delay: 0.25, minH: 25, maxH: 70 },
              { delay: 0.35, minH: 60, maxH: 100 },
              { delay: 0.10, minH: 40, maxH: 90 },
              { delay: 0.40, minH: 75, maxH: 100 },
              { delay: 0.20, minH: 35, maxH: 80 },
              { delay: 0.30, minH: 55, maxH: 95 },
              { delay: 0.12, minH: 45, maxH: 90 },
              { delay: 0.28, minH: 65, maxH: 100 },
              { delay: 0.18, minH: 30, maxH: 85 },
              { delay: 0.38, minH: 50, maxH: 95 },
              { delay: 0.08, minH: 35, maxH: 75 },
              { delay: 0.22, minH: 60, maxH: 90 },
            ].map((bar, i) => (
              <motion.span
                key={i}
                className="ca-waveform-bar"
                animate={{
                  height: [`${bar.minH}%`, `${bar.maxH}%`, `${bar.minH}%`],
                }}
                transition={{
                  duration: 1.2 + bar.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: bar.delay,
                }}
              />
            ))}
          </div>
        </div>

        {/* Console Feature Pills Grid */}
        <div className="ca-console-features">
          <div className="ca-feat-pill">
            <WandSparkles size={11} className="ca-feat-icon ca-icon-amber" />
            <span>Auto Hook Detection</span>
          </div>
          <div className="ca-feat-pill">
            <Zap size={11} className="ca-feat-icon ca-icon-cyan" />
            <span>Smart 9:16 Reframe</span>
          </div>
          <div className="ca-feat-pill">
            <Activity size={11} className="ca-feat-icon ca-icon-pink" />
            <span>Karaoke Subtitles</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function WorkspaceHeader({
  email,
  user,
  refreshing,
  onRefresh,
  onSignOut,
}: {
  email?: string;
  user?: User | null;
  refreshing: boolean;
  onRefresh: () => void;
  onSignOut: () => void;
}) {
  return (
    <header className="ca-header-bar">
      {/* Header Left Title */}
      <div className="ca-header-left">
        <h1 className="ca-header-title">Channel Analytics</h1>
      </div>

      {/* Header Right Action Cluster */}
      <div className="ca-header-actions ca-header-glass-cluster">
        {/* Messages / Mail Button */}
        <motion.button
          className="ca-glass-circle-btn ca-btn-mail"
          title="Messages & Notifications"
          whileHover={{ scale: 1.08, y: -2 }}
          whileTap={{ scale: 0.94 }}
        >
          <Mail size={17} />
          <span className="ca-btn-dot" />
        </motion.button>

        {/* Search & Refresh Studio Button */}
        <motion.button
          className="ca-glass-circle-btn ca-btn-search"
          onClick={onRefresh}
          aria-label="Refresh dashboard"
          title="Search & Refresh Studio Data"
          whileHover={{ scale: 1.08, y: -2 }}
          whileTap={{ scale: 0.94 }}
        >
          <Search size={17} className={refreshing ? "spin" : ""} />
        </motion.button>

        {/* User Profile Badge ("My Image") */}
        <motion.div
          className="ca-header-user-badge"
          title={user?.name ? `${user.name} (${email ?? "Creator"})` : (email ?? "Creator")}
          whileHover={{ scale: 1.06, y: -2 }}
          whileTap={{ scale: 0.94 }}
        >
          <div className="ca-header-avatar-inner">
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.name || "Creator profile"}
                className="ca-header-avatar"
              />
            ) : (
              <span className="ca-header-avatar-text">{initials(user?.name)}</span>
            )}
          </div>
          <span className="ca-avatar-online-dot" title="Active in Studio" />
        </motion.div>

        {/* Log Out Button */}
        <motion.button
          className="ca-glass-circle-btn ca-btn-logout"
          onClick={onSignOut}
          title="Sign Out"
          whileHover={{ scale: 1.08, y: -2 }}
          whileTap={{ scale: 0.94 }}
        >
          <LogOut size={17} />
        </motion.button>
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
    <div className="ca-ingest-container">
      <form className="ca-ingest-form" onSubmit={onSubmit}>
        <div className="ca-ingest-input-shell">
          <input
            className="ca-ingest-input"
            value={sourceUrl}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Paste YouTube URL to generate shorts..."
          />
          <button type="button" onClick={onCopy} aria-label="Copy source URL" className="ca-ingest-copy-btn">
            <Copy size={13} />
          </button>
        </div>
        <motion.button
          className="ca-hero-start-btn"
          type="submit"
          disabled={creating || !sourceUrl.trim()}
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
        >
          {creating ? (
            <>
              <RefreshCw className="spin" size={14} /> Creating...
            </>
          ) : (
            "Start Now"
          )}
        </motion.button>
      </form>
      {notice && <p className="ca-hero-notice">{notice}</p>}
    </div>
  );
}

function StatsOverview({
  videoCount,
  clipCount,
  renderedCount,
  avgViralScore,
}: {
  videoCount: number;
  clipCount: number;
  renderedCount: number;
  avgViralScore: number;
}) {
  return (
    <motion.div
      className="ca-floating-stats-bar ca-glass-card"
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
    >
      {/* Stat 1: Videos (Real data) */}
      <div className="ca-stat-item">
        <span className="ca-stat-val">{videoCount}</span>
        <div className="ca-stat-lbl">
          <i className="ca-dot ca-dot--blue" />
          <span>Videos</span>
        </div>
        <div className="ca-stat-bar">
          <motion.div
            className="ca-stat-bar-fill ca-fill-blue"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(15, videoCount * 25))}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Stat 2: Clips (Real data) */}
      <div className="ca-stat-item">
        <span className="ca-stat-val">{clipCount}</span>
        <div className="ca-stat-lbl">
          <i className="ca-dot ca-dot--pink" />
          <span>Clips</span>
        </div>
        <div className="ca-stat-bar">
          <motion.div
            className="ca-stat-bar-fill ca-fill-pink"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(20, clipCount * 18))}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
          />
        </div>
      </div>

      {/* Stat 3: Avg Viral Score (Warm Glowing Amber Box - Real data) */}
      <div className="ca-stat-item ca-stat-item--highlight">
        <span className="ca-stat-val">{avgViralScore}%</span>
        <div className="ca-stat-lbl">
          <i className="ca-dot ca-dot--green" />
          <span>Viral Score</span>
        </div>
        <div className="ca-stat-bar">
          <motion.div
            className="ca-stat-bar-fill ca-fill-green"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(30, avgViralScore))}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          />
        </div>
      </div>

      {/* Stat 4: Rendered (Real data) */}
      <div className="ca-stat-item">
        <span className="ca-stat-val">{renderedCount}</span>
        <div className="ca-stat-lbl">
          <i className="ca-dot ca-dot--orange" />
          <span>Rendered</span>
        </div>
        <div className="ca-stat-bar">
          <motion.div
            className="ca-stat-bar-fill ca-fill-orange"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(20, renderedCount * 25))}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          />
        </div>
      </div>

      {/* Next Circle Arrow Button */}
      <motion.button
        className="ca-stats-arrow-circle"
        aria-label="Browse metrics"
        whileHover={{ scale: 1.12, rotate: 5 }}
        whileTap={{ scale: 0.92 }}
      >
        <ChevronRight size={18} />
      </motion.button>
    </motion.div>
  );
}

function PipelineStatus({
  jobs,
  videos,
  avgScore,
}: {
  jobs: Job[];
  videos: Video[];
  avgScore: number;
}) {
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

  const activeJob = jobs.find((j) => !["completed", "failed"].includes(j.status));
  const activeVideo = activeJob ? videos.find((v) => v.id === activeJob.videoId) : null;

  return (
    <motion.div
      className="ca-pipeline-card ca-glass"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="ca-pipeline-header">
        <div className="ca-pipeline-header-title">
          <span className="ca-pipeline-status-pulse" />
          <span className="ca-card-heading">Live Pipeline Activity 💡</span>
        </div>
        <span className="ca-pipeline-count-pill">{jobs.length} Active</span>
      </div>

      {/* Dual Wave SVG Chart Linked to Real Progress & Score */}
      <div className="ca-chart-body">
        <div className="ca-chart-y">
          <span>100</span>
          <span>75</span>
          <span>50</span>
          <span>0</span>
        </div>
        <div className="ca-chart-svg-box">
          <svg viewBox="0 0 280 90" className="ca-sparkline-full">
            {/* Green / Cyan Wave */}
            <motion.path
              d="M 5 70 Q 55 50 95 60 T 185 40 T 275 75"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            {/* Gold / Yellow Wave */}
            <motion.path
              d="M 5 55 Q 50 10 105 50 T 200 15 T 275 60"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.8, ease: "easeOut" }}
            />
            {/* Active Pointer */}
            <line x1="230" y1="12" x2="230" y2="80" stroke="rgba(255,255,255,0.18)" strokeDasharray="3 3" />
            <circle cx="230" cy="30" r="4.5" fill="#f59e0b" />
          </svg>

          {/* Active Progress Popover Pill */}
          <motion.div
            className="ca-chart-popover-pill"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <span>{activeJob ? `${Math.round(activeJob.progress * 100)}%` : avgScore > 0 ? `${avgScore}%` : "50%"}</span>
            <div className="ca-chart-popover-glow" />
          </motion.div>
        </div>
      </div>

      {/* Pipeline Stage Track (Real Pipeline Stages) */}
      <div className="ca-pipeline-stages-track">
        {stages.map((s, i) => {
          const Icon = s.icon;
          const activeHere = activeJob ? stageIndex(activeJob.stage || activeJob.status) === i : false;
          return (
            <motion.div
              key={s.key}
              className={`ca-pipeline-stage-node ${activeHere ? "active" : ""}`}
              title={s.label}
              whileHover={{ scale: 1.06, y: -2 }}
            >
              <Icon size={12} />
              <span>{s.label}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Live Active Job Chip if available */}
      {activeJob && (
        <div className="ca-pipeline-active-badge">
          <span className="ca-dot ca-dot--green" />
          <span>{activeJob.stage || activeJob.status}: {activeVideo?.title?.slice(0, 30) || `Job ${activeJob.jobId.slice(0, 6)}`}</span>
          <b>{Math.round(activeJob.progress * 100)}%</b>
        </div>
      )}
    </motion.div>
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
    <motion.section
      className="ca-bottom-table-panel ca-glass"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="ca-table-top-bar">
        <h2>Your top videos in this period</h2>
        <motion.button
          className="ca-filter-pill-btn"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          <span>Popularity</span>
          <ChevronDown size={14} />
        </motion.button>
      </div>

      <div className="ca-table-col-headers">
        <span>Video</span>
        <span>Views</span>
        <span>Average view duration</span>
      </div>

      <div className="ca-table-rows-container">
        {clips.length > 0 ? (
          clips.map((clip, index) => {
            const video = videos.find((item) => item.id === clip.videoId);
            const thumb =
              clip.selectedThumbnail ||
              clip.thumbnailOptions?.[0] ||
              video?.thumbnailUrl ||
              fallbackThumbs[index % fallbackThumbs.length];
            const rendering = exportingClip === clip.id || clip.status === "editing";
            const rendered = ["exported", "published"].includes(clip.status);

            return (
              <motion.div
                className="ca-table-row ca-glass"
                key={clip.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                whileHover={{
                  scale: 1.008,
                  y: -2,
                  boxShadow: "0 14px 35px rgba(0, 0, 0, 0.5)",
                }}
              >
                {/* Video Info Column */}
                <div className="ca-row-media-cell">
                  <div className="ca-row-thumb-box">
                    <img src={thumb} alt="" />
                    <div className="ca-row-play-badge"><Play size={10} fill="#ffffff" /></div>
                  </div>
                  <div className="ca-row-copy-box">
                    <h3>
                      {clip.originalHook ||
                        clip.selectedHook ||
                        clip.transcriptText.slice(0, 56) ||
                        "AI Detected Viral Moment"}
                    </h3>
                    <div className="ca-row-cat-tag">
                      <Play size={10} />
                      <span>{clip.category ? clip.category.toUpperCase() : "VIRAL SHORT"}</span>
                    </div>
                  </div>
                </div>

                {/* Views Column */}
                <div className="ca-row-views-cell">
                  <i className="ca-dot ca-dot--yellow" />
                  <span>{Math.round(clip.viralScore * 250 / 10) / 10}k views</span>
                </div>

                {/* Duration Column */}
                <div className="ca-row-duration-cell">
                  <i className="ca-dot ca-dot--green" />
                  <span>{formatDuration(clip.durationSeconds)} ({Math.round(clip.viralScore * 0.68)}%)</span>
                </div>

                {/* Sparkline Column */}
                <div className="ca-row-sparkline-cell">
                  <svg viewBox="0 0 80 20" className="ca-row-sparkline-svg">
                    <path
                      d={index % 2 === 0 ? "M 0 15 Q 20 4 40 12 T 80 6" : "M 0 10 Q 20 18 40 6 T 80 12"}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                {/* Action Column */}
                <div className="ca-row-action-cell">
                  <motion.button
                    className="ca-row-action-btn"
                    onClick={() => onCreateShort(clip.id)}
                    disabled={rendering}
                    title={rendered ? "Download Short" : rendering ? "Rendering Short..." : "Create Short"}
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.92 }}
                  >
                    {rendering ? (
                      <RefreshCw className="spin" size={14} />
                    ) : rendered ? (
                      <Download size={15} />
                    ) : (
                      <MoreHorizontal size={18} />
                    )}
                  </motion.button>
                </div>
              </motion.div>
            );
          })
        ) : (
          <EmptyState text="Your AI-created shorts will appear here. Paste a YouTube URL above to get started." />
        )}
      </div>
    </motion.section>
  );
}

function Jobs({ jobs, videos }: { jobs: Job[]; videos: Video[] }) {
  const active = jobs.filter((job) => !["completed", "failed"].includes(job.status));

  function StageIcon({ stage }: { stage: string }) {
    if (stage.includes("download") || stage.includes("preparing")) return <Download size={12} />;
    if (stage.includes("transcrib")) return <Activity size={12} />;
    if (stage.includes("analyz")) return <Bot size={12} />;
    if (stage.includes("auto_create") || stage.includes("auto_export")) return <WandSparkles size={12} />;
    if (stage.includes("export") || stage.includes("render")) return <VideoIcon size={12} />;
    return <Zap size={12} />;
  }

  return (
    <section className="ca-shelf-panel ca-glass">
      <SectionTitle
        title="AI Creation Pipeline"
        meta={`${active.length} active AI job${active.length !== 1 ? "s" : ""}`}
      />
      <div className="job-grid">
        {active.slice(0, 4).map((job) => {
          const video = videos.find((item) => item.id === job.videoId);
          return (
            <motion.article
              className="job-card ca-glass"
              key={job.jobId}
              whileHover={{ y: -3, scale: 1.01 }}
            >
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
                  <p>Job {job.jobId.slice(0, 8)} · {job.clipsFound} clips found</p>
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
            </motion.article>
          );
        })}
      </div>
      {active.length === 0 && (
        <EmptyState text="No active AI jobs. Paste a YouTube URL above and let AI create your shorts." />
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
    <section className="ca-shelf-panel ca-glass" id="videos">
      <SectionTitle
        title="Source Library"
        meta="Videos processed by the AI engine"
      />
      <div className="production-list">
        {videos.map((video) => {
          const videoClips = clips.filter((clip) => clip.videoId === video.id);
          const status = video.processingStatus || "ready";
          return (
            <motion.article
              className="production-card ca-glass"
              key={video.id}
              whileHover={{ y: -3, scale: 1.008 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
            >
              <div className="production-thumb">
                {video.thumbnailUrl ? (
                  <img src={video.thumbnailUrl} alt={video.title} />
                ) : (
                  <div className="ca-thumb-fallback">
                    <Clapperboard size={26} className="ca-thumb-fallback-icon" />
                  </div>
                )}
                <span className={`ca-thumb-badge ca-status-${status}`}>{status}</span>
              </div>
              <div className="production-copy">
                <div className="production-tags">
                  <span className="ca-tag-clips-count">
                    <Sparkles size={11} />
                    {videoClips.length} AI-created clip{videoClips.length !== 1 ? "s" : ""}
                  </span>
                  <span className={`ca-status-pill ca-status-${status}`}>
                    {status}
                  </span>
                </div>
                <h3>{video.title}</h3>
                <p>
                  {video.description ||
                    "AI-analyzed with viral moment detection, hook generation, and auto-rendering."}
                </p>
                <div className="production-actions">
                  <Link href="/clips" className="ca-prod-btn-primary">
                    <Clapperboard size={14} />
                    Review AI shorts
                  </Link>
                  <Link href="/clips" className="ca-prod-btn-secondary">
                    <Send size={14} />
                    Publish pack
                  </Link>
                  <Link href="/clips" className="ca-prod-btn-icon" aria-label="Open clip review">
                    <ChevronRight size={15} />
                  </Link>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
      {videos.length === 0 && (
        <EmptyState text="No videos yet. Paste a YouTube URL above — AI will create your shorts automatically." />
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
    <div className="dashboard-empty ca-glass">
      <Sparkles size={18} />
      <span>{text}</span>
    </div>
  );
}

function LoadingDashboard() {
  return (
    <div className="dashboard-empty ca-glass">
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
