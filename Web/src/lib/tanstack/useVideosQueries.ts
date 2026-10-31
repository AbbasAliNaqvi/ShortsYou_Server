import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Video, type PublicVideo, type Transcript, type EditSettings } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export function useVideos(token: string | null, sort?: string) {
  return useQuery<Video[]>({
    queryKey: queryKeys.videos.list(sort),
    queryFn: async () => {
      if (!token) return [];
      return api.videos(token, sort);
    },
    enabled: Boolean(token),
    staleTime: 30 * 1000,
  });
}

export function useVideoSearch(token: string | null, query: string) {
  return useQuery<PublicVideo[]>({
    queryKey: queryKeys.videos.search(query),
    queryFn: async () => {
      if (!token || !query.trim()) return [];
      return api.searchVideos(token, query.trim());
    },
    enabled: Boolean(token && query.trim().length > 1),
    staleTime: 60 * 1000,
  });
}

export function useVideoTranscript(token: string | null, videoId: string | null) {
  return useQuery<Transcript | null>({
    queryKey: videoId ? queryKeys.videos.transcript(videoId) : ["videos", "transcript", "none"],
    queryFn: async () => {
      if (!token || !videoId) return null;
      return api.transcript(token, videoId);
    },
    enabled: Boolean(token && videoId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSyncVideosMutation(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("Authentication required");
      return api.syncVideos(token);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.videos.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    },
  });
}

export function useDeleteVideoMutation(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (videoId: string) => {
      if (!token) throw new Error("Authentication required");
      return api.deleteVideo(token, videoId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.videos.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.clips.all });
    },
  });
}

export function useGenerateVideoMutation(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (videoId: string) => {
      if (!token) throw new Error("Authentication required");
      return api.generateVideo(token, videoId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.clips.all });
    },
  });
}

export function useAutoCreateMutation(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (videoId: string) => {
      if (!token) throw new Error("Authentication required");
      return api.autoCreate(token, videoId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.clips.all });
    },
  });
}

export function useCreateManualShortMutation(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      videoId: string;
      startTime: number;
      endTime: number;
      hookText: string;
      editSettings?: EditSettings;
    }) => {
      if (!token) throw new Error("Authentication required");
      return api.createManualShort(
        token,
        payload.videoId,
        payload.startTime,
        payload.endTime,
        payload.hookText,
        payload.editSettings,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.clips.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    },
  });
}
