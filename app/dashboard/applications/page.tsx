"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Trash2,
  ExternalLink,
  MapPin,
  Calendar,
} from "lucide-react";

interface Application {
  id: string;
  opportunity_id: string;
  status: "draft" | "submitted" | "accepted" | "rejected";
  notes: string | null;
  prep_score: number | null;
  applied_at: string | null;
  created_at: string;
  opportunity: {
    id: string;
    title: string;
    type: string;
    country: string;
    deadline: string | null;
  };
}

const STATUS_CONFIG = {
  draft:     { label: "En cours",  Icon: Clock,       color: "#94a3b8", bg: "#f1f5f9", border: "#e2e8f0" },
  submitted: { label: "Soumise",   Icon: Send,        color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
  accepted:  { label: "Acceptée",  Icon: CheckCircle, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  rejected:  { label: "Refusée",   Icon: XCircle,     color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
} as const;

const TYPE_COLOR: Record<string, string> = {
  bourse: "#7c3aed",
  stage: "#2563eb",
  emploi: "#059669",
  echange: "#d97706",
  concours: "#dc2626",
};

const TYPE_LABEL: Record<string, string> = {
  bourse: "Bourse",
  stage: "Stage",
  emploi: "Emploi",
  echange: "Échange",
  concours: "Concours",
};

function daysLeft(d: string | null) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

export default function ApplicationsPage() {
  const router = useRouter();
  const { user, isAuthLoading } = useStore();
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  useEffect(() => {
    if (!isAuthLoading && !user) router.push("/login");
  }, [isAuthLoading, user]);

  const { data: apps, isLoading } = useQuery<Application[]>({
    queryKey: ["applications"],
    queryFn: async () => (await api.get("/applications")).data,
    enabled: !!user,
  });

  // Seuls les statuts que l'utilisateur CONTRÔLE
  const markSubmitted = useMutation({
    mutationFn: (id: string) => api.put(`/applications/${id}`, { status: "submitted" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      success("Candidature marquée comme soumise !");
    },
    onError: () => toastError("Erreur, réessaie."),
  });

  const deleteApp = useMutation({
    mutationFn: (id: string) => api.delete(`/applications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["my-stats"] });
      success("Candidature supprimée");
    },
    onError: () => toastError("Erreur lors de la suppression."),
  });

  if (isAuthLoading || !user) return null;

  const counts = {
    total:     apps?.length ?? 0,
    submitted: apps?.filter(a => a.status === "submitted").length ?? 0,
    accepted:  apps?.filter(a => a.status === "accepted").length ?? 0,
    draft:     apps?.filter(a => a.status === "draft").length ?? 0,
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#f8fafc" }}>

      {/* Header */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #f1f5f9",
        padding: "20px 28px 16px",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <ClipboardList size={22} color="#059669" />
          <h1 style={{ fontWeight: 900, fontSize: 22, color: "#0f172a" }}>
            Mes candidatures
          </h1>
        </div>
        <p style={{ fontSize: 14, color: "#94a3b8", marginLeft: 34 }}>
          Suis l'état de toutes tes candidatures en un seul endroit
        </p>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>

        {/* Stats 4 colonnes */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 24,
        }}>
          {[
            { label: "Total",       val: counts.total,     color: "#0f172a", bg: "#f8fafc", border: "#e2e8f0", Icon: ClipboardList },
            { label: "En cours",    val: counts.draft,     color: "#64748b", bg: "#f8fafc", border: "#e2e8f0", Icon: Clock },
            { label: "Soumises",    val: counts.submitted, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", Icon: Send },
            { label: "Acceptées",   val: counts.accepted,  color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", Icon: CheckCircle },
          ].map(({ label, val, color, bg, border, Icon: StatIcon }) => (
            <div key={label} style={{
              background: bg,
              border: `1px solid ${border}`,
              borderRadius: 14,
              padding: "16px 18px",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <StatIcon size={16} color={color} />
                <span style={{ fontSize: 24, fontWeight: 900, color }}>{val}</span>
              </div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Explication des statuts */}
        <div style={{
          background: "#fefce8",
          border: "1px solid #fde68a",
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 20,
          fontSize: 13,
          color: "#92400e",
        }}>
          <strong>Comment ça marche ?</strong> Crée une candidature quand tu veux postuler,
          puis marque-la <strong>"Soumise"</strong> une fois que tu as envoyé ton dossier.
          Le statut <strong>"Acceptée" ou "Refusée"</strong> sera mis à jour par l'organisation.
        </div>

        {/* Chargement */}
        {isLoading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: "#fff", borderRadius: 16, height: 140, border: "1px solid #f1f5f9" }}
                className="animate-pulse" />
            ))}
          </div>
        )}

        {/* Vide */}
        {!isLoading && apps?.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "80px 20px",
            background: "#fff",
            borderRadius: 20,
            border: "1px solid #f1f5f9",
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "#f0fdf4",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <ClipboardList size={28} color="#16a34a" />
            </div>
            <p style={{ fontWeight: 800, fontSize: 18, color: "#0f172a", marginBottom: 8 }}>
              Aucune candidature
            </p>
            <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 24 }}>
              Explore le feed et postule à une opportunité qui te correspond.
            </p>
            <Link href="/dashboard" style={{
              background: "#059669",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              padding: "10px 24px",
              borderRadius: 12,
              textDecoration: "none",
            }}>
              Explorer le feed →
            </Link>
          </div>
        )}

        {/* Liste */}
        {apps && apps.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 14,
          }}>
            {apps.map(app => {
              const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.draft;
              const StatusIcon = cfg.Icon;
              const d = daysLeft(app.opportunity.deadline);
              const typeColor = TYPE_COLOR[app.opportunity.type] ?? "#6b7280";
              const typeLabel = TYPE_LABEL[app.opportunity.type] ?? app.opportunity.type;

              return (
                <div key={app.id} style={{
                  background: "#fff",
                  borderRadius: 16,
                  border: "1px solid #f1f5f9",
                  overflow: "hidden",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}>
                  {/* Barre couleur type */}
                  <div style={{ height: 3, background: typeColor }} />

                  <div style={{ padding: "16px 18px" }}>
                    {/* Row: type + deadline */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700,
                        color: typeColor,
                        background: typeColor + "18",
                        padding: "3px 10px",
                        borderRadius: 20,
                      }}>
                        {typeLabel}
                      </span>
                      {d !== null && d >= 0 && (
                        <span style={{
                          fontSize: 11, fontWeight: 700,
                          color: d <= 7 ? "#dc2626" : "#94a3b8",
                          display: "flex", alignItems: "center", gap: 4,
                        }}>
                          <Calendar size={11} />
                          J-{d}
                        </span>
                      )}
                      {d !== null && d < 0 && (
                        <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>
                          Expirée
                        </span>
                      )}
                    </div>

                    {/* Titre */}
                    <Link
                      href={`/opportunity/${app.opportunity.id}`}
                      style={{
                        display: "block",
                        fontWeight: 700,
                        fontSize: 15,
                        color: "#0f172a",
                        textDecoration: "none",
                        lineHeight: 1.35,
                        marginBottom: 8,
                      }}
                    >
                      {app.opportunity.title}
                    </Link>

                    {/* Pays */}
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 14 }}>
                      <MapPin size={12} color="#94a3b8" />
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>{app.opportunity.country}</span>
                    </div>

                    {/* Statut badge */}
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      borderRadius: 20,
                      background: cfg.bg,
                      border: `1px solid ${cfg.border}`,
                      marginBottom: 14,
                    }}>
                      <StatusIcon size={13} color={cfg.color} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>

                    {/* Actions */}
                    <div style={{
                      display: "flex",
                      gap: 8,
                      borderTop: "1px solid #f8fafc",
                      paddingTop: 12,
                    }}>
                      {/* Marquer soumise — seulement si en cours */}
                      {app.status === "draft" && (
                        <button
                          onClick={() => markSubmitted.mutate(app.id)}
                          disabled={markSubmitted.isPending}
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            padding: "8px 12px",
                            background: "#059669",
                            color: "#fff",
                            border: "none",
                            borderRadius: 10,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          <Send size={12} />
                          Marquer soumise
                        </button>
                      )}

                      {/* Voir l'opportunité */}
                      <Link
                        href={`/opportunity/${app.opportunity.id}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "8px 12px",
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: 10,
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#64748b",
                          textDecoration: "none",
                        }}
                      >
                        <ExternalLink size={12} />
                        Voir
                      </Link>

                      {/* Supprimer */}
                      <button
                        onClick={() => {
                          if (window.confirm("Supprimer cette candidature ?")) {
                            deleteApp.mutate(app.id);
                          }
                        }}
                        disabled={deleteApp.isPending}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 5,
                          padding: "8px 10px",
                          background: "#fef2f2",
                          border: "1px solid #fecaca",
                          borderRadius: 10,
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#dc2626",
                          cursor: "pointer",
                        }}
                        title="Supprimer cette candidature"
                      >
                        <Trash2 size={13} />
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
