"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";

interface Application {
  id: string; opportunity_id: string;
  status: "draft"|"submitted"|"accepted"|"rejected";
  notes: string|null; prep_score: number|null;
  applied_at: string|null; created_at: string;
  opportunity: { id: string; title: string; type: string; country: string; deadline: string|null };
}

const STATUS: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  draft:     { label:"Brouillon",   color:"#6b7280", bg:"#f3f4f6", dot:"#9ca3af" },
  submitted: { label:"Soumise",     color:"#2563eb", bg:"#dbeafe", dot:"#3b82f6" },
  accepted:  { label:"Acceptée ✓", color:"#059669", bg:"#d1fae5", dot:"#10b981" },
  rejected:  { label:"Refusée",    color:"#dc2626", bg:"#fee2e2", dot:"#ef4444" },
};

const TYPE_COLOR: Record<string, string> = {
  bourse:"#7c3aed", stage:"#2563eb", emploi:"#059669", echange:"#d97706", concours:"#dc2626",
};

function daysLeft(d: string|null) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

export default function ApplicationsPage() {
  const router = useRouter();
  const { user, isAuthLoading } = useStore();
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  useEffect(() => { if (!isAuthLoading && !user) router.push("/login"); }, [isAuthLoading, user]);

  const { data: apps, isLoading } = useQuery<Application[]>({
    queryKey: ["applications"], queryFn: async () => (await api.get("/applications")).data, enabled: !!user,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.put(`/applications/${id}`, { status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["applications"] }); success("Statut mis à jour"); },
    onError: () => toastError("Erreur"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/applications/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["applications"] }); success("Supprimée"); },
  });

  if (isAuthLoading || !user) return null;

  const byStatus = (s: string) => apps?.filter(a => a.status === s).length ?? 0;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Topbar */}
      <div style={{ background: "#fff", borderBottom: "0.5px solid #f3f4f6", padding: "18px 24px", flexShrink: 0 }}>
        <h1 style={{ fontWeight: 900, fontSize: 22, color: "#111827", marginBottom: 4 }}>Mes candidatures</h1>
        <p style={{ fontSize: 13, color: "#9ca3af" }}>{apps ? `${apps.length} candidature${apps.length > 1 ? "s" : ""}` : ""}</p>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

        {/* Stats */}
        {apps && apps.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
            {[
              { label:"Brouillons", val: byStatus("draft"),     color:"#9ca3af", bg:"#f9fafb" },
              { label:"Soumises",   val: byStatus("submitted"), color:"#2563eb", bg:"#eff6ff" },
              { label:"Acceptées",  val: byStatus("accepted"),  color:"#059669", bg:"#f0fdf4" },
              { label:"Refusées",   val: byStatus("rejected"),  color:"#dc2626", bg:"#fef2f2" },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: "14px 16px", textAlign: "center" }}>
                <p style={{ fontWeight: 900, fontSize: 28, color: s.color, lineHeight: 1 }}>{s.val}</p>
                <p style={{ fontSize: 11, fontWeight: 600, color: s.color, opacity: .7, marginTop: 4 }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {isLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1,2,3].map(i => <div key={i} style={{ background: "#fff", borderRadius: 16, border: "0.5px solid #f3f4f6", height: 90 }} className="animate-pulse" />)}
          </div>
        )}

        {!isLoading && apps?.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>📋</p>
            <p style={{ fontWeight: 800, fontSize: 18, color: "#111827", marginBottom: 8 }}>Aucune candidature</p>
            <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 24 }}>Explore le feed et postule à une opportunité.</p>
            <Link href="/dashboard"
              style={{ background: "#059669", color: "#fff", fontWeight: 700, fontSize: 14,
                padding: "10px 24px", borderRadius: 12, textDecoration: "none" }}>
              Explorer →
            </Link>
          </div>
        )}

        {apps && apps.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
            {apps.map(app => {
              const s   = STATUS[app.status] ?? STATUS.draft;
              const d   = daysLeft(app.opportunity.deadline);
              const col = TYPE_COLOR[app.opportunity.type] ?? "#6b7280";
              return (
                <div key={app.id} style={{ background: "#fff", borderRadius: 16, border: "0.5px solid #f3f4f6", overflow: "hidden" }}>
                  <div style={{ height: 3, background: col }} />
                  <div style={{ padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: s.color, background: s.bg,
                        padding: "3px 10px", borderRadius: 20, display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot }} />
                        {s.label}
                      </span>
                      {d !== null && d >= 0 && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: d <= 7 ? "#dc2626" : "#9ca3af" }}>
                          J-{d}
                        </span>
                      )}
                    </div>
                    <button onClick={() => router.push(`/opportunity/${app.opportunity.id}`)}
                      style={{ fontWeight: 700, fontSize: 14, color: "#111827", background: "none", border: "none",
                        cursor: "pointer", textAlign: "left", padding: 0, marginBottom: 6, width: "100%", lineHeight: 1.3 }}>
                      {app.opportunity.title}
                    </button>
                    <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 12 }}>🌍 {app.opportunity.country}</p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "0.5px solid #f9fafb", paddingTop: 10 }}>
                      <select value={app.status}
                        onChange={e => statusMutation.mutate({ id: app.id, status: e.target.value })}
                        style={{ fontSize: 11, border: "0.5px solid #e5e7eb", borderRadius: 8, padding: "4px 8px", background: "#fff", outline: "none", cursor: "pointer" }}>
                        <option value="draft">Brouillon</option>
                        <option value="submitted">Soumise</option>
                        <option value="accepted">Acceptée</option>
                        <option value="rejected">Refusée</option>
                      </select>
                      <button onClick={() => { if (confirm("Supprimer ?")) deleteMutation.mutate(app.id); }}
                        style={{ fontSize: 11, color: "#d1d5db", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>
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
    </div>
  );
}
