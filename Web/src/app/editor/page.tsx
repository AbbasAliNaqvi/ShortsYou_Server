"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type User, type Video } from "@/lib/api";
import { WorkspaceShell, LoadingState } from "@/components/Layout";
import { EditorPickerHero, EditorVideoPickerGrid } from "@/components/Editor";

export default function EditorVideoPicker() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setNotice] = useState("");

  async function loadData() {
    const token = localStorage.getItem("shortsyou_jwt");
    if (!token) {
      router.replace("/login");
      return;
    }
    try {
      const [userRes, videosRes] = await Promise.allSettled([
        api.me(token),
        api.videos(token),
      ]);
      if (userRes.status === "fulfilled") setUser(userRes.value);
      if (videosRes.status === "fulfilled") setVideos(videosRes.value ?? []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load your videos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => void loadData());
  }, []);

  function signOut() {
    localStorage.removeItem("shortsyou_jwt");
    router.push("/login");
  }

  return (
    <WorkspaceShell
      title="Custom Editor"
      subtitle="Footage Studio"
      user={user}
      refreshing={loading}
      onRefresh={() => void loadData()}
      onSignOut={signOut}
    >
      <div className="ca-editor-picker-stack">
        <EditorPickerHero videoCount={videos.length} />

        {loading ? (
          <LoadingState />
        ) : (
          <EditorVideoPickerGrid
            videos={videos}
            onSelectVideo={(video) => router.push(`/editor/${video.id}`)}
          />
        )}
      </div>
    </WorkspaceShell>
  );
}
