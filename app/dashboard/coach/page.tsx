"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import Link from "next/link";

interface Coaching {
  action: string; action_type: string; action_url: string; action_cta: string;
  urgent_deadlines: { title: string; days: number; id: string }[];
  insights: {
    profile_pct: number; docs_pct: number; applied: number;
    submitted: number; accepted: number; saved: number; missing_docs: string[];
  };
}

const DOC_LABELS: Record<string, string> = { cv: "CV", releve: "Relevé de notes", cni: "CNI / Passeport", attestation: "Attestation" };

const ROADMAP_STEPS = [
  { id: 1, title: "Profil complet",        desc: "Niveau, filière, langues, moyenne, compétences",         check: (c: Coaching) => c.insights.profile_pct >= 85, url: "/dashboard/profile" },
  { id: 2, title: "Dossier complet",       desc: "CV, relevés, CNI, attestation uploadés",                  check: (c: Coaching) => c.insights.docs_pct >= 100,   url: "/dashboard/documents" },
  { id: 3, title: "Première candidature", desc: "Postule à au moins une opportunité",                       check: (c: Coaching) => c.insights.applied >= 1,      url: "/dashboard" },
  { id: 4, title: "Candidature soumise",  desc: "Au moins une candidature en statut Soumise",               check: (c: Coaching) => c.insights.submitted >= 1,    url: "/dashboard/applications" },
  { id: 5, title: "5 opportunités suivies", desc: "Sauvegarde 5 opportunités dans tes favoris",             check: (c: Coaching) => c.insights.saved >= 5,        url: "/dashboard" },
  { id: 6, title: "Lettre IA générée",    desc: "Utilise le générateur de lettre sur une opportunité",      check: () => false,                                    url: "/dashboard" },
];

export default function CoachPage() {
  const router = useRouter();
  const { user, isAuthLoading } = useStore();

  useEffect(() => { if (!isAuthLoading && !user) router.push("/login"); }, [isAuthLoading, user]);

  const { data } = useQuery<Coaching>({
    queryKey: ["coaching"],
    queryFn: async () => (await api.get("/users/me/coaching")).data,
    enabled: !!user,
  });

  if (isAuthLoading || !user) return null;

  const completedSteps = data ? ROADMAP_STEPS.filter(s => s.check(data)).length : 0;
  const progressPct    = Math.round((completedSteps / ROADMAP_STEPS.length) * 100);

  return (
    <div className="px-4 lg:px-5 py-5 max-w-3xl">

      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900">Mon parcours</h2>
        <p className="text-sm text-gray-400 mt-1">
          Ton coach personnalisé — étape par étape vers ta première candidature réussie.
        </p>
      </div>

      {/* Progression globale */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-gray-800">Progression globale</span>
          <span className="text-2xl font-black text-emerald-600">{progressPct}%</span>
        </div>
        <div className="bg-gray-100 rounded-full h-3 overflow-hidden mb-1">
          <div className="h-full rounded-full bg-emerald-500 transition-all duration-700"
            style={{ width: `${progressPct}%` }} />
        </div>
        <p className="text-xs text-gray-400">{completedSteps} / {ROADMAP_STEPS.length} étapes complétées</p>
      </div>

      {/* Roadmap */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-5">
        <div className="p-5 border-b border-gray-50">
          <h3 className="font-bold text-gray-800">Feuille de route</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {ROADMAP_STEPS.map((step, i) => {
            const done    = data ? step.check(data) : false;
            const current = !done && (i === 0 || (data ? ROADMAP_STEPS[i-1].check(data) : false));
            return (
              <div key={step.id}
                className={`flex items-start gap-4 p-4 transition-colors ${current ? "bg-emerald-50" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 mt-0.5 ${
                  done    ? "bg-emerald-500 text-white" :
                  current ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500" :
                            "bg-gray-100 text-gray-400"
                }`}>
                  {done ? "✓" : step.id}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm ${done ? "text-gray-400 line-through" : current ? "text-gray-900" : "text-gray-500"}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
                  {current && (
                    <Link href={step.url}
                      className="inline-block mt-2 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition">
                      Faire maintenant →
                    </Link>
                  )}
                </div>
                {done && <span className="text-emerald-500 text-lg shrink-0">✓</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Documents manquants */}
      {data && data.insights.missing_docs.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-5">
          <h3 className="font-bold text-blue-800 mb-3 text-sm">
            📁 Documents manquants ({data.insights.missing_docs.length})
          </h3>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {data.insights.missing_docs.map(doc => (
              <div key={doc} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border border-blue-100">
                <span className="text-red-400 font-bold text-xs">✕</span>
                <span className="text-sm font-medium text-gray-700">{DOC_LABELS[doc] ?? doc}</span>
              </div>
            ))}
          </div>
          <Link href="/dashboard/documents"
            className="inline-block text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-xl transition">
            Uploader mes documents →
          </Link>
        </div>
      )}

      {/* Conseils selon le profil */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-bold text-gray-800 mb-4 text-sm">💡 Conseils pour maximiser tes chances</h3>
        <div className="space-y-3">
          {[
            { icon: "🎯", tip: "Postule à plusieurs opportunités en même temps. Les taux d'acceptation sont en général faibles — diversifie.", color: "bg-purple-50 border-purple-100" },
            { icon: "✍️", tip: "Personnalise chaque lettre de motivation. Utilise le générateur IA mais adapte toujours l'introduction.", color: "bg-violet-50 border-violet-100" },
            { icon: "📅", tip: "Note les deadlines J-30 dans ton agenda. Une candidature préparée en 2 semaines est toujours meilleure qu'une bâclée en 2 jours.", color: "bg-amber-50 border-amber-100" },
            { icon: "📊", tip: "Un relevé de notes avec une note ≥ 12/20 suffit pour 80% des opportunités sur OpportuLink.", color: "bg-blue-50 border-blue-100" },
            { icon: "🤝", tip: "Pour les stages locaux (MTN, Orange), une recommandation d'un professeur double tes chances.", color: "bg-emerald-50 border-emerald-100" },
          ].map((c, i) => (
            <div key={i} className={`flex items-start gap-3 rounded-xl px-4 py-3 border ${c.color}`}>
              <span className="text-xl shrink-0">{c.icon}</span>
              <p className="text-sm text-gray-700 leading-relaxed">{c.tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
