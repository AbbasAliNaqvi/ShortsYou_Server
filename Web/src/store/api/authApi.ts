import { baseApi } from "./baseApi";
import type { User, ApiEnvelope } from "@/lib/api";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<User, void>({
      query: () => "/api/v1/auth/me",
      transformResponse: (response: ApiEnvelope<User> | User) => {
        if ("data" in response && response.data) return response.data;
        return response as User;
      },
      providesTags: ["Auth"],
    }),
  }),
  overrideExisting: false,
});

export const { useGetMeQuery } = authApi;
