"use client";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface OpportunityDetail {
  id: string;
  title: string;
  type: string;
  description: string;
  source_url: string;
  deadline: string | null;
  country: string;
  required_level: string[];
  required_fields: string[];
  required_languages: string[];
  min_gpa: number | null;
  reliability_score: number;
  is_verified: boolean;
}

interface PrepScore {
  score: number;
  missing: { label: string; fix: string }[];
  message: string;
}

const LANGUAGE_LABELS: Record<string, string> = {
  fr: "Francais", en: "Anglais", de: "Allemand",
  es: "Espagnol", zh: "Chinois", ar: "Arabe", pt: "Portugais",
};

const TYPE_STYLES: Record<string, { label: string; color: string }> = {
  bourse:   { label: "Bourse",   color: "bg-emerald-100 text-emerald-700" },
  stage:    { label: "Stage",    color: "bg-blue-100 text-blue-700" },
  emploi:   { label: "Emploi",   color: "bg-purple-100 text-purple-700" },
  echange:  { label: "Echange",  color: "bg-orange-100 text-orange-700" },
  concours: { label: "Concours", color: "bg-red-100 text-red-700" },
};

function PrepScoreSection({ oppId }: { oppId: string }) {
  const { data, isLoading } = useQuery<PrepScore>({
    queryKey: ["prep-score", oppId],
    queryFn: async () => {
      const res = await api.get("/opportunities/" + oppId + "/prep-score");
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
        <div className="h-3 bg-gray-100 rounded w-full" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const color =
    data.score >= 70 ? "bg-emerald-500" :
    data.score >= 40 ? "bg-orange-400" : "bg-red-400";

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="font-semibold text-gray-800 mb-3">Ton score de preparation</h3>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 bg-gray-100 rounded-full h-3">
          <div className={color + " h-3 rounded-full transition-all"} style={{ width: data.score + "%" }} />
        </div>
        <span className="text-2xl font-bold text-gray-800 w-14 text-right">{data.score}%</span>
      </div>
      <p className="text-sm text-gray-600 mb-4">{data.message}</p>
      {data.missing.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ce qu il te manque :</p>
          {data.missing.map((item, i) => (
            <div key={i} className="flex items-start gap-2 bg-red-50 rounded-lg px-3 py-2">
              <span className="text-red-400 mt-0.5">x</span>
              <div>
                <p className="text-sm font-medium text-red-700">{item.label}</p>
                <p className="text-xs text-red-500">{item.fix}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {data.missing.length === 0 && (
        <div className="bg-emerald-50 rounded-lg px-3 py-2 text-emerald-700 text-sm font-medium">
          Ton dossier est complet pour cette opportunite !
        </div>
      )}
    </div>
  );
}

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: opp, isLoading, isError } = useQuery<OpportunityDetail>({
    queryKey: ["opportunity", id],
    queryFn: async () => {
      const res = await api.get("/opportunities/" + id);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Chargement...</p>
      </div>
    );
  }

  if (isError || !opp) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">Opportunite introuvable.</p>
      </div>
    );
  }

  const typeStyle = TYPE_STYLES[opp.type] ?? { label: opp.type, color: "bg-gray-100 text-gray-700" };
  const daysLeft = opp.deadline
    ? Math.ceil((new Date(opp.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold text-emerald-600">OpportuLink</h1>
        <button onClick={() => router.push("/dashboard")} className="text-sm text-gray-500 hover:text-gray-700">
          Retour au feed
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className={"text-xs font-semibold px-2.5 py-1 rounded-full " + typeStyle.color}>
              {typeStyle.label}
            </span>
            {opp.is_verified && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-600">
                Verifie
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">{opp.title}</h2>
          <p className="text-sm text-gray-400 mb-4">{opp.country}</p>
          <p className="text-gray-600 text-sm leading-relaxed">{opp.description}</p>
        </div>

        <PrepScoreSection oppId={id} />

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-3">Criteres d eligibilite</h3>
          <div className="space-y-2 text-sm">
            {opp.required_level.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Niveau requis</span>
                <span className="text-gray-800 font-medium">{opp.required_level.join(", ")}</span>
              </div>
            )}
            {opp.required_fields.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Filieres</span>
                <span className="text-gray-800 font-medium">{opp.required_fields.join(", ")}</span>
              </div>
            )}
            {opp.required_languages.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Langues</span>
                <span className="text-gray-800 font-medium">
                  {opp.required_languages.map((l) => LANGUAGE_LABELS[l] ?? l).join(", ")}
                </span>
              </div>
            )}
            {opp.min_gpa && (
              <div className="flex justify-between">
                <span className="text-gray-500">Moyenne minimale</span>
                <span className="text-gray-800 font-medium">{opp.min_gpa}/20</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Fiabilite</span>
              <span className="text-gray-800 font-medium">{opp.reliability_score}/100</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-3">Deadline</h3>
          {opp.deadline ? (
            <p className={daysLeft !== null && daysLeft <= 7 ? "text-sm font-medium text-red-500" : "text-sm font-medium text-gray-700"}>
              {new Date(opp.deadline).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              {daysLeft !== null && " - " + daysLeft + " jours restants"}
            </p>
          ) : (
            <p className="text-sm text-gray-400">Pas de deadline precisee</p>
          )}
        </div>
      </main>
    </div>
  );
}
