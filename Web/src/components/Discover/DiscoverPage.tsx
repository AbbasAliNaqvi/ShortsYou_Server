"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type Channel, type PublicVideo, type User } from "@/lib/api";
import { fetchPredictedTrends, type PredictTrendsData } from "@/lib/trendsApi";
import { notify } from "@/components/Notifications/NotificationCenter";
import { WorkspaceShell } from "@/components/Layout";
import { DiscoverHero } from "./DiscoverHero";
import { ChannelCandidates } from "./ChannelCandidates";
import { ChannelBanner } from "./ChannelBanner";
import { CreatorVideoCatalog } from "./CreatorVideoCatalog";
import { TrendsIntelligenceRadar } from "./TrendsIntelligenceRadar";

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

  // Predicted Trends & Viral Intelligence Radar State
  const [trendsData, setTrendsData] = useState<PredictTrendsData | null>(null);
  const [trendsLoading, setTrendsLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token) {
      router.replace("/login");
      return;
    }
    api.me(token).then((userData) => {
      setUser(userData);
      void loadTrends(userData.id);
    }).catch(() => {
      void loadTrends();
    });
  }, [router]);

  async function loadTrends(userIdToUse?: string) {
    setTrendsLoading(true);
    try {
      const effectiveId = userIdToUse || user?.id || "6a9881707a0426c73af163e5";
      const data = await fetchPredictedTrends(effectiveId);
      setTrendsData(data);
    } catch (error) {
      console.warn("Trends load error:", error);
    } finally {
      setTrendsLoading(false);
    }
  }

  async function search(event?: FormEvent, targetQuery?: string) {
    event?.preventDefault();
    const q = (targetQuery !== undefined ? targetQuery : query).trim();
    if (!q) return;
    setBusy(true);
    setMessage("");
    try {
      const results = await api.searchChannel(q);
      setChannels(results);
      if (results.length === 0) {
        setChannel(null);
        setVideos([]);
        setMessage(`No public channels matched "${q}".`);
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

  function handleSelectSearchTopic(topic: string) {
    setQuery(topic);
    window.scrollTo({ top: 0, behavior: "smooth" });
    void search(undefined, topic);
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
    const results = await Promise.allSettled(
      videoIds.map((videoId) =>
        api.processPublicVideo(token, channel.channelId, videoId, transcribe)
      )
    );
    const queued = results.filter((result) => result.status === "fulfilled").length;
    const failed = results.length - queued;
    setSelected([]);
    const successMsg = `${queued} video${queued === 1 ? "" : "s"} added${failed ? `, ${failed} could not be added` : ""}. Opening Your Videos...`;
    setMessage(successMsg);
    notify("Videos Queued", successMsg, failed ? "info" : "success");
    setBusy(false);
    if (queued > 0) router.push("/videos");
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

  const hasSearchResults = channels.length > 0 || channel !== null;

  return (
    <WorkspaceShell
      title="Discover Creators"
      subtitle="Creator Intelligence"
      user={user}
      refreshing={busy || trendsLoading}
      onRefresh={() => {
        if (query.trim()) void search();
        void loadTrends();
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

        {/* ── CASE 1: When user searches for a channel ── */}
        {hasSearchResults && (
          <>
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
          </>
        )}

        {/* ── PREDICT TRENDS & VIRAL BLUEPRINTS RADAR ──
            Shown prominently when no search is active, and also shown right after search results
        */}
        <TrendsIntelligenceRadar
          data={trendsData}
          loading={trendsLoading}
          onRefresh={() => void loadTrends()}
          onSelectSearchTopic={handleSelectSearchTopic}
        />
      </div>
    </WorkspaceShell>
  );
}
