// components/opportunity/OpportunityListRow.tsx
// Ligne dense pour les listes longues (section "Explorer tout" du feed).
"use client";
import Link from "next/link";
import { Globe, CalendarClock } from "lucide-react";
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
      {/* Badge de type — identifiable au premier regard */}
      <span style={{ flexShrink: 0, width: 68, textAlign: "center", fontSize: 10, fontWeight: 800,
        letterSpacing: ".03em", textTransform: "uppercase", color: cfg.color, background: cfg.bg,
        padding: "5px 0", borderRadius: 8 }}>
        {cfg.label}
      </span>

      <Link href={`/opportunity/${opp.id}`} style={{ flex: 1, minWidth: 0, textDecoration: "none" }}>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {opp.title}
        </p>
        <p style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 3, display: "flex",
          alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
            <Globe size={11} /> {opp.country ?? "International"}
          </span>
          {d !== null && d >= 0 && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3,
              color: d <= 7 ? "var(--text-urgent)" : "var(--text-muted)", fontWeight: d <= 7 ? 700 : 500 }}>
              <CalendarClock size={11} /> {d === 0 ? "Aujourd'hui" : `J-${d}`}
            </span>
          )}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
            <reliability.icon size={11} color={`var(--text-${reliability.variant})`} /> {reliability.label}
          </span>
        </p>
      </Link>

      {/* Score de match */}
      <div style={{ flexShrink: 0, textAlign: "right", minWidth: 42 }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{score}%</p>
        <p style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600, marginTop: 2,
          textTransform: "uppercase", letterSpacing: ".04em" }}>match</p>
      </div>

      <SaveButton oppId={opp.id} compact />
    </div>
  );
}
