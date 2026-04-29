import { create } from "zustand";
import { User } from "@/lib/auth";

interface FeedFilters {
  type: string;
  country: string;
  search: string;
}

interface AppState {
  user: User | null;
  isAuthLoading: boolean;
  setUser: (user: User | null) => void;
  setAuthLoading: (loading: boolean) => void;
  filters: FeedFilters;
  setFilter: (key: keyof FeedFilters, value: string) => void;
  resetFilters: () => void;
}

const defaultFilters: FeedFilters = {
  type: "all",
  country: "",
  search: "",
};

export const useStore = create<AppState>((set) => ({
  user: null,
  isAuthLoading: true,
  setUser: (user) => set({ user }),
  setAuthLoading: (loading) => set({ isAuthLoading: loading }),
  filters: defaultFilters,
  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),
  resetFilters: () => set({ filters: defaultFilters }),
}));
