"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import OpportunityCard, { OpportunityData } from "@/components/opportunity/OpportunityCard";

const LIMIT = 20;

async function fetchFeedPage({
  type, country, search, pageParam,
}: {
  type: string; country: string; search: string; pageParam: number;
}): Promise<OpportunityData[]> {
  const params = new URLSearchParams({ page: String(pageParam), limit: String(LIMIT) });
  if (type !== "all") params.set("type", type);
  if (country) params.set("country", country);
  if (search) params.set("search", search);
  const res = await api.get(`/opportunities?${params}`);
  return res.data;
}

const TYPES = [
  { value: "all",      label: "Tous",      emoji: "✨" },
  { value: "bourse",   label: "Bourses",   emoji: "🎓" },
  { value: "stage",    label: "Stages",    emoji: "💼" },
  { value: "emploi",   label: "Emplois",   emoji: "🏢" },
  { value: "echange",  label: "Échanges",  emoji: "✈️" },
  { value: "concours", label: "Concours",  emoji: "🏆" },
];

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="h-[3px] bg-gray-200" />
      <div className="p-4 space-y-3 animate-pulse">
        <div className="flex justify-between">
          <div className="h-5 bg-gray-100 rounded-full w-20" />
          <div className="h-5 bg-gray-100 rounded-full w-12" />
        </div>
        <div className="h-4 bg-gray-200 rounded w-4/5" />
        <div className="h-3 bg-gray-100 rounded w-2/5" />
        <div className="pt-2 border-t border-gray-50">
          <div className="h-2 bg-gray-100 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function ProfileNudge({ user }: { user: { level?: string|null; field?: string|null; gpa?: number|null } }) {
  const missing = [];
  if (!user.level) missing.push("niveau");
  if (!user.field) missing.push("filière");
  if (!user.gpa) missing.push("moyenne");
  if (missing.length === 0) return null;
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className="text-amber-500 text-lg shrink-0">⚡</span>
        <p className="text-xs text-amber-800 font-medium">
          Complète ton profil ({missing.join(", ")}) pour un feed 100% personnalisé
        </p>
      </div>
      <a href="/dashboard/profile"
        className="shrink-0 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl transition">
        Compléter →
      </a>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthLoading, filters, setFilter } = useStore();
  const [searchInput, setSearchInput] = useState(filters.search);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthLoading && !user) router.push("/login");
  }, [isAuthLoading, user, router]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setFilter("search", searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput, setFilter]);

  const {
    data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["feed", filters.type, filters.country, filters.search],
    queryFn: ({ pageParam }) => fetchFeedPage({
      type: filters.type,
      country: filters.country,
      search: filters.search,
      pageParam: pageParam as number,
    }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === LIMIT ? allPages.length + 1 : undefined,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Infinite scroll — IntersectionObserver sur le sentinel
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!user) return null;

  const allOpps = data?.pages.flat() ?? [];
  const totalCount = allOpps.length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  const firstName = user.full_name.split(" ")[0];

  return (
    <div className="px-4 lg:px-6 py-5 max-w-5xl">

      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">
          {greeting},{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">
            {firstName}
          </span>{" "}
          👋
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          {isLoading
            ? "Calcul de ton feed personnalisé..."
            : `${totalCount} opportunité${totalCount > 1 ? "s" : ""} correspondent à ton profil`}
        </p>
      </div>

      {/* Nudge profil */}
      <ProfileNudge user={user} />

      {/* Search + filtres */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          {TYPES.map((t) => (
            <button key={t.value} onClick={() => setFilter("type", t.value)}
              className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all ${
                filters.type === t.value
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-emerald-300"
              }`}>
              <span>{t.emoji}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed — grille 2 colonnes sur desktop */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {isError && (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="font-semibold text-gray-700 mb-1">Impossible de charger le feed</p>
          <p className="text-sm text-gray-400">Vérifie ta connexion.</p>
        </div>
      )}

      {!isLoading && allOpps.length === 0 && (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-semibold text-gray-700 mb-1">Aucun résultat</p>
          <p className="text-sm text-gray-400 mb-4">Élargis tes filtres ou ta recherche.</p>
          <button onClick={() => { setFilter("type", "all"); setSearchInput(""); }}
            className="text-sm font-bold text-emerald-600 border border-emerald-200 px-5 py-2.5 rounded-xl hover:bg-emerald-50">
            Réinitialiser
          </button>
        </div>
      )}

      {allOpps.length > 0 && (
        <>
          {/* Grille 2 colonnes desktop, 1 colonne mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allOpps.map((opp, i) => (
              <div key={opp.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(i % 10, 9) * 40}ms` }}>
                <OpportunityCard opportunity={opp} />
              </div>
            ))}
          </div>

          {/* Sentinel + loader infinite scroll */}
          <div ref={sentinelRef} className="py-6 flex justify-center">
            {isFetchingNextPage && (
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <div className="animate-spin h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full" />
                Chargement de la suite...
              </div>
            )}
            {!hasNextPage && allOpps.length > 0 && (
              <p className="text-xs text-gray-300 font-medium">
                Tu as tout vu ! {allOpps.length} opportunités.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
