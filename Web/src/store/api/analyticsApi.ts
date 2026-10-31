import { baseApi } from "./baseApi";
import type {
  CreatorDNA,
  PerformanceAnalytics,
  ContentGapsResponse,
  AudiencePersonasResponse,
  TrendForecastResponse,
  ModelAccuracy,
  ABTestsResponse,
  ApiEnvelope,
} from "@/lib/api";

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCreatorDNA: builder.query<CreatorDNA, void>({
      query: () => "/api/v1/analytics/dna",
      transformResponse: (response: ApiEnvelope<CreatorDNA> | CreatorDNA) => {
        if ("data" in response && response.data) return response.data;
        return response as CreatorDNA;
      },
      providesTags: ["Analytics"],
    }),

    generateDNA: builder.mutation<CreatorDNA, boolean | void>({
      query: (sync) => ({
        url: `/api/v1/analytics/dna/generate${sync ? "/sync" : ""}`,
        method: "POST",
      }),
      transformResponse: (response: ApiEnvelope<CreatorDNA> | CreatorDNA) => {
        if ("data" in response && response.data) return response.data;
        return response as CreatorDNA;
      },
      invalidatesTags: ["Analytics"],
    }),

    getPerformance: builder.query<PerformanceAnalytics, void>({
      query: () => "/api/v1/analytics/performance",
      transformResponse: (response: ApiEnvelope<PerformanceAnalytics> | PerformanceAnalytics) => {
        if ("data" in response && response.data) return response.data;
        return response as PerformanceAnalytics;
      },
      providesTags: ["Analytics"],
    }),

    getContentGaps: builder.query<ContentGapsResponse, void>({
      query: () => "/api/v1/analytics/content-gaps",
      transformResponse: (response: ApiEnvelope<ContentGapsResponse> | ContentGapsResponse) => {
        if ("data" in response && response.data) return response.data;
        return response as ContentGapsResponse;
      },
      providesTags: ["Analytics"],
    }),

    getAudiencePersonas: builder.query<AudiencePersonasResponse, void>({
      query: () => "/api/v1/analytics/personas",
      transformResponse: (response: ApiEnvelope<AudiencePersonasResponse> | AudiencePersonasResponse) => {
        if ("data" in response && response.data) return response.data;
        return response as AudiencePersonasResponse;
      },
      providesTags: ["Analytics"],
    }),

    getTrendForecast: builder.query<TrendForecastResponse, void>({
      query: () => "/api/v1/analytics/trend-forecast",
      transformResponse: (response: ApiEnvelope<TrendForecastResponse> | TrendForecastResponse) => {
        if ("data" in response && response.data) return response.data;
        return response as TrendForecastResponse;
      },
      providesTags: ["Analytics"],
    }),

    getModelAccuracy: builder.query<ModelAccuracy, void>({
      query: () => "/api/v1/analytics/model-accuracy",
      transformResponse: (response: ApiEnvelope<ModelAccuracy> | ModelAccuracy) => {
        if ("data" in response && response.data) return response.data;
        return response as ModelAccuracy;
      },
      providesTags: ["Analytics"],
    }),

    getABTests: builder.query<ABTestsResponse, void>({
      query: () => "/api/v1/analytics/ab-tests",
      transformResponse: (response: ApiEnvelope<ABTestsResponse> | ABTestsResponse) => {
        if ("data" in response && response.data) return response.data;
        return response as ABTestsResponse;
      },
      providesTags: ["Analytics"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCreatorDNAQuery,
  useGenerateDNAMutation,
  useGetPerformanceQuery,
  useGetContentGapsQuery,
  useGetAudiencePersonasQuery,
  useGetTrendForecastQuery,
  useGetModelAccuracyQuery,
  useGetABTestsQuery,
} = analyticsApi;
