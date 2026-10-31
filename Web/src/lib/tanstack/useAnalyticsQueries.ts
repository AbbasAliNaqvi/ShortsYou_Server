import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  api,
  type CreatorDNA,
  type PerformanceAnalytics,
  type ContentGapsResponse,
  type AudiencePersonasResponse,
  type TrendForecastResponse,
  type ModelAccuracy,
  type ABTestsResponse,
  type KnowledgeGraphResponse,
} from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export function useCreatorDNA(token: string | null) {
  return useQuery<CreatorDNA>({
    queryKey: queryKeys.analytics.dna(),
    queryFn: async () => {
      if (!token) return { ready: false, message: "No token" };
      return api.analytics.dna(token);
    },
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGenerateDNAMutation(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sync?: boolean) => {
      if (!token) throw new Error("Authentication required");
      return api.analytics.generateDNA(token, Boolean(sync));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.analytics.dna() });
    },
  });
}

export function usePerformanceAnalytics(token: string | null) {
  return useQuery<PerformanceAnalytics>({
    queryKey: queryKeys.analytics.performance(),
    queryFn: async () => {
      if (!token) return { points: [], pearsonR: 0, n: 0 };
      return api.analytics.performance(token);
    },
    enabled: Boolean(token),
    staleTime: 60 * 1000,
  });
}

export function useContentGaps(token: string | null) {
  return useQuery<ContentGapsResponse>({
    queryKey: queryKeys.analytics.contentGaps(),
    queryFn: async () => {
      if (!token) return { gaps: [] };
      return api.analytics.contentGaps(token);
    },
    enabled: Boolean(token),
    staleTime: 2 * 60 * 1000,
  });
}

export function useAudiencePersonas(token: string | null) {
  return useQuery<AudiencePersonasResponse>({
    queryKey: queryKeys.analytics.personas(),
    queryFn: async () => {
      if (!token) return { personas: [] };
      return api.analytics.personas(token);
    },
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTrendForecast(token: string | null) {
  return useQuery<TrendForecastResponse>({
    queryKey: queryKeys.analytics.trendForecast(),
    queryFn: async () => {
      if (!token) return { forecasts: [] };
      return api.analytics.trendForecast(token);
    },
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
  });
}

export function useModelAccuracy(token: string | null) {
  return useQuery<ModelAccuracy>({
    queryKey: queryKeys.analytics.modelAccuracy(),
    queryFn: async () => {
      if (!token)
        return {
          accuracyHistory: [],
          featureImportances: [],
          labeledSamples: 0,
          modelReady: false,
        };
      return api.analytics.modelAccuracy(token);
    },
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
  });
}

export function useABTests(token: string | null) {
  return useQuery<ABTestsResponse>({
    queryKey: queryKeys.analytics.abTests(),
    queryFn: async () => {
      if (!token) return { experiments: [] };
      return api.analytics.abTests(token);
    },
    enabled: Boolean(token),
    staleTime: 60 * 1000,
  });
}

export function useKnowledgeGraph(token: string | null) {
  return useQuery<KnowledgeGraphResponse>({
    queryKey: queryKeys.analytics.knowledgeGraph(),
    queryFn: async () => {
      if (!token) return { nodes: [], edges: [] };
      return api.analytics.knowledgeGraph(token);
    },
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
  });
}
