"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";

interface OpportunitySnapshot {
  id: string;
  title: string;
  type: string;
  country: string;
  deadline: string | null;
}

interface Application {
  id: string;
  opportunity_id: string;
  status: "draft" | "submitted" | "accepted" | "rejected";
  notes: string | null;
  prep_score: number | null;
  applied_at: string | null;
  created_at: string;
  opportunity: OpportunitySnapshot;
}

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: "Brouillon",   color: "text-gray-600",    bg: "bg-gray-100" },
  submitted: { label: "Soumise",     color: "text-blue-700",   bg: "bg-blue-100" },
  accepted:  { label: "Acceptée ✓", color: "text-emerald-700", bg: "bg-emerald-100" },
  rejected:  { label: "Refusée",    color: "text-red-600",     bg: "bg-red-100" },
};

const TYPE_COLORS: Record<string, string> = {
  bourse: "bg-purple-500", stage: "bg-blue-500",
  emploi: "bg-green-500", echange: "bg-orange-500", concours: "bg-red-500",
};

async function fetchApplications(): Promise<Application[]> {
  const res = await api.get("/applications");
  return res.data;
}

function DeadlineBadge({ deadline }: { deadline: string | null }) {
  if (!deadline) return null;
  const daysLeft = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (daysLeft < 0) return <span className="text-xs text-red-400 font-medium">Expirée</span>;
  if (daysLeft <= 7) return <span className="text-xs text-orange-500 font-semibold">⚠️ J-{daysLeft}</span>;
  return <span className="text-xs text-gray-400">{new Date(deadline).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>;
}

export default function ApplicationsPage() {
  const router = useRouter();
  const { user, isAuthLoading } = useStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthLoading && !user) router.push("/login");
  }, [isAuthLoading, user]);

  const { data: applications, isLoading, isError } = useQuery({
    queryKey: ["applications"],
    queryFn: fetchApplications,
    enabled: !!user,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.put(`/applications/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["applications"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/applications/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["applications"] }),
  });

  if (isAuthLoading || !user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Mes candidatures</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          {applications ? `${applications.length} candidature${applications.length > 1 ? "s" : ""}` : ""}
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/4 mb-3" />
              <div className="h-5 bg-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-red-600 text-sm">
          Erreur lors du chargement.
        </div>
      )}

      {!isLoading && applications?.length === 0 && (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">📋</p>
          <p className="font-semibold text-gray-700 mb-1">Aucune candidature</p>
          <p className="text-sm text-gray-400 mb-5">Postule à une opportunité depuis le feed.</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm font-semibold text-emerald-600 border border-emerald-200 px-5 py-2.5 rounded-xl hover:bg-emerald-50 transition"
          >
            Explorer le feed →
          </button>
        </div>
      )}

      {applications && applications.length > 0 && (
        <div className="space-y-3">
          {applications.map((app) => {
            const s = STATUS_STYLES[app.status] ?? STATUS_STYLES.draft;
            const typeColor = TYPE_COLORS[app.opportunity.type] ?? "bg-gray-400";
            return (
              <div key={app.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow">
                {/* Colored top bar by type */}
                <div className={`h-1 ${typeColor}`} />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <button
                      onClick={() => router.push(`/opportunity/${app.opportunity.id}`)}
                      className="text-left font-semibold text-gray-900 text-sm leading-snug hover:text-emerald-600 transition-colors flex-1"
                    >
                      {app.opportunity.title}
                    </button>
                    <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.color}`}>
                      {s.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                    <span>🌍 {app.opportunity.country}</span>
                    <DeadlineBadge deadline={app.opportunity.deadline} />
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <select
                      value={app.status}
                      onChange={(e) => statusMutation.mutate({ id: app.id, status: e.target.value })}
                      disabled={statusMutation.isPending}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    >
                      <option value="draft">Brouillon</option>
                      <option value="submitted">Soumise</option>
                      <option value="accepted">Acceptée</option>
                      <option value="rejected">Refusée</option>
                    </select>
                    <button
                      onClick={() => { if (confirm("Supprimer ?")) deleteMutation.mutate(app.id); }}
                      className="text-xs text-gray-300 hover:text-red-400 transition-colors px-2 py-1.5"
                    >
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
