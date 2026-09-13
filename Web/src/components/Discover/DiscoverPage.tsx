"use client";
/* YouTube thumbnail hosts are dynamic and are intentionally not sent through Next's image proxy. */
/* eslint-disable @next/next/no-img-element */

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Clapperboard, Eye, LoaderCircle, Play, Radio, Search, Sparkles, Users, Video } from "lucide-react";
import { api, type Channel, type PublicVideo } from "@/lib/api";

export function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<PublicVideo[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function search(event?: FormEvent) {
    event?.preventDefault();
    if (!query.trim()) return;
    setBusy(true); setMessage("");
    try {
      const results = await api.searchChannel(query.trim());
      setChannels(results);
      if (results.length === 0) {
        setChannel(null); setVideos([]); setMessage("No public channels matched that search.");
      } else {
        await selectChannel(results[0]);
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Creator search failed."); } finally { setBusy(false); }
  }

  async function selectChannel(nextChannel?: Channel) {
    if (!nextChannel) return;
    setBusy(true);
    try {
      const videoResult = await api.channelVideos(nextChannel.channelId);
      setChannel(nextChannel); setVideos(videoResult.videos ?? []); setSelected([]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load channel videos.");
    } finally { setBusy(false); }
  }

  async function queueVideos(videoIds: string[]) {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token || !channel) { setMessage("Sign in again before queueing a creator video."); return; }
    const transcribe = false;
    setBusy(true); setMessage(`Adding ${videoIds.length} video${videoIds.length === 1 ? "" : "s"} to your selected videos...`);
    let queued = 0;
    for (const videoId of videoIds) { try { await api.processPublicVideo(token, channel.channelId, videoId, transcribe); queued += 1; } catch { /* Existing or unavailable videos do not stop the batch. */ } }
    setSelected([]); setMessage(`${queued} video${queued === 1 ? "" : "s"} added. Open Your Videos to choose how to create each short.`); setBusy(false);
  }

  async function addChannelAndQueue() {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token || !channel) { setMessage("Sign in again before adding a channel."); return; }
    setBusy(true);
    try {
      await api.addChannel(token, channel.channelId, channel.title);
      setMessage(`${channel.title} added to your studio. Select videos below to add them to Your Videos.`);
      setBusy(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to add this channel.");
      setBusy(false);
    }
  }

  return <main className="discover-page"><header className="discover-header"><Link href="/dashboard" className="discover-brand"><span>SY</span> ShortsYou <b>Viral Pipeline</b></Link><Link href="/videos" className="discover-back"><ArrowLeft size={14} /> Your Videos</Link></header><div className="discover-content"><section className="discover-hero"><span className="discover-kicker"><Sparkles size={14} /> Creator intelligence</span><h1>Find the next channel<br /><em>worth your attention.</em></h1><p>Search public YouTube creators, choose videos, then create your short from the Your Videos studio.</p><form className="creator-search" onSubmit={search}><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a creator, channel, or @handle" /><button type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : <ArrowRight size={16} />} Search</button></form>{message && <p className="discover-message">{message}</p>}</section>{channels.length > 0 && <section className="channel-candidates"><div className="channel-candidates-heading"><span>Search results</span><b>{channels.length} channels found</b></div><div>{channels.map((candidate) => <button className={channel?.channelId === candidate.channelId ? "selected" : ""} key={candidate.channelId} onClick={() => void selectChannel(candidate)}><span>{candidate.thumbnailUrl ? <img src={candidate.thumbnailUrl} alt="" /> : <Radio size={17} />}</span><strong>{candidate.title}</strong><small>{compact(candidate.subscriberCount)} subscribers</small></button>)}</div></section>}{channel && <section className="channel-result"><div className="channel-avatar">{channel.thumbnailUrl ? <img src={channel.thumbnailUrl} alt="" /> : <Radio size={24} />}</div><div className="channel-copy"><span>Selected channel</span><h2>{channel.title}</h2><p>{channel.description}</p><div><b><Users size={13} /> {compact(channel.subscriberCount)} subscribers</b><b><Video size={13} /> {compact(channel.videoCount)} videos</b><b><Eye size={13} /> {compact(channel.viewCount)} views</b></div></div><button className="channel-add" onClick={() => void addChannelAndQueue()} disabled={busy}><Clapperboard size={15} /> Add creator to studio</button></section>}{channel && <section className="creator-videos"><div className="creator-videos-heading"><div><span>Public video catalog</span><h2>Select specific videos</h2></div><button onClick={() => setSelected(selected.length === videos.length ? [] : videos.map((video) => video.youtubeVideoId))}><Check size={14} /> {selected.length ? `${selected.length} selected` : "Select all"}</button></div><div className="public-video-grid">{videos.map((video) => { const isSelected = selected.includes(video.youtubeVideoId); return <article className={isSelected ? "public-video selected" : "public-video"} key={video.youtubeVideoId} onClick={() => setSelected((current) => isSelected ? current.filter((id) => id !== video.youtubeVideoId) : [...current, video.youtubeVideoId])}><div>{video.thumbnailUrl ? <img src={video.thumbnailUrl} alt="" /> : <Play size={23} />}<span><Play size={13} /></span>{isSelected && <b><Check size={13} /></b>}</div><small>{compact(video.viewCount)} views · {duration(video.durationSeconds)}</small><h3>{video.title}</h3><button onClick={(event) => { event.stopPropagation(); void queueVideos([video.youtubeVideoId]); }}>Add to Your Videos <ArrowRight size={13} /></button></article>; })}</div>{selected.length > 0 && <button className="queue-selected" onClick={() => void queueVideos(selected)} disabled={busy}><Clapperboard size={16} /> Add {selected.length} selected video{selected.length === 1 ? "" : "s"}</button>}</section>}</div></main>;
}
function compact(value: number) { if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`; if (value >= 1000) return `${(value / 1000).toFixed(1)}K`; return String(value); }
function duration(value: number) { return `${Math.floor(value / 60)}:${String(Math.round(value % 60)).padStart(2, "0")}`; }
