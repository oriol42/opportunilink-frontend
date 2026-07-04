// components/opportunity/OpportunityListRow.tsx
// Ligne dense pour les listes longues (section "Explorer tout" du feed).
"use client";
import Link from "next/link";
import SaveButton from "@/components/opportunity/SaveButton";
import { typeConfig, daysLeft, reliabilityMeta, OpportunityLite } from "@/lib/opportunityHelpers";

export default function OpportunityListRow({ opp }: { opp: OpportunityLite }) {
  const cfg = typeConfig(opp.type);
  const d = daysLeft(opp.deadline);
  const score = Math.round(opp.relevance_score ?? 0);
  const reliability = reliabilityMeta(opp.reliability_score ?? 0);
  const scoreColor = score>=70 ? "var(--accent)" : score>=40 ? "var(--text-warning)" : "var(--text-muted)";

  return (
    <div className="sidebar-item" style={{
      display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
      borderBottom: "1px solid var(--border-subtle)",
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />

      <Link href={`/opportunity/${opp.id}`} style={{ flex: 1, minWidth: 0, textDecoration: "none" }}>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {opp.title}
        </p>
        <p style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
          {cfg.label} · {opp.country ?? "International"}
        </p>
      </Link>

      <reliability.icon size={13} color={`var(--text-${reliability.variant})`} style={{ flexShrink: 0 }} />

      {d !== null && d >= 0 && (
        <span style={{ fontSize: 11, fontWeight: 700, flexShrink: 0,
          color: d <= 7 ? "var(--text-urgent)" : "var(--text-muted)" }}>
          {d === 0 ? "Auj." : `J-${d}`}
        </span>
      )}

      <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor, flexShrink: 0, minWidth: 32, textAlign: "right" }}>
        {score}%
      </span>

      <SaveButton oppId={opp.id} compact />
    </div>
  );
}
