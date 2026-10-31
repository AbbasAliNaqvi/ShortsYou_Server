import { baseApi } from "./baseApi";
import type { SwipeDeckItem, SwipeStats, EditSettings } from "@/lib/api";

export interface SwipeActionPayload {
  clipId: string;
  videoId: string;
  action: "accept" | "reject" | "super";
  startTime?: number;
  endTime?: number;
  hookText?: string;
  editSettings?: EditSettings;
}

export interface SwipeActionResponse {
  status: string;
  clipId: string;
  message: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: string;
}

export const swipeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSwipeDeck: builder.query<SwipeDeckItem[], void>({
      query: () => "/api/v1/swipe/deck",
      transformResponse: (response: ApiEnvelope<SwipeDeckItem[]> | SwipeDeckItem[]) => {
        if ("data" in response && Array.isArray(response.data)) {
          return response.data;
        }
        return Array.isArray(response) ? response : [];
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "SwipeDeck" as const, id })),
              { type: "SwipeDeck", id: "LIST" },
            ]
          : [{ type: "SwipeDeck", id: "LIST" }],
    }),

    getSwipeStats: builder.query<SwipeStats, void>({
      query: () => "/api/v1/swipe/stats",
      transformResponse: (response: ApiEnvelope<SwipeStats> | SwipeStats) => {
        if ("data" in response && response.data) {
          return response.data;
        }
        return response as SwipeStats;
      },
      providesTags: ["SwipeStats"],
    }),

    swipeAction: builder.mutation<SwipeActionResponse, SwipeActionPayload>({
      query: (body) => ({
        url: "/api/v1/swipe/action",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<SwipeActionResponse> | SwipeActionResponse) => {
        if ("data" in response && response.data) {
          return response.data;
        }
        return response as SwipeActionResponse;
      },
      // Optimistic cache update: instant 0ms removal of card from deck
      async onQueryStarted({ clipId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          swipeApi.util.updateQueryData("getSwipeDeck", undefined, (draft) => {
            const index = draft.findIndex((item) => item.id === clipId);
            if (index !== -1) {
              draft.splice(index, 1);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ["SwipeStats"],
    }),

    swipeUndo: builder.mutation<SwipeActionResponse, { clipId: string }>({
      query: (body) => ({
        url: "/api/v1/swipe/undo",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<SwipeActionResponse> | SwipeActionResponse) => {
        if ("data" in response && response.data) {
          return response.data;
        }
        return response as SwipeActionResponse;
      },
      invalidatesTags: [{ type: "SwipeDeck", id: "LIST" }, "SwipeStats"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetSwipeDeckQuery,
  useGetSwipeStatsQuery,
  useSwipeActionMutation,
  useSwipeUndoMutation,
} = swipeApi;
