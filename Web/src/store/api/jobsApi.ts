import { baseApi } from "./baseApi";
import type { Job, ApiEnvelope } from "@/lib/api";

export const jobsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getJobs: builder.query<Job[], void>({
      query: () => "/api/v1/jobs",
      transformResponse: (response: ApiEnvelope<Job[]> | Job[]) => {
        if ("data" in response && Array.isArray(response.data)) {
          return response.data;
        }
        return Array.isArray(response) ? response : [];
      },
      providesTags: ["Jobs"],
    }),

    getJobById: builder.query<Job, string>({
      query: (jobId) => `/api/v1/jobs/${encodeURIComponent(jobId)}`,
      transformResponse: (response: ApiEnvelope<Job> | Job) => {
        if ("data" in response && response.data) return response.data;
        return response as Job;
      },
      providesTags: (result, error, jobId) => [{ type: "Jobs", id: jobId }],
    }),
  }),
  overrideExisting: false,
});

export const { useGetJobsQuery, useGetJobByIdQuery } = jobsApi;
