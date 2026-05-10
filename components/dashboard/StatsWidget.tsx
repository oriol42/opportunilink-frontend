"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Stats {
  applications: { total: number; accepted: number; submitted: number };
  saved_count: number;
  documents_count: number;
  profile_pct: number;
  member_since: string;
}

export default function StatsWidget() {
  const { data } = useQuery<Stats>({
    queryKey: ["my-stats"],
    queryFn: async () => (await api.get("/users/me/stats")).data,
    staleTime: 2 * 60 * 1000,
  });

  if (!data) return null;

  const items = [
    { label: "Candidatures",  val: data.applications.total,    emoji: "📋", color: "text-blue-600",    bg: "bg-blue-50" },
    { label: "Acceptées",     val: data.applications.accepted,  emoji: "✅", color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Favoris",       val: data.saved_count,            emoji: "🔖", color: "text-amber-600",   bg: "bg-amber-50" },
    { label: "Documents",     val: data.documents_count,        emoji: "📁", color: "text-purple-600",  bg: "bg-purple-50" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800 text-sm">Ton activité</h3>
        <span className="text-xs text-gray-400">Membre depuis {data.member_since}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {items.map(({ label, val, emoji, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
            <p className="text-base mb-0.5">{emoji}</p>
            <p className={`text-xl font-black ${color}`}>{val}</p>
            <p className="text-[10px] text-gray-500 font-semibold mt-0.5 leading-tight">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
