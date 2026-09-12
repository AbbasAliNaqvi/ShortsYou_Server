const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5050";

export type ApiRequestOptions = RequestInit & { token?: string };

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    throw new Error(`API request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  me: (token: string) => apiRequest<unknown>("/api/v1/auth/me", { token }),
  videos: (token: string) => apiRequest<unknown>("/api/v1/videos", { token }),
  clips: (token: string) => apiRequest<unknown>("/api/v1/clips", { token }),
  analytics: {
    dna: (token: string) => apiRequest<unknown>("/api/v1/analytics/dna", { token }),
    trends: (token: string) => apiRequest<unknown>("/api/v1/analytics/trend-forecast", { token }),
  },
};