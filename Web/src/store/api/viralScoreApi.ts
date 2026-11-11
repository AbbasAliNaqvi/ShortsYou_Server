import { baseApi } from "./baseApi";
import type { PredictViralScoreResponse } from "@/lib/viralScoreApi";

export interface PredictViralScoreArgs {
  userId: string;
  videoId: string;
  videoMetadata: {
    title: string;
    durationSeconds: number;
    videoUrl?: string;
    transcriptText?: string;
  };
  segment: {
    startTime: number;
    endTime: number;
    hookText?: string;
    features?: Record<string, number | string>;
  };
}

export const viralScoreApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    predictViralScore: builder.mutation<PredictViralScoreResponse, PredictViralScoreArgs>({
      queryFn: async (arg) => {
        try {
          const res = await fetch("/api/viral-score/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(arg),
          });
          const json = await res.json();
          if (!json.success) {
            throw new Error(json.error ?? "Failed to calculate viral score");
          }
          return { data: json.data };
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Failed to calculate viral score";
          return { error: { status: 500, data: message } };
        }
      },
    }),
  }),
  overrideExisting: false,
});

export const { usePredictViralScoreMutation } = viralScoreApi;
