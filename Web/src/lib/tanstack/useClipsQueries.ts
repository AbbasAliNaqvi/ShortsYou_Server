import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Clip, type DailyReel, type EditSettings } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export function useClips(token: string | null) {
  return useQuery<Clip[]>({
    queryKey: queryKeys.clips.list(),
    queryFn: async () => {
      if (!token) return [];
      return api.clips(token);
    },
    enabled: Boolean(token),
    staleTime: 30 * 1000,
  });
}

export function useDailyReels(token: string | null) {
  return useQuery<DailyReel[]>({
    queryKey: queryKeys.clips.dailyReels(),
    queryFn: async () => {
      if (!token) return [];
      return api.dailyReels(token);
    },
    enabled: Boolean(token),
    staleTime: 60 * 1000,
  });
}

export function usePendingClips(token: string | null) {
  return useQuery({
    queryKey: queryKeys.clips.pending(),
    queryFn: async () => {
      if (!token) return { clips: [], count: 0 };
      return api.pendingClips(token);
    },
    enabled: Boolean(token),
    staleTime: 30 * 1000,
  });
}

export function useApprovedClips(token: string | null) {
  return useQuery({
    queryKey: queryKeys.clips.approved(),
    queryFn: async () => {
      if (!token) return { clips: [], count: 0 };
      return api.approvedClips(token);
    },
    enabled: Boolean(token),
    staleTime: 30 * 1000,
  });
}

export function useApproveClipMutation(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (clipId: string) => {
      if (!token) throw new Error("Authentication required");
      return api.approveClip(token, clipId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.clips.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.swipe.stats() });
    },
  });
}

export function useRejectClipMutation(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (clipId: string) => {
      if (!token) throw new Error("Authentication required");
      return api.rejectClip(token, clipId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.clips.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.swipe.stats() });
    },
  });
}

export function useExportClipMutation(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (clipId: string) => {
      if (!token) throw new Error("Authentication required");
      return api.exportClip(token, clipId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.clips.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.swipe.stats() });
    },
  });
}

export function usePublishClipMutation(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (clipId: string) => {
      if (!token) throw new Error("Authentication required");
      return api.publishClip(token, clipId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.clips.all });
    },
  });
}

export function useDeleteClipMutation(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (clipId: string) => {
      if (!token) throw new Error("Authentication required");
      return api.deleteClip(token, clipId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.clips.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.swipe.deck() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.swipe.stats() });
    },
  });
}

export function useUpdateClipMutation(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      clipId: string;
      update: Partial<Pick<Clip, "selectedHook" | "status">> & {
        editSettings?: EditSettings;
      };
    }) => {
      if (!token) throw new Error("Authentication required");
      return api.updateClip(token, payload.clipId, payload.update);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.clips.all });
    },
  });
}
