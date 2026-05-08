import Link from "next/link";

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

interface OpportunityCardProps {
  opportunity: OpportunityData;
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  bourse: { label: "Bourse", color: "bg-purple-100 text-purple-700" },
  stage: { label: "Stage", color: "bg-blue-100 text-blue-700" },
  emploi: { label: "Emploi", color: "bg-green-100 text-green-700" },
  echange: { label: "Échange", color: "bg-orange-100 text-orange-700" },
  concours: { label: "Concours", color: "bg-red-100 text-red-700" },
};

function getDaysLeft(deadline: string | null): number | null {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getScoreColor(score: number): string {
  if (score >= 75) return "text-emerald-600";
  if (score >= 50) return "text-yellow-600";
  return "text-red-500";
}

function getScoreBarColor(score: number): string {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 50) return "bg-yellow-400";
  return "bg-red-400";
}

function DeadlineBadge({ deadline }: { deadline: string | null }) {
  const days = getDaysLeft(deadline);
  if (days === null) return null;
  if (days < 0) return <span className="text-xs text-gray-400">Expirée</span>;

  const urgency =
    days <= 3
      ? "bg-red-100 text-red-700"
      : days <= 7
      ? "bg-orange-100 text-orange-700"
      : "bg-gray-100 text-gray-600";

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${urgency}`}>
      {days === 0 ? "Aujourd'hui !" : `J-${days}`}
    </span>
  );
}

export default function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const typeConfig = TYPE_CONFIG[opportunity.type] ?? {
    label: opportunity.type,
    color: "bg-gray-100 text-gray-600",
  };

  const score = Math.round(opportunity.relevance_score);

  return (
    <Link href={`/opportunity/${opportunity.id}`}>
      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-emerald-300 transition-all duration-200 cursor-pointer">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeConfig.color}`}>
            {typeConfig.label}
          </span>
          <DeadlineBadge deadline={opportunity.deadline} />
        </div>

        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1 line-clamp-2">
          {opportunity.title}
        </h3>

        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
          {opportunity.organization_name && (
            <span>{opportunity.organization_name}</span>
          )}
          {opportunity.organization_name && opportunity.country && <span>·</span>}
          {opportunity.country && <span>🌍 {opportunity.country}</span>}
        </div>

        {opportunity.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">
            {opportunity.description}
          </p>
        )}

        <div className="mt-auto">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">Pertinence</span>
            <span className={`text-xs font-bold ${getScoreColor(score)}`}>
              {score}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${getScoreBarColor(score)}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
