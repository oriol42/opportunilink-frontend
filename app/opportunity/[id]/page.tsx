"use client";
import { useState } from "react";
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

interface LetterResponse {
  letter: string;
  opportunity_title: string;
  word_count: number;
}

const LANGUAGE_LABELS: Record<string, string> = {
  fr: "Français",
  en: "Anglais",
  de: "Allemand",
  es: "Espagnol",
  zh: "Chinois",
  ar: "Arabe",
  pt: "Portugais",
};

const TYPE_STYLES: Record<string, { label: string; color: string }> = {
  bourse:   { label: "Bourse",   color: "bg-emerald-100 text-emerald-700" },
  stage:    { label: "Stage",    color: "bg-blue-100 text-blue-700" },
  emploi:   { label: "Emploi",   color: "bg-purple-100 text-purple-700" },
  echange:  { label: "Échange",  color: "bg-orange-100 text-orange-700" },
  concours: { label: "Concours", color: "bg-red-100 text-red-700" },
};

// ─── PrepScore section ────────────────────────────────────────────────────────

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
  if (!data) return null;

  const color =
    data.score >= 70 ? "bg-emerald-500" :
    data.score >= 40 ? "bg-orange-400" : "bg-red-400";

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="font-semibold text-gray-800 mb-3">Ton score de préparation</h3>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 bg-gray-100 rounded-full h-3">
          <div
            className={color + " h-3 rounded-full transition-all"}
            style={{ width: data.score + "%" }}
          />
        </div>
        <span className="text-2xl font-bold text-gray-800 w-14 text-right">
          {data.score}%
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-4">{data.message}</p>
      {data.missing.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Ce qu&apos;il te manque :
          </p>
          {data.missing.map((item, i) => (
            <div key={i} className="flex items-start gap-2 bg-red-50 rounded-lg px-3 py-2">
              <span className="text-red-400 mt-0.5">✕</span>
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
          Ton dossier est complet pour cette opportunité !
        </div>
      )}
    </div>
  );
}

// ─── Bouton Postuler ──────────────────────────────────────────────────────────

type ApplyState = "idle" | "loading" | "done" | "already" | "error";

function ApplyButton({ oppId, oppTitle }: { oppId: string; oppTitle: string }) {
  const router = useRouter();
  const [state, setState] = useState<ApplyState>("idle");

  async function handleApply() {
    setState("loading");
    try {
      await api.post("/applications", { opportunity_id: oppId });
      setState("done");
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 400) {
        setState("already");
      } else {
        setState("error");
      }
    }
  }

  if (state === "done") {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center space-y-3">
        <p className="text-emerald-700 font-semibold text-lg">✓ Candidature créée !</p>
        <p className="text-sm text-emerald-600">
          &quot;{oppTitle}&quot; a été ajoutée à tes candidatures en statut <strong>Brouillon</strong>.
        </p>
        <button
          onClick={() => router.push("/dashboard/applications")}
          className="text-sm text-emerald-700 underline hover:text-emerald-900"
        >
          Voir mes candidatures →
        </button>
      </div>
    );
  }

  if (state === "already") {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 text-center space-y-2">
        <p className="text-orange-700 font-semibold">Tu as déjà une candidature pour cette opportunité.</p>
        <button
          onClick={() => router.push("/dashboard/applications")}
          className="text-sm text-orange-600 underline hover:text-orange-800"
        >
          Voir mes candidatures →
        </button>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center space-y-2">
        <p className="text-red-600 font-semibold">Une erreur est survenue. Réessaie.</p>
        <button onClick={() => setState("idle")} className="text-sm text-red-500 underline">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleApply}
      disabled={state === "loading"}
      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed
                 text-white font-semibold py-4 rounded-xl transition-colors text-base"
    >
      {state === "loading" ? "Création en cours..." : "Postuler à cette opportunité"}
    </button>
  );
}

// ─── Générateur de lettre ─────────────────────────────────────────────────────
// 4 états : idle | loading | done | error
// La lettre générée s'affiche dans une section expandable avec bouton "Copier"

type LetterState = "idle" | "loading" | "done" | "error";

function LetterGenerator({ oppId }: { oppId: string }) {
  const [state, setState] = useState<LetterState>("idle");
  const [letter, setLetter] = useState<string>("");
  const [wordCount, setWordCount] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setState("loading");
    setLetter("");
    try {
      const res = await api.post<LetterResponse>("/ai/generate-letter", {
        opportunity_id: oppId,
      });
      setLetter(res.data.letter);
      setWordCount(res.data.word_count);
      setState("done");
    } catch {
      setState("error");
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    // Reset "Copié !" after 2 seconds
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header + bouton */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <h3 className="font-semibold text-gray-800">Lettre de motivation IA</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Générée par Llama 3.3 70B — personnalisée avec ton profil
            </p>
          </div>
          {/* Badge "IA" */}
          <span className="shrink-0 text-xs font-bold px-2 py-1 rounded-full bg-violet-100 text-violet-600">
            IA
          </span>
        </div>

        <button
          onClick={handleGenerate}
          disabled={state === "loading"}
          className="mt-4 w-full border-2 border-violet-500 text-violet-600 hover:bg-violet-50
                     disabled:opacity-50 disabled:cursor-not-allowed font-semibold py-3
                     rounded-xl transition-colors text-sm"
        >
          {state === "loading"
            ? "Génération en cours... (5-10 sec)"
            : state === "done"
            ? "Regénérer la lettre"
            : "Générer ma lettre de motivation"}
        </button>

        {state === "error" && (
          <p className="mt-3 text-sm text-red-500 text-center">
            Erreur lors de la génération. Réessaie dans quelques secondes.
          </p>
        )}
      </div>

      {/* Lettre générée */}
      {state === "done" && letter && (
        <div className="border-t border-gray-100">
          {/* Barre d'actions */}
          <div className="flex items-center justify-between px-5 py-3 bg-gray-50">
            <span className="text-xs text-gray-400">{wordCount} mots</span>
            <button
              onClick={handleCopy}
              className="text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors"
            >
              {copied ? "✓ Copié !" : "Copier la lettre"}
            </button>
          </div>

          {/* Texte de la lettre */}
          <div className="px-5 py-4">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {letter}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

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
        <p className="text-red-500">Opportunité introuvable.</p>
      </div>
    );
  }

  const typeStyle = TYPE_STYLES[opp.type] ?? { label: opp.type, color: "bg-gray-100 text-gray-700" };

  const daysLeft = opp.deadline
    ? Math.ceil((new Date(opp.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold text-emerald-600">OpportuLink</h1>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Retour au feed
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-4">

        {/* Titre + description */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className={"text-xs font-semibold px-2.5 py-1 rounded-full " + typeStyle.color}>
              {typeStyle.label}
            </span>
            {opp.is_verified && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-600">
                Vérifié
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">{opp.title}</h2>
          <p className="text-sm text-gray-400 mb-4">{opp.country}</p>
          <p className="text-gray-600 text-sm leading-relaxed">{opp.description}</p>
        </div>

        {/* Score de préparation */}
        <PrepScoreSection oppId={id} />

        {/* Critères d'éligibilité */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-3">Critères d&apos;éligibilité</h3>
          <div className="space-y-2 text-sm">
            {opp.required_level.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Niveau requis</span>
                <span className="text-gray-800 font-medium">{opp.required_level.join(", ")}</span>
              </div>
            )}
            {opp.required_fields.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Filières</span>
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
              <span className="text-gray-500">Fiabilité</span>
              <span className="text-gray-800 font-medium">{opp.reliability_score}/100</span>
            </div>
          </div>
        </div>

        {/* Deadline */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-3">Deadline</h3>
          {opp.deadline ? (
            <p className={
              daysLeft !== null && daysLeft <= 7
                ? "text-sm font-medium text-red-500"
                : "text-sm font-medium text-gray-700"
            }>
              {new Date(opp.deadline).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {daysLeft !== null && " — " + daysLeft + " jours restants"}
            </p>
          ) : (
            <p className="text-sm text-gray-400">Pas de deadline précisée</p>
          )}
        </div>

        {/* Bouton Postuler */}
        <ApplyButton oppId={id} oppTitle={opp.title} />

        {/* Générateur de lettre IA */}
        <LetterGenerator oppId={id} />

        {/* Lien source officielle */}
        {opp.source_url && (
          <a
            href={opp.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-sm text-gray-400 hover:text-gray-600 underline py-2"
          >
            Voir la source officielle →
          </a>
        )}

      </main>
    </div>
  );
}
