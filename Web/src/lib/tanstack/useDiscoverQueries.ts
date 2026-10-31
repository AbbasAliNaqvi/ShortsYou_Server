import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Channel, type PublicVideo } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export function useChannelSearch(query: string) {
  return useQuery<Channel[]>({
    queryKey: queryKeys.discover.channelSearch(query),
    queryFn: async () => {
      if (!query.trim()) return [];
      return api.searchChannel(query.trim());
    },
    enabled: Boolean(query.trim().length > 1),
    staleTime: 60 * 1000,
  });
}

export function useChannelVideos(channelId: string | null) {
  return useQuery<{ channelId: string; videos: PublicVideo[] }>({
    queryKey: channelId ? queryKeys.discover.channelVideos(channelId) : ["discover", "channelVideos", "none"],
    queryFn: async () => {
      if (!channelId) return { channelId: "", videos: [] };
      return api.channelVideos(channelId);
    },
    enabled: Boolean(channelId),
    staleTime: 2 * 60 * 1000,
  });
}

export function useProcessPublicVideoMutation(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      channelId: string;
      videoId: string;
      transcribe?: boolean;
    }) => {
      if (!token) throw new Error("Authentication required");
      return api.processPublicVideo(
        token,
        payload.channelId,
        payload.videoId,
        payload.transcribe ?? true,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.videos.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    },
  });
}

export function useAddChannelMutation(token: string | null) {
  return useMutation({
    mutationFn: async (payload: { channelId: string; name: string }) => {
      if (!token) throw new Error("Authentication required");
      return api.addChannel(token, payload.channelId, payload.name);
    },
  });
}
