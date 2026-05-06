"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { logout } from "@/lib/auth";
import { api } from "@/lib/api";
import { OpportunityCard, Opportunity } from "@/components/opportunity/OpportunityCard";

const TYPES = [
  { value: "all",      label: "Tout" },
  { value: "bourse",   label: "Bourses" },
  { value: "stage",    label: "Stages" },
  { value: "emploi",   label: "Emplois" },
  { value: "echange",  label: "Échanges" },
  { value: "concours", label: "Concours" },
];

async function fetchFeed(params: {
  type: string;
  country: string;
  search: string;
}): Promise<Opportunity[]> {
  const query = new URLSearchParams();
  if (params.type !== "all") query.set("type", params.type);
  if (params.country) query.set("country", params.country);
  if (params.search) query.set("search", params.search);
  const res = await api.get(`/opportunities?${query.toString()}`);
  return res.data;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthLoading, filters, setFilter, resetFilters } = useStore();

  // Local state for search input — debounced before hitting the store
  const [searchInput, setSearchInput] = useState(filters.search);

  // Debounce: wait 500ms after last keystroke before updating the store
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilter("search", searchInput);
    }, 500);
    return () => clearTimeout(timer); // Cancel if user types again before 500ms
  }, [searchInput]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/login");
    }
  }, [isAuthLoading, user]);

  // React Query — refetches automatically when filters change
  const { data: opportunities, isLoading, isError } = useQuery({
    queryKey: ["feed", filters],
    queryFn: () => fetchFeed(filters),
    enabled: !!user,
  });

  if (isAuthLoading || !user) return null;

  const profileComplete = user.level && user.field && user.languages?.length > 0;
  const activeFiltersCount = [
    filters.type !== "all",
    !!filters.country,
    !!filters.search,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-emerald-600">OpportuLink</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard/profile")}
              className="text-sm text-gray-500 hover:text-emerald-600 transition"
            >
              Mon profil
            </button>
            <button
              onClick={logout}
              className="text-sm text-gray-400 hover:text-gray-600 transition"
            >
              Déconnexion
            </button>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="max-w-2xl mx-auto flex gap-1 mt-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm font-semibold px-4 py-1.5 rounded-full bg-emerald-600 text-white"
          >
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

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Greeting */}
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-gray-800">
            Bonjour, {user.full_name.split(" ")[0]} 👋
          </h2>
          <p className="text-gray-500 mt-1 text-sm">
            Voici les opportunités sélectionnées pour toi.
          </p>
        </div>

        {/* Incomplete profile warning */}
        {!profileComplete && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-center justify-between">
            <div>
              <p className="text-amber-800 font-medium text-sm">Profil incomplet</p>
              <p className="text-amber-600 text-xs mt-0.5">
                Complete ton profil pour de meilleures recommandations.
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard/profile")}
              className="text-xs bg-amber-500 text-white px-3 py-2 rounded-lg hover:bg-amber-600 transition font-medium whitespace-nowrap"
            >
              Compléter →
            </button>
          </div>
        )}

        {/* Filter bar */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-5 space-y-3">
          {/* Search input */}
          <input
            type="text"
            placeholder="Rechercher une opportunité..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-transparent"
          />

          {/* Type pills */}
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setFilter("type", t.value)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full transition ${
                  filters.type === t.value
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Country + reset */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Pays (ex: France, Allemagne...)"
              value={filters.country}
              onChange={(e) => setFilter("country", e.target.value)}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-transparent"
            />
            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  resetFilters();
                  setSearchInput("");
                }}
                className="text-xs text-gray-400 hover:text-red-500 px-3 py-2 border border-gray-200 rounded-lg transition whitespace-nowrap"
              >
                Effacer ({activeFiltersCount})
              </button>
            )}
          </div>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse"
              >
                <div className="h-4 bg-gray-100 rounded w-1/4 mb-3" />
                <div className="h-5 bg-gray-100 rounded w-3/4 mb-3" />
                <div className="h-2 bg-gray-100 rounded w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-5 text-red-600 text-sm">
            Erreur lors du chargement. Vérifie que le backend tourne.
          </div>
        )}

        {/* Empty state */}
        {!isLoading && opportunities?.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-medium">Aucune opportunité pour ces filtres.</p>
            <button
              onClick={() => { resetFilters(); setSearchInput(""); }}
              className="mt-3 text-sm text-emerald-600 hover:underline"
            >
              Effacer les filtres
            </button>
          </div>
        )}

        {/* Feed */}
        {opportunities && opportunities.length > 0 && (
          <div className="space-y-4">
            {opportunities.map((opp) => (
              <OpportunityCard key={opp.id} opp={opp} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
