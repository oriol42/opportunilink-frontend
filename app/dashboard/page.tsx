"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import Link from "next/link";
import SaveButton from "@/components/opportunity/SaveButton";
import CoachingCard from "@/components/dashboard/CoachingCard";
import { TrendingUp, Clock, CheckCircle, Bookmark, Target, Zap, Award, BarChart2 } from "lucide-react";

interface Opp {
  id: string; title: string; type: string;
  description?: string|null; deadline: string|null;
  country: string|null; reliability_score: number;
  relevance_score: number; is_verified?: boolean;
}
interface Stats {
  applications: { total: number; submitted: number; accepted: number; draft: number };
  saved_count: number; documents_count: number; profile_pct: number; opportuni_score: number;
}

const TYPE: Record<string,{label:string;color:string;bg:string}> = {
  bourse:    { label:"Bourse",      color:"#7c3aed", bg:"#f3e8ff" },
  stage:     { label:"Stage",       color:"#2563eb", bg:"#dbeafe" },
  emploi:    { label:"Emploi",      color:"#059669", bg:"#d1fae5" },
  echange:   { label:"Échange",     color:"#0891b2", bg:"#cffafe" },
  concours:  { label:"Concours",    color:"#dc2626", bg:"#fee2e2" },
  formation: { label:"Formation",   color:"#d97706", bg:"#fef3c7" },
  certificat:{ label:"Certificat",  color:"#16a34a", bg:"#dcfce7" },
  bourse_univ:{ label:"Univ.",      color:"#9333ea", bg:"#fae8ff" },
};

const ALL_TABS = [
  { key:"",          label:"Recommandés" },
  { key:"bourse",    label:"Bourses" },
  { key:"stage",     label:"Stages" },
  { key:"emploi",    label:"Emplois" },
  { key:"echange",   label:"Échanges" },
  { key:"concours",  label:"Concours" },
  { key:"formation", label:"Formations" },
];

function dl(deadline: string|null) {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline).getTime()-Date.now())/86400000);
}

function OppCard({ opp }: { opp: Opp }) {
  const cfg = TYPE[opp.type] ?? { label:opp.type, color:"#6b7280", bg:"#f3f4f6" };
  const d = dl(opp.deadline);
  const score = Math.round(opp.relevance_score ?? 0);
  const scoreColor = score>=75?"#10b981":score>=50?"#f59e0b":"#ef4444";
  return (
    <div style={{ background:"#fff", borderRadius:14, border:"1px solid #f1f5f9", overflow:"hidden", display:"flex", flexDirection:"column", transition:"box-shadow .15s, transform .15s", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }} className="hover:shadow-md hover:-translate-y-0.5">
      <div style={{ height:3, background:cfg.color, flexShrink:0 }} />
      <div style={{ padding:"14px", flex:1, display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <span style={{ fontSize:11, fontWeight:700, color:cfg.color, background:cfg.bg, padding:"2px 8px", borderRadius:20 }}>{cfg.label}</span>
          {d!==null&&d>=0&&<span style={{ fontSize:10, fontWeight:800, color:d<=7?"#dc2626":"#9ca3af", background:d<=7?"#fee2e2":"#f8fafc", padding:"2px 8px", borderRadius:20 }}>{d<=3?`🔥 J-${d}`:d<=7?`⚡ J-${d}`:`J-${d}`}</span>}
        </div>
        <Link href={`/opportunity/${opp.id}`} style={{ textDecoration:"none" }}>
          <p style={{ fontWeight:700, fontSize:14, color:"#0f172a", lineHeight:1.4, marginBottom:6, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as const, overflow:"hidden" }} className="hover:text-emerald-600 transition-colors cursor-pointer">{opp.title}</p>
        </Link>
        <p style={{ fontSize:11, color:"#94a3b8", marginBottom:12, flex:1 }}>🌍 {opp.country??"International"}{opp.is_verified&&<span style={{ color:"#10b981", marginLeft:6, fontWeight:600 }}>✓</span>}</p>
        <div style={{ display:"flex", alignItems:"center", gap:8, borderTop:"1px solid #f8fafc", paddingTop:10 }}>
          <div style={{ flex:1, height:4, background:"#f1f5f9", borderRadius:2, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${score}%`, background:scoreColor, borderRadius:2 }} />
          </div>
          <span style={{ fontSize:11, fontWeight:800, color:scoreColor, width:32, textAlign:"right" }}>{score}%</span>
          <SaveButton oppId={opp.id} compact />
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background:"#fff", borderRadius:14, border:"1px solid #f1f5f9", overflow:"hidden" }} className="animate-pulse">
      <div style={{ height:3, background:"#f1f5f9" }} />
      <div style={{ padding:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}><div style={{ height:18, width:60, background:"#f1f5f9", borderRadius:20 }}/><div style={{ height:18, width:40, background:"#f1f5f9", borderRadius:20 }}/></div>
        <div style={{ height:14, background:"#f1f5f9", borderRadius:4, width:"85%", marginBottom:6 }}/>
        <div style={{ height:14, background:"#f8fafc", borderRadius:4, width:"65%", marginBottom:12 }}/>
        <div style={{ height:4, background:"#f1f5f9", borderRadius:2 }}/>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthLoading } = useStore();
  const [activeTab, setActiveTab] = useState(0);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => { if (!isAuthLoading&&!user) router.push("/login"); }, [isAuthLoading, user, router]);

  const { data: stats } = useQuery<Stats>({
    queryKey: ["my-stats"],
    queryFn: async () => (await api.get("/users/me/stats")).data,
    enabled: !!user, staleTime: 2*60*1000,
  });

  const tabType = ALL_TABS[activeTab].key;
  const { data: opps, isLoading } = useQuery<Opp[]>({
    queryKey: ["feed-tab", tabType],
    queryFn: async () => {
      const p = new URLSearchParams({ page:"1", limit:"30" });
      if (tabType) p.set("type", tabType);
      return (await api.get(`/opportunities?${p}`)).data;
    },
    enabled: !!user, staleTime: 5*60*1000,
  });

  if (isAuthLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full"/></div>;
  if (!user) return null;

  const displayOpps = opps ?? [];
  const urgentCount = displayOpps.filter(o=>{ const d=dl(o.deadline); return d!==null&&d>=0&&d<=7; }).length;
  const visibleOpps = showMore ? displayOpps : displayOpps.slice(0,9);
  const firstName = user.full_name.split(" ")[0];

  return (
    <div style={{ height:"100%", overflowY:"auto", background:"#f8fafc" }}>
      <div style={{ maxWidth:1400, margin:"0 auto", padding:"0 24px 40px" }}>

        {/* HERO */}
        <div style={{ background:"linear-gradient(135deg, #0a0a0a 0%, #065f46 60%, #0f172a 100%)", borderRadius:"0 0 24px 24px", padding:"28px 32px 32px", marginBottom:28, marginLeft:-24, marginRight:-24, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-60, right:60, width:300, height:300, background:"radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)", pointerEvents:"none" }} />
          <div style={{ position:"relative" }}>
            <p style={{ fontSize:13, color:"#6ee7b7", fontWeight:600, marginBottom:6 }}>{new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</p>
            <h1 style={{ fontWeight:900, fontSize:28, color:"#fff", marginBottom:8, lineHeight:1.2 }}>Bonjour, {firstName} 👋</h1>
            <p style={{ fontSize:15, color:"#a7f3d0", marginBottom:24, lineHeight:1.5 }}>
              {isLoading?"Calcul de ton feed personnalisé...":`${displayOpps.length} opportunités correspondent à ton profil${urgentCount>0?` · 🔥 ${urgentCount} deadline${urgentCount>1?"s":""} urgente${urgentCount>1?"s":""}`:""}` }
            </p>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:28 }}>
              <Link href="/dashboard" style={{ background:"#10b981", color:"#fff", fontWeight:700, fontSize:13, padding:"10px 20px", borderRadius:12, textDecoration:"none", display:"inline-block" }}>Explorer les opportunités →</Link>
              <Link href="/dashboard/profile" style={{ background:"rgba(255,255,255,0.1)", color:"#a7f3d0", fontWeight:600, fontSize:13, padding:"10px 20px", borderRadius:12, textDecoration:"none", border:"1px solid rgba(167,243,208,0.2)", display:"inline-block" }}>Compléter mon profil</Link>
            </div>
            {stats&&(
              <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                {[
                  { val:stats.applications.total, label:"Candidatures", icon:"📋" },
                  { val:stats.applications.accepted, label:"Acceptées", icon:"✅" },
                  { val:stats.saved_count, label:"Favoris", icon:"🔖" },
                  { val:`${stats.profile_pct}%`, label:"Profil", icon:"👤" },
                ].map(s=>(
                  <div key={s.label} style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:16 }}>{s.icon}</span>
                    <div><p style={{ fontWeight:900, fontSize:18, color:"#fff", lineHeight:1 }}>{s.val}</p><p style={{ fontSize:10, color:"#6ee7b7", fontWeight:600 }}>{s.label}</p></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 2 COLONNES */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:24, alignItems:"start" }}>

          {/* COLONNE GAUCHE */}
          <div>
            <CoachingCard />

            {/* Tabs — tous les types */}
            <div style={{ display:"flex", gap:2, marginBottom:16, background:"#fff", borderRadius:14, padding:4, border:"1px solid #f1f5f9", boxShadow:"0 1px 3px rgba(0,0,0,0.04)", overflowX:"auto" }}>
              {ALL_TABS.map((tab,i)=>(
                <button key={tab.key} onClick={()=>{ setActiveTab(i); setShowMore(false); }} style={{ flexShrink:0, padding:"8px 14px", borderRadius:10, border:"none", cursor:"pointer", fontWeight:700, fontSize:12, transition:"all .15s", background:activeTab===i?"#0f172a":"transparent", color:activeTab===i?"#fff":"#64748b" }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Grid cards */}
            {isLoading&&<div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:12 }}>{Array.from({length:6}).map((_,i)=><SkeletonCard key={i}/>)}</div>}
            {!isLoading&&displayOpps.length===0&&(
              <div style={{ textAlign:"center", padding:"48px 20px", background:"#fff", borderRadius:16, border:"1px solid #f1f5f9" }}>
                <p style={{ fontSize:40, marginBottom:12 }}>🔍</p>
                <p style={{ fontWeight:700, fontSize:16, color:"#0f172a", marginBottom:8 }}>Aucune opportunité pour ce filtre</p>
                <p style={{ fontSize:13, color:"#94a3b8" }}>Essaie un autre onglet ou complète ton profil pour plus de recommandations.</p>
              </div>
            )}
            {!isLoading&&displayOpps.length>0&&(
              <>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:12, marginBottom:16 }}>
                  {visibleOpps.map(opp=><OppCard key={opp.id} opp={opp}/>)}
                </div>
                {!showMore&&displayOpps.length>9&&(
                  <div style={{ textAlign:"center" }}>
                    <button onClick={()=>setShowMore(true)} style={{ fontSize:13, fontWeight:700, color:"#059669", background:"#f0fdf4", border:"1px solid #bbf7d0", padding:"10px 24px", borderRadius:12, cursor:"pointer" }}>
                      Voir plus ({displayOpps.length-9} opportunités) →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* COLONNE DROITE sticky */}
          <div style={{ display:"flex", flexDirection:"column", gap:16, position:"sticky", top:20 }}>

            {/* Profil card */}
            <div style={{ background:"#fff", borderRadius:16, border:"1px solid #f1f5f9", boxShadow:"0 1px 3px rgba(0,0,0,0.04)", overflow:"hidden" }}>
              <div style={{ background:"linear-gradient(135deg,#0f172a,#065f46)", padding:"20px", position:"relative" }}>
                <div style={{ width:48, height:48, borderRadius:"50%", background:"#10b981", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:900, color:"#fff", marginBottom:10 }}>
                  {user.full_name.split(" ").map((n:string)=>n[0]).slice(0,2).join("").toUpperCase()}
                </div>
                <p style={{ fontWeight:800, fontSize:15, color:"#fff", marginBottom:2 }}>{user.full_name}</p>
                <p style={{ fontSize:11, color:"#6ee7b7" }}>{user.level??"Niveau non renseigné"} · {user.field??"Filière non renseignée"}</p>
              </div>
              <div style={{ padding:"16px" }}>
                {stats&&(
                  <>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                      <span style={{ fontSize:12, fontWeight:600, color:"#64748b" }}>Profil complété</span>
                      <span style={{ fontSize:14, fontWeight:900, color:stats.profile_pct>=80?"#10b981":"#f59e0b" }}>{stats.profile_pct}%</span>
                    </div>
                    <div style={{ background:"#f1f5f9", height:6, borderRadius:3, overflow:"hidden", marginBottom:16 }}>
                      <div style={{ height:"100%", borderRadius:3, transition:"width .7s", width:`${stats.profile_pct}%`, background:stats.profile_pct>=80?"#10b981":"#f59e0b" }}/>
                    </div>
                  </>
                )}
                <Link href="/dashboard/profile" style={{ display:"block", textAlign:"center", fontSize:12, fontWeight:700, color:"#059669", background:"#f0fdf4", border:"1px solid #bbf7d0", padding:"8px", borderRadius:10, textDecoration:"none" }}>
                  Améliorer mon profil →
                </Link>
              </div>
            </div>

            {/* Analytics card — remplace "Actions rapides" */}
            {stats && (
              <div style={{ background:"#fff", borderRadius:16, border:"1px solid #f1f5f9", boxShadow:"0 1px 3px rgba(0,0,0,0.04)", padding:"16px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                  <BarChart2 size={15} color="#059669" />
                  <p style={{ fontWeight:800, fontSize:13, color:"#0f172a" }}>Mes statistiques</p>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {[
                    { Icon:TrendingUp, label:"Score", value:stats.opportuni_score, color:"#7c3aed", bg:"#f5f3ff" },
                    { Icon:CheckCircle, label:"Acceptées", value:stats.applications.accepted, color:"#16a34a", bg:"#f0fdf4" },
                    { Icon:Clock, label:"En cours", value:stats.applications.draft, color:"#d97706", bg:"#fffbeb" },
                    { Icon:Bookmark, label:"Favoris", value:stats.saved_count, color:"#0891b2", bg:"#ecfeff" },
                  ].map(({ Icon, label, value, color, bg }) => (
                    <div key={label} style={{ background:bg, borderRadius:12, padding:"12px 12px 10px", display:"flex", flexDirection:"column", gap:6 }}>
                      <Icon size={14} color={color} />
                      <p style={{ fontWeight:900, fontSize:20, color, lineHeight:1 }}>{value}</p>
                      <p style={{ fontSize:10, color, opacity:0.7, fontWeight:600 }}>{label}</p>
                    </div>
                  ))}
                </div>

                {/* Taux de succès */}
                {stats.applications.total > 0 && (
                  <div style={{ marginTop:12, padding:"10px 12px", background:"#f8fafc", borderRadius:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                        <Target size={12} color="#059669" />
                        <span style={{ fontSize:11, color:"#64748b", fontWeight:600 }}>Taux de succès</span>
                      </div>
                      <span style={{ fontSize:12, fontWeight:800, color:"#059669" }}>
                        {Math.round((stats.applications.accepted/stats.applications.total)*100)}%
                      </span>
                    </div>
                    <div style={{ height:4, background:"#e2e8f0", borderRadius:2, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${Math.round((stats.applications.accepted/stats.applications.total)*100)}%`, background:"#10b981", borderRadius:2 }}/>
                    </div>
                  </div>
                )}

                {/* Score opportulink */}
                <div style={{ marginTop:10, padding:"10px 12px", background:"linear-gradient(135deg,#f5f3ff,#ede9fe)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <Award size={13} color="#7c3aed" />
                    <span style={{ fontSize:11, color:"#7c3aed", fontWeight:700 }}>OpportuScore</span>
                  </div>
                  <span style={{ fontSize:16, fontWeight:900, color:"#7c3aed" }}>{stats.opportuni_score} / 1000</span>
                </div>
              </div>
            )}

            {/* Deadlines urgentes */}
            {opps&&opps.filter(o=>{ const d=dl(o.deadline); return d!==null&&d>=0&&d<=14; }).length>0&&(
              <div style={{ background:"#fff", borderRadius:16, border:"1px solid #f1f5f9", boxShadow:"0 1px 3px rgba(0,0,0,0.04)", overflow:"hidden" }}>
                <div style={{ padding:"14px 16px", borderBottom:"1px solid #f8fafc" }}>
                  <p style={{ fontWeight:800, fontSize:13, color:"#0f172a" }}>⏰ Deadlines proches</p>
                </div>
                <div style={{ padding:"8px 0" }}>
                  {opps.filter(o=>{ const d=dl(o.deadline); return d!==null&&d>=0&&d<=14; }).slice(0,5).map(opp=>{
                    const d = dl(opp.deadline)!;
                    return (
                      <Link key={opp.id} href={`/opportunity/${opp.id}`} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px", textDecoration:"none", transition:"background .1s" }} className="hover:bg-gray-50">
                        <div style={{ flex:1, minWidth:0 }}><p style={{ fontSize:12, fontWeight:600, color:"#0f172a", lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{opp.title}</p></div>
                        <span style={{ fontSize:11, fontWeight:800, flexShrink:0, color:d<=7?"#dc2626":"#d97706", background:d<=7?"#fee2e2":"#fef3c7", padding:"2px 7px", borderRadius:20 }}>J-{d}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
// Ce fichier est déjà complet — les deadlines sont dans opps qui se recharge à chaque onglet
