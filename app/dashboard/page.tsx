"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import Link from "next/link";
import SaveButton from "@/components/opportunity/SaveButton";
import CoachingCard from "@/components/dashboard/CoachingCard";

interface Opp {
  id: string; title: string; type: string;
  description?: string | null; deadline: string | null;
  country: string | null; reliability_score: number;
  relevance_score: number; is_verified?: boolean;
  source_url?: string;
}
interface Stats {
  applications: { total: number; submitted: number; accepted: number };
  saved_count: number; documents_count: number; profile_pct: number;
}

const TYPE: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  bourse:   { label: "Bourse",   color: "#7c3aed", bg: "#f3e8ff", dot: "#a855f7" },
  stage:    { label: "Stage",    color: "#2563eb", bg: "#dbeafe", dot: "#3b82f6" },
  emploi:   { label: "Emploi",   color: "#059669", bg: "#d1fae5", dot: "#10b981" },
  echange:  { label: "Échange",  color: "#d97706", bg: "#fef3c7", dot: "#f59e0b" },
  concours: { label: "Concours", color: "#dc2626", bg: "#fee2e2", dot: "#ef4444" },
};

const TABS = ["Recommandés", "Favoris", "Bourses", "Stages", "Emplois"];

function dl(deadline: string | null) {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
}

function detectMethodBadge(sourceUrl: string, description: string) {
  const url = (sourceUrl || "").toLowerCase();
  const desc = (description || "").toLowerCase();
  if (url.includes("forms.google") || url.includes("typeform") || url.includes("jotform") ||
      desc.includes("formulaire en ligne") || desc.includes("fill out the form"))
    return { icon: "📝", label: "Formulaire", color: "#7c3aed", bg: "#f3e8ff" };
  const emailMatch = (sourceUrl + " " + description).match(/([a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch || url.startsWith("mailto:") ||
      (desc.includes("email") && desc.includes("envoyer")) ||
      desc.includes("candidature par email"))
    return { icon: "📧", label: "Email", color: "#0369a1", bg: "#e0f2fe" };
  if (url.includes("daad.de") || url.includes("campusfrance") || url.includes("erasmus") || url.includes("auf.org"))
    return { icon: "🎓", label: "Portail", color: "#059669", bg: "#f0fdf4" };
  if (url.includes("linkedin.com"))
    return { icon: "💼", label: "LinkedIn", color: "#0a66c2", bg: "#eff6ff" };
  return { icon: "🌐", label: "Lien externe", color: "#374151", bg: "#f9fafb" };
}

function OppCard({ opp }: { opp: Opp }) {
  const cfg    = TYPE[opp.type] ?? { label: opp.type, color: "#6b7280", bg: "#f3f4f6", dot: "#9ca3af" };
  const d      = dl(opp.deadline);
  const score  = Math.round(opp.relevance_score ?? 0);
  const scoreColor = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  const method = detectMethodBadge(opp.source_url || "", opp.description || "");

  // Description — 3 lignes max, texte propre
  const excerpt = opp.description
    ? opp.description.replace(/\s+/g, " ").trim().slice(0, 160) + (opp.description.length > 160 ? "…" : "")
    : "Consulte la page détail pour plus d'informations sur cette opportunité.";

  return (
    <div style={{
      background: "#fff", borderRadius: 18,
      border: "1px solid #f1f5f9", overflow: "hidden",
      display: "flex", flexDirection: "column",
      transition: "box-shadow .2s, transform .2s",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    }} className="hover:shadow-lg hover:-translate-y-1">

      {/* Barre accent */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${cfg.color}, ${cfg.dot})`, flexShrink: 0 }} />

      <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Ligne 1 : type + deadline */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: cfg.color, background: cfg.bg,
            padding: "4px 10px", borderRadius: 20, flexShrink: 0 }}>
            {cfg.label}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* Badge méthode */}
            <span style={{ fontSize: 10, fontWeight: 700, color: method.color,
              background: method.bg, padding: "3px 8px", borderRadius: 20 }}>
              {method.icon} {method.label}
            </span>
            {d !== null && d >= 0 && (
              <span style={{ fontSize: 10, fontWeight: 800, flexShrink: 0,
                color: d <= 3 ? "#fff" : d <= 7 ? "#dc2626" : "#9ca3af",
                background: d <= 3 ? "#dc2626" : d <= 7 ? "#fee2e2" : "#f8fafc",
                padding: "3px 9px", borderRadius: 20 }}>
                {d === 0 ? "🔥 Auj." : d <= 3 ? `🔥 J-${d}` : d <= 7 ? `⚡ J-${d}` : `J-${d}`}
              </span>
            )}
          </div>
        </div>

        {/* Titre */}
        <Link href={`/opportunity/${opp.id}`} style={{ textDecoration: "none" }}>
          <p style={{ fontWeight: 800, fontSize: 14, color: "#0f172a", lineHeight: 1.45,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
            className="hover:text-emerald-600 transition-colors cursor-pointer">
            {opp.title}
          </p>
        </Link>

        {/* Description — toujours visible */}
        <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6,
          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
          flex: 1 }}>
          {excerpt}
        </p>

        {/* Pays + vérifié */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>
            🌍 {opp.country ?? "International"}
          </span>
          {opp.is_verified && (
            <span style={{ fontSize: 11, color: "#059669", fontWeight: 700,
              background: "#f0fdf4", padding: "1px 7px", borderRadius: 20 }}>
              ✓ Vérifié
            </span>
          )}
        </div>

        {/* Score + save */}
        <div style={{ display: "flex", alignItems: "center", gap: 8,
          borderTop: "1px solid #f8fafc", paddingTop: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>Pertinence</span>
              <span style={{ fontSize: 11, fontWeight: 900, color: scoreColor }}>{score}%</span>
            </div>
            <div style={{ height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${score}%`, background: scoreColor,
                borderRadius: 3, transition: "width .5s" }} />
            </div>
          </div>
          <SaveButton oppId={opp.id} compact />
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #f1f5f9", overflow: "hidden",
      minHeight: 240 }} className="animate-pulse">
      <div style={{ height: 4, background: "#f1f5f9" }} />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ height: 22, width: 70, background: "#f1f5f9", borderRadius: 20 }} />
          <div style={{ height: 22, width: 50, background: "#f1f5f9", borderRadius: 20 }} />
        </div>
        <div style={{ height: 14, background: "#f1f5f9", borderRadius: 4, width: "90%" }} />
        <div style={{ height: 14, background: "#f8fafc", borderRadius: 4, width: "70%" }} />
        <div style={{ height: 12, background: "#f8fafc", borderRadius: 4, width: "100%" }} />
        <div style={{ height: 12, background: "#f8fafc", borderRadius: 4, width: "85%" }} />
        <div style={{ height: 12, background: "#f8fafc", borderRadius: 4, width: "75%" }} />
        <div style={{ height: 5, background: "#f1f5f9", borderRadius: 3, marginTop: 8 }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthLoading } = useStore();
  const [activeTab, setActiveTab] = useState(0);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => { if (!isAuthLoading && !user) router.push("/login"); }, [isAuthLoading, user, router]);

  const { data: stats } = useQuery<Stats>({
    queryKey: ["my-stats"],
    queryFn: async () => (await api.get("/users/me/stats")).data,
    enabled: !!user, staleTime: 2 * 60 * 1000,
  });

  const tabType = ["", "", "bourse", "stage", "emploi"][activeTab];
  const { data: opps, isLoading } = useQuery<Opp[]>({
    queryKey: ["feed-tab", tabType],
    queryFn: async () => {
      const p = new URLSearchParams({ page: "1", limit: "30" });
      if (tabType) p.set("type", tabType);
      return (await api.get(`/opportunities?${p}`)).data;
    },
    enabled: !!user, staleTime: 5 * 60 * 1000,
  });

  const { data: saved } = useQuery<Opp[]>({
    queryKey: ["saved"],
    queryFn: async () => (await api.get("/opportunities/saved")).data,
    enabled: !!user && activeTab === 1, staleTime: 60000,
  });

  if (isAuthLoading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
    </div>
  );
  if (!user) return null;

  const displayOpps = activeTab === 1 ? (saved ?? []) : (opps ?? []);
  const urgentCount = displayOpps.filter(o => { const d = dl(o.deadline); return d !== null && d >= 0 && d <= 7; }).length;
  const visibleOpps = showMore ? displayOpps : displayOpps.slice(0, 9);
  const firstName = user.full_name.split(" ")[0];

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "#f8fafc" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px 40px" }}>

        {/* Hero */}
        <div style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #065f46 60%, #0f172a 100%)",
          borderRadius: "0 0 28px 28px", padding: "28px 32px 32px",
          marginBottom: 28, marginLeft: -24, marginRight: -24,
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -60, right: 60, width: 300, height: 300,
            background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)",
            pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <p style={{ fontSize: 12, color: "#6ee7b7", fontWeight: 700, marginBottom: 6 }}>
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <h1 style={{ fontWeight: 900, fontSize: 28, color: "#fff", marginBottom: 8, lineHeight: 1.2 }}>
              Bonjour, {firstName} 👋
            </h1>
            <p style={{ fontSize: 14, color: "#a7f3d0", marginBottom: 24, lineHeight: 1.5 }}>
              {isLoading
                ? "Calcul de ton feed personnalisé..."
                : `${(opps ?? []).length} opportunités correspondent à ton profil${urgentCount > 0 ? ` · 🔥 ${urgentCount} deadline${urgentCount > 1 ? "s" : ""} urgente${urgentCount > 1 ? "s" : ""}` : ""}`}
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 28 }}>
              <Link href="/dashboard" style={{ background: "#10b981", color: "#fff", fontWeight: 700,
                fontSize: 13, padding: "10px 20px", borderRadius: 12, textDecoration: "none" }}>
                Explorer les opportunités →
              </Link>
              <Link href="/dashboard/profile" style={{ background: "rgba(255,255,255,0.1)", color: "#a7f3d0",
                fontWeight: 600, fontSize: 13, padding: "10px 20px", borderRadius: 12,
                textDecoration: "none", border: "1px solid rgba(167,243,208,0.2)" }}>
                Compléter mon profil
              </Link>
            </div>
            {stats && (
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {[
                  { val: stats.applications.total, label: "Candidatures", icon: "📋" },
                  { val: stats.applications.accepted, label: "Acceptées", icon: "✅" },
                  { val: stats.saved_count, label: "Favoris", icon: "🔖" },
                  { val: `${stats.profile_pct}%`, label: "Profil", icon: "👤" },
                ].map(s => (
                  <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{s.icon}</span>
                    <div>
                      <p style={{ fontWeight: 900, fontSize: 20, color: "#fff", lineHeight: 1 }}>{s.val}</p>
                      <p style={{ fontSize: 10, color: "#6ee7b7", fontWeight: 600 }}>{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 2 colonnes */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>

          {/* Colonne gauche */}
          <div>
            <CoachingCard />

            {/* Tabs */}
            <div style={{ display: "flex", gap: 2, marginBottom: 20, background: "#fff",
              borderRadius: 14, padding: 4, border: "1px solid #f1f5f9",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              {TABS.map((tab, i) => (
                <button key={tab} onClick={() => { setActiveTab(i); setShowMore(false); }}
                  style={{ flex: 1, padding: "9px 4px", borderRadius: 10, border: "none",
                    cursor: "pointer", fontWeight: 700, fontSize: 12, transition: "all .15s",
                    background: activeTab === i ? "#0f172a" : "transparent",
                    color: activeTab === i ? "#fff" : "#64748b" }}>
                  {tab}
                </button>
              ))}
            </div>

            {/* Grid — 2 colonnes fixes pour avoir des cards assez larges */}
            {isLoading && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {!isLoading && displayOpps.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 20px", background: "#fff",
                borderRadius: 18, border: "1px solid #f1f5f9" }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>{activeTab === 1 ? "🔖" : "🔍"}</p>
                <p style={{ fontWeight: 700, fontSize: 16, color: "#0f172a", marginBottom: 8 }}>
                  {activeTab === 1 ? "Aucun favori" : "Aucune opportunité"}
                </p>
                <p style={{ fontSize: 13, color: "#94a3b8" }}>
                  {activeTab === 1 ? "Sauvegarde des opportunités depuis le feed." : "Essaie un autre onglet."}
                </p>
              </div>
            )}

            {!isLoading && displayOpps.length > 0 && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 20 }}>
                  {visibleOpps.map(opp => <OppCard key={opp.id} opp={opp} />)}
                </div>
                {!showMore && displayOpps.length > 9 && (
                  <div style={{ textAlign: "center" }}>
                    <button onClick={() => setShowMore(true)}
                      style={{ fontSize: 13, fontWeight: 700, color: "#059669",
                        background: "#f0fdf4", border: "1px solid #bbf7d0",
                        padding: "12px 28px", borderRadius: 12, cursor: "pointer" }}
                      className="hover:bg-emerald-100">
                      Voir plus ({displayOpps.length - 9} opportunités) →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Colonne droite sticky */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 20 }}>

            {/* Profil card */}
            <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #f1f5f9",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden" }}>
              <div style={{ background: "linear-gradient(135deg, #0f172a, #065f46)", padding: "20px" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#10b981",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, fontWeight: 900, color: "#fff", marginBottom: 10 }}>
                  {user.full_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <p style={{ fontWeight: 800, fontSize: 15, color: "#fff", marginBottom: 2 }}>{user.full_name}</p>
                <p style={{ fontSize: 11, color: "#6ee7b7" }}>
                  {user.level ?? "Niveau non renseigné"} · {user.field ?? "Filière non renseignée"}
                </p>
              </div>
              <div style={{ padding: "16px" }}>
                {stats && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Profil complété</span>
                      <span style={{ fontSize: 14, fontWeight: 900,
                        color: stats.profile_pct >= 80 ? "#10b981" : "#f59e0b" }}>
                        {stats.profile_pct}%
                      </span>
                    </div>
                    <div style={{ background: "#f1f5f9", height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 16 }}>
                      <div style={{ height: "100%", borderRadius: 3, transition: "width .7s",
                        width: `${stats.profile_pct}%`,
                        background: stats.profile_pct >= 80 ? "#10b981" : "#f59e0b" }} />
                    </div>
                  </>
                )}
                <Link href="/dashboard/profile" style={{ display: "block", textAlign: "center",
                  fontSize: 12, fontWeight: 700, color: "#059669", background: "#f0fdf4",
                  border: "1px solid #bbf7d0", padding: "8px", borderRadius: 10, textDecoration: "none" }}>
                  Améliorer mon profil →
                </Link>
              </div>
            </div>

            {/* Deadlines urgentes */}
            {opps && opps.filter(o => { const d = dl(o.deadline); return d !== null && d >= 0 && d <= 14; }).length > 0 && (
              <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #f1f5f9",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden" }}>
                <div style={{ padding: "14px 16px", borderBottom: "1px solid #f8fafc" }}>
                  <p style={{ fontWeight: 800, fontSize: 13, color: "#0f172a" }}>⏰ Deadlines proches</p>
                </div>
                <div style={{ padding: "8px 0" }}>
                  {opps
                    .filter(o => { const d = dl(o.deadline); return d !== null && d >= 0 && d <= 14; })
                    .slice(0, 5)
                    .map(opp => {
                      const d = dl(opp.deadline)!;
                      return (
                        <Link key={opp.id} href={`/opportunity/${opp.id}`}
                          style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
                            textDecoration: "none" }} className="hover:bg-gray-50">
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", lineHeight: 1.3,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {opp.title}
                            </p>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 800, flexShrink: 0,
                            color: d <= 7 ? "#dc2626" : "#d97706",
                            background: d <= 7 ? "#fee2e2" : "#fef3c7",
                            padding: "2px 7px", borderRadius: 20 }}>
                            J-{d}
                          </span>
                        </Link>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Quick links */}
            <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #f1f5f9",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)", padding: "16px" }}>
              <p style={{ fontWeight: 800, fontSize: 13, color: "#0f172a", marginBottom: 12 }}>Accès rapide</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {[
                  { href: "/dashboard/applications", icon: "📋", label: "Mes candidatures", count: stats?.applications.total },
                  { href: "/dashboard/saved",        icon: "🔖", label: "Mes favoris",       count: stats?.saved_count },
                  { href: "/dashboard/documents",    icon: "📁", label: "Mes documents",     count: stats?.documents_count },
                  { href: "/dashboard/coach",        icon: "🤖", label: "Coach IA",          count: null },
                ].map(item => (
                  <Link key={item.href} href={item.href}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px",
                      borderRadius: 10, textDecoration: "none" }} className="hover:bg-gray-50">
                    <span style={{ fontSize: 16 }}>{item.icon}</span>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#374151" }}>{item.label}</span>
                    {item.count !== null && item.count !== undefined && (
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#9ca3af",
                        background: "#f1f5f9", padding: "1px 7px", borderRadius: 20 }}>
                        {item.count}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
