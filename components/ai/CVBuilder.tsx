"use client";
import { useState } from "react";
import { api } from "@/lib/api";

interface CVAdvice {
  titre_cv: string;
  resume: string;
  competences_a_mettre_en_avant: string[];
  points_a_valoriser: string[];
  conseils: string[];
  opportunity_title: string;
}

type BuilderState = "idle" | "loading" | "done" | "error";

export default function CVBuilder({ oppId }: { oppId: string }) {
  const [state, setState] = useState<BuilderState>("idle");
  const [advice, setAdvice] = useState<CVAdvice | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setState("loading");
    setAdvice(null);
    try {
      const res = await api.post<CVAdvice>("/ai/generate-cv", { opportunity_id: oppId });
      setAdvice(res.data);
      setState("done");
    } catch {
      setState("error");
    }
  }

  async function handleCopy() {
    if (!advice) return;
    const text = [
      `TITRE : ${advice.titre_cv}`,
      `\nRÉSUMÉ PROFIL :\n${advice.resume}`,
      `\nCOMPÉTENCES :\n${advice.competences_a_mettre_en_avant.map(c => `• ${c}`).join("\n")}`,
      `\nPOINTS À VALORISER :\n${advice.points_a_valoriser.map(p => `• ${p}`).join("\n")}`,
      `\nCONSEILS :\n${advice.conseils.map(c => `→ ${c}`).join("\n")}`,
    ].join("");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <h3 className="font-semibold text-gray-800">Optimisation CV IA</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Conseils personnalisés pour adapter ton CV à cette opportunité
            </p>
          </div>
          <span className="shrink-0 text-xs font-bold px-2 py-1 rounded-full bg-teal-100 text-teal-600">
            IA
          </span>
        </div>

        <button
          onClick={handleGenerate}
          disabled={state === "loading"}
          className="mt-4 w-full border-2 border-teal-500 text-teal-600 hover:bg-teal-50
                     disabled:opacity-50 disabled:cursor-not-allowed font-semibold py-3
                     rounded-xl transition-colors text-sm"
        >
          {state === "loading"
            ? "Analyse en cours... (5-10 sec)"
            : state === "done"
            ? "Régénérer les conseils"
            : "Optimiser mon CV pour cette opportunité"}
        </button>

        {state === "error" && (
          <p className="mt-3 text-sm text-red-500 text-center">
            Erreur lors de la génération. Réessaie dans quelques secondes.
          </p>
        )}
      </div>

      {/* Résultats */}
      {state === "done" && advice && (
        <div className="border-t border-gray-100">
          {/* Barre d'actions */}
          <div className="flex items-center justify-between px-5 py-3 bg-gray-50">
            <span className="text-xs text-gray-400 font-medium">Conseils prêts ✓</span>
            <button
              onClick={handleCopy}
              className="text-xs font-semibold text-teal-600 hover:text-teal-800 transition-colors"
            >
              {copied ? "✓ Copié !" : "Tout copier"}
            </button>
          </div>

          <div className="px-5 py-4 space-y-5">

            {/* Titre CV */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Titre suggéré pour ton CV
              </p>
              <div className="bg-teal-50 rounded-xl px-4 py-3 border border-teal-100">
                <p className="text-sm font-bold text-teal-800">{advice.titre_cv}</p>
              </div>
            </div>

            {/* Résumé profil */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Accroche / Résumé profil
              </p>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl px-4 py-3">
                {advice.resume}
              </p>
            </div>

            {/* Compétences */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Compétences à mettre en avant
              </p>
              <div className="flex flex-wrap gap-2">
                {advice.competences_a_mettre_en_avant.map((c, i) => (
                  <span key={i} className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Points à valoriser */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Points à valoriser dans tes expériences
              </p>
              <ul className="space-y-2">
                {advice.points_a_valoriser.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-emerald-500 shrink-0 mt-0.5 font-bold">→</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            {/* Conseils */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Conseils clés
              </p>
              <div className="space-y-2">
                {advice.conseils.map((c, i) => (
                  <div key={i} className="flex items-start gap-2.5 bg-amber-50 rounded-xl px-3 py-2.5 border border-amber-100">
                    <span className="text-amber-500 shrink-0 font-bold text-sm">{i + 1}</span>
                    <p className="text-sm text-amber-800">{c}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
