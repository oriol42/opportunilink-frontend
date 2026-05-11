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

interface Stats {
  applications: { total: number; submitted: number; accepted: number };
  saved_count: number; documents_count: number; profile_pct: number;
}

const TYPE_CFG: Record<string, { label: string; color: string; bg: string; accent: string }> = {
  bourse:   { label: "Bourse",   color: "#7c3aed", bg: "#f3e8ff", accent: "#4c1d95" },
  stage:    { label: "Stage",    color: "#2563eb", bg: "#dbeafe", accent: "#1e3a8a" },
  emploi:   { label: "Emploi",   color: "#059669", bg: "#d1fae5", accent: "#064e3b" },
  echange:  { label: "Échange",  color: "#d97706", bg: "#fef3c7", accent: "#78350f" },
  concours: { label: "Concours", color: "#dc2626", bg: "#fee2e2", accent: "#7f1d1d" },
};

const TYPES = [
  { value: "all", label: "Tous", emoji: "✨" },
  { value: "bourse", label: "Bourses", emoji: "🎓" },
  { value: "stage", label: "Stages", emoji: "💼" },
  { value: "emploi", label: "Emplois", emoji: "🏢" },
  { value: "echange", label: "Échanges", emoji: "✈️" },
  { value: "concours", label: "Concours", emoji: "🏆" },
];

function daysLeft(deadline: string | null) {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
}

// ── Hero Card — grande carte en avant ─────────────────────
function HeroCard({ opp }: { opp: Opp }) {
  const cfg   = TYPE_CFG[opp.type] ?? { label: opp.type, color: "#6b7280", bg: "#f3f4f6", accent: "#374151" };
  const d     = daysLeft(opp.deadline);
  const score = Math.round(opp.relevance_score ?? 0);
  const scoreColor = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <Link href={`/opportunity/${opp.id}`} style={{ textDecoration: "none", display: "block" }}>
      <div style={{
        background: "#fff", borderRadius: 20, border: "0.5px solid #f3f4f6",
        overflow: "hidden", cursor: "pointer", transition: "box-shadow .15s, transform .15s",
        height: "100%",
      }} className="hover:shadow-lg hover:-translate-y-0.5">
        {/* Accent bar */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${cfg.color}, ${cfg.accent})` }} />

        <div style={{ padding: "20px 20px 16px" }}>
          {/* Top row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: "3px 10px", borderRadius: 20 }}>
              {cfg.label}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {opp.is_verified && <span style={{ fontSize: 10, color: "#059669", fontWeight: 700 }}>✓ Vérifié</span>}
              {d !== null && d >= 0 && (
                <span style={{ fontSize: 11, fontWeight: 800,
                  color: d <= 7 ? "#dc2626" : "#6b7280",
                  background: d <= 7 ? "#fee2e2" : "#f3f4f6",
                  padding: "3px 10px", borderRadius: 20 }}>
                  {d <= 7 ? `🔥 J-${d}` : `J-${d}`}
                </span>
              )}
              <SaveButton oppId={opp.id} compact />
            </div>
          </div>

          {/* Titre */}
          <h3 style={{ fontWeight: 800, fontSize: 16, color: "#111827", lineHeight: 1.35, marginBottom: 8 }}>
            {opp.title}
          </h3>

          {/* Description */}
          {opp.description && (
            <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.55, marginBottom: 14,
              overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
              {opp.description}
            </p>
          )}

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>🌍 {opp.country ?? "International"}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 80, height: 4, background: "#f3f4f6", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${score}%`, background: scoreColor, borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: scoreColor }}>{score}%</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Compact Card — carousel horizontal ────────────────────
function CompactCard({ opp }: { opp: Opp }) {
  const cfg   = TYPE_CFG[opp.type] ?? { label: opp.type, color: "#6b7280", bg: "#f3f4f6", accent: "#374151" };
  const d     = daysLeft(opp.deadline);
  const score = Math.round(opp.relevance_score ?? 0);

  return (
    <Link href={`/opportunity/${opp.id}`} style={{ textDecoration: "none", display: "block", flexShrink: 0, width: 260 }}>
      <div style={{
        background: "#fff", borderRadius: 16, border: "0.5px solid #f3f4f6",
        overflow: "hidden", height: "100%", cursor: "pointer",
      }} className="hover:shadow-md hover:-translate-y-0.5 transition-all">
        <div style={{ height: 3, background: cfg.color }} />
        <div style={{ padding: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: "2px 8px", borderRadius: 20 }}>
              {cfg.label}
            </span>
            {d !== null && d >= 0 && d <= 14 && (
              <span style={{ fontSize: 10, fontWeight: 700, color: d <= 7 ? "#dc2626" : "#d97706" }}>
                {d <= 7 ? `🔥 J-${d}` : `J-${d}`}
              </span>
            )}
          </div>
          <p style={{ fontWeight: 700, fontSize: 13, color: "#111827", lineHeight: 1.35, marginBottom: 8,
            overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
            {opp.title}
          </p>
          <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10 }}>🌍 {opp.country ?? "International"}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ flex: 1, height: 3, background: "#f3f4f6", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${score}%`, background: score >= 75 ? "#10b981" : "#f59e0b", borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, color: score >= 75 ? "#059669" : "#d97706" }}>{score}%</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthLoading, filters, setFilter } = useStore();
  const [searchInput, setSearchInput] = useState(filters.search);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!isAuthLoading && !user) router.push("/login"); }, [isAuthLoading, user, router]);
  useEffect(() => { const t = setTimeout(() => setFilter("search", searchInput), 400); return () => clearTimeout(t); }, [searchInput, setFilter]);

  const { data: stats } = useQuery<Stats>({
    queryKey: ["my-stats"], queryFn: async () => (await api.get("/users/me/stats")).data,
    enabled: !!user, staleTime: 2 * 60 * 1000,
  });

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["feed", filters.type, filters.country, filters.search],
    queryFn: async ({ pageParam }) => {
      const p = new URLSearchParams({ page: String(pageParam), limit: String(LIMIT) });
      if (filters.type !== "all") p.set("type", filters.type);
      if (filters.search) p.set("search", filters.search);
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

  if (isAuthLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>;
  if (!user) return null;

  const allOpps  = data?.pages.flat() ?? [];
  const heroOpps = allOpps.slice(0, 2);   // 2 grandes cartes
  const carousel = allOpps.slice(2, 12);  // carousel horizontal
  const listOpps = allOpps.slice(12);     // liste ensuite

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  const firstName = user.full_name.split(" ")[0];
  const urgentCount = allOpps.filter(o => { const d = daysLeft(o.deadline); return d !== null && d >= 0 && d <= 7; }).length;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* ── TOPBAR ─────────────────────────────────────────── */}
      <div style={{ background: "#fff", borderBottom: "0.5px solid #f3f4f6", padding: "14px 24px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
          {/* Titre + salut */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontWeight: 900, fontSize: 20, color: "#111827", lineHeight: 1.2 }}>
              {greeting}, <span style={{ color: "#059669" }}>{firstName}</span> 👋
            </h1>
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
              {isLoading ? "Calcul du feed personnalisé..." : `${allOpps.length} opportunités · ${urgentCount} deadline${urgentCount !== 1 ? "s" : ""} urgente${urgentCount !== 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Search */}
          <div style={{ position: "relative", width: 220 }} className="hidden sm:block">
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#9ca3af" }}>🔍</span>
            <input placeholder="Rechercher..."
              value={searchInput} onChange={e => setSearchInput(e.target.value)}
              style={{ width: "100%", border: "0.5px solid #e5e7eb", borderRadius: 10, paddingLeft: 28, paddingRight: 10,
                paddingTop: 8, paddingBottom: 8, fontSize: 12, outline: "none", background: "#f9fafb" }} />
          </div>

          {/* Notif bell — décoratif */}
          <div style={{ position: "relative", cursor: "pointer" }}>
            <span style={{ fontSize: 20 }}>🔔</span>
            {urgentCount > 0 && (
              <span style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16,
                background: "#dc2626", borderRadius: "50%", fontSize: 9, fontWeight: 800,
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {urgentCount}
              </span>
            )}
          </div>

          {/* Avatar */}
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#065f46",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800, color: "#34d399", flexShrink: 0, cursor: "pointer" }}>
            {user.full_name.split(" ").map((n: string) => n[0]).slice(0,2).join("").toUpperCase()}
          </div>
        </div>

        {/* Stats mini row */}
        {stats && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12, overflowX: "auto" }}
            className="scrollbar-hide">
            {[
              { emoji: "📋", val: stats.applications.total, label: "Candidatures", color: "#2563eb" },
              { emoji: "✅", val: stats.applications.accepted, label: "Acceptées",  color: "#059669" },
              { emoji: "🔖", val: stats.saved_count,          label: "Favoris",     color: "#7c3aed" },
              { emoji: "📁", val: stats.documents_count,      label: "Documents",   color: "#d97706" },
              { emoji: "⚡", val: `${stats.profile_pct}%`,    label: "Profil",      color: "#6b7280" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6,
                background: "#f9fafb", border: "0.5px solid #f3f4f6", borderRadius: 10,
                padding: "6px 12px", flexShrink: 0, cursor: "default" }}>
                <span style={{ fontSize: 13 }}>{s.emoji}</span>
                <span style={{ fontWeight: 800, fontSize: 14, color: s.color }}>{s.val}</span>
                <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Filtres types */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto" }} className="scrollbar-hide">
          {TYPES.map(t => (
            <button key={t.value} onClick={() => setFilter("type", t.value)}
              style={{ flexShrink: 0, fontSize: 11, fontWeight: 600, padding: "6px 12px",
                borderRadius: 20, border: "none", cursor: "pointer", transition: "all .1s",
                background: filters.type === t.value ? "#059669" : "#f3f4f6",
                color: filters.type === t.value ? "#fff" : "#6b7280" }}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENU SCROLLABLE ─────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

        {/* CoachingCard */}
        <CoachingCard />

        {/* ── Section : Top recommandations ─────────────────── */}
        {!isLoading && heroOpps.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: 16, color: "#111827" }}>Top pour toi</h2>
                <p style={{ fontSize: 12, color: "#9ca3af" }}>Les meilleures correspondances avec ton profil</p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
              {heroOpps.map(opp => <HeroCard key={opp.id} opp={opp} />)}
            </div>
          </div>
        )}

        {/* ── Carousel horizontal ────────────────────────────── */}
        {!isLoading && carousel.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: 16, color: "#111827" }}>Explorer</h2>
                <p style={{ fontSize: 12, color: "#9ca3af" }}>Fais défiler → pour voir plus</p>
              </div>
            </div>
            <div ref={carouselRef}
              style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}
              className="scrollbar-hide">
              {carousel.map(opp => <CompactCard key={opp.id} opp={opp} />)}
            </div>
          </div>
        )}

        {/* ── Skeletons ──────────────────────────────────────── */}
        {isLoading && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14, marginBottom: 28 }}>
              {[1,2].map(i => (
                <div key={i} style={{ background: "#fff", borderRadius: 20, border: "0.5px solid #f3f4f6", height: 180 }}
                  className="animate-pulse" />
              ))}
            </div>
            <div style={{ display: "flex", gap: 12, overflow: "hidden", marginBottom: 28 }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ width: 260, flexShrink: 0, background: "#fff", borderRadius: 16,
                  border: "0.5px solid #f3f4f6", height: 140 }} className="animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {/* ── Suite liste ────────────────────────────────────── */}
        {listOpps.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontWeight: 800, fontSize: 16, color: "#111827", marginBottom: 14 }}>Toutes les opportunités</h2>
            <div style={{ background: "#fff", borderRadius: 16, border: "0.5px solid #f3f4f6", overflow: "hidden" }}>
              {listOpps.map((opp, i) => {
                const cfg   = TYPE_CFG[opp.type] ?? { label: opp.type, color: "#6b7280", bg: "#f3f4f6", accent: "#374151" };
                const d     = daysLeft(opp.deadline);
                const score = Math.round(opp.relevance_score ?? 0);
                return (
                  <div key={opp.id}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                      borderBottom: i < listOpps.length - 1 ? "0.5px solid #f9fafb" : "none" }}
                    className="hover:bg-gray-50 transition-colors">
                    <div style={{ width: 3, background: cfg.color, borderRadius: 2, alignSelf: "stretch", minHeight: 36, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link href={`/opportunity/${opp.id}`}
                        style={{ fontWeight: 700, fontSize: 13, color: "#111827", textDecoration: "none", display: "block", marginBottom: 4 }}
                        className="hover:text-emerald-600 transition-colors">
                        {opp.title}
                      </Link>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: "1px 7px", borderRadius: 20 }}>
                          {cfg.label}
                        </span>
                        {opp.country && <span style={{ fontSize: 10, color: "#9ca3af" }}>🌍 {opp.country}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                      {d !== null && d >= 0 && (
                        <span style={{ fontSize: 10, fontWeight: 700,
                          color: d <= 7 ? "#dc2626" : "#9ca3af",
                          background: d <= 7 ? "#fee2e2" : "#f3f4f6",
                          padding: "2px 8px", borderRadius: 20 }}>
                          J-{d}
                        </span>
                      )}
                      <span style={{ fontSize: 11, fontWeight: 800, color: score >= 75 ? "#059669" : "#d97706" }}>{score}%</span>
                      <SaveButton oppId={opp.id} compact />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sentinel */}
        <div ref={sentinelRef} style={{ padding: "12px 0", textAlign: "center" }}>
          {isFetchingNextPage && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, color: "#9ca3af" }}>
              <div className="animate-spin" style={{ width: 14, height: 14, border: "2px solid #10b981", borderTopColor: "transparent", borderRadius: "50%" }} />
              Chargement...
            </div>
          )}
          {!hasNextPage && allOpps.length > 0 && (
            <p style={{ fontSize: 11, color: "#d1d5db" }}>Toutes les opportunités affichées — {allOpps.length} au total</p>
          )}
        </div>
      </div>
    </div>
  );
}
