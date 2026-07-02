// components/dashboard/CoachingCard.tsx
"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";
import Card from "@/components/ui/Card";
import { Flame, Zap, Files, Target, Send, Sparkles, Clock, ArrowRight } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface Coaching {
  action: string;
  action_type: string;
  action_url: string;
  action_cta: string;
  urgent_deadlines: { title: string; days: number; id: string }[];
  insights: {
    profile_pct: number; docs_pct: number;
    applied: number; submitted: number; accepted: number;
    saved: number; missing_docs: string[];
  };
}

const TYPE_STYLE: Record<string, { variant: "danger" | "warning" | "success" | "neutral"; icon: LucideIcon }> = {
  urgent:   { variant: "danger",  icon: Flame },
  profile:  { variant: "warning", icon: Zap },
  document: { variant: "neutral", icon: Files },
  apply:    { variant: "success", icon: Target },
  submit:   { variant: "neutral", icon: Send },
  explore:  { variant: "neutral", icon: Sparkles },
};

function ProgressRing({ pct, color, size = 44 }: { pct: number; color: string; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={5} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 700, color: "var(--text-primary)" }}>{pct}%</span>
    </div>
  );
}

export default function CoachingCard() {
  const { data, isLoading } = useQuery<Coaching>({
    queryKey: ["coaching"],
    queryFn: async () => (await api.get("/users/me/coaching")).data,
    staleTime: 3 * 60 * 1000,
  });

  if (isLoading) return (
    <Card style={{ height: 84 }}>
      <div style={{ height: 14, width: "30%", background: "var(--bg-surface-2)", borderRadius: 6, marginBottom: 10 }} />
      <div style={{ height: 10, width: "70%", background: "var(--bg-surface-2)", borderRadius: 6 }} />
    </Card>
  );

  if (!data) return null;

  const style = TYPE_STYLE[data.action_type] ?? TYPE_STYLE.explore;
  const badgeColors: Record<string, { bg: string; text: string; border: string }> = {
    danger:  { bg: "var(--bg-danger)",  text: "var(--text-danger)",  border: "var(--border-danger)" },
    warning: { bg: "var(--bg-warning)", text: "var(--text-warning)", border: "var(--border-warning)" },
    success: { bg: "var(--bg-success)", text: "var(--text-success)", border: "var(--border-success)" },
    neutral: { bg: "var(--bg-surface-2)", text: "var(--text-secondary)", border: "var(--border)" },
  };
  const c = badgeColors[style.variant];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      <Card style={{ background: c.bg, borderColor: c.border }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--bg-card)", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <style.icon size={17} color={c.text} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: c.text, textTransform: "uppercase",
              letterSpacing: ".05em", marginBottom: 4 }}>
              Prochaine action recommandée
            </p>
            <p style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.5, fontWeight: 500 }}>{data.action}</p>
            <Link href={data.action_url} style={{
              display: "inline-flex", alignItems: "center", gap: 5, marginTop: 10, fontSize: 12, fontWeight: 700,
              color: "#fff", background: "var(--text-primary)", padding: "8px 14px", borderRadius: 10, textDecoration: "none",
            }}>{data.action_cta} <ArrowRight size={13} /></Link>
          </div>
        </div>
      </Card>

      {data.urgent_deadlines.length > 0 && (
        <Card style={{ padding: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase",
            letterSpacing: ".05em", marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
            <Clock size={12} /> Deadlines urgentes dans tes favoris
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {data.urgent_deadlines.map((d, i) => (
              <Link key={i} href={`/opportunity/${d.id}`} className="sidebar-item" style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                borderRadius: 10, padding: "8px 10px", margin: "0 -10px", textDecoration: "none" }}>
                <p style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500, flex: 1,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: 10 }}>{d.title}</p>
                <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
                  color: d.days <= 1 ? "var(--text-danger)" : "var(--text-urgent)",
                  background: d.days <= 1 ? "var(--bg-danger)" : "var(--bg-urgent)" }}>
                  {d.days === 0 ? "Auj. !" : `J-${d.days}`}
                </span>
              </Link>
            ))}
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12 }}>
        <Card style={{ padding: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase",
            letterSpacing: ".05em", marginBottom: 10 }}>Profil</p>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ProgressRing pct={data.insights.profile_pct} color={data.insights.profile_pct >= 80 ? "var(--accent)" : "var(--text-warning)"} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                {data.insights.profile_pct >= 80 ? "Complet" : "Incomplet"}
              </p>
              <Link href="/dashboard/profile" style={{ fontSize: 11, color: "var(--accent-dark)", fontWeight: 600, textDecoration: "none" }}>
                Améliorer →
              </Link>
            </div>
          </div>
        </Card>

        <Card style={{ padding: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase",
            letterSpacing: ".05em", marginBottom: 10 }}>Dossier</p>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ProgressRing pct={data.insights.docs_pct} color={data.insights.docs_pct >= 75 ? "var(--accent)" : "#3b82f6"} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                {data.insights.docs_pct >= 100 ? "Complet" : `${data.insights.docs_pct}%`}
              </p>
              {data.insights.missing_docs.length > 0 && (
                <Link href="/dashboard/documents" style={{ fontSize: 11, color: "#3b82f6", fontWeight: 600, textDecoration: "none" }}>
                  +{data.insights.missing_docs.length} manquant{data.insights.missing_docs.length > 1 ? "s" : ""} →
                </Link>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
