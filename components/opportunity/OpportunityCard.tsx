// components/opportunity/OpportunityCard.tsx
"use client";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ScoreRing from "@/components/ui/ScoreRing";
import SaveButton from "@/components/opportunity/SaveButton";
import { Clock } from "lucide-react";
import {
  OpportunityLite, UserLite, typeConfig, daysLeft,
  detectApplyMethod, matchReasons, reliabilityMeta,
} from "@/lib/opportunityHelpers";

export default function OpportunityCard({ opp, user }: { opp: OpportunityLite; user: UserLite }) {
  const cfg = typeConfig(opp.type);
  const d = daysLeft(opp.deadline);
  const score = Math.round(opp.relevance_score ?? 0);
  const method = detectApplyMethod(opp.source_url || "", opp.description || "");
  const reason = matchReasons(opp, user)[0];
  const reliability = reliabilityMeta(opp.reliability_score ?? 0);
  const excerpt = opp.description?.replace(/\s+/g, " ").trim().slice(0, 130)
    + (opp.description && opp.description.length > 130 ? "…" : "");

  const accentColor = d !== null && d >= 0 && d <= 3 ? "var(--text-urgent)" : cfg.color;

  return (
    <Card accentColor={accentColor} hoverable style={{ padding: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <ScoreRing score={score} size={44} strokeWidth={3} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg,
                padding: "3px 9px", borderRadius: 20 }}>{cfg.label}</span>
              <Badge variant={reliability.variant} icon={reliability.icon}>{reliability.label}</Badge>
            </div>
            <Link href={`/opportunity/${opp.id}`} style={{ textDecoration: "none" }}>
              <p style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)", lineHeight: 1.35,
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {opp.title}
              </p>
            </Link>
          </div>
        </div>

        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55, flex: 1,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {excerpt || "Consulte la page détail pour plus d'informations."}
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <Badge icon={reason.icon}>{reason.label}</Badge>
          {d !== null && d >= 0 && (
            <Badge variant={d <= 7 ? "urgent" : "neutral"} icon={Clock}>
              {d === 0 ? "Aujourd'hui" : `J-${d}`}
            </Badge>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          borderTop: "1px solid var(--border-subtle)", paddingTop: 10, marginTop: 2 }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
            <method.icon size={13} /> {method.label} · {opp.country ?? "International"}
          </span>
          <SaveButton oppId={opp.id} compact />
        </div>
      </div>
    </Card>
  );
}
