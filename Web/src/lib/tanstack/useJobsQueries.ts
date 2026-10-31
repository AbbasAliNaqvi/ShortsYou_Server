import { useQuery } from "@tanstack/react-query";
import { api, type Job } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export function useJobs(token: string | null, refetchIntervalMs = 5000) {
  return useQuery<Job[]>({
    queryKey: queryKeys.jobs.list(),
    queryFn: async () => {
      if (!token) return [];
      return api.jobs(token);
    },
    enabled: Boolean(token),
    refetchInterval: (query) => {
      // Check if any job is still in progress; if so, keep polling
      const data = query.state.data;
      const hasActive = data?.some((j) => j.status === "processing" || j.status === "pending" || j.status === "queued");
      return hasActive ? refetchIntervalMs : false;
    },
    staleTime: 5000,
  });
}

export function useJob(token: string | null, jobId: string | null) {
  return useQuery<Job | null>({
    queryKey: jobId ? queryKeys.jobs.detail(jobId) : ["jobs", "none"],
    queryFn: async () => {
      if (!token || !jobId) return null;
      return api.job(token, jobId);
    },
    enabled: Boolean(token && jobId),
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === "processing" ? 3000 : false;
    },
  });
}
