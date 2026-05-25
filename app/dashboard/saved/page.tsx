"use client";
import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import Link from "next/link";

interface SavedOpp {
  id: string; title: string; type: string;
  deadline: string | null; country: string | null;
  reliability_score: number; relevance_score: number; is_verified?: boolean;
}
const TYPE_CFG: Record<string,{ label:string; color:string; bg:string }> = {
  bourse:   { label:"Bourse",   color:"#7c3aed", bg:"#f3e8ff" },
  stage:    { label:"Stage",    color:"#2563eb", bg:"#dbeafe" },
  emploi:   { label:"Emploi",   color:"#059669", bg:"#d1fae5" },
  echange:  { label:"Échange",  color:"#d97706", bg:"#fef3c7" },
  concours: { label:"Concours", color:"#dc2626", bg:"#fee2e2" },
};
function days(deadline: string | null) {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
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
      <div style={{ padding:"20px 24px 16px", borderBottom:"0.5px solid #f3f4f6", background:"#fff", flexShrink:0 }}>
        <h1 style={{ fontWeight:900, fontSize:22, color:"#111827", marginBottom:4 }}>Mes favoris</h1>
        <p style={{ fontSize:13, color:"#9ca3af" }}>{data ? `${data.length} opportunité${data.length!==1?"s":""} sauvegardée${data.length!==1?"s":""}` : ""}</p>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>
        {isLoading && <div style={{ display:"flex", flexDirection:"column", gap:12 }}>{[1,2,3].map(i=><div key={i} style={{ background:"#fff", borderRadius:16, border:"0.5px solid #f3f4f6", padding:20, height:100 }} className="animate-pulse" />)}</div>}
        {isError && <div style={{ background:"#fef2f2", border:"0.5px solid #fecaca", borderRadius:16, padding:20, color:"#dc2626", fontSize:14 }}>Erreur lors du chargement.</div>}
        {!isLoading && data?.length === 0 && (
          <div style={{ textAlign:"center", padding:"80px 20px" }}>
            <p style={{ fontSize:48, marginBottom:16 }}>🔖</p>
            <p style={{ fontWeight:800, fontSize:18, color:"#111827", marginBottom:8 }}>Aucun favori</p>
            <p style={{ fontSize:14, color:"#9ca3af", marginBottom:24 }}>Sauvegarde des opportunités depuis le feed en cliquant sur 🏷️</p>
            <Link href="/dashboard" style={{ background:"#059669", color:"#fff", fontWeight:700, fontSize:14, padding:"10px 24px", borderRadius:12, textDecoration:"none" }}>Explorer le feed →</Link>
          </div>
        )}
        {data && data.length > 0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {data.map(opp => {
              const cfg = TYPE_CFG[opp.type] ?? { label:opp.type, color:"#6b7280", bg:"#f3f4f6" };
              const d = days(opp.deadline);
              const score = Math.round(opp.relevance_score ?? 0);
              return (
                <div key={opp.id} style={{ background:"#fff", borderRadius:16, border:"0.5px solid #f3f4f6", padding:16, display:"flex", alignItems:"center", gap:14, transition:"box-shadow .15s" }} className="hover:shadow-sm">
                  <div style={{ width:4, borderRadius:2, background:cfg.color, alignSelf:"stretch", flexShrink:0, minHeight:48 }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <Link href={`/opportunity/${opp.id}`} style={{ fontWeight:700, fontSize:14, color:"#111827", textDecoration:"none", display:"block", marginBottom:6 }} className="hover:text-emerald-600 transition-colors">{opp.title}</Link>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                      <span style={{ fontSize:11, fontWeight:700, color:cfg.color, background:cfg.bg, padding:"2px 8px", borderRadius:20 }}>{cfg.label}</span>
                      {opp.country && <span style={{ fontSize:11, color:"#9ca3af" }}>🌍 {opp.country}</span>}
                      {d !== null && d >= 0 && <span style={{ fontSize:11, fontWeight:700, color:d<=7?"#dc2626":"#9ca3af", background:d<=7?"#fee2e2":"#f3f4f6", padding:"2px 8px", borderRadius:20 }}>{d===0?"Auj.!":`J-${d}`}</span>}
                      <span style={{ fontSize:11, fontWeight:800, color:score>=75?"#059669":"#d97706", marginLeft:"auto" }}>{score}% match</span>
                    </div>
                  </div>
                  <button onClick={() => handleUnsave(opp.id)} title="Retirer des favoris" style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, color:"#d1d5db", padding:4, borderRadius:8, flexShrink:0 }} className="hover:text-red-400 transition-colors">✕</button>
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
    <Suspense fallback={<div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"80vh" }}><div className="animate-spin rounded-full" style={{ width:40, height:40, border:"3px solid #10b981", borderTopColor:"transparent" }} /></div>}>
      <SavedInner />
    </Suspense>
  );
}
