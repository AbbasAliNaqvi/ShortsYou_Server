import { baseApi } from "./baseApi";
import type { Video, ApiEnvelope } from "@/lib/api";

export const videosApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getVideos: builder.query<Video[], string | void>({
      query: (sort) => `/api/v1/videos${sort ? `?sort=${encodeURIComponent(sort)}` : ""}`,
      transformResponse: (response: ApiEnvelope<Video[]> | Video[]) => {
        if ("data" in response && Array.isArray(response.data)) {
          return response.data;
        }
        return Array.isArray(response) ? response : [];
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Videos" as const, id })),
              { type: "Videos", id: "LIST" },
            ]
          : [{ type: "Videos", id: "LIST" }],
    }),

    syncVideos: builder.mutation<{ synced: number; queued: number }, void>({
      query: () => ({
        url: "/api/v1/videos/sync",
        method: "POST",
      }),
      transformResponse: (
        response: ApiEnvelope<{ synced: number; queued: number }> | { synced: number; queued: number },
      ) => {
        if ("data" in response && response.data) return response.data;
        return response as { synced: number; queued: number };
      },
      invalidatesTags: [{ type: "Videos", id: "LIST" }, "Jobs"],
    }),

    deleteVideo: builder.mutation<{ videoId: string; message: string }, string>({
      query: (videoId) => ({
        url: `/api/v1/videos/${encodeURIComponent(videoId)}`,
        method: "DELETE",
      }),
      transformResponse: (
        response: ApiEnvelope<{ videoId: string; message: string }> | { videoId: string; message: string },
      ) => {
        if ("data" in response && response.data) return response.data;
        return response as { videoId: string; message: string };
      },
      invalidatesTags: [{ type: "Videos", id: "LIST" }, { type: "Clips", id: "LIST" }],
    }),

    generateVideo: builder.mutation<{ jobId: string; videoId: string; status: string; message: string }, string>({
      query: (videoId) => ({
        url: `/api/v1/videos/${encodeURIComponent(videoId)}/generate`,
        method: "POST",
      }),
      transformResponse: (
        response:
          | ApiEnvelope<{ jobId: string; videoId: string; status: string; message: string }>
          | { jobId: string; videoId: string; status: string; message: string },
      ) => {
        if ("data" in response && response.data) return response.data;
        return response as { jobId: string; videoId: string; status: string; message: string };
      },
      invalidatesTags: ["Jobs", { type: "Clips", id: "LIST" }],
    }),

    autoCreateVideo: builder.mutation<{ jobId: string; videoId: string; status: string; message: string }, string>({
      query: (videoId) => ({
        url: `/api/v1/videos/${encodeURIComponent(videoId)}/auto-create`,
        method: "POST",
      }),
      transformResponse: (
        response:
          | ApiEnvelope<{ jobId: string; videoId: string; status: string; message: string }>
          | { jobId: string; videoId: string; status: string; message: string },
      ) => {
        if ("data" in response && response.data) return response.data;
        return response as { jobId: string; videoId: string; status: string; message: string };
      },
      invalidatesTags: ["Jobs", { type: "Clips", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetVideosQuery,
  useSyncVideosMutation,
  useDeleteVideoMutation,
  useGenerateVideoMutation,
  useAutoCreateVideoMutation,
} = videosApi;
