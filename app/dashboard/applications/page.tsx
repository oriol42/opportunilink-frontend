"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";

// --- Types ---

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

// --- Constants ---

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  draft:     { label: "Brouillon",  color: "bg-gray-100 text-gray-600" },
  submitted: { label: "Soumise",    color: "bg-blue-100 text-blue-700" },
  accepted:  { label: "Acceptée ✓", color: "bg-emerald-100 text-emerald-700" },
  rejected:  { label: "Refusée",    color: "bg-red-100 text-red-600" },
};

const TYPE_LABELS: Record<string, string> = {
  bourse: "Bourse", stage: "Stage", emploi: "Emploi",
  echange: "Échange", concours: "Concours",
};

// --- API calls ---

async function fetchApplications(): Promise<Application[]> {
  const res = await api.get("/applications");
  return res.data;
}

async function updateStatus(id: string, status: string): Promise<void> {
  await api.put(`/applications/${id}`, { status });
}

async function deleteApplication(id: string): Promise<void> {
  await api.delete(`/applications/${id}`);
}

// --- Helpers ---

function DeadlineBadge({ deadline }: { deadline: string | null }) {
  if (!deadline) return null;
  const daysLeft = Math.ceil(
    (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (daysLeft < 0) return <span className="text-xs text-red-400">Expirée</span>;
  if (daysLeft <= 7) return <span className="text-xs text-red-500 font-medium">⚠️ {daysLeft}j</span>;
  return (
    <span className="text-xs text-gray-400">
      {new Date(deadline).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
    </span>
  );
}

// --- Main component ---

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

  // useMutation for status update — invalidates the list on success
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["applications"] }),
  });

  // useMutation for delete — invalidates the list on success
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteApplication(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["applications"] }),
  });

  if (isAuthLoading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-emerald-600">OpportuLink</h1>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/dashboard/profile")} className="text-sm text-gray-500 hover:text-emerald-600 transition">Mon profil</button>
          </div>
        </div>
        {/* Navigation tabs */}
        <div className="max-w-2xl mx-auto flex gap-1 mt-3">
          <button onClick={() => router.push("/dashboard")} className="text-sm font-medium px-4 py-1.5 rounded-full text-gray-500 hover:bg-gray-100 transition">Feed</button>
          <button className="text-sm font-semibold px-4 py-1.5 rounded-full bg-emerald-600 text-white">Candidatures</button>
          <button onClick={() => router.push("/dashboard/documents")} className="text-sm font-medium px-4 py-1.5 rounded-full text-gray-500 hover:bg-gray-100 transition">Documents</button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-gray-800">Mes candidatures</h2>
          <p className="text-gray-500 mt-1 text-sm">Suis l'état de toutes tes candidatures.</p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/4 mb-3" />
                <div className="h-5 bg-gray-100 rounded w-3/4" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-5 text-red-600 text-sm">
            Erreur lors du chargement des candidatures.
          </div>
        )}

        {/* Empty state */}
        {!isLoading && applications?.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-medium">Aucune candidature pour l'instant.</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-3 text-sm text-emerald-600 hover:underline"
            >
              Explorer les opportunités →
            </button>
          </div>
        )}

        {/* Applications list */}
        {applications && applications.length > 0 && (
          <div className="space-y-4">
            {applications.map((app) => {
              const statusStyle = STATUS_STYLES[app.status] ?? STATUS_STYLES.draft;
              return (
                <div key={app.id} className="bg-white rounded-xl border border-gray-100 p-5">
                  {/* Top row: type badge + status badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                        {TYPE_LABELS[app.opportunity.type] ?? app.opportunity.type}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyle.color}`}>
                        {statusStyle.label}
                      </span>
                    </div>
                    <span className="text-sm text-gray-400">🌍 {app.opportunity.country}</span>
                  </div>

                  {/* Title — clickable to detail page */}
                  <button
                    onClick={() => router.push(`/opportunity/${app.opportunity.id}`)}
                    className="text-left font-semibold text-gray-800 hover:text-emerald-600 transition mb-3 leading-snug block"
                  >
                    {app.opportunity.title}
                  </button>

                  {/* Bottom row: deadline + status selector + delete */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <DeadlineBadge deadline={app.opportunity.deadline} />

                    <div className="flex items-center gap-2">
                      {/* Status update dropdown */}
                      <select
                        value={app.status}
                        onChange={(e) =>
                          statusMutation.mutate({ id: app.id, status: e.target.value })
                        }
                        disabled={statusMutation.isPending}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
                      >
                        <option value="draft">Brouillon</option>
                        <option value="submitted">Soumise</option>
                        <option value="accepted">Acceptée</option>
                        <option value="rejected">Refusée</option>
                      </select>

                      {/* Delete button */}
                      <button
                        onClick={() => {
                          if (confirm("Supprimer cette candidature ?")) {
                            deleteMutation.mutate(app.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="text-xs text-gray-400 hover:text-red-500 transition px-2 py-1.5"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
