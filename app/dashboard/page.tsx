"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { logout } from "@/lib/auth";
import { api } from "@/lib/api";
import { OpportunityCard, Opportunity } from "@/components/opportunity/OpportunityCard";

async function fetchFeed(): Promise<Opportunity[]> {
  const res = await api.get("/opportunities");
  return res.data;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthLoading } = useStore();

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/login");
    }
  }, [isAuthLoading, user]);

  const { data: opportunities, isLoading, isError } = useQuery({
    queryKey: ["feed"],
    queryFn: fetchFeed,
    enabled: !!user,
  });

  if (isAuthLoading || !user) return null;

  const profileComplete = user.level && user.field && user.languages.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold text-emerald-600">OpportuLink</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard/profile")}
            className="text-sm text-emerald-600 hover:underline font-medium"
          >
            Mon profil
          </button>
          <button onClick={logout} className="text-gray-500 hover:text-gray-700 text-sm">
            Déconnexion
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Bonjour, {user.full_name.split(" ")[0]} 👋
          </h2>
          <p className="text-gray-500 mt-1">Voici les opportunités sélectionnées pour toi.</p>
        </div>

        {!profileComplete && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="text-amber-800 font-medium text-sm">Profil incomplet</p>
              <p className="text-amber-600 text-xs mt-0.5">Complete ton profil pour de meilleures recommandations.</p>
            </div>
            <button
              onClick={() => router.push("/dashboard/profile")}
              className="text-xs bg-amber-500 text-white px-3 py-2 rounded-lg hover:bg-amber-600 transition font-medium whitespace-nowrap"
            >
              Compléter →
            </button>
          </div>
        )}

        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/4 mb-3" />
                <div className="h-5 bg-gray-100 rounded w-3/4 mb-3" />
                <div className="h-2 bg-gray-100 rounded w-full" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-5 text-red-600 text-sm">
            Erreur lors du chargement du feed. Vérifie que le backend tourne.
          </div>
        )}

        {opportunities && opportunities.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-medium">Aucune opportunité pour le moment.</p>
          </div>
        )}

        {opportunities && (
          <div className="space-y-4">
            {opportunities.map((opp) => (
              <OpportunityCard key={opp.id} opp={opp} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
