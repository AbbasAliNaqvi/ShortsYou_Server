import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type SwipeDeckItem, type SwipeStats, type EditSettings } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export function useTanStackSwipeDeck(token: string | null) {
  return useQuery({
    queryKey: queryKeys.swipe.deck(),
    queryFn: async (): Promise<SwipeDeckItem[]> => {
      if (!token) return [];
      return api.swipe.deck(token);
    },
    enabled: Boolean(token),
    staleTime: 60 * 1000,
  });
}

export function useTanStackSwipeStats(token: string | null) {
  return useQuery({
    queryKey: queryKeys.swipe.stats(),
    queryFn: async (): Promise<SwipeStats> => {
      if (!token) {
        return {
          totalSwiped: 0,
          acceptedCount: 0,
          rejectedCount: 0,
          renderingJobs: 0,
          readyCount: 0,
        };
      }
      return api.swipe.stats(token);
    },
    enabled: Boolean(token),
    refetchInterval: (query) => {
      const data = query.state.data;
      return (data?.renderingJobs ?? 0) > 0 ? 10 * 1000 : false;
    },
  });
}

export function useTanStackSwipeAction(token: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      clipId: string;
      videoId: string;
      action: "accept" | "reject" | "super";
      startTime?: number;
      endTime?: number;
      hookText?: string;
      editSettings?: EditSettings;
    }) => {
      if (!token) throw new Error("Authentication required");
      return api.swipe.action(token, payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.swipe.stats() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.clips.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    },
  });
}

export function useTanStackSwipeUndo(token: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clipId: string) => {
      if (!token) throw new Error("Authentication required");
      return api.swipe.undo(token, clipId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.swipe.deck() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.swipe.stats() });
    },
  });
}
