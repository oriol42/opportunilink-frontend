"use client";
import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import Link from "next/link";
import { Globe, X, LoaderCircle } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { typeConfig, daysLeft } from "@/lib/opportunityHelpers";

interface SavedOpp {
  id: string; title: string; type: string;
  deadline: string | null; country: string | null;
  reliability_score: number; relevance_score: number; is_verified?: boolean;
}

function SavedInner() {
  const router = useRouter();
  const { user, isAuthLoading } = useStore();
  const queryClient = useQueryClient();

  useEffect(() => { if (!isAuthLoading && !user) router.push("/login"); }, [isAuthLoading, user, router]);

  const { data, isLoading, isError } = useQuery<SavedOpp[]>({
    queryKey: ["saved"],
    queryFn: async () => (await api.get("/opportunities/saved")).data,
    enabled: !!user,
  });

  async function handleUnsave(id: string) {
    await api.post(`/opportunities/${id}/save`);
    queryClient.invalidateQueries({ queryKey: ["saved"] });
  }

  if (isAuthLoading || !user) return null;

  return (
    <div style={{ padding:"0", height:"100%", display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"20px 24px 16px", borderBottom:"1px solid var(--border-subtle)", background:"var(--bg-card)", flexShrink:0 }}>
        <h1 style={{ fontFamily:"var(--font-voice)", fontWeight:500, fontSize:22, color:"var(--text-primary)", marginBottom:4 }}>Mes favoris</h1>
        <p style={{ fontSize:13, color:"var(--text-muted)" }}>{data ? `${data.length} opportunité${data.length!==1?"s":""} sauvegardée${data.length!==1?"s":""}` : ""}</p>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>
        {isLoading && <div style={{ display:"flex", flexDirection:"column", gap:12 }}>{[1,2,3].map(i=><div key={i} style={{ background:"var(--bg-card)", borderRadius:16, border:"1px solid var(--border)", padding:20, height:100 }} className="animate-pulse" />)}</div>}
        {isError && <div style={{ background:"var(--bg-danger)", border:"1px solid var(--border-danger)", borderRadius:16, padding:20, color:"var(--text-danger)", fontSize:14 }}>Erreur lors du chargement.</div>}
        {!isLoading && data?.length === 0 && (
          <EmptyState variant="saved" action={{ label: "Explorer le feed", href: "/dashboard" }} />
        )}
        {data && data.length > 0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {data.map(opp => {
              const cfg = typeConfig(opp.type);
              const d = daysLeft(opp.deadline);
              const score = Math.round(opp.relevance_score ?? 0);
              return (
                <div key={opp.id} className="opp-hover" style={{ background:"var(--bg-card)", borderRadius:16, border:"1px solid var(--border)", padding:16, display:"flex", alignItems:"center", gap:14, transition:"box-shadow .15s" }}>
                  <div style={{ width:4, borderRadius:2, background:cfg.color, alignSelf:"stretch", flexShrink:0, minHeight:48 }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <Link href={`/opportunity/${opp.id}`} style={{ fontWeight:700, fontSize:14, color:"var(--text-primary)", textDecoration:"none", display:"block", marginBottom:6 }}>{opp.title}</Link>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                      <span style={{ fontSize:11, fontWeight:700, color:cfg.color, background:cfg.bg, padding:"2px 8px", borderRadius:20 }}>{cfg.label}</span>
                      {opp.country && <span style={{ fontSize:11, color:"var(--text-muted)", display:"flex", alignItems:"center", gap:3 }}><Globe size={11} /> {opp.country}</span>}
                      {d !== null && d >= 0 && <span style={{ fontSize:11, fontWeight:700, color:d<=7?"var(--text-danger)":"var(--text-muted)", background:d<=7?"var(--bg-danger)":"var(--bg-surface-2)", padding:"2px 8px", borderRadius:20 }}>{d===0?"Auj.!":`J-${d}`}</span>}
                      <span style={{ fontSize:11, fontWeight:700, color:score>=75?"var(--text-success)":"var(--text-warning)", marginLeft:"auto" }}>{score}% match</span>
                    </div>
                  </div>
                  <button onClick={() => handleUnsave(opp.id)} title="Retirer des favoris" style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", padding:4, borderRadius:8, flexShrink:0, display:"flex" }}><X size={17} /></button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SavedPage() {
  return (
    <Suspense fallback={
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"80vh" }}>
        <LoaderCircle size={32} color="var(--accent)" className="spin" />
      </div>
    }>
      <SavedInner />
    </Suspense>
  );
}
