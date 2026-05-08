"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import { logout } from "@/lib/auth";
import OpportunityCard, {
  OpportunityData,
} from "@/components/opportunity/OpportunityCard";

async function fetchFeed(
  type: string,
  country: string,
  search: string
): Promise<OpportunityData[]> {
  const params = new URLSearchParams({ page: "1", limit: "20" });
  if (type !== "all") params.set("type", type);
  if (country) params.set("country", country);
  if (search) params.set("search", search);
  const res = await api.get(`/opportunities?${params}`);
  return res.data;
}

const OPPORTUNITY_TYPES = [
  { value: "all", label: "Tous" },
  { value: "bourse", label: "Bourses" },
  { value: "stage", label: "Stages" },
  { value: "emploi", label: "Emplois" },
  { value: "echange", label: "Échanges" },
  { value: "concours", label: "Concours" },
];

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="h-4 bg-gray-200 rounded-full w-16" />
        <div className="h-4 bg-gray-200 rounded-full w-10" />
      </div>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
      <div className="h-2 bg-gray-100 rounded w-full" />
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthLoading, filters, setFilter } = useStore();
  const [searchInput, setSearchInput] = useState(filters.search);

  useEffect(() => {
    if (!isAuthLoading && !user) router.push("/login");
  }, [isAuthLoading, user, router]);

  // Debounce search — attend 400ms après la dernière frappe
  useEffect(() => {
    const timer = setTimeout(() => setFilter("search", searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isError } = useQuery<OpportunityData[]>({
    queryKey: ["feed", filters.type, filters.country, filters.search],
    queryFn: () => fetchFeed(filters.type, filters.country, filters.search),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar avec onglets */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-emerald-600">OpportuLink</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard/profile")}
              className="text-sm text-gray-500 hover:text-emerald-600 transition"
            >
              Mon profil
            </button>
            <button
              onClick={logout}
              className="text-sm text-gray-400 hover:text-red-500 transition"
            >
              Déconnexion
            </button>
          </div>
        </div>
        {/* Navigation tabs — même pattern que applications/documents */}
        <div className="max-w-2xl mx-auto flex gap-1 mt-3">
          <button className="text-sm font-semibold px-4 py-1.5 rounded-full bg-emerald-600 text-white">
            Feed
          </button>
          <button
            onClick={() => router.push("/dashboard/applications")}
            className="text-sm font-medium px-4 py-1.5 rounded-full text-gray-500 hover:bg-gray-100 transition"
          >
            Candidatures
          </button>
          <button
            onClick={() => router.push("/dashboard/documents")}
            className="text-sm font-medium px-4 py-1.5 rounded-full text-gray-500 hover:bg-gray-100 transition"
          >
            Documents
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Welcome */}
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-gray-800">
            Bonjour, {user.full_name.split(" ")[0]} 👋
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {data ? `${data.length} opportunités disponibles` : "Chargement..."}
          </p>
        </div>

        {/* Search */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Rechercher une opportunité..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>

        {/* Type filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {OPPORTUNITY_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilter("type", t.value)}
              className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                filters.type === t.value
                  ? "bg-emerald-500 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-emerald-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Feed states */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {isError && (
          <div className="text-center py-16">
            <p className="text-3xl mb-3">⚠️</p>
            <p className="text-gray-500 text-sm">Impossible de charger le feed.</p>
            <p className="text-gray-400 text-xs mt-1">
              Vérifie que le backend tourne sur le port 8000.
            </p>
          </div>
        )}

        {data && data.length === 0 && (
          <div className="text-center py-16">
            <p className="text-3xl mb-3">🔍</p>
            <p className="text-gray-500 text-sm">
              Aucune opportunité ne correspond à tes filtres.
            </p>
          </div>
        )}

        {data && data.length > 0 && (
          <div className="space-y-3">
            {data.map((opp) => (
              <OpportunityCard key={opp.id} opportunity={opp} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
