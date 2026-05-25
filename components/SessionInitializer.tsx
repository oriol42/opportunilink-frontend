"use client";
import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import { fetchCurrentUser, isTokenExpired, removeToken } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { startKeepAlive } from "@/lib/keepAlive";

export function SessionInitializer() {
  const { setUser, setAuthLoading } = useStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Démarre le keep-alive dès le premier chargement
    startKeepAlive();

    async function initSession() {
      if (isTokenExpired()) {
        removeToken();
        setAuthLoading(false);
        return;
      }
      try {
        const user = await fetchCurrentUser();
        setUser(user);

        // Précharge en parallèle
        Promise.all([
          queryClient.prefetchQuery({
            queryKey: ["feed-tab", ""],
            queryFn: async () => (await api.get("/opportunities?page=1&limit=40")).data,
            staleTime: 10 * 60 * 1000,
          }),
          queryClient.prefetchQuery({
            queryKey: ["my-stats"],
            queryFn: async () => (await api.get("/users/me/stats")).data,
            staleTime: 10 * 60 * 1000,
          }),
          queryClient.prefetchQuery({
            queryKey: ["coaching"],
            queryFn: async () => (await api.get("/users/me/coaching")).data,
            staleTime: 3 * 60 * 1000,
          }),
        ]);
      } catch {
        removeToken();
      } finally {
        setAuthLoading(false);
      }
    }
    initSession();
  }, []);

  return null;
}
