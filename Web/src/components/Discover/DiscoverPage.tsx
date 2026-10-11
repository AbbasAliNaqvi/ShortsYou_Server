"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type Channel, type PublicVideo, type User } from "@/lib/api";
import { notify } from "@/components/Notifications/NotificationCenter";
import { WorkspaceShell } from "@/components/Layout";
import {
  DiscoverHero,
  ChannelCandidates,
  ChannelBanner,
  CreatorVideoCatalog,
} from "@/components/Discover";

export function DiscoverPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [query, setQuery] = useState("");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<PublicVideo[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token) return;
    api.me(token).then(setUser).catch(() => {});
  }, []);

  async function search(event?: FormEvent) {
    event?.preventDefault();
    if (!query.trim()) return;
    setBusy(true);
    setMessage("");
    try {
      const results = await api.searchChannel(query.trim());
      setChannels(results);
      if (results.length === 0) {
        setChannel(null);
        setVideos([]);
        setMessage("No public channels matched that search.");
      } else {
        await selectChannel(results[0]);
      }
    } catch (error) {
      const err = error instanceof Error ? error.message : "Creator search failed.";
      setMessage(err);
      notify("Search Failed", err, "error");
    } finally {
      setBusy(false);
    }
  }

  async function selectChannel(nextChannel?: Channel) {
    if (!nextChannel) return;
    setBusy(true);
    try {
      const videoResult = await api.channelVideos(nextChannel.channelId);
      setChannel(nextChannel);
      setVideos(videoResult.videos ?? []);
      setSelected([]);
    } catch (error) {
      const err = error instanceof Error ? error.message : "Unable to load channel videos.";
      setMessage(err);
      notify("Loading Error", err, "error");
    } finally {
      setBusy(false);
    }
  }

  async function queueVideos(videoIds: string[]) {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token || !channel) {
      const err = "Sign in again before queueing a creator video.";
      setMessage(err);
      notify("Session Required", err, "error");
      return;
    }
    const transcribe = false;
    setBusy(true);
    const startMsg = `Adding ${videoIds.length} video${videoIds.length === 1 ? "" : "s"} to your selected videos...`;
    setMessage(startMsg);
    let queued = 0;
    for (const videoId of videoIds) {
      try {
        await api.processPublicVideo(token, channel.channelId, videoId, transcribe);
        queued += 1;
      } catch {
        /* Existing or unavailable videos do not stop the batch. */
      }
    }
    setSelected([]);
    const successMsg = `${queued} video${queued === 1 ? "" : "s"} added. Open Your Videos to choose how to create each short.`;
    setMessage(successMsg);
    notify("Videos Queued", successMsg, "success");
    setBusy(false);
  }

  async function addChannelAndQueue() {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token || !channel) {
      const err = "Sign in again before adding a channel.";
      setMessage(err);
      notify("Session Required", err, "error");
      return;
    }
    setBusy(true);
    try {
      await api.addChannel(token, channel.channelId, channel.title);
      const successMsg = `${channel.title} added to your studio. Select videos below to add them to Your Videos.`;
      setMessage(successMsg);
      notify("Creator Added", successMsg, "success");
      setBusy(false);
    } catch (error) {
      const err = error instanceof Error ? error.message : "Unable to add this channel.";
      setMessage(err);
      notify("Action Failed", err, "error");
      setBusy(false);
    }
  }

  function toggleSelectVideo(videoId: string) {
    setSelected((current) =>
      current.includes(videoId)
        ? current.filter((id) => id !== videoId)
        : [...current, videoId]
    );
  }

  function selectAllVideos() {
    setSelected(videos.map((v) => v.youtubeVideoId));
  }

  function clearSelection() {
    setSelected([]);
  }

  function signOut() {
    localStorage.removeItem("shortsyou_jwt");
    router.push("/login");
  }

  return (
    <WorkspaceShell
      title="Discover Creators"
      subtitle="Creator Intelligence"
      user={user}
      refreshing={busy}
      onRefresh={() => {
        if (query.trim()) void search();
      }}
      onSignOut={signOut}
    >
      <div className="ca-discover-content-stack">
        {/* Creator Intelligence Search Hero */}
        <DiscoverHero
          query={query}
          busy={busy}
          message={message}
          onChangeQuery={setQuery}
          onSubmitSearch={search}
          onClearMessage={() => setMessage("")}
        />

        {/* Search Results Channel Candidate Shelf */}
        <ChannelCandidates
          channels={channels}
          selectedChannel={channel}
          onSelectChannel={(c) => void selectChannel(c)}
          busy={busy}
        />

        {/* Selected Channel Showcase Banner */}
        {channel && (
          <ChannelBanner
            channel={channel}
            busy={busy}
            onAddChannel={() => void addChannelAndQueue()}
          />
        )}

        {/* Creator's Public Video Catalog */}
        {channel && (
          <CreatorVideoCatalog
            videos={videos}
            selected={selected}
            busy={busy}
            onToggleSelect={toggleSelectVideo}
            onSelectAll={selectAllVideos}
            onClearSelection={clearSelection}
            onQueueVideos={(ids) => void queueVideos(ids)}
          />
        )}
      </div>
    </WorkspaceShell>
  );
}
