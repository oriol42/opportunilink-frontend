"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import Link from "next/link";
import SaveButton from "@/components/opportunity/SaveButton";
import CoachingCard from "@/components/dashboard/CoachingCard";

const LIMIT = 20;

interface Opp {
  id: string; title: string; type: string;
  description?: string | null; deadline: string | null;
  country: string | null; reliability_score: number;
  relevance_score: number; is_verified?: boolean;
}

const TYPE_CFG: Record<string, { label: string; color: string; dot: string; bar: string }> = {
  bourse:   { label: "Bourse",   color: "#7c3aed", dot: "#7c3aed", bar: "#7c3aed" },
  stage:    { label: "Stage",    color: "#2563eb", dot: "#2563eb", bar: "#2563eb" },
  emploi:   { label: "Emploi",   color: "#059669", dot: "#059669", bar: "#059669" },
  echange:  { label: "Échange",  color: "#d97706", dot: "#d97706", bar: "#d97706" },
  concours: { label: "Concours", color: "#dc2626", dot: "#dc2626", bar: "#dc2626" },
};

const TYPES = [
  { value:"all", label:"Tous", emoji:"✨" },
  { value:"bourse", label:"Bourses", emoji:"🎓" },
  { value:"stage", label:"Stages", emoji:"💼" },
  { value:"emploi", label:"Emplois", emoji:"🏢" },
  { value:"echange", label:"Échanges", emoji:"✈️" },
  { value:"concours", label:"Concours", emoji:"🏆" },
];

function days(deadline: string | null): number | null {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
}

function DeadlineChip({ deadline }: { deadline: string | null }) {
  const d = days(deadline);
  if (d === null) return null;
  if (d < 0)  return <span style={{ fontSize: 10, color: "#9ca3af" }}>Expirée</span>;
  if (d === 0) return <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "#dc2626", padding: "1px 7px", borderRadius: 20 }}>Auj.!</span>;
  if (d <= 3)  return <span style={{ fontSize: 10, fontWeight: 700, color: "#991b1b", background: "#fee2e2", padding: "1px 7px", borderRadius: 20 }}>🔥 J-{d}</span>;
  if (d <= 7)  return <span style={{ fontSize: 10, fontWeight: 700, color: "#92400e", background: "#fef3c7", padding: "1px 7px", borderRadius: 20 }}>⚡ J-{d}</span>;
  return <span style={{ fontSize: 10, color: "#9ca3af", background: "#f3f4f6", padding: "1px 7px", borderRadius: 20 }}>J-{d}</span>;
}

function OppRow({ opp, style }: { opp: Opp; style?: React.CSSProperties }) {
  const cfg   = TYPE_CFG[opp.type] ?? { label: opp.type, color: "#6b7280", dot: "#6b7280", bar: "#6b7280" };
  const score = Math.round(opp.relevance_score ?? 0);
  const scoreColor = score >= 75 ? "#059669" : score >= 50 ? "#d97706" : "#dc2626";

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 12,
      padding: "11px 16px", borderBottom: "0.5px solid #f3f4f6",
      background: "#fff", cursor: "pointer", transition: "background .1s",
      ...style,
    }}
    className="hover:bg-gray-50 group">

      {/* Indicateur coloré type */}
      <div style={{ width: 3, borderRadius: 2, background: cfg.dot, alignSelf: "stretch", minHeight: 40, shrink: 0, flexShrink: 0, marginTop: 2 }} />

      {/* Contenu principal */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
          <Link href={`/opportunity/${opp.id}`} style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: "#111827", lineHeight: 1.35, marginBottom: 2 }}
              className="group-hover:text-emerald-700 transition-colors">
              {opp.title}
            </p>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <DeadlineChip deadline={opp.deadline} />
            <SaveButton oppId={opp.id} compact />
          </div>
        </div>

        {/* Description — 1 ligne */}
        {opp.description && (
          <p style={{ fontSize: 11.5, color: "#6b7280", lineHeight: 1.4, marginBottom: 6,
            overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
            {opp.description}
          </p>
        )}

        {/* Meta row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color,
            background: cfg.color + "15", padding: "2px 8px", borderRadius: 20 }}>
            {cfg.label}
          </span>
          {opp.country && <span style={{ fontSize: 10, color: "#9ca3af" }}>🌍 {opp.country}</span>}
          {opp.is_verified && <span style={{ fontSize: 10, color: "#059669", fontWeight: 600 }}>✓ Vérifié</span>}

          {/* Score inline */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 60, height: 3, background: "#f3f4f6", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${score}%`, background: scoreColor, borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, color: scoreColor, width: 28, textAlign: "right" }}>{score}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div style={{ display: "flex", gap: 12, padding: "12px 16px", borderBottom: "0.5px solid #f3f4f6", background: "#fff" }}>
      <div style={{ width: 3, background: "#f3f4f6", borderRadius: 2, alignSelf: "stretch" }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 13, background: "#f3f4f6", borderRadius: 4, width: "65%", marginBottom: 8 }} />
        <div style={{ height: 11, background: "#f9fafb", borderRadius: 4, width: "40%", marginBottom: 8 }} />
        <div style={{ height: 10, background: "#f9fafb", borderRadius: 4, width: "30%" }} />
      </div>
    </div>
  );
}

interface Stats { applications: { total: number }; saved_count: number; documents_count: number }

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthLoading, filters, setFilter } = useStore();
  const [searchInput, setSearchInput] = useState(filters.search);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!isAuthLoading && !user) router.push("/login"); }, [isAuthLoading, user, router]);
  useEffect(() => { const t = setTimeout(() => setFilter("search", searchInput), 400); return () => clearTimeout(t); }, [searchInput, setFilter]);

  const { data: stats } = useQuery<Stats>({
    queryKey: ["my-stats"], queryFn: async () => (await api.get("/users/me/stats")).data,
    enabled: !!user, staleTime: 2 * 60 * 1000,
  });

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["feed", filters.type, filters.country, filters.search],
    queryFn: async ({ pageParam }) => {
      const p = new URLSearchParams({ page: String(pageParam), limit: String(LIMIT) });
      if (filters.type !== "all") p.set("type", filters.type);
      if (filters.country) p.set("country", filters.country);
      if (filters.search)  p.set("search", filters.search);
      return (await api.get(`/opportunities?${p}`)).data as Opp[];
    },
    initialPageParam: 1,
    getNextPageParam: (last, all) => last.length === LIMIT ? all.length + 1 : undefined,
    enabled: !!user, staleTime: 5 * 60 * 1000,
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
  const hour    = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  const urgentCount = allOpps.filter(o => { const d = days(o.deadline); return d !== null && d >= 0 && d <= 7; }).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minWidth: 0 }}>

      {/* Header fixe */}
      <div style={{ background: "#fff", borderBottom: "0.5px solid #f3f4f6", padding: "12px 16px", flexShrink: 0 }}>
        <div style={{ marginBottom: 10 }}>
          <h2 style={{ fontWeight: 900, fontSize: 18, color: "#111827" }}>
            {greeting}, <span style={{ color: "#059669" }}>{user.full_name.split(" ")[0]}</span> 👋
          </h2>
          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
            {isLoading ? "Calcul du feed..." : `${allOpps.length} opportunités · ${urgentCount} deadline${urgentCount > 1 ? "s" : ""} urgente${urgentCount > 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Stats pills */}
        {stats && (
          <div style={{ display: "flex", gap: 6, marginBottom: 10, overflowX: "auto" }}>
            {[
              { dot: "#059669", val: stats.applications.total, label: "Candidatures" },
              { dot: "#7c3aed", val: stats.saved_count,        label: "Favoris" },
              { dot: "#2563eb", val: stats.documents_count,    label: "Documents" },
              { dot: "#dc2626", val: urgentCount,              label: "Urgentes" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6, background: "#f9fafb",
                border: "0.5px solid #f3f4f6", borderRadius: 8, padding: "5px 10px", flexShrink: 0 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
                <span style={{ fontWeight: 800, fontSize: 13, color: "#111827" }}>{s.val}</span>
                <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Search + filtres */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#9ca3af" }}>🔍</span>
            <input type="text" placeholder="Rechercher..."
              value={searchInput} onChange={e => setSearchInput(e.target.value)}
              style={{ width: "100%", border: "0.5px solid #e5e7eb", borderRadius: 8, paddingLeft: 28, paddingRight: 10, paddingTop: 7, paddingBottom: 7, fontSize: 12, outline: "none", background: "#f9fafb" }} />
          </div>
          <div style={{ display: "flex", gap: 4, overflowX: "auto", flexShrink: 0 }}>
            {TYPES.map(t => (
              <button key={t.value} onClick={() => setFilter("type", t.value)}
                style={{
                  flexShrink: 0, display: "flex", alignItems: "center", gap: 4,
                  fontSize: 11, fontWeight: 600, padding: "6px 10px", borderRadius: 8,
                  border: "none", cursor: "pointer", transition: "all .1s",
                  background: filters.type === t.value ? "#059669" : "#f3f4f6",
                  color: filters.type === t.value ? "#fff" : "#6b7280",
                }}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feed scrollable */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

        {/* Coaching card */}
        <div style={{ padding: "12px 16px 0" }}>
          <CoachingCard />
        </div>

        {/* Liste opportunités */}
        {isLoading && Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}

        {isError && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>⚠️</p>
            <p style={{ color: "#6b7280" }}>Impossible de charger le feed</p>
          </div>
        )}

        {!isLoading && allOpps.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>🔍</p>
            <p style={{ fontWeight: 700, color: "#374151", marginBottom: 12 }}>Aucun résultat</p>
            <button onClick={() => { setFilter("type", "all"); setSearchInput(""); }}
              style={{ fontSize: 12, fontWeight: 700, color: "#059669", border: "1px solid #bbf7d0", background: "#f0fdf4", padding: "8px 16px", borderRadius: 10, cursor: "pointer" }}>
              Réinitialiser
            </button>
          </div>
        )}

        {allOpps.map((opp, i) => (
          <OppRow key={opp.id} opp={opp} style={{ animationDelay: `${Math.min(i % 10, 9) * 25}ms` }} />
        ))}

        {/* Sentinel infinite scroll */}
        <div ref={sentinelRef} style={{ padding: "20px 0", textAlign: "center" }}>
          {isFetchingNextPage && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, color: "#9ca3af" }}>
              <div className="animate-spin" style={{ width: 14, height: 14, border: "2px solid #10b981", borderTopColor: "transparent", borderRadius: "50%" }} />
              Chargement...
            </div>
          )}
          {!hasNextPage && allOpps.length > 0 && (
            <p style={{ fontSize: 11, color: "#d1d5db" }}>{allOpps.length} opportunités affichées</p>
          )}
        </div>
      </div>
    </div>
  );
}
