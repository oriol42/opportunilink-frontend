import Link from "next/link";
import SaveButton from "@/components/opportunity/SaveButton";

export interface OpportunityData {
  id: string;
  title: string;
  type: string;
  description?: string | null;
  deadline: string | null;
  country: string | null;
  reliability_score: number;
  relevance_score: number;
  organization_name?: string | null;
}

const TYPE_CONFIG: Record<string, { label: string; pill: string; dot: string; accent: string }> = {
  bourse:   { label: "Bourse",   pill: "bg-purple-100 text-purple-700",   dot: "bg-purple-500",  accent: "from-purple-400 via-violet-400 to-purple-300" },
  stage:    { label: "Stage",    pill: "bg-blue-100 text-blue-700",       dot: "bg-blue-500",    accent: "from-blue-400 via-cyan-400 to-blue-300" },
  emploi:   { label: "Emploi",   pill: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", accent: "from-emerald-400 via-teal-400 to-emerald-300" },
  echange:  { label: "Échange",  pill: "bg-orange-100 text-orange-700",   dot: "bg-orange-500",  accent: "from-orange-400 via-amber-400 to-orange-300" },
  concours: { label: "Concours", pill: "bg-red-100 text-red-700",         dot: "bg-red-500",     accent: "from-red-400 via-rose-400 to-red-300" },
};

function getDaysLeft(deadline: string | null): number | null {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
}

function DeadlineBadge({ deadline }: { deadline: string | null }) {
  const days = getDaysLeft(deadline);
  if (days === null) return null;
  if (days < 0) return <span className="text-xs text-gray-300 italic">Expirée</span>;
  if (days === 0) return <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-full animate-pulse">🔥 Aujourd'hui</span>;
  if (days <= 3)  return <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">🔥 J-{days}</span>;
  if (days <= 7)  return <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">⚡ J-{days}</span>;
  return <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">J-{days}</span>;
}

function ScoreBar({ score }: { score: number }) {
  const gradient = score >= 75 ? "from-emerald-400 to-teal-400" : score >= 50 ? "from-amber-400 to-yellow-300" : "from-red-400 to-rose-300";
  const textColor = score >= 75 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-red-500";
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${gradient}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-bold tabular-nums w-9 text-right ${textColor}`}>{score}%</span>
    </div>
  );
}

export default function OpportunityCard({ opportunity }: { opportunity: OpportunityData }) {
  const cfg = TYPE_CONFIG[opportunity.type] ?? { label: opportunity.type, pill: "bg-gray-100 text-gray-600", dot: "bg-gray-400", accent: "from-gray-300 to-gray-200" };
  const score = Math.round(opportunity.relevance_score ?? 0);

  return (
    <article className="group bg-white rounded-2xl border border-gray-100 overflow-hidden min-w-0 hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
      <div className={`h-[3px] bg-gradient-to-r ${cfg.accent}`} />
      <div className="p-4 pb-3.5">

        {/* Row 1: type + save + deadline */}
        <div className="flex items-center justify-between mb-2.5">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
            {cfg.label}
          </span>
          <div className="flex items-center gap-2">
            <SaveButton oppId={opportunity.id} compact />
            <DeadlineBadge deadline={opportunity.deadline} />
          </div>
        </div>

        {/* Title — cliquable */}
        <Link href={`/opportunity/${opportunity.id}`}>
          <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1.5 line-clamp-2 group-hover:text-emerald-700 transition-colors cursor-pointer">
            {opportunity.title}
          </h3>
        </Link>

        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
          {opportunity.country && <span>🌍 {opportunity.country}</span>}
          {opportunity.reliability_score >= 90 && <><span>·</span><span className="text-emerald-500 font-semibold">✓ Fiable</span></>}
        </div>

        {opportunity.description && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">{opportunity.description}</p>
        )}

        <div className="pt-3 border-t border-gray-50">
          <p className="text-xs text-gray-400 mb-1.5">Pertinence pour ton profil</p>
          <ScoreBar score={score} />
        </div>
      </div>
    </article>
  );
}
