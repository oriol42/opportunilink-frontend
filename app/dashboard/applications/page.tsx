"use client";
import { Suspense } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";
import {
  ClipboardList, CheckCircle, XCircle, Clock,
  Send, Trash2, ExternalLink, MapPin, Calendar, LoaderCircle, Info,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

interface Application {
  id: string; opportunity_id: string;
  status: "draft" | "submitted" | "accepted" | "rejected";
  notes: string | null; prep_score: number | null;
  applied_at: string | null; created_at: string;
  opportunity: { id: string; title: string; type: string; country: string; deadline: string | null };
}
const STATUS_CONFIG = {
  draft:     { label:"En cours",  Icon:Clock,       color:"var(--text-muted)",   bg:"var(--bg-surface-2)", border:"var(--border)" },
  submitted: { label:"Soumise",   Icon:Send,        color:"#3b82f6",             bg:"rgba(59,130,246,.1)", border:"rgba(59,130,246,.25)" },
  accepted:  { label:"Acceptée",  Icon:CheckCircle, color:"var(--text-success)", bg:"var(--bg-success)",   border:"var(--border-success)" },
  rejected:  { label:"Refusée",   Icon:XCircle,     color:"var(--text-danger)",  bg:"var(--bg-danger)",    border:"var(--border-danger)" },
} as const;
const TYPE_COLOR: Record<string,string> = { bourse:"#7c3aed", stage:"#2563eb", emploi:"#059669", echange:"#d97706", concours:"#dc2626" };
const TYPE_LABEL: Record<string,string> = { bourse:"Bourse", stage:"Stage", emploi:"Emploi", echange:"Échange", concours:"Concours" };
function daysLeft(d: string | null) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

function ApplicationsInner() {
  const router = useRouter();
  const { user, isAuthLoading } = useStore();
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  useEffect(() => { if (!isAuthLoading && !user) router.push("/login"); }, [isAuthLoading, user, router]);

  const { data: apps, isLoading } = useQuery<Application[]>({
    queryKey: ["applications"],
    queryFn: async () => (await api.get("/applications")).data,
    enabled: !!user,
  });

  const markSubmitted = useMutation({
    mutationFn: (id: string) => api.put(`/applications/${id}`, { status: "submitted" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["applications"] }); success("Candidature marquée comme soumise !"); },
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
    <div style={{ height:"100%", display:"flex", flexDirection:"column", background:"var(--bg-base)" }}>
      <div style={{ background:"var(--bg-card)", borderBottom:"1px solid var(--border-subtle)", padding:"20px 28px 16px", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:4 }}>
          <ClipboardList size={20} color="var(--accent-dark)" />
          <h1 style={{ fontFamily:"var(--font-voice)", fontWeight:500, fontSize:22, color:"var(--text-primary)" }}>Mes candidatures</h1>
        </div>
        <p style={{ fontSize:14, color:"var(--text-muted)", marginLeft:32 }}>Suis l'état de toutes tes candidatures en un seul endroit</p>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }}>
        <div className="applications-stats-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
          {[
            { label:"Total",     val:counts.total,     color:"var(--text-primary)", bg:"var(--bg-surface-2)", border:"var(--border)", Icon:ClipboardList },
            { label:"En cours",  val:counts.draft,     color:"var(--text-secondary)", bg:"var(--bg-surface-2)", border:"var(--border)", Icon:Clock },
            { label:"Soumises",  val:counts.submitted, color:"#3b82f6", bg:"rgba(59,130,246,.08)", border:"rgba(59,130,246,.2)", Icon:Send },
            { label:"Acceptées", val:counts.accepted,  color:"var(--text-success)", bg:"var(--bg-success)", border:"var(--border-success)", Icon:CheckCircle },
          ].map(({ label, val, color, bg, border, Icon: SI }) => (
            <div key={label} style={{ background:bg, border:`1px solid ${border}`, borderRadius:14, padding:"16px 18px" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                <SI size={16} color={color} />
                <span style={{ fontFamily:"var(--font-voice)", fontSize:22, fontWeight:600, color }}>{val}</span>
              </div>
              <p style={{ fontSize:12, fontWeight:600, color:"var(--text-muted)" }}>{label}</p>
            </div>
          ))}
        </div>
        <div style={{ background:"var(--bg-warning)", border:"1px solid var(--border-warning)", borderRadius:12,
          padding:"12px 16px", marginBottom:20, fontSize:13, color:"var(--text-warning)",
          display:"flex", alignItems:"flex-start", gap:8 }}>
          <Info size={14} style={{ flexShrink:0, marginTop:2 }} />
          <span><strong>Comment ça marche ?</strong> Crée une candidature quand tu veux postuler, puis marque-la <strong>"Soumise"</strong> une fois que tu as envoyé ton dossier.</span>
        </div>
        {isLoading && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:12 }}>
            {[1,2,3].map(i => <div key={i} style={{ background:"var(--bg-card)", borderRadius:16, height:140, border:"1px solid var(--border)" }} className="animate-pulse" />)}
          </div>
        )}
        {!isLoading && apps?.length === 0 && (
          <div style={{ background:"var(--bg-card)", borderRadius:20, border:"1px solid var(--border)" }}>
            <EmptyState variant="applications" action={{ label: "Explorer le feed", href: "/dashboard" }} />
          </div>
        )}
        {apps && apps.length > 0 && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:14 }}>
            {apps.map(app => {
              const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.draft;
              const StatusIcon = cfg.Icon;
              const d = daysLeft(app.opportunity.deadline);
              const typeColor = TYPE_COLOR[app.opportunity.type] ?? "#6b7280";
              const typeLabel = TYPE_LABEL[app.opportunity.type] ?? app.opportunity.type;
              return (
                <div key={app.id} style={{ background:"var(--bg-card)", borderRadius:16, border:"1px solid var(--border)", overflow:"hidden", boxShadow:"var(--shadow-sm)" }}>
                  <div style={{ height:3, background:typeColor }} />
                  <div style={{ padding:"16px 18px" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:typeColor, background:typeColor+"18", padding:"3px 10px", borderRadius:20 }}>{typeLabel}</span>
                      {d !== null && d >= 0 && <span style={{ fontSize:11, fontWeight:700, color:d<=7?"var(--text-danger)":"var(--text-muted)", display:"flex", alignItems:"center", gap:4 }}><Calendar size={11} />J-{d}</span>}
                      {d !== null && d < 0 && <span style={{ fontSize:11, color:"var(--text-muted)", fontStyle:"italic" }}>Expirée</span>}
                    </div>
                    <Link href={`/opportunity/${app.opportunity.id}`} style={{ display:"block", fontWeight:700, fontSize:15, color:"var(--text-primary)", textDecoration:"none", lineHeight:1.35, marginBottom:8 }}>{app.opportunity.title}</Link>
                    <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:14 }}>
                      <MapPin size={12} color="var(--text-muted)" />
                      <span style={{ fontSize:12, color:"var(--text-muted)" }}>{app.opportunity.country}</span>
                    </div>
                    <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:20, background:cfg.bg, border:`1px solid ${cfg.border}`, marginBottom:14 }}>
                      <StatusIcon size={13} color={cfg.color} />
                      <span style={{ fontSize:12, fontWeight:700, color:cfg.color }}>{cfg.label}</span>
                    </div>
                    <div style={{ display:"flex", gap:8, borderTop:"1px solid var(--border-subtle)", paddingTop:12 }}>
                      {app.status === "draft" && (
                        <button onClick={() => markSubmitted.mutate(app.id)} disabled={markSubmitted.isPending}
                          style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"8px 12px", background:"var(--accent)", color:"#fff", border:"none", borderRadius:10, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                          <Send size={12} />Marquer soumise
                        </button>
                      )}
                      <Link href={`/opportunity/${app.opportunity.id}`} style={{ display:"flex", alignItems:"center", gap:5, padding:"8px 12px", background:"var(--bg-surface-2)", border:"1px solid var(--border)", borderRadius:10, fontSize:12, fontWeight:600, color:"var(--text-secondary)", textDecoration:"none" }}>
                        <ExternalLink size={12} />Voir
                      </Link>
                      <button onClick={() => { if (window.confirm("Supprimer cette candidature ?")) deleteApp.mutate(app.id); }} disabled={deleteApp.isPending}
                        style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:5, padding:"8px 10px", background:"var(--bg-danger)", border:"1px solid var(--border-danger)", borderRadius:10, fontSize:12, fontWeight:600, color:"var(--text-danger)", cursor:"pointer" }} title="Supprimer">
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

export default function ApplicationsPage() {
  return (
    <Suspense fallback={
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"80vh" }}>
        <LoaderCircle size={32} color="var(--accent)" className="spin" />
      </div>
    }>
      <ApplicationsInner />
    </Suspense>
  );
}
