"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";

interface Coaching {
  action: string;
  action_type: string;
  action_url: string;
  action_cta: string;
  urgent_deadlines: { title: string; days: number; id: string }[];
  insights: {
    profile_pct: number; docs_pct: number;
    applied: number; submitted: number; accepted: number;
    saved: number; missing_docs: string[];
  };
}

const TYPE_STYLE: Record<string, { bg: string; border: string; icon: string; btn: string }> = {
  urgent:  { bg: "bg-red-50",     border: "border-red-200",    icon: "🔥", btn: "bg-red-500 hover:bg-red-600 text-white" },
  profile: { bg: "bg-amber-50",   border: "border-amber-200",  icon: "⚡", btn: "bg-amber-500 hover:bg-amber-600 text-white" },
  document:{ bg: "bg-blue-50",    border: "border-blue-200",   icon: "📁", btn: "bg-blue-500 hover:bg-blue-600 text-white" },
  apply:   { bg: "bg-emerald-50", border: "border-emerald-200",icon: "🎯", btn: "bg-emerald-500 hover:bg-emerald-600 text-white" },
  submit:  { bg: "bg-purple-50",  border: "border-purple-200", icon: "📤", btn: "bg-purple-500 hover:bg-purple-600 text-white" },
  explore: { bg: "bg-gray-50",    border: "border-gray-200",   icon: "✨", btn: "bg-gray-800 hover:bg-gray-900 text-white" },
};

function ProgressRing({ pct, color, size = 48 }: { pct: number; color: string; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
    </svg>
  );
}

export default function CoachingCard() {
  const { data, isLoading } = useQuery<Coaching>({
    queryKey: ["coaching"],
    queryFn: async () => (await api.get("/users/me/coaching")).data,
    staleTime: 3 * 60 * 1000,
  });

  if (isLoading) return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 animate-pulse">
      <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
      <div className="h-3 bg-gray-100 rounded w-full mb-2" />
      <div className="h-3 bg-gray-100 rounded w-3/4" />
    </div>
  );

  if (!data) return null;

  const style = TYPE_STYLE[data.action_type] ?? TYPE_STYLE.explore;

  return (
    <div className="space-y-3 mb-4">

      {/* Action prioritaire */}
      <div className={`${style.bg} border ${style.border} rounded-2xl p-4`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0">{style.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
              Prochaine action recommandée
            </p>
            <p className="text-sm text-gray-800 leading-relaxed font-medium">{data.action}</p>
            <Link href={data.action_url}
              className={`inline-block mt-3 text-xs font-bold px-4 py-2 rounded-xl transition ${style.btn}`}>
              {data.action_cta}
            </Link>
          </div>
        </div>
      </div>

      {/* Deadlines urgentes */}
      {data.urgent_deadlines.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
            ⏰ Deadlines urgentes dans tes favoris
          </p>
          <div className="space-y-2">
            {data.urgent_deadlines.map((d, i) => (
              <Link key={i} href={`/opportunity/${d.id}`}
                className="flex items-center justify-between hover:bg-gray-50 rounded-xl px-3 py-2 -mx-3 transition">
                <p className="text-sm text-gray-800 font-medium truncate flex-1 mr-3">{d.title}</p>
                <span className={`shrink-0 text-xs font-black px-2.5 py-1 rounded-full ${
                  d.days <= 1 ? "bg-red-100 text-red-700" :
                  d.days <= 3 ? "bg-orange-100 text-orange-700" :
                  "bg-amber-100 text-amber-700"
                }`}>
                  {d.days === 0 ? "Auj. !" : `J-${d.days}`}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Insights — 4 métriques */}
      <div className="grid grid-cols-2 gap-3">

        {/* Profil */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Profil</p>
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <ProgressRing pct={data.insights.profile_pct} color={data.insights.profile_pct >= 80 ? "#10b981" : "#f59e0b"} />
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-gray-800">
                {data.insights.profile_pct}%
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                {data.insights.profile_pct >= 80 ? "Complet" : "Incomplet"}
              </p>
              <Link href="/dashboard/profile" className="text-[11px] text-emerald-600 font-semibold hover:underline">
                Améliorer →
              </Link>
            </div>
          </div>
        </div>

        {/* Dossier */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Dossier</p>
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <ProgressRing pct={data.insights.docs_pct} color={data.insights.docs_pct >= 75 ? "#10b981" : "#3b82f6"} />
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-gray-800">
                {data.insights.docs_pct}%
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                {data.insights.docs_pct >= 100 ? "Complet" : `${data.insights.docs_pct}%`}
              </p>
              {data.insights.missing_docs.length > 0 && (
                <Link href="/dashboard/documents" className="text-[11px] text-blue-600 font-semibold hover:underline">
                  +{data.insights.missing_docs.length} manquant{data.insights.missing_docs.length > 1 ? "s" : ""} →
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
