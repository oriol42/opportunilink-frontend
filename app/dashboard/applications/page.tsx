"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

interface OpportunitySnapshot {
  id: string; title: string; type: string; country: string; deadline: string | null;
}
interface Application {
  id: string; opportunity_id: string;
  status: "draft" | "submitted" | "accepted" | "rejected";
  notes: string | null; prep_score: number | null;
  applied_at: string | null; created_at: string;
  opportunity: OpportunitySnapshot;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  draft:     { label: "Brouillon",   color: "text-gray-600",    bg: "bg-gray-100",    dot: "bg-gray-400" },
  submitted: { label: "Soumise",     color: "text-blue-700",    bg: "bg-blue-100",    dot: "bg-blue-500" },
  accepted:  { label: "Acceptée ✓", color: "text-emerald-700", bg: "bg-emerald-100", dot: "bg-emerald-500" },
  rejected:  { label: "Refusée",    color: "text-red-600",     bg: "bg-red-100",     dot: "bg-red-400" },
};
const TYPE_ACCENT: Record<string, string> = {
  bourse:"from-purple-400 to-violet-300", stage:"from-blue-400 to-cyan-300",
  emploi:"from-emerald-400 to-teal-300", echange:"from-orange-400 to-amber-300",
  concours:"from-red-400 to-rose-300",
};

export default function ApplicationsPage() {
  const router = useRouter();
  const { user, isAuthLoading } = useStore();
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  useEffect(() => {
    if (!isAuthLoading && !user) router.push("/login");
  }, [isAuthLoading, user]);

  const { data: apps, isLoading, isError } = useQuery<Application[]>({
    queryKey: ["applications"],
    queryFn: async () => (await api.get("/applications")).data,
    enabled: !!user,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/applications/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      success("Statut mis à jour");
    },
    onError: () => error("Erreur lors de la mise à jour"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/applications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      success("Candidature supprimée");
    },
  });

  if (isAuthLoading || !user) return null;

  const countByStatus = ["draft","submitted","accepted","rejected"].reduce(
    (acc, s) => ({ ...acc, [s]: apps?.filter(a => a.status === s).length ?? 0 }),
    {} as Record<string, number>
  );

  return (
    <div className="px-4 lg:px-6 py-5 max-w-5xl">
      <div className="mb-5">
        <h2 className="text-2xl font-syne font-black text-gray-900">Mes candidatures</h2>
        <p className="text-sm text-gray-400 mt-1">
          {apps ? `${apps.length} candidature${apps.length > 1 ? "s" : ""}` : ""}
        </p>
      </div>

      {/* Stats */}
      {apps && apps.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[
            { key:"draft",     label:"Brouillons", bg:"bg-gray-100",    text:"text-gray-700" },
            { key:"submitted", label:"Soumises",   bg:"bg-blue-100",    text:"text-blue-700" },
            { key:"accepted",  label:"Acceptées",  bg:"bg-emerald-100", text:"text-emerald-700" },
            { key:"rejected",  label:"Refusées",   bg:"bg-red-100",     text:"text-red-600" },
          ].map(({ key, label, bg, text }) => (
            <div key={key} className={`${bg} rounded-2xl p-3 text-center`}>
              <p className={`text-xl font-black ${text}`}>{countByStatus[key]}</p>
              <p className={`text-[10px] font-semibold ${text} opacity-80`}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="h-[3px] bg-gray-200" />
              <div className="p-4 space-y-2.5">
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-100 rounded w-1/5" />
                  <div className="h-4 bg-gray-100 rounded w-1/5" />
                </div>
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-2/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-red-600 text-sm text-center">
          Erreur lors du chargement.
        </div>
      )}

      {!isLoading && apps?.length === 0 && (
        <div className="text-center py-20">
          <p className="text-6xl mb-4">📋</p>
          <p className="font-bold text-gray-800 mb-1">Aucune candidature</p>
          <p className="text-sm text-gray-400 mb-6">Explore le feed et postule !</p>
          <button onClick={() => router.push("/dashboard")}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-2xl transition text-sm">
            Explorer le feed →
          </button>
        </div>
      )}

      {apps && apps.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {apps.map((app, i) => {
            const s = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.draft;
            const accent = TYPE_ACCENT[app.opportunity.type] ?? "from-gray-300 to-gray-200";
            const daysLeft = app.opportunity.deadline
              ? Math.ceil((new Date(app.opportunity.deadline).getTime() - Date.now()) / 86400000)
              : null;
            return (
              <div key={app.id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-sm transition-all animate-fade-up"
                style={{ animationDelay: `${i * 30}ms` }}>
                <div className={`h-[3px] bg-gradient-to-r ${accent}`} />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                    {daysLeft !== null && daysLeft >= 0 && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${daysLeft <= 7 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"}`}>
                        {daysLeft <= 7 ? `🔥 J-${daysLeft}` : `J-${daysLeft}`}
                      </span>
                    )}
                  </div>
                  <button onClick={() => router.push(`/opportunity/${app.opportunity.id}`)}
                    className="text-left font-bold text-gray-900 text-sm leading-snug hover:text-emerald-600 transition w-full mb-1.5">
                    {app.opportunity.title}
                  </button>
                  <p className="text-xs text-gray-400 mb-3">🌍 {app.opportunity.country}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <select value={app.status}
                      onChange={(e) => statusMutation.mutate({ id: app.id, status: e.target.value })}
                      disabled={statusMutation.isPending}
                      className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 font-medium">
                      <option value="draft">Brouillon</option>
                      <option value="submitted">Soumise</option>
                      <option value="accepted">Acceptée</option>
                      <option value="rejected">Refusée</option>
                    </select>
                    <button onClick={() => { if (confirm("Supprimer ?")) deleteMutation.mutate(app.id); }}
                      className="text-xs text-gray-300 hover:text-red-400 transition px-2 py-1.5 font-medium">
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
