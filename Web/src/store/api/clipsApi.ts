import { baseApi } from "./baseApi";
import type { Clip, DailyReel, ClipAction, ApiEnvelope } from "@/lib/api";

export const clipsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getClips: builder.query<Clip[], void>({
      query: () => "/api/v1/clips",
      transformResponse: (response: ApiEnvelope<Clip[]> | Clip[]) => {
        if ("data" in response && Array.isArray(response.data)) {
          return response.data;
        }
        return Array.isArray(response) ? response : [];
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Clips" as const, id })),
              { type: "Clips", id: "LIST" },
            ]
          : [{ type: "Clips", id: "LIST" }],
    }),

    getDailyReels: builder.query<DailyReel[], void>({
      query: () => "/api/v1/clips/daily-reels",
      transformResponse: (response: ApiEnvelope<DailyReel[]> | DailyReel[]) => {
        if ("data" in response && Array.isArray(response.data)) {
          return response.data;
        }
        return Array.isArray(response) ? response : [];
      },
      providesTags: ["DailyReels"],
    }),

    approveClip: builder.mutation<ClipAction, string>({
      query: (clipId) => ({
        url: `/api/v1/clips/${encodeURIComponent(clipId)}/approve`,
        method: "PATCH",
      }),
      transformResponse: (response: ApiEnvelope<ClipAction> | ClipAction) => {
        if ("data" in response && response.data) return response.data;
        return response as ClipAction;
      },
      invalidatesTags: (result, error, clipId) => [
        { type: "Clips", id: clipId },
        { type: "Clips", id: "LIST" },
        "SwipeStats",
      ],
    }),

    rejectClip: builder.mutation<ClipAction, string>({
      query: (clipId) => ({
        url: `/api/v1/clips/${encodeURIComponent(clipId)}/reject`,
        method: "PATCH",
      }),
      transformResponse: (response: ApiEnvelope<ClipAction> | ClipAction) => {
        if ("data" in response && response.data) return response.data;
        return response as ClipAction;
      },
      invalidatesTags: (result, error, clipId) => [
        { type: "Clips", id: clipId },
        { type: "Clips", id: "LIST" },
        "SwipeStats",
      ],
    }),

    exportClip: builder.mutation<{ clipId: string; status: string }, string>({
      query: (clipId) => ({
        url: `/api/v1/clips/${encodeURIComponent(clipId)}/export`,
        method: "POST",
      }),
      transformResponse: (
        response: ApiEnvelope<{ clipId: string; status: string }> | { clipId: string; status: string },
      ) => {
        if ("data" in response && response.data) return response.data;
        return response as { clipId: string; status: string };
      },
      invalidatesTags: (result, error, clipId) => [
        { type: "Clips", id: clipId },
        "Jobs",
        "SwipeStats",
      ],
    }),

    publishClip: builder.mutation<{ clipId: string; status: string }, string>({
      query: (clipId) => ({
        url: `/api/v1/clips/${encodeURIComponent(clipId)}/published`,
        method: "POST",
      }),
      transformResponse: (
        response: ApiEnvelope<{ clipId: string; status: string }> | { clipId: string; status: string },
      ) => {
        if ("data" in response && response.data) return response.data;
        return response as { clipId: string; status: string };
      },
      invalidatesTags: (result, error, clipId) => [
        { type: "Clips", id: clipId },
        { type: "Clips", id: "LIST" },
      ],
    }),

    deleteClip: builder.mutation<{ clipId: string; message: string }, string>({
      query: (clipId) => ({
        url: `/api/v1/clips/${encodeURIComponent(clipId)}`,
        method: "DELETE",
      }),
      transformResponse: (
        response: ApiEnvelope<{ clipId: string; message: string }> | { clipId: string; message: string },
      ) => {
        if ("data" in response && response.data) return response.data;
        return response as { clipId: string; message: string };
      },
      invalidatesTags: [{ type: "Clips", id: "LIST" }, { type: "SwipeDeck", id: "LIST" }, "SwipeStats"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetClipsQuery,
  useGetDailyReelsQuery,
  useApproveClipMutation,
  useRejectClipMutation,
  useExportClipMutation,
  usePublishClipMutation,
  useDeleteClipMutation,
} = clipsApi;
