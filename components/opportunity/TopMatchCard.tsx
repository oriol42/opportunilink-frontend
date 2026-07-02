// components/opportunity/TopMatchCard.tsx
"use client";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import ScoreRing from "@/components/ui/ScoreRing";
import SaveButton from "@/components/opportunity/SaveButton";
import { Sparkles, Clock } from "lucide-react";
import {
  OpportunityLite, UserLite, typeConfig, daysLeft,
  detectApplyMethod, matchReasons, reliabilityMeta,
} from "@/lib/opportunityHelpers";

export default function TopMatchCard({ opp, user }: { opp: OpportunityLite; user: UserLite }) {
  const cfg = typeConfig(opp.type);
  const d = daysLeft(opp.deadline);
  const score = Math.round(opp.relevance_score ?? 0);
  const method = detectApplyMethod(opp.source_url || "", opp.description || "");
  const reasons = matchReasons(opp, user);
  const reliability = reliabilityMeta(opp.reliability_score ?? 0);
  const excerpt = opp.description?.replace(/\s+/g, " ").trim().slice(0, 190)
    + (opp.description && opp.description.length > 190 ? "…" : "");

  return (
    <div style={{
      background: "var(--bg-hero)", borderRadius: 18, overflow: "hidden",
      border: "1px solid rgba(16,185,129,.25)", position: "relative",
    }}>
      <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180,
        background: `radial-gradient(circle,${cfg.color}18 0%,transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ padding: "22px 24px", position: "relative", display: "flex", gap: 20 }}>

        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <ScoreRing score={score} size={64} strokeWidth={4} />
          <span style={{ fontSize: 10, fontWeight: 700, color: "#6ee7b7", letterSpacing: ".06em", textAlign: "center" }}>MATCH</span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#fbbf24", background: "rgba(251,191,36,.15)",
              padding: "4px 10px", borderRadius: 20, border: "1px solid rgba(251,191,36,.25)",
              display: "flex", alignItems: "center", gap: 4 }}>
              <Sparkles size={11} /> Top Match IA
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg,
              padding: "4px 10px", borderRadius: 20 }}>{cfg.label}</span>
            <Badge variant={reliability.variant} icon={reliability.icon}>{reliability.label}</Badge>
            {d !== null && d >= 0 && d <= 14 && (
              <Badge variant="urgent" icon={Clock}>{d === 0 ? "Aujourd'hui" : `J-${d}`}</Badge>
            )}
          </div>

          <Link href={`/opportunity/${opp.id}`} style={{ textDecoration: "none" }}>
            <h3 style={{ fontFamily: "var(--font-voice)", fontWeight: 500, fontSize: 19, color: "#fff",
              lineHeight: 1.35, marginBottom: 8, cursor: "pointer" }}>{opp.title}</h3>
          </Link>

          {excerpt && <p style={{ fontSize: 13, color: "rgba(255,255,255,.45)", lineHeight: 1.6, marginBottom: 12 }}>{excerpt}</p>}

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {reasons.map((r, i) => (
              <span key={i} style={{ fontSize: 11, fontWeight: 600, color: "#a7f3d0",
                background: "rgba(16,185,129,.1)", padding: "4px 10px", borderRadius: 20,
                border: "1px solid rgba(16,185,129,.2)", display: "flex", alignItems: "center", gap: 4 }}>
                <r.icon size={11} />{r.label}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 12 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,.4)", display: "flex", alignItems: "center", gap: 5 }}>
              <method.icon size={13} /> {method.label} · {opp.country ?? "International"}
            </span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <SaveButton oppId={opp.id} compact />
              <Link href={`/opportunity/${opp.id}`} style={{ fontSize: 13, fontWeight: 700, color: "#0f172a",
                background: "linear-gradient(135deg,var(--accent),#34d399)",
                padding: "8px 16px", borderRadius: 10, textDecoration: "none" }}>Voir →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
