// components/dashboard/AIInsights.tsx
// Card "Insight IA" de la sidebar droite du dashboard.
// Génère des insights dynamiques, personnalisés et actionnables à partir des
// VRAIES données de l'utilisateur (son feed scoré + profil + stats) — pas de
// texte statique. Chaque insight est cliquable ; un bouton rafraîchit le feed.
"use client";
import Link from "next/link";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bot, RefreshCw, Flame, Sparkles, BookOpen, User, FolderOpen, Rocket,
  ChevronRight, LucideIcon,
} from "lucide-react";
import { OpportunityLite, daysLeft } from "@/lib/opportunityHelpers";

interface StatsLite {
  profile_pct?: number;
  document_pct?: number;
  applications?: { total?: number };
}
interface UserLite { field?: string | null; level?: string | null; languages?: string[] | null }

interface Insight {
  key: string; icon: LucideIcon; color: string;
  title: string; detail: string; href?: string; cta?: string;
}

function buildInsights(opps: OpportunityLite[], user: UserLite, stats?: StatsLite): Insight[] {
  const out: Insight[] = [];
  const scored = opps.map(o => ({ o, s: Math.round(o.relevance_score ?? 0) }));
  const byScore = [...scored].sort((a, b) => b.s - a.s);
  const top = byScore.filter(x => x.s >= 80);
  const closingSoon = scored
    .filter(x => { const d = daysLeft(x.o.deadline); return d !== null && d >= 0 && d <= 7 && x.s >= 55; })
    .sort((a, b) => (daysLeft(a.o.deadline)! - daysLeft(b.o.deadline)!));
  const field = user.field ?? "";
  const inField = field ? scored.filter(x => x.o.required_fields?.includes(field)) : [];

  // 1 — Urgent ET pertinent (priorité maximale)
  if (closingSoon.length > 0) {
    const { o, s } = closingSoon[0]; const d = daysLeft(o.deadline)!;
    out.push({
      key: "urgent", icon: Flame, color: "#ef4444",
      title: `${closingSoon.length} match${closingSoon.length > 1 ? "s" : ""} ferme${closingSoon.length > 1 ? "nt" : ""} bientôt`,
      detail: `« ${o.title} » — ${s}% de match, ${d === 0 ? "ferme aujourd'hui" : `plus que ${d} j`}.`,
      href: `/opportunity/${o.id}`, cta: "Postuler maintenant",
    });
  }
  // 2 — Meilleurs matchs
  if (top.length > 0) {
    const { o, s } = top[0];
    out.push({
      key: "top", icon: Sparkles, color: "#a78bfa",
      title: `${top.length} opportunité${top.length > 1 ? "s" : ""} à +80% de match`,
      detail: `Ton meilleur match : « ${o.title} » (${s}%).`,
      href: `/opportunity/${o.id}`, cta: "Voir mon meilleur match",
    });
  }
  // 3 — Ciblé sur la filière
  if (inField.length > 0 && field) {
    out.push({
      key: "field", icon: BookOpen, color: "#60a5fa",
      title: `${inField.length} opportunité${inField.length > 1 ? "s" : ""} en ${field}`,
      detail: "Elles ciblent précisément ta filière.",
      href: `/opportunity/${inField.sort((a, b) => b.s - a.s)[0].o.id}`, cta: "Explorer",
    });
  }
  // 4 — Profil à compléter
  if (stats && typeof stats.profile_pct === "number" && stats.profile_pct < 80) {
    out.push({
      key: "profile", icon: User, color: "#fbbf24",
      title: `Profil complété à ${stats.profile_pct}%`,
      detail: "Complète-le : des matchs plus précis se débloquent.",
      href: "/dashboard/profile", cta: "Compléter mon profil",
    });
  }
  // 5 — Dossier documents
  if (stats && typeof stats.document_pct === "number" && stats.document_pct < 100) {
    out.push({
      key: "docs", icon: FolderOpen, color: "#22d3ee",
      title: `Dossier documents à ${stats.document_pct}%`,
      detail: "Ajoute tes documents essentiels pour candidater vite.",
      href: "/dashboard/documents", cta: "Compléter mon dossier",
    });
  }
  // 6 — Aucune candidature encore
  if (stats && stats.applications?.total === 0 && byScore.length > 0) {
    const { o, s } = byScore[0];
    out.push({
      key: "noapp", icon: Rocket, color: "#34d399",
      title: "Lance ta première candidature",
      detail: `Commence par « ${o.title} » (${s}% de match).`,
      href: `/opportunity/${o.id}`, cta: "Commencer",
    });
  }
  if (out.length === 0) {
    out.push({
      key: "ok", icon: Sparkles, color: "#a78bfa",
      title: "Ton feed est à jour",
      detail: `${opps.length} opportunités analysées selon ton profil.`,
    });
  }
  return out;
}

export default function AIInsights({ opps, user, stats }:
  { opps: OpportunityLite[]; user: UserLite; stats?: StatsLite }) {
  const qc = useQueryClient();
  const [spin, setSpin] = useState(false);
  const insights = buildInsights(opps, user, stats).slice(0, 3);

  function refresh() {
    setSpin(true);
    qc.invalidateQueries({ queryKey: ["feed-all"] });
    qc.invalidateQueries({ queryKey: ["my-stats"] });
    setTimeout(() => setSpin(false), 700);
  }

  return (
    <div style={{ background: "var(--bg-hero)", borderRadius: 16, padding: "16px 17px",
      border: "1px solid rgba(139,92,246,.2)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 13 }}>
        <Bot size={16} color="#a78bfa" />
        <p style={{ fontWeight: 600, fontSize: 13, color: "#fff", flex: 1 }}>Insight IA</p>
        <button onClick={refresh} aria-label="Rafraîchir les insights" title="Rafraîchir"
          style={{ background: "rgba(167,139,250,.16)", border: "none", cursor: "pointer",
            width: 26, height: 26, borderRadius: 8, display: "flex", alignItems: "center",
            justifyContent: "center", color: "#c4b5fd" }}>
          <RefreshCw size={13} className={spin ? "spin" : undefined} />
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {insights.map(ins => {
          const body = (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: `${ins.color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ins.icon size={15} color={ins.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", lineHeight: 1.35, marginBottom: 2 }}>
                  {ins.title}
                </p>
                <p style={{ fontSize: 11.5, color: "rgba(255,255,255,.6)", lineHeight: 1.5 }}>
                  {ins.detail}
                </p>
                {ins.cta && ins.href && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, marginTop: 5,
                    fontSize: 11.5, fontWeight: 700, color: "#c4b5fd" }}>
                    {ins.cta} <ChevronRight size={12} />
                  </span>
                )}
              </div>
            </div>
          );
          return ins.href ? (
            <Link key={ins.key} href={ins.href} className="insight-row"
              style={{ textDecoration: "none", background: "rgba(255,255,255,.05)", borderRadius: 12,
                padding: "10px 11px", border: "1px solid rgba(255,255,255,.07)", display: "block" }}>
              {body}
            </Link>
          ) : (
            <div key={ins.key} style={{ background: "rgba(255,255,255,.05)", borderRadius: 12,
              padding: "10px 11px", border: "1px solid rgba(255,255,255,.07)" }}>
              {body}
            </div>
          );
        })}
      </div>
    </div>
  );
}
