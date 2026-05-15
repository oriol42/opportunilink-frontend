"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/store/useStore";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { logout } from "@/lib/auth";
import FloatingCoach from "@/components/FloatingCoach";
import { Zap, ClipboardList, Bookmark, FolderOpen, User, BarChart3, TrendingUp, Award, LogOut, ChevronRight } from "lucide-react";

const NAV = [
  { href:"/dashboard",              label:"Feed",         Icon:Zap },
  { href:"/dashboard/applications", label:"Candidatures", Icon:ClipboardList },
  { href:"/dashboard/saved",        label:"Favoris",      Icon:Bookmark },
  { href:"/dashboard/documents",    label:"Documents",    Icon:FolderOpen },
  { href:"/dashboard/profile",      label:"Profil",       Icon:User },
];

interface Stats { applications:{total:number;submitted:number;accepted:number}; saved_count:number; documents_count:number; profile_pct:number; opportuni_score:number; }

function useSidebarStats() {
  const { data } = useQuery<Stats>({ queryKey:["my-stats"], queryFn:async()=>(await api.get("/users/me/stats")).data, staleTime:2*60*1000 });
  return data;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useStore();
  const stats = useSidebarStats();

  const initials = user?.full_name ? user.full_name.split(" ").map((n:string)=>n[0]).slice(0,2).join("").toUpperCase() : "?";
  const profileFields = [user?.level, user?.field, user?.gpa, user?.city, (user?.languages?.length??0)>0?"ok":"", (user?.skills?.length??0)>0?"ok":""];
  const completeness = Math.round(profileFields.filter(Boolean).length/profileFields.length*100);

  const sidebar = (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      {/* Logo */}
      <div style={{ padding:"0 20px", height:60, display:"flex", alignItems:"center", borderBottom:"1px solid #1a2a1a", flexShrink:0 }}>
        <span style={{ fontWeight:900, fontSize:18, color:"#4ade80", letterSpacing:"-0.5px" }}>Opportu<span style={{ color:"#fff" }}>Link</span></span>
      </div>

      {/* User card */}
      <div style={{ margin:"16px 12px", borderRadius:14, background:"linear-gradient(135deg,#0d2818,#0a1f14)", border:"1px solid #1a3a22", padding:"14px", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <div style={{ width:38, height:38, borderRadius:"50%", background:"linear-gradient(135deg,#16a34a,#15803d)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:14, color:"#fff", flexShrink:0 }}>{initials}</div>
          <div style={{ minWidth:0, flex:1 }}>
            <p style={{ fontWeight:700, fontSize:13, color:"#f0fdf4", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{user?.full_name??"—"}</p>
            <p style={{ fontSize:11, color:"#4ade80", marginTop:1 }}>{user?.level??"Niveau non renseigné"}</p>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
          <div style={{ flex:1, height:4, borderRadius:2, background:"#1a3a22", overflow:"hidden" }}>
            <div style={{ height:"100%", borderRadius:2, width:`${completeness}%`, background:completeness>=80?"#22c55e":completeness>=50?"#eab308":"#ef4444", transition:"width 0.7s" }}/>
          </div>
          <span style={{ fontSize:11, fontWeight:700, color:"#4ade80", width:28, textAlign:"right" }}>{completeness}%</span>
        </div>
        <p style={{ fontSize:10, color:"#166534" }}>Profil complété</p>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:"0 8px", overflowY:"auto" }}>
        <p style={{ fontSize:10, fontWeight:700, color:"#1f4428", textTransform:"uppercase", letterSpacing:"0.08em", padding:"4px 8px 8px" }}>Navigation</p>
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname===href;
          return (
            <Link key={href} href={href} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, marginBottom:2, textDecoration:"none", background:active?"linear-gradient(135deg,#14532d,#166534)":"transparent", color:active?"#4ade80":"#4b6b52", fontWeight:active?700:500, fontSize:14, transition:"all 0.15s" }}>
              <Icon size={17} strokeWidth={active?2.5:2} />
              <span style={{ flex:1 }}>{label}</span>
              {active&&<ChevronRight size={14} style={{ opacity:0.6 }}/>}
            </Link>
          );
        })}

        {/* Stats */}
        {stats && (
          <>
            <p style={{ fontSize:10, fontWeight:700, color:"#1f4428", textTransform:"uppercase", letterSpacing:"0.08em", padding:"16px 8px 8px" }}>Mes stats</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, padding:"0 4px" }}>
              {[
                { label:"Candidatures", value:stats.applications.total, Icon:ClipboardList, color:"#60a5fa" },
                { label:"Acceptées",    value:stats.applications.accepted, Icon:Award,        color:"#4ade80" },
                { label:"Favoris",      value:stats.saved_count,           Icon:Bookmark,     color:"#f59e0b" },
                { label:"Score",        value:stats.opportuni_score,       Icon:TrendingUp,   color:"#a78bfa" },
              ].map(({ label, value, Icon:StatIcon, color }) => (
                <div key={label} style={{ background:"#0a1a0c", border:"1px solid #1a3a22", borderRadius:10, padding:"10px 10px 8px" }}>
                  <StatIcon size={14} color={color} style={{ marginBottom:4 }} />
                  <p style={{ fontWeight:800, fontSize:18, color:"#f0fdf4", lineHeight:1 }}>{value}</p>
                  <p style={{ fontSize:10, color:"#4b6b52", marginTop:2 }}>{label}</p>
                </div>
              ))}
            </div>
            {stats.applications.total>0 && (
              <div style={{ margin:"8px 4px 0", background:"#0a1a0c", border:"1px solid #1a3a22", borderRadius:10, padding:"10px 12px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}><BarChart3 size={13} color="#34d399"/><span style={{ fontSize:11, color:"#4b6b52", fontWeight:600 }}>Taux succès</span></div>
                  <span style={{ fontSize:12, fontWeight:800, color:"#34d399" }}>{Math.round((stats.applications.accepted/stats.applications.total)*100)}%</span>
                </div>
                <div style={{ height:3, background:"#1a3a22", borderRadius:2, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${Math.round((stats.applications.accepted/stats.applications.total)*100)}%`, background:"#22c55e", borderRadius:2 }}/>
                </div>
              </div>
            )}
          </>
        )}
      </nav>

      {/* Déconnexion — seulement ici, pas dans le header */}
      <div style={{ padding:"12px", borderTop:"1px solid #1a2a1a", flexShrink:0 }}>
        <button onClick={logout} style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"9px 12px", borderRadius:10, border:"none", background:"transparent", color:"#4b6b52", fontSize:13, fontWeight:500, cursor:"pointer", transition:"all 0.15s" }}>
          <LogOut size={15}/> Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:"#f1f5f1" }}>
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex" style={{ width:220, flexShrink:0, height:"100vh", background:"#060e07", overflowY:"auto", overflowX:"hidden", flexDirection:"column" }}>
        {sidebar}
      </aside>

      {/* Zone principale */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, height:"100vh", overflow:"hidden" }}>
        {/* AUCUN header mobile avec OpportuLink ou Déco — on met juste le logo discret */}
        <div className="lg:hidden" style={{ background:"#060e07", borderBottom:"1px solid #1a2a1a", height:52, display:"flex", alignItems:"center", padding:"0 16px", flexShrink:0 }}>
          <span style={{ fontWeight:900, fontSize:16, color:"#4ade80" }}>OpportuLink</span>
        </div>

        <main style={{ flex:1, overflowY:"auto", overflowX:"hidden" }}>
          {children}
        </main>

        {/* Bottom nav mobile */}
        <nav className="lg:hidden" style={{ background:"#060e07", borderTop:"1px solid #1a2a1a", flexShrink:0 }}>
          <div style={{ display:"flex" }}>
            {NAV.map(({ href, label, Icon }) => {
              const active = pathname===href;
              return (
                <Link key={href} href={href} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", padding:"10px 0 8px", textDecoration:"none", color:active?"#4ade80":"#2d4a30", position:"relative" }}>
                  {active&&<span style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:24, height:2, borderRadius:1, background:"#4ade80" }}/>}
                  <Icon size={20} strokeWidth={active?2.5:1.8}/>
                  <span style={{ fontSize:10, fontWeight:active?700:500, marginTop:3 }}>{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
      <FloatingCoach/>
    </div>
  );
}
