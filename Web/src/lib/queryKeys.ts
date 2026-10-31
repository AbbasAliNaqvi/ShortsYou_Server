/**
 * Centralized TanStack Query Keys Factory
 * Provides type-safe and consistent query keys across all application domains.
 */

export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    me: () => [...queryKeys.auth.all, "me"] as const,
  },
  videos: {
    all: ["videos"] as const,
    list: (sort?: string) => [...queryKeys.videos.all, "list", sort ?? "default"] as const,
    search: (query: string) => [...queryKeys.videos.all, "search", query] as const,
    transcript: (videoId: string) => [...queryKeys.videos.all, "transcript", videoId] as const,
  },
  clips: {
    all: ["clips"] as const,
    list: () => [...queryKeys.clips.all, "list"] as const,
    dailyReels: () => [...queryKeys.clips.all, "dailyReels"] as const,
    pending: () => [...queryKeys.clips.all, "pending"] as const,
    approved: () => [...queryKeys.clips.all, "approved"] as const,
    detail: (clipId: string) => [...queryKeys.clips.all, "detail", clipId] as const,
  },
  jobs: {
    all: ["jobs"] as const,
    list: () => [...queryKeys.jobs.all, "list"] as const,
    detail: (jobId: string) => [...queryKeys.jobs.all, "detail", jobId] as const,
  },
  analytics: {
    all: ["analytics"] as const,
    dna: () => [...queryKeys.analytics.all, "dna"] as const,
    performance: () => [...queryKeys.analytics.all, "performance"] as const,
    contentGaps: () => [...queryKeys.analytics.all, "contentGaps"] as const,
    personas: () => [...queryKeys.analytics.all, "personas"] as const,
    trendForecast: () => [...queryKeys.analytics.all, "trendForecast"] as const,
    modelAccuracy: () => [...queryKeys.analytics.all, "modelAccuracy"] as const,
    abTests: () => [...queryKeys.analytics.all, "abTests"] as const,
    knowledgeGraph: () => [...queryKeys.analytics.all, "knowledgeGraph"] as const,
  },
  discover: {
    all: ["discover"] as const,
    channelSearch: (query: string) => [...queryKeys.discover.all, "search", query] as const,
    channelVideos: (channelId: string) => [...queryKeys.discover.all, "channelVideos", channelId] as const,
  },
  swipe: {
    all: ["swipe"] as const,
    deck: () => [...queryKeys.swipe.all, "deck"] as const,
    stats: () => [...queryKeys.swipe.all, "stats"] as const,
  },
  admin: {
    all: ["admin"] as const,
    keyHealth: () => [...queryKeys.admin.all, "keyHealth"] as const,
  },
};
