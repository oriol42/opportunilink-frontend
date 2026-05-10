"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import OpportunityCard, { OpportunityData } from "@/components/opportunity/OpportunityCard";
import Link from "next/link";

const LIMIT = 20;

async function fetchPage({ type, country, search, pageParam }: { type: string; country: string; search: string; pageParam: number }) {
  const p = new URLSearchParams({ page: String(pageParam), limit: String(LIMIT) });
  if (type !== "all") p.set("type", type);
  if (country) p.set("country", country);
  if (search)  p.set("search", search);
  return (await api.get(`/opportunities?${p}`)).data as OpportunityData[];
}

interface Stats { applications: { total: number; accepted: number }; saved_count: number; documents_count: number }

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
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="h-[3px] bg-gray-200" />
      <div className="p-3.5 space-y-2.5 animate-pulse">
        <div className="flex gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-200 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-gray-200 rounded w-4/5" />
            <div className="h-2.5 bg-gray-100 rounded w-2/5" />
          </div>
        </div>
        <div className="flex gap-1.5">
          <div className="h-4 bg-gray-100 rounded-full w-16" />
          <div className="h-4 bg-gray-100 rounded-full w-12 ml-auto" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 bg-gray-100 rounded w-8" />
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthLoading, filters, setFilter } = useStore();
  const [searchInput, setSearchInput] = useState(filters.search);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!isAuthLoading && !user) router.push("/login"); }, [isAuthLoading, user, router]);
  useEffect(() => { const t = setTimeout(() => setFilter("search", searchInput), 400); return () => clearTimeout(t); }, [searchInput, setFilter]);

  const { data: stats } = useQuery<Stats>({
    queryKey: ["my-stats"],
    queryFn: async () => (await api.get("/users/me/stats")).data,
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["feed", filters.type, filters.country, filters.search],
    queryFn: ({ pageParam }) => fetchPage({ type: filters.type, country: filters.country, search: filters.search, pageParam: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (last, all) => last.length === LIMIT ? all.length + 1 : undefined,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [handleObserver]);

  if (isAuthLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>;
  if (!user) return null;

  const allOpps = data?.pages.flat() ?? [];
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  const firstName = user.full_name.split(" ")[0];

  // Compter deadlines urgentes dans le feed
  const urgentCount = allOpps.filter(o => {
    if (!o.deadline) return false;
    const d = Math.ceil((new Date(o.deadline).getTime() - Date.now()) / 86400000);
    return d >= 0 && d <= 7;
  }).length;

  return (
    <div className="flex flex-col h-full min-w-0">

      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-4 lg:px-5 py-3 shrink-0">
        <div className="flex items-center gap-3 mb-2.5">
          <div className="flex-1">
            <h2 className="font-black text-gray-900 text-lg leading-tight">
              {greeting}, <span className="text-emerald-600">{firstName}</span> 👋
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isLoading ? "Calcul de ton feed..." : `${allOpps.length} opportunités correspondent à ton profil`}
            </p>
          </div>
        </div>

        {/* Search + filtres */}
        <div className="flex gap-2">
          <div className="relative flex-1 min-w-0">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
            <input type="text" placeholder="Rechercher..."
              value={searchInput} onChange={e => setSearchInput(e.target.value)}
              className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {TYPES.map(t => (
              <button key={t.value} onClick={() => setFilter("type", t.value)}
                className={`shrink-0 flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-all ${
                  filters.type === t.value ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats strip */}
      {stats && (
        <div className="flex gap-2 px-4 lg:px-5 py-2.5 bg-gray-50 border-b border-gray-100 overflow-x-auto scrollbar-hide shrink-0">
          {[
            { dot: "#059669", val: stats.applications.total,   label: "Candidatures" },
            { dot: "#7c3aed", val: stats.saved_count,          label: "Favoris" },
            { dot: "#d97706", val: stats.documents_count,      label: "Documents" },
            { dot: "#dc2626", val: urgentCount,                label: "Deadlines < 7j" },
          ].map(({ dot, val, label }) => (
            <div key={label} className="flex items-center gap-2 bg-white rounded-lg border border-gray-100 px-3 py-2 shrink-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />
              <span className="font-black text-gray-900 text-sm">{val}</span>
              <span className="text-[10px] text-gray-400 font-semibold">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-5 py-4">

        {/* Nudge profil */}
        {user && (!user.level || !user.field || !user.gpa) && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-4 text-xs">
            <span className="text-amber-500 text-sm shrink-0">⚡</span>
            <p className="text-amber-800 font-medium flex-1">
              Complète ton profil pour un feed 100% personnalisé
            </p>
            <Link href="/dashboard/profile" className="shrink-0 font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition text-[11px]">
              Compléter →
            </Link>
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {isError && (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">⚠️</p>
            <p className="font-semibold text-gray-700 mb-1">Impossible de charger le feed</p>
          </div>
        )}

        {!isLoading && allOpps.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold text-gray-700 mb-4">Aucun résultat</p>
            <button onClick={() => { setFilter("type", "all"); setSearchInput(""); }}
              className="text-sm font-bold text-emerald-600 border border-emerald-200 px-5 py-2.5 rounded-xl hover:bg-emerald-50">
              Réinitialiser
            </button>
          </div>
        )}

        {allOpps.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allOpps.map((opp, i) => (
                <div key={opp.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i % 9, 8) * 35}ms` }}>
                  <OpportunityCard opportunity={opp} />
                </div>
              ))}
            </div>
            <div ref={sentinelRef} className="py-6 flex justify-center">
              {isFetchingNextPage && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="animate-spin h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full" />
                  Chargement...
                </div>
              )}
              {!hasNextPage && allOpps.length > 0 && (
                <p className="text-xs text-gray-300">Tu as tout vu — {allOpps.length} opportunités.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
