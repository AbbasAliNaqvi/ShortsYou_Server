import { useQuery } from "@tanstack/react-query";
import { api, type User } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export function useCurrentUser(token: string | null) {
  return useQuery<User | null>({
    queryKey: queryKeys.auth.me(),
    queryFn: async () => {
      if (!token) return null;
      return api.me(token);
    },
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}
