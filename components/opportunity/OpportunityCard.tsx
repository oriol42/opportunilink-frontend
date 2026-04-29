import Link from "next/link";

export interface Opportunity {
  id: string;
  title: string;
  type: "bourse" | "stage" | "emploi" | "echange" | "concours";
  country: string;
  deadline: string | null;
  reliability_score: number;
  is_verified: boolean;
  relevance_score: number;
  prep_score: number | null;
}

const TYPE_STYLES: Record<string, { label: string; color: string }> = {
  bourse:   { label: "Bourse",   color: "bg-emerald-100 text-emerald-700" },
  stage:    { label: "Stage",    color: "bg-blue-100 text-blue-700" },
  emploi:   { label: "Emploi",   color: "bg-purple-100 text-purple-700" },
  echange:  { label: "Échange",  color: "bg-orange-100 text-orange-700" },
  concours: { label: "Concours", color: "bg-red-100 text-red-700" },
};

function DeadlineBadge({ deadline }: { deadline: string | null }) {
  if (!deadline) return null;
  const daysLeft = Math.ceil(
    (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (daysLeft < 0) return <span className="text-xs text-red-500 font-medium">Expirée</span>;
  if (daysLeft <= 7) return <span className="text-xs text-red-500 font-medium">⚠️ {daysLeft}j restants</span>;
  if (daysLeft <= 30) return <span className="text-xs text-orange-500 font-medium">{daysLeft}j restants</span>;
  return (
    <span className="text-xs text-gray-400">
      {new Date(deadline).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
    </span>
  );
}

function RelevanceBar({ score }: { score: number }) {
  const color = score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-orange-400" : "bg-gray-300";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{score}%</span>
    </div>
  );
}

export function OpportunityCard({ opp }: { opp: Opportunity }) {
  const typeStyle = TYPE_STYLES[opp.type] ?? { label: opp.type, color: "bg-gray-100 text-gray-700" };

  return (
    <Link href={`/opportunity/${opp.id}`}>
      <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeStyle.color}`}>
              {typeStyle.label}
            </span>
            {opp.is_verified && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-600">
                ✓ Vérifié
              </span>
            )}
          </div>
          <span className="text-sm text-gray-400">🌍 {opp.country}</span>
        </div>

        <h3 className="font-semibold text-gray-800 mb-3 leading-snug">{opp.title}</h3>

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">Pertinence pour toi</span>
          </div>
          <RelevanceBar score={Math.round(opp.relevance_score)} />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <DeadlineBadge deadline={opp.deadline} />
          <span className="text-xs text-gray-400">Fiabilité {opp.reliability_score}/100</span>
        </div>
      </div>
    </Link>
  );
}
