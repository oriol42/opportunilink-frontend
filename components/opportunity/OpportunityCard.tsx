import Link from "next/link";
import SaveButton from "@/components/opportunity/SaveButton";

export interface OpportunityData {
  id: string; title: string; type: string;
  description?: string | null; deadline: string | null;
  country: string | null; reliability_score: number;
  relevance_score: number; organization_name?: string | null;
  is_verified?: boolean;
}

const TYPE_CONFIG: Record<string, { label: string; pill: string; accent: string; logoColor: string }> = {
  bourse:   { label: "Bourse",   pill: "bg-purple-100 text-purple-800",   accent: "#a855f7", logoColor: "#4c1d95" },
  stage:    { label: "Stage",    pill: "bg-blue-100 text-blue-800",       accent: "#3b82f6", logoColor: "#1e3a5f" },
  emploi:   { label: "Emploi",   pill: "bg-emerald-100 text-emerald-800", accent: "#10b981", logoColor: "#064e3b" },
  echange:  { label: "Échange",  pill: "bg-orange-100 text-orange-800",   accent: "#f97316", logoColor: "#7c2d12" },
  concours: { label: "Concours", pill: "bg-red-100 text-red-800",         accent: "#ef4444", logoColor: "#7f1d1d" },
};

function orgInitials(name?: string | null): string {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

function DeadlineBadge({ deadline }: { deadline: string | null }) {
  if (!deadline) return null;
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (days < 0) return <span className="text-[10px] text-gray-400 italic">Expirée</span>;
  if (days === 0) return <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">🔥 Auj.</span>;
  if (days <= 3)  return <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">🔥 J-{days}</span>;
  if (days <= 7)  return <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">⚡ J-{days}</span>;
  return <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">J-{days}</span>;
}

export default function OpportunityCard({ opportunity }: { opportunity: OpportunityData }) {
  const cfg   = TYPE_CONFIG[opportunity.type] ?? { label: opportunity.type, pill: "bg-gray-100 text-gray-700", accent: "#6b7280", logoColor: "#374151" };
  const score = Math.round(opportunity.relevance_score ?? 0);
  const scoreColor = score >= 75 ? "#059669" : score >= 50 ? "#d97706" : "#dc2626";
  const orgName = opportunity.organization_name;

  return (
    <article className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 min-w-0">
      {/* Accent top */}
      <div style={{ height: "3px", background: cfg.accent }} />

      <div className="p-3.5">
        {/* Row: org logo + titre + save */}
        <div className="flex items-start gap-2.5 mb-2.5">
          {/* Logo org */}
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0"
            style={{ background: cfg.logoColor }}>
            {orgName ? orgInitials(orgName) : cfg.label[0]}
          </div>

          <div className="flex-1 min-w-0">
            <Link href={`/opportunity/${opportunity.id}`}>
              <p className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors cursor-pointer">
                {opportunity.title}
              </p>
            </Link>
            <p className="text-[10px] text-gray-400 mt-0.5 truncate">
              {orgName ?? "Source externe"} · {opportunity.country ?? "International"}
            </p>
          </div>

          <SaveButton oppId={opportunity.id} compact />
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.pill}`}>
            {cfg.label}
          </span>
          {opportunity.is_verified && (
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              ✓ Vérifié
            </span>
          )}
          <div className="ml-auto">
            <DeadlineBadge deadline={opportunity.deadline} />
          </div>
        </div>

        {/* Score */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 shrink-0">Match</span>
          <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: scoreColor }} />
          </div>
          <span className="text-[10px] font-black w-7 text-right" style={{ color: scoreColor }}>{score}%</span>
        </div>
      </div>
    </article>
  );
}
