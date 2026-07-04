// components/opportunity/OpportunityCard.tsx
// Card canonique pour une opportunité — utilisée dans le feed, les favoris,
// et partout où on affiche une liste d'opportunités.
"use client";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
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
  const excerpt = opp.description?.replace(/\s+/g, " ").trim().slice(0, 120)
    + (opp.description && opp.description.length > 120 ? "…" : "");
  const scoreColor = score>=70 ? "var(--accent)" : score>=40 ? "var(--text-warning)" : "var(--text-muted)";

  return (
    <Card hoverable style={{ padding: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: 17, flex: 1, display: "flex", flexDirection: "column", gap: 11 }}>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: `${scoreColor}16`,
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor }}>{score}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
              {d !== null && d >= 0 && d <= 7 && (
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-urgent)", marginLeft: "auto", flexShrink: 0 }}>
                  {d === 0 ? "Aujourd'hui" : `J-${d}`}
                </span>
              )}
            </div>
            <Link href={`/opportunity/${opp.id}`} style={{ textDecoration: "none" }}>
              <p style={{ fontWeight: 600, fontSize: 14.5, color: "var(--text-primary)", lineHeight: 1.35,
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {opp.title}
              </p>
            </Link>
          </div>
        </div>

        <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.55, flex: 1,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {excerpt || "Consulte la page détail pour plus d'informations."}
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <Badge variant={reliability.variant} icon={reliability.icon}>{reliability.label}</Badge>
          <Badge icon={reason.icon}>{reason.label}</Badge>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          borderTop: "1px solid var(--border-subtle)", paddingTop: 10, marginTop: 2 }}>
          <span style={{ fontSize: 11.5, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
            <method.icon size={12} /> {method.label} · {opp.country ?? "International"}
          </span>
          <SaveButton oppId={opp.id} compact />
        </div>
      </div>
    </Card>
  );
}
