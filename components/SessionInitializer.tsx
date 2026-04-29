"use client";
import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import { fetchCurrentUser, isTokenExpired, removeToken } from "@/lib/auth";

export function SessionInitializer() {
  const { setUser, setAuthLoading } = useStore();

  useEffect(() => {
    async function initSession() {
      if (isTokenExpired()) {
        removeToken();
        setAuthLoading(false);
        return;
      }
      try {
        const user = await fetchCurrentUser();
        setUser(user);
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
