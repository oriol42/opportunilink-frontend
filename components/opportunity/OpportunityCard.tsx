// components/opportunity/OpportunityCard.tsx
"use client";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import SaveButton from "@/components/opportunity/SaveButton";
import { Wallet } from "lucide-react";
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
    <Card hoverable style={{ padding: 0, display: "flex", flexDirection: "column",
      boxShadow: "var(--shadow-sm)", transition: "box-shadow .2s, transform .2s" }}>
      <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
          {(() => {
            const size = 46; const r = 19; const circ = 2*Math.PI*r;
            const dash = (score/100)*circ;
            return (
              <div style={{ position:"relative", flexShrink:0 }}>
                <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
                  <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border-subtle)" strokeWidth={4} />
                  <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={scoreColor} strokeWidth={4}
                    strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
                </svg>
                <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor }}>{score}</span>
                </div>
              </div>
            );
          })()}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
              {d !== null && d >= 0 && d <= 7 && (
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-urgent)", marginLeft: "auto", flexShrink: 0 }}>
                  {d === 0 ? "Aujourd'hui" : `J-${d}`}
                </span>
              )}
            </div>
            <Link href={`/opportunity/${opp.id}`} style={{ textDecoration: "none" }}>
              <p style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)", lineHeight: 1.4,
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {opp.title}
              </p>
            </Link>
          </div>
        </div>

        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, flex: 1,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {excerpt || "Consulte la page détail pour plus d'informations."}
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          <Badge variant={reliability.variant} icon={reliability.icon}>{reliability.label}</Badge>
          <Badge icon={reason.icon}>{reason.label}</Badge>
          {opp.has_salary && <Badge variant="success" icon={Wallet}>Rémunéré</Badge>}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          borderTop: "1px solid var(--border-subtle)", paddingTop: 12, marginTop: 2 }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
            <method.icon size={12} /> {method.label} · {opp.country ?? "International"}
          </span>
          <SaveButton oppId={opp.id} compact />
        </div>
      </div>
    </Card>
  );
}
