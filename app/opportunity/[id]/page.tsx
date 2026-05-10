"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import CVBuilder from "@/components/ai/CVBuilder";
import SaveButton from "@/components/opportunity/SaveButton";
import { useToast } from "@/components/ui/Toast";
import ShareButton from "@/components/opportunity/ShareButton";

interface OpportunityDetail {
  id: string; title: string; type: string; description: string;
  source_url: string; deadline: string | null; country: string;
  required_level: string[]; required_fields: string[];
  required_languages: string[]; min_gpa: number | null;
  reliability_score: number; is_verified: boolean;
}
interface PrepScore {
  score: number; missing: { label: string; fix: string }[]; message: string;
}
interface LetterResponse {
  letter: string; opportunity_title: string; word_count: number;
}

const LANGUAGE_LABELS: Record<string, string> = {
  fr: "Français", en: "Anglais", de: "Allemand",
  es: "Espagnol", zh: "Chinois", ar: "Arabe", pt: "Portugais",
};
const TYPE_CONFIG: Record<string, { label: string; color: string; accent: string }> = {
  bourse:   { label: "Bourse",   color: "bg-purple-100 text-purple-700",   accent: "from-purple-400 to-violet-300" },
  stage:    { label: "Stage",    color: "bg-blue-100 text-blue-700",       accent: "from-blue-400 to-cyan-300" },
  emploi:   { label: "Emploi",   color: "bg-emerald-100 text-emerald-700", accent: "from-emerald-400 to-teal-300" },
  echange:  { label: "Échange",  color: "bg-orange-100 text-orange-700",   accent: "from-orange-400 to-amber-300" },
  concours: { label: "Concours", color: "bg-red-100 text-red-700",         accent: "from-red-400 to-rose-300" },
};

function PrepScoreSection({ oppId }: { oppId: string }) {
  const { data, isLoading } = useQuery<PrepScore>({
    queryKey: ["prep-score", oppId],
    queryFn: async () => (await api.get(`/opportunities/${oppId}/prep-score`)).data,
  });
  if (isLoading) return <div className="bg-white rounded-2xl border p-5 animate-pulse h-28" />;
  if (!data) return null;
  const barColor = data.score >= 70 ? "from-emerald-400 to-teal-400" : data.score >= 40 ? "from-amber-400 to-yellow-300" : "from-red-400 to-rose-300";
  const bg = data.score >= 70 ? "bg-emerald-50 border-emerald-100" : data.score >= 40 ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100";
  return (
    <div className={`rounded-2xl border p-5 ${bg}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 text-sm">Score de préparation</h3>
        <span className="text-2xl font-black text-gray-800">{data.score}%</span>
      </div>
      <div className="bg-white rounded-full h-2.5 overflow-hidden mb-3 shadow-inner">
        <div className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`} style={{ width: `${data.score}%` }} />
      </div>
      <p className="text-xs text-gray-600 mb-3">{data.message}</p>
      {data.missing.length > 0 && (
        <div className="space-y-2">
          {data.missing.map((item, i) => (
            <div key={i} className="flex items-start gap-2 bg-white rounded-xl px-3 py-2 shadow-sm">
              <span className="text-red-400 shrink-0 mt-0.5 text-xs font-bold">✕</span>
              <div>
                <p className="text-xs font-semibold text-red-700">{item.label}</p>
                <p className="text-xs text-red-500">{item.fix}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {data.missing.length === 0 && (
        <div className="bg-white rounded-xl px-3 py-2 text-emerald-700 text-xs font-semibold">✓ Dossier complet !</div>
      )}
    </div>
  );
}

function ApplyButton({ oppId, oppTitle }: { oppId: string; oppTitle: string }) {
  const router = useRouter();
  const { success, error, warning } = useToast();
  const [state, setState] = useState<"idle"|"loading"|"done"|"already">("idle");

  async function handleApply() {
    setState("loading");
    try {
      await api.post("/applications", { opportunity_id: oppId });
      setState("done");
      success("Candidature créée ! Retrouve-la dans tes candidatures.");
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 400) {
        setState("already");
        warning("Tu as déjà une candidature pour cette opportunité.");
      } else {
        setState("idle");
        error("Erreur lors de la création. Réessaie.");
      }
    }
  }

  if (state === "done" || state === "already") return (
    <button onClick={() => router.push("/dashboard/applications")}
      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-4 rounded-2xl transition text-sm">
      {state === "done" ? "✓ Voir mes candidatures →" : "Déjà en candidature — Voir mes candidatures →"}
    </button>
  );

  return (
    <button onClick={handleApply} disabled={state === "loading"}
      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-all text-base shadow-lg shadow-emerald-100">
      {state === "loading" ? "Création en cours..." : "Postuler à cette opportunité →"}
    </button>
  );
}

function LetterGenerator({ oppId }: { oppId: string }) {
  const { error: toastError } = useToast();
  const [state, setState] = useState<"idle"|"loading"|"done"|"error">("idle");
  const [letter, setLetter] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setState("loading");
    setLetter("");
    try {
      const res = await api.post<LetterResponse>("/ai/generate-letter", { opportunity_id: oppId });
      setLetter(res.data.letter);
      setWordCount(res.data.word_count);
      setState("done");
    } catch {
      setState("error");
      toastError("Erreur IA. Réessaie dans quelques secondes.");
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <h3 className="font-semibold text-gray-800">Lettre de motivation IA</h3>
            <p className="text-xs text-gray-400 mt-0.5">Llama 3.3 70B — personnalisée avec ton profil</p>
          </div>
          <span className="shrink-0 text-xs font-bold px-2 py-1 rounded-full bg-violet-100 text-violet-600">IA</span>
        </div>
        <button onClick={handleGenerate} disabled={state === "loading"}
          className="mt-4 w-full border-2 border-violet-500 text-violet-600 hover:bg-violet-50 disabled:opacity-50 font-semibold py-3 rounded-xl transition text-sm">
          {state === "loading" ? "Génération... (5-10 sec)" : state === "done" ? "Régénérer" : "Générer ma lettre de motivation"}
        </button>
      </div>
      {state === "done" && letter && (
        <div className="border-t border-gray-100">
          <div className="flex items-center justify-between px-5 py-3 bg-gray-50">
            <span className="text-xs text-gray-400">{wordCount} mots</span>
            <button onClick={handleCopy} className="text-xs font-semibold text-violet-600 hover:text-violet-800">
              {copied ? "✓ Copié !" : "Copier la lettre"}
            </button>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{letter}</p>
          </div>
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
    queryFn: async () => (await api.get(`/opportunities/${id}`)).data,
  });

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
    </div>
  );

  if (isError || !opp) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
      <p className="text-4xl">😕</p>
      <p className="text-gray-500 font-medium">Opportunité introuvable.</p>
      <button onClick={() => router.push("/dashboard")} className="text-sm text-emerald-600 underline">Retour au feed</button>
    </div>
  );

  const typeCfg = TYPE_CONFIG[opp.type] ?? { label: opp.type, color: "bg-gray-100 text-gray-700", accent: "from-gray-300 to-gray-200" };
  const daysLeft = opp.deadline ? Math.ceil((new Date(opp.deadline).getTime() - Date.now()) / 86400000) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.push("/dashboard")} className="text-sm text-gray-500 hover:text-gray-800 font-medium">← Retour</button>
          <span className="font-black text-emerald-600">OpportuLink</span>
          <div className="flex items-center gap-2"><ShareButton title={opp?.title ?? ""} oppId={id} /><SaveButton oppId={id} /></div>
        </div>
        <div className={`h-[2px] bg-gradient-to-r ${typeCfg.accent}`} />
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeCfg.color}`}>{typeCfg.label}</span>
            {opp.is_verified && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-600">✓ Vérifié</span>}
            {daysLeft !== null && daysLeft <= 7 && daysLeft >= 0 && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-600">🔥 J-{daysLeft}</span>}
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1 leading-tight">{opp.title}</h1>
          <p className="text-sm text-gray-400 mb-4">🌍 {opp.country}</p>
          <p className="text-sm text-gray-600 leading-relaxed">{opp.description}</p>
        </div>

        <PrepScoreSection oppId={id} />

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4 text-sm">Critères d&apos;éligibilité</h2>
          <div className="space-y-3">
            {opp.required_level.length > 0 && <div className="flex justify-between text-sm"><span className="text-gray-400">Niveau</span><span className="font-semibold text-gray-800">{opp.required_level.join(", ")}</span></div>}
            {opp.required_fields.length > 0 && <div className="flex justify-between text-sm"><span className="text-gray-400">Filières</span><span className="font-semibold text-gray-800">{opp.required_fields.join(", ")}</span></div>}
            {opp.required_languages.length > 0 && <div className="flex justify-between text-sm"><span className="text-gray-400">Langues</span><span className="font-semibold text-gray-800">{opp.required_languages.map(l => LANGUAGE_LABELS[l] ?? l).join(", ")}</span></div>}
            {opp.min_gpa && <div className="flex justify-between text-sm"><span className="text-gray-400">Moyenne min.</span><span className="font-semibold text-gray-800">{opp.min_gpa}/20</span></div>}
            <div className="flex justify-between text-sm"><span className="text-gray-400">Fiabilité</span><span className={`font-semibold ${opp.reliability_score >= 80 ? "text-emerald-600" : "text-amber-600"}`}>{opp.reliability_score}/100</span></div>
          </div>
        </div>

        {opp.deadline && (
          <div className={`rounded-2xl border p-4 flex items-center justify-between ${daysLeft !== null && daysLeft <= 7 ? "bg-red-50 border-red-100" : "bg-white border-gray-100"}`}>
            <div>
              <p className="text-xs text-gray-400 font-medium mb-0.5">Date limite</p>
              <p className={`font-bold text-sm ${daysLeft !== null && daysLeft <= 7 ? "text-red-600" : "text-gray-800"}`}>
                {new Date(opp.deadline).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            {daysLeft !== null && daysLeft >= 0 && (
              <div className={`text-right ${daysLeft <= 7 ? "text-red-500" : "text-gray-400"}`}>
                <p className="text-2xl font-black">{daysLeft}</p>
                <p className="text-xs">jours restants</p>
              </div>
            )}
          </div>
        )}

        <ApplyButton oppId={id} oppTitle={opp.title} />

        <div className="space-y-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide px-1">Outils IA</h2>
          <LetterGenerator oppId={id} />
          <CVBuilder oppId={id} />
        </div>

        {opp.source_url && (
          <a href={opp.source_url} target="_blank" rel="noopener noreferrer"
            className="block text-center text-sm text-gray-400 hover:text-gray-600 underline py-3">
            Voir la source officielle →
          </a>
        )}
      </main>
    </div>
  );
}
