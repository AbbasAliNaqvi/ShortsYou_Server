"use client";
/* External creator and Supabase assets are intentionally rendered without Next's image proxy. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDownToLine, ArrowLeft, BarChart3, Check, Clapperboard, Download, Film, LayoutDashboard, LogOut, Menu, Play, Radio, RefreshCw, Send, Settings2, Sparkles, WandSparkles, X, Zap } from "lucide-react";
import { api, type Clip, type User, type Video } from "@/lib/api";

export function ClipsReviewPage() {
  const router = useRouter();
  const [clips, setClips] = useState<Clip[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  async function refresh() {
    const token = sessionStorage.getItem("shortsyou_jwt");
    if (!token) return;
    try {
      const [userResult, clipsResult, videosResult] = await Promise.all([api.me(token), api.clips(token), api.videos(token)]);
      setUser(userResult); setClips(clipsResult); setVideos(videosResult);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to refresh clips."); }
  }

  useEffect(() => { queueMicrotask(() => void refresh()); }, []);

  const visible = useMemo(() => clips.filter((clip) => filter === "all" || (filter === "ready" ? ["detected", "exported"].includes(clip.status) : clip.category === filter)), [clips, filter]);
  const videoFor = (clip: Clip) => videos.find((video) => video.id === clip.videoId);

  async function exportClip(clipId: string) {
    const token = sessionStorage.getItem("shortsyou_jwt"); if (!token) return;
    setBusy(clipId); setNotice("Queueing 4K export...");
    try { await api.exportClip(token, clipId); setNotice("Export queued. The card will update after the worker finishes."); await refresh(); } catch (error) { setNotice(error instanceof Error ? error.message : "Export failed."); } finally { setBusy(null); }
  }

  async function publishClip(clipId: string) {
    const token = sessionStorage.getItem("shortsyou_jwt"); if (!token) return;
    setBusy(clipId); setNotice("Publishing clip...");
    try { await api.publishClip(token, clipId); setNotice("Clip published and analytics collection scheduled."); await refresh(); } catch (error) { setNotice(error instanceof Error ? error.message : "Publish failed."); } finally { setBusy(null); }
  }

  async function downloadClip(clipId: string) {
    const token = sessionStorage.getItem("shortsyou_jwt"); if (!token) return;
    setBusy(clipId);
    try { const result = await api.downloadClip(token, clipId); window.open(result.downloadUrl, "_blank", "noopener,noreferrer"); } catch (error) { setNotice(error instanceof Error ? error.message : "Download is not ready yet."); } finally { setBusy(null); }
  }

  async function publishSelected() { for (const clipId of selected) await publishClip(clipId); setSelected([]); }
  function signOut() { sessionStorage.removeItem("shortsyou_jwt"); router.push("/login"); }

  return <main className="clips-page"><aside className={`clips-rail ${mobileNav ? "open" : ""}`}><div className="clips-rail-brand"><Link href="/">SY</Link><button onClick={() => setMobileNav(false)}><X size={17} /></button></div><nav><Link href="/dashboard"><LayoutDashboard size={18} /><span>Studio</span></Link><Link href="/editor"><WandSparkles size={18} /><span>Custom Editor</span></Link><Link className="active" href="/clips"><Clapperboard size={18} /><span>Clips Review</span><b>{clips.length}</b></Link><Link href="/discover"><Radio size={18} /><span>Viral Pipeline</span></Link><Link href="/dashboard#analytics"><BarChart3 size={18} /><span>Analytics</span></Link></nav><div className="clips-rail-bottom"><button><Settings2 size={17} /></button><button onClick={signOut}><LogOut size={17} /></button></div></aside><div className="clips-main"><header className="clips-header"><button className="clips-menu" onClick={() => setMobileNav(true)}><Menu size={20} /></button><Link href="/dashboard" className="clips-back"><ArrowLeft size={14} /> Studio</Link><span className="clips-user">{user?.email ?? "Studio session"}</span><button onClick={() => void refresh()} aria-label="Refresh"><RefreshCw size={16} /></button></header><div className="clips-content"><section className="clips-hero"><div><span className="clips-kicker"><Sparkles size={13} /> Curated footage · {clips.length} clips ready</span><h1>Clips Review &amp;<br /><em>Publishing Studio</em></h1><p>Polish, export, and publish your highest-saliency moments with a controlled production workflow.</p></div><div className="clips-actions"><Link href="/editor" className="primary"><WandSparkles size={15} /> Open Custom Editor</Link><button><Radio size={15} /> Auto-Schedule Queue</button><button><Download size={15} /> Export All 4K</button><button className="primary" disabled={!selected.length} onClick={() => void publishSelected()}><Send size={15} /> Publish Selected ({selected.length})</button></div></section><section className="clips-metrics"><Metric icon={Film} value={`${clips.length}`} label="Extracted Clips" note={`${videos.length} source videos`} /><Metric icon={Zap} value={`${Math.round(Math.max(0, ...clips.map((clip) => clip.viralScore)))}%`} label="Peak Hook Saliency" note="Highest ranked moment" /><Metric icon={Radio} value={`${clips.filter((clip) => clip.status === "exported").length}`} label="Ready Exports" note="Awaiting distribution" /><Metric icon={BarChart3} value={`${clips.filter((clip) => clip.status === "published").length}`} label="Published" note="Analytics tracking" /></section><section className="clips-toolbar"><div>{[["all", `All Clips (${clips.length})`], ["ready", "Ready to Publish"], ["viral", "Viral"], ["narrative", "Narrative"]].map(([key, label]) => <button className={filter === key ? "active" : ""} key={key} onClick={() => setFilter(key)}>{label}</button>)}</div><button onClick={() => setSelected(selected.length === visible.length ? [] : visible.map((clip) => clip.id))}><Check size={14} /> Select All</button></section>{notice && <p className="clips-notice">{notice}</p>}<section className="clips-grid">{visible.map((clip, index) => <ClipCard key={clip.id} clip={clip} video={videoFor(clip)} selected={selected.includes(clip.id)} busy={busy === clip.id} onSelect={() => setSelected((current) => current.includes(clip.id) ? current.filter((id) => id !== clip.id) : [...current, clip.id])} onExport={() => void exportClip(clip.id)} onDownload={() => void downloadClip(clip.id)} index={index} />)}</section>{visible.length === 0 && <div className="clips-empty"><Clapperboard size={24} /><h2>No clips match this view</h2><p>Process a YouTube video from the discovery studio to create reviewable shorts.</p><Link href="/discover">Find a creator or video</Link></div>}</div></div></main>;
}

function Metric({ icon: Icon, value, label, note }: { icon: typeof Film; value: string; label: string; note: string }) { return <article><span><Icon size={17} /></span><strong>{value}</strong><small>{label}</small><em>{note}</em></article>; }
function ClipCard({ clip, video, selected, busy, onSelect, onExport, onDownload, index }: { clip: Clip; video?: Video; selected: boolean; busy: boolean; onSelect: () => void; onExport: () => void; onDownload: () => void; index: number }) { const image = clip.selectedThumbnail || clip.thumbnailOptions?.[0] || video?.thumbnailUrl; const title = clip.originalHook || clip.selectedHook || clip.transcriptText || "High-saliency moment"; const isRendered = ["exported", "published"].includes(clip.status); const isRendering = clip.status === "editing"; return <article className="clip-card"><div className="clip-media">{image ? <img src={image} alt="" /> : <div className={`clip-art art-${index % 4}`}><Play size={30} /></div>}<div className="clip-gradient" /><input type="checkbox" checked={selected} onChange={onSelect} /><span className="clip-score">{Math.round(clip.viralScore)} / 100</span><div className="clip-caption">{title.slice(0, 90)}</div><div className="clip-wave"><span>◖</span><i /><i /><i /><i /><i /><i /><small>{formatDuration(clip.durationSeconds)}</small></div></div><div className="clip-details"><div className="clip-meta"><span>{video?.title?.slice(0, 22) ?? "Processed source"}</span><b>{clip.category || "Viral"}</b></div><h3>{title.slice(0, 100)}</h3><p>{clip.status} · {clip.semanticLabels?.slice(0, 2).join(" · ") || "AI hook detected"}</p><div className="clip-platforms"><span>Shorts</span><span>TikTok</span><span>Reels</span></div><div className="clip-buttons"><button onClick={onExport} disabled={busy || isRendering}>{busy || isRendering ? <RefreshCw className="spin" size={13} /> : <WandSparkles size={13} />} {isRendering ? "Rendering…" : isRendered ? "Quick Polish" : "Create Short"}</button><button className="publish" onClick={onDownload} disabled={busy || !isRendered}><ArrowDownToLine size={13} /> Download</button></div></div></article>; }
function formatDuration(value: number) { return `${Math.floor(value / 60)}:${String(Math.round(value % 60)).padStart(2, "0")}`; }
