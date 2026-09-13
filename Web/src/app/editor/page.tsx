"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Clapperboard, LoaderCircle, Sparkles, WandSparkles } from "lucide-react";
import { api, type Video } from "@/lib/api";

export default function EditorVideoPicker() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token) { router.replace("/login"); return; }
    api.videos(token).then(setVideos).catch((error) => setNotice(error instanceof Error ? error.message : "Unable to load your videos.")).finally(() => setLoading(false));
  }, [router]);

  return <main className="editor-picker"><header><Link href="/dashboard">ShortsYou</Link><nav><Link href="/dashboard">Studio</Link><Link href="/videos">Videos</Link><Link className="active" href="/editor">Custom Editor</Link><Link href="/clips">Clips Review</Link></nav></header><section className="picker-hero"><span><Sparkles size={14} /> CUSTOM SHORT STUDIO</span><h1>Choose footage,<br /><em>then make it yours.</em></h1><p>Select a saved video to set the exact moment, framing, face layout, captions, music, and finishing treatment.</p></section>{loading ? <div className="picker-loading"><LoaderCircle className="spin" /> Loading your studio footage…</div> : notice ? <p className="picker-notice">{notice}</p> : videos.length ? <section className="picker-videos">{videos.map((video) => <button key={video.id} onClick={() => router.push(`/editor/${video.id}`)}><div>{video.thumbnailUrl ? <img src={video.thumbnailUrl} alt="" /> : <Clapperboard size={28} />}<span><WandSparkles size={16} /> Edit this video</span></div><small>{format(video.durationSeconds)} · {video.sourceType === "own" ? "Your channel" : "Selected creator"}</small><strong>{video.title}</strong><i>Open editor <ArrowRight size={14} /></i></button>)}</section> : <section className="picker-empty"><Clapperboard size={28} /><h2>Add a video before editing</h2><p>Sync your channel or select a creator video, then it will appear here.</p><Link href="/videos">Go to videos <ArrowRight size={15} /></Link></section>}</main>;
}

function format(seconds: number) { return `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, "0")}`; }
