const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5050";

export type ApiRequestOptions = RequestInit & { token?: string };
export type ApiEnvelope<T> = { success: boolean; data: T; error?: string };

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const payload = (await response
      .json()
      .catch(() => null)) as ApiEnvelope<unknown> | null;
    throw new Error(
      payload?.error ?? `API request failed (${response.status})`,
    );
  }

  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!payload.success) {
    throw new Error(payload.error ?? "API request failed");
  }
  return payload.data ?? ([] as unknown as T);
}

export const api = {
  health: () => apiRequest<Health>("/health"),
  me: (token: string) => apiRequest<User>("/api/v1/auth/me", { token }),
  videos: (token: string) => apiRequest<Video[]>("/api/v1/videos", { token }),
  searchVideos: (token: string, query: string) =>
    apiRequest<PublicVideo[]>(`/api/v1/videos/search?q=${encodeURIComponent(query)}`, { token }),
  deleteVideo: (token: string, videoId: string) =>
    apiRequest<{ videoId: string; message: string }>(`/api/v1/videos/${encodeURIComponent(videoId)}`, { method: "DELETE", token }),
  transcript: (token: string, videoId: string) =>
    apiRequest<Transcript>(
      `/api/v1/videos/${encodeURIComponent(videoId)}/transcript`,
      { token },
    ),
  syncVideos: (token: string) =>
    apiRequest<{ synced: number; queued: number }>("/api/v1/videos/sync", {
      method: "POST",
      token,
    }),
  generateVideo: (token: string, videoId: string) =>
    apiRequest<{ jobId: string; videoId: string; status: string; message: string }>(
      `/api/v1/videos/${encodeURIComponent(videoId)}/generate`,
      { method: "POST", token },
    ),
  createManualShort: (
    token: string,
    videoId: string,
    startTime: number,
    endTime: number,
    hookText: string,
    editSettings?: EditSettings,
  ) =>
    apiRequest<{ clipId: string; status: string }>(
      `/api/v1/videos/${encodeURIComponent(videoId)}/clips/manual`,
      {
        method: "POST",
        body: JSON.stringify({ startTime, endTime, hookText, editSettings }),
        token,
      },
    ),
  ingest: (token: string, url: string, transcribe = true) =>
    apiRequest<{ jobId: string; videoId: string; title: string }>(
      "/api/v1/videos/ingest",
      { method: "POST", body: JSON.stringify({ url, transcribe }), token },
    ),
  autoCreate: (token: string, videoId: string) =>
    apiRequest<{ jobId: string; videoId: string; status: string; message: string }>(
      `/api/v1/videos/${encodeURIComponent(videoId)}/auto-create`,
      { method: "POST", token },
    ),
  autoCreateIngest: (token: string, url: string) =>
    apiRequest<{ jobId: string; videoId: string; title: string; status: string; message: string }>(
      "/api/v1/videos/auto-create",
      { method: "POST", body: JSON.stringify({ url }), token },
    ),
  processPublicVideo: (
    token: string,
    channelId: string,
    videoId: string,
    transcribe = true,
  ) =>
    apiRequest<{ jobId: string; videoId: string; title: string }>(
      `/api/v1/channels/${encodeURIComponent(channelId)}/videos/${encodeURIComponent(videoId)}/process`,
      { method: "POST", body: JSON.stringify({ transcribe }), token },
    ),
  searchChannel: (query: string) =>
    apiRequest<Channel[]>(
      `/api/v1/channels/search?q=${encodeURIComponent(query)}`,
    ),
  channelVideos: (channelId: string) =>
    apiRequest<{ channelId: string; videos: PublicVideo[] }>(
      `/api/v1/channels/${encodeURIComponent(channelId)}/videos`,
    ),
  addChannel: (token: string, channelId: string, name: string) =>
    apiRequest<{ channelId: string; channelName: string }>(
      `/api/v1/channels/${encodeURIComponent(channelId)}/studio`,
      { method: "PUT", body: JSON.stringify({ name }), token },
    ),
  clips: (token: string) => apiRequest<Clip[]>("/api/v1/clips", { token }),
  pendingClips: (token: string) =>
    apiRequest<ClipCollection>("/api/v1/clips/pending", { token }),
  approvedClips: (token: string) =>
    apiRequest<ClipCollection>("/api/v1/clips/approved", { token }),
  clip: (token: string, clipId: string) =>
    apiRequest<Clip>(`/api/v1/clips/${encodeURIComponent(clipId)}`, { token }),
  approveClip: (token: string, clipId: string) =>
    apiRequest<ClipAction>(`/api/v1/clips/${encodeURIComponent(clipId)}/approve`, {
      method: "PATCH",
      token,
    }),
  deleteClip: (token: string, clipId: string) =>
    apiRequest<{ clipId: string; message: string }>(`/api/v1/clips/${encodeURIComponent(clipId)}`, { method: "DELETE", token }),
  rejectClip: (token: string, clipId: string) =>
    apiRequest<ClipAction>(`/api/v1/clips/${encodeURIComponent(clipId)}/reject`, {
      method: "PATCH",
      token,
    }),
  jobs: (token: string) => apiRequest<Job[]>("/api/v1/jobs", { token }),
  job: (token: string, jobId: string) =>
    apiRequest<Job>(`/api/v1/jobs/${encodeURIComponent(jobId)}`, { token }),
  exportClip: (token: string, clipId: string) =>
    apiRequest<{ clipId: string; status: string }>(
      `/api/v1/clips/${clipId}/export`,
      { method: "POST", token },
    ),
  publishClip: (token: string, clipId: string) =>
    apiRequest<{ clipId: string; status: string }>(
      `/api/v1/clips/${clipId}/published`,
      { method: "POST", token },
    ),
  downloadClip: (token: string, clipId: string) =>
    apiRequest<{ downloadUrl: string }>(`/api/v1/clips/${clipId}/download`, {
      token,
    }),
  updateClip: (
    token: string,
    clipId: string,
    update: Partial<Pick<Clip, "selectedHook" | "status">> & {
      editSettings?: EditSettings;
    },
  ) =>
    apiRequest<Clip>(`/api/v1/clips/${clipId}`, {
      method: "PATCH",
      body: JSON.stringify(update),
      token,
    }),
  edit: {
    health: (token: string) =>
      apiRequest<EditServiceHealth>("/api/v1/edit/health", { token }),
  },
  analytics: {
    dna: (token: string) =>
      apiRequest<unknown>("/api/v1/analytics/dna", { token }),
    knowledgeGraph: (token: string) =>
      apiRequest<unknown>("/api/v1/analytics/knowledge-graph", { token }),
    contentGaps: (token: string) =>
      apiRequest<unknown>("/api/v1/analytics/content-gaps", { token }),
    personas: (token: string) =>
      apiRequest<unknown>("/api/v1/analytics/personas", { token }),
    trends: (token: string) =>
      apiRequest<unknown>("/api/v1/analytics/trend-forecast", { token }),
    performance: (token: string) =>
      apiRequest<PerformanceAnalytics>("/api/v1/analytics/performance", {
        token,
      }),
    modelAccuracy: (token: string) =>
      apiRequest<ModelAccuracy>("/api/v1/analytics/model-accuracy", { token }),
    abTests: (token: string) =>
      apiRequest<unknown>("/api/v1/analytics/ab-tests", { token }),
  },
};

export type Health = {
  status: "ok" | "degraded";
  uptime: string;
  runtime: string;
  dependencies: Record<string, { status: string; error?: string }>;
};

export type User = {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  channelName?: string;
};
export type Video = {
  id: string;
  youtubeVideoId?: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  durationSeconds: number;
  processingStatus: string;
  clipsDetected: number;
  viewCount: number;
  publishedAt: string;
  sourceType?: string;
  sourceChannelId?: string;
};
export type TranscriptWord = {
  word: string;
  start: number;
  end: number;
  probability: number;
};
export type TranscriptSegment = {
  index: number;
  start: number;
  end: number;
  text: string;
  words: TranscriptWord[];
};
export type Transcript = {
  id: string;
  videoId: string;
  userId: string;
  language: string;
  segments: TranscriptSegment[];
  fillerWords: TranscriptWord[];
  silenceGaps: { start: number; end: number; duration: number }[];
  createdAt: string;
};
export type Clip = {
  id: string;
  videoId: string;
  viralScore: number;
  hookScore: number;
  transcriptText: string;
  originalHook?: string;
  selectedHook?: string;
  semanticLabels?: string[];
  status: string;
  category: string;
  durationSeconds: number;
  createdAt: string;
  selectedThumbnail?: string;
  thumbnailOptions?: string[];
  supabaseShortUrl?: string;
  supabaseRawClipUrl?: string;
};
export type ClipCollection = { clips: Clip[]; count: number };
export type ClipAction = { clipId: string; status: string; message: string };
export type EditSettings = {
  backgroundStyle: string;
  colorGrade: string;
  musicMood: string;
  captionStyle: string;
  layout?: "standard" | "two_frame" | "multi_face" | "auto_face";
  removeSilences: boolean;
  removeFillers: boolean;
};
export type EditServiceHealth = {
  status: string;
  service: string;
  version: string;
};
export type Job = {
  id: string;
  jobId: string;
  videoId: string;
  status: string;
  stage: string;
  progress: number;
  clipsFound: number;
  error?: string;
  createdAt: string;
};
export type Channel = {
  channelId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  customUrl?: string;
};
export type PublicVideo = {
  youtubeVideoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  durationSeconds: number;
  viewCount: number;
  publishedAt: string;
};
export type PerformanceAnalytics = {
  points: {
    clipId: string;
    predictedScore: number;
    actualViews: number;
    category: string;
  }[];
  pearsonR: number;
  n: number;
};
export type ModelAccuracy = {
  accuracyHistory: { date?: string; accuracy?: number; value?: number }[];
  featureImportances: {
    feature?: string;
    importance?: number;
    value?: number;
  }[];
  labeledSamples: number;
  modelReady: boolean;
};
