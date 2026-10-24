const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" &&
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1"
    ? "https://shortsyou-server.onrender.com"
    : "http://localhost:5050");

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
  version: () => apiRequest<VersionInfo>("/version"),
  me: (token: string) => apiRequest<User>("/api/v1/auth/me", { token }),
  videos: (token: string, sort?: string) =>
    apiRequest<Video[]>(`/api/v1/videos${sort ? `?sort=${encodeURIComponent(sort)}` : ""}`, { token }),
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
  dailyReels: (token: string) =>
    apiRequest<DailyReel[]>("/api/v1/clips/daily-reels", { token }),
  autoCompose: (token: string, videoId: string) =>
    apiRequest<AutoComposeResult>("/api/v1/editor/auto-compose", {
      method: "POST",
      body: JSON.stringify({ videoId }),
      token,
    }),
  generateHooks: (token: string, videoId?: string, clipText?: string, tone?: string) =>
    apiRequest<HookVariation[]>("/api/v1/editor/generate-hooks", {
      method: "POST",
      body: JSON.stringify({ videoId, clipText, tone }),
      token,
    }),
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
      `/api/v1/clips/${encodeURIComponent(clipId)}/export`,
      { method: "POST", token },
    ),
  publishClip: (token: string, clipId: string) =>
    apiRequest<{ clipId: string; status: string }>(
      `/api/v1/clips/${encodeURIComponent(clipId)}/published`,
      { method: "POST", token },
    ),
  downloadClip: (token: string, clipId: string) =>
    apiRequest<{ downloadUrl: string }>(`/api/v1/clips/${encodeURIComponent(clipId)}/download`, {
      token,
    }),
  updateClip: (
    token: string,
    clipId: string,
    update: Partial<Pick<Clip, "selectedHook" | "status">> & {
      editSettings?: EditSettings;
    },
  ) =>
    apiRequest<Clip>(`/api/v1/clips/${encodeURIComponent(clipId)}`, {
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
      apiRequest<CreatorDNA>("/api/v1/analytics/dna", { token }),
    generateDNA: (token: string, sync = false) =>
      apiRequest<CreatorDNA>(
        `/api/v1/analytics/dna/generate${sync ? "/sync" : ""}`,
        { method: "POST", token },
      ),
    knowledgeGraph: (token: string) =>
      apiRequest<KnowledgeGraphResponse>("/api/v1/analytics/knowledge-graph", { token }),
    contentGaps: (token: string) =>
      apiRequest<ContentGapsResponse>("/api/v1/analytics/content-gaps", { token }),
    personas: (token: string) =>
      apiRequest<AudiencePersonasResponse>("/api/v1/analytics/personas", { token }),
    trendForecast: (token: string) =>
      apiRequest<TrendForecastResponse>("/api/v1/analytics/trend-forecast", { token }),
    trends: (token: string) =>
      apiRequest<TrendForecastResponse>("/api/v1/analytics/trend-forecast", { token }),
    performance: (token: string) =>
      apiRequest<PerformanceAnalytics>("/api/v1/analytics/performance", {
        token,
      }),
    modelAccuracy: (token: string) =>
      apiRequest<ModelAccuracy>("/api/v1/analytics/model-accuracy", { token }),
    abTests: (token: string) =>
      apiRequest<ABTestsResponse>("/api/v1/analytics/ab-tests", { token }),
  },
  admin: {
    keyHealth: (token: string) =>
      apiRequest<AdminKeyHealthResponse>("/api/v1/admin/key-health", { token }),
  },
};

export type Health = {
  status: "ok" | "degraded";
  uptime: string;
  runtime: string;
  dependencies: Record<string, { status: string; error?: string }>;
};

export type VersionInfo = {
  version: string;
  buildTime: string;
  runtime: string;
  os: string;
  arch: string;
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
  createdAt?: string;
  updatedAt?: string;
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
  userId: string;
  startTime: number;
  endTime: number;
  viralScore: number;
  genericPredictionScore: number;
  personalizedPredictionScore: number;
  hookScore: number;
  transcriptText: string;
  originalHook?: string;
  selectedHook?: string;
  semanticLabels?: string[];
  emotionType?: string;
  suggestedHooks?: { text: string; hookScore: number }[];
  scores?: {
    emotion: number;
    semanticImpact: number;
    speechEmphasis: number;
    clarity: number;
    novelty: number;
    trendAlignment: number;
  };
  editSettings: EditSettings;
  predictionConfidenceInterval?: { low: number; high: number };
  performanceData?: {
    views48h: number;
    ctr48h: number;
    avgWatchTimeSec: number;
    engagementRate: number;
    collectedAt: string;
  };
  status: string;
  category: string;
  durationSeconds: number;
  createdAt: string;
  selectedThumbnail?: string;
  thumbnailOptions?: string[];
  supabaseShortUrl?: string;
  supabaseRawClipUrl?: string;
  abTestGroup?: string;
  updatedAt?: string;
  exportedAt?: string;
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
export type CreatorDNA = {
  id?: string;
  userId?: string;
  ready?: boolean;
  message?: string;
  topicDistribution?: { topic: string; label: string; weight: number }[];
  emotionalRange?: {
    dominantEmotion?: string;
    mean?: number;
    std?: number;
    min?: number;
    max?: number;
  };
  speechProfile?: {
    avgWpm?: number;
    pauseFrequency?: number;
    emphasisFrequency?: number;
    avgSegmentLength?: number;
  };
  vocabularyProfile?: {
    topWords?: string[];
    avgSentenceLength?: number;
    readabilityScore?: number;
  };
  contentGaps?: {
    topic: string;
    demandScore: number;
    trendScore: number;
    gapScore: number;
    opportunityScore: number;
  }[];
  topicGraph?: {
    nodes: {
      id: string;
      label: string;
      clipCount: number;
      isGap: boolean;
      isTrending: boolean;
      weight: number;
    }[];
    edges: { source: string; target: string; weight: number }[];
  };
  featureImportances?: {
    feature: string;
    meanAbsSHAP: number;
    featureType: string;
  }[];
  dnaVector?: number[];
  evergreensRatio?: number;
  avgHookScore?: number;
  lastUpdatedAt?: string;
  createdAt?: string;
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

export interface DailyReel {
  id: string;
  videoId: string;
  videoTitle: string;
  thumbnailUrl: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  hookText: string;
  viralScore: number;
  category: string;
  status: string;
  reasoning: string;
  playableUrl?: string;
}

export interface AutoComposeResult {
  startTime: number;
  endTime: number;
  duration: number;
  hookText: string;
  captionStyle: "bold" | "karaoke" | "minimal";
  colorGrade: string;
  musicMood: string;
  backgroundStyle: string;
  layout?: "standard" | "two_frame" | "multi_face" | "auto_face";
  reasoning: string;
}

export interface HookVariation {
  tone: string;
  text: string;
}

export interface ContentGap {
  topic: string;
  demandScore: number;
  trendScore: number;
  gapScore: number;
  opportunityScore: number;
}

export interface ContentGapsResponse {
  gaps: ContentGap[];
}

export interface TopicGraphNode {
  id: string;
  label: string;
  clipCount: number;
  isGap: boolean;
  isTrending: boolean;
  weight: number;
}

export interface TopicGraphEdge {
  source: string;
  target: string;
  weight: number;
}

export interface KnowledgeGraphResponse {
  nodes: TopicGraphNode[];
  edges: TopicGraphEdge[];
  contentGaps?: ContentGap[];
}

export interface VocabWord {
  word: string;
  tfidfScore: number;
}

export interface SentimentProfile {
  positive: number;
  negative: number;
  neutral: number;
}

export interface Persona {
  personaId: string;
  name: string;
  commentCount: number;
  percentOfAudience: number;
  vocabulary: VocabWord[];
  questionTypes: string[];
  sentimentProfile: SentimentProfile;
  engagementRate: number;
  topEngagedCategories: string[];
}

export interface ClusterMetrics {
  silhouetteScore: number;
  nClusters: number;
}

export interface AudiencePersonasResponse {
  id?: string;
  userId?: string;
  personas: Persona[];
  clusterMetrics?: ClusterMetrics | null;
  lastUpdatedAt?: string;
  createdAt?: string;
}

export interface TrendPoint {
  date: string;
  interestScore: number;
}

export interface ForecastPoint {
  date: string;
  predictedScore: number;
  lower95: number;
  upper95: number;
}

export interface MatchedClip {
  clipId: string;
  title: string;
  similarityScore: number;
}

export interface TrendForecast {
  id?: string;
  userId?: string;
  topic: string;
  historicalData: TrendPoint[];
  forecast: ForecastPoint[];
  peakPredictionDate?: string;
  peakPredictedScore?: number;
  matchedClips?: MatchedClip[];
  forecastGeneratedAt?: string;
  nextUpdateAt?: string;
  createdAt?: string;
}

export interface TrendForecastResponse {
  forecasts: TrendForecast[];
}

export interface ABExperiment {
  id: string;
  userId: string;
  clipId: string;
  originalHook: string;
  generatedHook: string;
  originalCtr: number;
  generatedCtr: number;
  nOriginal: number;
  nGenerated: number;
  tStatistic: number;
  isSignificant: boolean;
  liftPercent: number;
  status: string;
  createdAt: string;
  completedAt?: string;
}

export interface ABTestsResponse {
  experiments: ABExperiment[];
}

export interface LLMKeyStatus {
  provider: string;
  keyIndex: number;
  status: string;
  rateLimitRemaining?: number;
  lastUsed?: string;
}

export interface AdminKeyHealthResponse {
  keys: LLMKeyStatus[];
}
