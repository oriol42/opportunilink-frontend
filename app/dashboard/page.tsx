"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  Bot, X, Search, FileText, CircleCheck, Bookmark, User,
  Sparkles, Flame, CalendarClock, ArrowRight, LoaderCircle, LucideIcon,
  SlidersHorizontal,
} from "lucide-react";
import CoachingCard from "@/components/dashboard/CoachingCard";
import OpportunityCard from "@/components/opportunity/OpportunityCard";
import OpportunityListRow from "@/components/opportunity/OpportunityListRow";
import TopMatchCard from "@/components/opportunity/TopMatchCard";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { OpportunityLite, daysLeft } from "@/lib/opportunityHelpers";
import EmptyState from "@/components/ui/EmptyState";

interface Stats {
  applications: { total: number; submitted: number; accepted: number };
  saved_count: number; documents_count: number; profile_pct: number;
}

const TABS = ["Tout","Bourses","Stages","Emplois","Formations","Concours"];
const TAB_TYPES = ["","bourse","stage","emploi","formation","concours"];

function SkeletonCard() {
  return (
    <div style={{ background:"var(--bg-card)", borderRadius:12, border:"1px solid var(--border)",
      overflow:"hidden", minHeight:230 }} className="animate-pulse">
      <div style={{ padding:16, display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--bg-surface-2)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ height:14, width:60, background:"var(--bg-surface-2)", borderRadius:20, marginBottom: 8 }} />
            <div style={{ height:16, background:"var(--bg-surface-2)", borderRadius:4, width:"88%" }} />
          </div>
        </div>
        <div style={{ height:12, background:"var(--bg-surface-2)", borderRadius:4, width:"90%" }} />
        <div style={{ height:12, background:"var(--bg-surface-2)", borderRadius:4, width:"65%" }} />
      </div>
    </div>
  );
}

function SH({ icon: Icon, title, count, color }: { icon: LucideIcon; title:string; count?:number; color?:string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:16 }}>
      <Icon size={18} color={color ?? "var(--text-secondary)"} />
      <h2 style={{ fontFamily: "var(--font-voice)", fontWeight:500, fontSize:17, color: color ?? "var(--text-primary)", flex:1 }}>{title}</h2>
      {count !== undefined && (
        <span style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)",
          background:"var(--bg-surface-2)", padding:"3px 11px", borderRadius:20,
          border:"1px solid var(--border-subtle)" }}>{count}</span>
      )}
    </div>
  );
}

function DashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthLoading } = useStore();
  const [activeTab, setActiveTab] = useState(0);
  const [showMore, setShowMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterCountry, setFilterCountry] = useState("");
  const [filterMaxGpa, setFilterMaxGpa] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");
  const searchQ = searchParams.get("q")?.toLowerCase().trim();

  useEffect(() => { if (!isAuthLoading && !user) router.push("/login"); }, [isAuthLoading, user, router]);

  const { data: stats } = useQuery<Stats>({
    queryKey: ["my-stats"],
    queryFn: async () => (await api.get("/users/me/stats")).data,
    enabled: !!user, staleTime: 10 * 60 * 1000, gcTime: 30 * 60 * 1000,
  });

  const { data: opps, isLoading, isFetching } = useQuery<OpportunityLite[]>({
    queryKey: ["feed-all"],
    queryFn: async () => {
      const p = new URLSearchParams({ page:"1", limit:"200" });
      return (await api.get(`/opportunities?${p}`)).data;
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const tabType = TAB_TYPES[activeTab];

  if (isAuthLoading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"80vh" }}>
      <LoaderCircle size={32} color="var(--accent)" className="spin" />
    </div>
  );
  if (!user) return null;

  const userCtx = { level:user.level, field:user.field, languages:user.languages };
  const allOpps = opps ?? [];

  const displayOpps = tabType ? allOpps.filter(o => o.type === tabType) : allOpps;

  const searchFiltered = searchQ
    ? displayOpps.filter(o =>
        o.title.toLowerCase().includes(searchQ) ||
        (o.description||"").toLowerCase().includes(searchQ) ||
        (o.country||"").toLowerCase().includes(searchQ) ||
        o.type.toLowerCase().includes(searchQ)
      )
    : displayOpps;

  const filtered = searchFiltered.filter(o => {
    if (filterCountry && !(o.country||"").toLowerCase().includes(filterCountry.toLowerCase())) return false;
    const maxGpa = filterMaxGpa ? parseFloat(filterMaxGpa) : null;
    if (maxGpa !== null && o.min_gpa != null && o.min_gpa > maxGpa) return false;
    if (filterLanguage && o.required_languages?.length && !o.required_languages.includes(filterLanguage)) return false;
    return true;
  });

  const activeFilterCount = [filterCountry, filterMaxGpa, filterLanguage].filter(Boolean).length;

  const sorted = [...filtered].sort((a,b) => (b.relevance_score ?? 0) - (a.relevance_score ?? 0));
  const topMatches  = sorted.filter(o => (o.relevance_score ?? 0) >= 80).slice(0, 3);
  const urgent      = sorted.filter(o => { const d = daysLeft(o.deadline); return d !== null && d >= 0 && d <= 7; }).slice(0, 4);
  const recent      = sorted.slice(0, 6);
  const bySkill     = sorted.filter(o => o.required_fields?.includes(user.field ?? "")).slice(0, 4);
  const rest        = showMore ? sorted.slice(6) : sorted.slice(6, 14);
  const urgentCount = filtered.filter(o => { const d = daysLeft(o.deadline); return d !== null && d >= 0 && d <= 7; }).length;
  const firstName   = user.full_name?.split(" ")[0] ?? "toi";
  const deadlines   = filtered.filter(o => { const d = daysLeft(o.deadline); return d !== null && d >= 0 && d <= 14; }).slice(0, 5);
  const mostUrgent  = sorted.find(o => { const d = daysLeft(o.deadline); return d !== null && d >= 0 && d <= 3; });

  return (
    <div style={{ display:"flex", flexDirection: "column", gap: 22, padding:"24px 28px 32px", minHeight:"100%" }}>

      {!searchQ && mostUrgent && (
        <Link href={`/opportunity/${mostUrgent.id}`} style={{ textDecoration: "none" }}>
          <div style={{ background: "var(--bg-urgent)", border: "1px solid var(--border-urgent)",
            borderLeft: "3px solid var(--text-urgent)", borderRadius: 12, padding: "12px 16px",
            display: "flex", alignItems: "center", gap: 10 }}>
            <Flame size={17} color="var(--text-urgent)" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: "var(--text-urgent)", margin: 0, flex: 1 }}>
              <strong>{mostUrgent.title}</strong> — il te reste {daysLeft(mostUrgent.deadline) === 0 ? "quelques heures" : `${daysLeft(mostUrgent.deadline)} jour${daysLeft(mostUrgent.deadline)! > 1 ? "s" : ""}`} pour candidater.
            </p>
            <ArrowRight size={15} color="var(--text-urgent)" style={{ flexShrink: 0 }} />
          </div>
        </Link>
      )}

      <div className="dashboard-columns" style={{ display:"flex", gap:24 }}>

        <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:22 }}>

          <div style={{ background:"var(--bg-hero)", borderRadius:20, padding:"26px 30px",
            position:"relative", overflow:"hidden", border:"1px solid rgba(16,185,129,.2)" }}>
            <div style={{ position:"absolute", top:-60, right:-60, width:260, height:260,
              background:"radial-gradient(circle,rgba(16,185,129,.1) 0%,transparent 70%)", pointerEvents:"none" }} />
            <div style={{ position:"relative" }}>
              <p style={{ fontSize:11, color:"#6ee7b7", fontWeight:700, marginBottom:6, letterSpacing:".06em", textTransform: "uppercase" }}>
                {new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}
              </p>
              <h1 style={{ fontFamily: "var(--font-voice)", fontWeight:500, fontSize:28, color:"#fff", marginBottom:6, lineHeight:1.2 }}>
                Bonjour, {firstName}
              </h1>
              <p style={{ fontSize:14, color:"rgba(255,255,255,.5)", marginBottom:20 }}>
                {searchQ
                  ? `${filtered.length} résultat${filtered.length > 1?"s":""} pour "${searchQ}"`
                  : isLoading && !opps
                  ? "Chargement de ton feed personnalisé..."
                  : `${filtered.length} opportunités · ${topMatches.length} top match${topMatches.length>1?"s":""} IA${urgentCount > 0 ? ` · ${urgentCount} deadline${urgentCount>1?"s":""} cette semaine` : ""}`}
              </p>
              {stats && !searchQ && (
                <div style={{ display:"flex", gap:26, flexWrap:"wrap" }}>
                  {[
                    { val:stats.applications.total,    label:"Candidatures", icon:FileText },
                    { val:stats.applications.accepted, label:"Acceptées",    icon:CircleCheck },
                    { val:stats.saved_count,           label:"Favoris",      icon:Bookmark },
                    { val:`${stats.profile_pct}%`,     label:"Profil",       icon:User },
                  ].map(s => (
                    <div key={s.label} style={{ display:"flex", alignItems:"center", gap:9 }}>
                      <s.icon size={20} color="#6ee7b7" />
                      <div>
                        <p style={{ fontFamily: "var(--font-voice)", fontWeight:600, fontSize:21, color:"#fff", lineHeight:1 }}>{s.val}</p>
                        <p style={{ fontSize:11, color:"#6ee7b7", fontWeight:600, marginTop:2 }}>{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {!searchQ && <CoachingCard />}

          {!searchQ && (
            <div>
              <div style={{ display:"flex", gap:8, alignItems:"stretch" }}>
                <div style={{ flex:1, display:"flex", flexWrap:"wrap", background:"var(--bg-card)", borderRadius:12, padding:4,
                  border:"1px solid var(--border)", gap:2 }}>
                  {TABS.map((tab, i) => (
                    <button key={tab} onClick={() => { setActiveTab(i); setShowMore(false); }} style={{
                      flex:"1 1 auto", minWidth:70, padding:"9px 6px", borderRadius:9, border:"none", cursor:"pointer",
                      fontWeight:600, fontSize:13, transition:"all .15s",
                      background: activeTab === i ? "var(--text-primary)" : "transparent",
                      color: activeTab === i ? "var(--bg-card)" : "var(--text-muted)",
                    }}>{tab}</button>
                  ))}
                </div>
                <button onClick={() => setShowFilters(s => !s)} style={{
                  flexShrink:0, display:"flex", alignItems:"center", gap:6, padding:"0 14px",
                  borderRadius:12, border:"1px solid var(--border)", cursor:"pointer", fontWeight:600, fontSize:13,
                  background: showFilters ? "var(--text-primary)" : "var(--bg-card)",
                  color: showFilters ? "var(--bg-card)" : "var(--text-secondary)" }}>
                  <SlidersHorizontal size={14} />
                  Filtres
                  {activeFilterCount > 0 && (
                    <span style={{ fontSize:10, fontWeight:700, background: showFilters ? "var(--bg-card)" : "var(--accent)",
                      color: showFilters ? "var(--text-primary)" : "#fff", borderRadius:20, padding:"1px 6px" }}>
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>

              {showFilters && (
                <div style={{ marginTop:8, background:"var(--bg-card)", borderRadius:12, border:"1px solid var(--border)",
                  padding:14, display:"flex", gap:12, flexWrap:"wrap", alignItems:"flex-end" }}>
                  <div style={{ flex:"1 1 160px" }}>
                    <label style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:5 }}>Pays</label>
                    <input value={filterCountry} onChange={e => setFilterCountry(e.target.value)}
                      placeholder="Ex: France, Cameroun..." style={{ width:"100%", padding:"8px 12px",
                      borderRadius:9, border:"1px solid var(--border)", background:"var(--bg-input)",
                      color:"var(--text-primary)", fontSize:13, outline:"none", boxSizing:"border-box" }} />
                  </div>
                  <div style={{ flex:"1 1 140px" }}>
                    <label style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:5 }}>
                      Moyenne max demandée
                    </label>
                    <select value={filterMaxGpa} onChange={e => setFilterMaxGpa(e.target.value)}
                      style={{ width:"100%", padding:"8px 12px", borderRadius:9, border:"1px solid var(--border)",
                      background:"var(--bg-input)", color:"var(--text-primary)", fontSize:13, outline:"none", cursor:"pointer" }}>
                      <option value="">Peu importe</option>
                      <option value="10">≤ 10/20</option>
                      <option value="12">≤ 12/20</option>
                      <option value="14">≤ 14/20</option>
                      <option value="16">≤ 16/20</option>
                    </select>
                  </div>
                  <div style={{ flex:"1 1 140px" }}>
                    <label style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:5 }}>Langue requise</label>
                    <select value={filterLanguage} onChange={e => setFilterLanguage(e.target.value)}
                      style={{ width:"100%", padding:"8px 12px", borderRadius:9, border:"1px solid var(--border)",
                      background:"var(--bg-input)", color:"var(--text-primary)", fontSize:13, outline:"none", cursor:"pointer" }}>
                      <option value="">Toutes</option>
                      <option value="fr">Français</option>
                      <option value="en">Anglais</option>
                      <option value="de">Allemand</option>
                      <option value="es">Espagnol</option>
                    </select>
                  </div>
                  {activeFilterCount > 0 && (
                    <button onClick={() => { setFilterCountry(""); setFilterMaxGpa(""); setFilterLanguage(""); }}
                      style={{ display:"flex", alignItems:"center", gap:5, padding:"8px 12px", borderRadius:9,
                        border:"1px solid var(--border-danger)", background:"var(--bg-danger)", color:"var(--text-danger)",
                        fontSize:12, fontWeight:700, cursor:"pointer" }}>
                      <X size={12} /> Effacer
                    </button>
                  )}
                </div>
              )}

              {isFetching && (
                <div style={{ height:2, background:"var(--border-subtle)", borderRadius:2, marginTop:3, overflow:"hidden" }}>
                  <div style={{ height:"100%", background:"var(--accent)", borderRadius:2,
                    animation:"progress-bar 1.2s ease-in-out infinite" }} />
                </div>
              )}
            </div>
          )}

          {isLoading && !opps && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:16 }}>
              {Array.from({ length: 6 }).map((_,i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {!isLoading && sorted.length === 0 && (
            <Card style={{ padding: 0 }}>
              <EmptyState
                variant={searchQ ? "search" : "feed"}
                title={searchQ ? `Aucun résultat pour "${searchQ}"` : undefined}
                subtitle={searchQ ? "Essaie d'autres mots-clés ou vérifie tes filtres." : undefined}
              />
            </Card>
          )}

          {sorted.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:28 }}>

              {searchQ && (
                <section>
                  <SH icon={Search} title={`Résultats pour "${searchQ}"`} count={sorted.length} />
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,340px))", gap:16 }}>
                    {sorted.map(opp => <OpportunityCard key={opp.id} opp={opp} user={userCtx} />)}
                  </div>
                </section>
              )}

              {!searchQ && (
                <>
                  {topMatches.length > 0 && (
                    <section>
                      <SH icon={Sparkles} title="Top Match IA" count={topMatches.length} color="var(--accent-dark)" />
                      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                        {topMatches.map(opp => <TopMatchCard key={opp.id} opp={opp} user={userCtx} />)}
                      </div>
                    </section>
                  )}
                  {urgent.length > 0 && (
                    <section>
                      <SH icon={Flame} title="Deadlines urgentes — cette semaine" count={urgent.length} color="var(--text-urgent)" />
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,340px))", gap:16 }}>
                        {urgent.map(opp => <OpportunityCard key={opp.id} opp={opp} user={userCtx} />)}
                      </div>
                    </section>
                  )}
                  {recent.length > 0 && (
                    <section>
                      <SH icon={Sparkles} title="Nouvelles opportunités" count={recent.length} />
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,340px))", gap:16 }}>
                        {recent.map(opp => <OpportunityCard key={opp.id} opp={opp} user={userCtx} />)}
                      </div>
                    </section>
                  )}
                  {bySkill.length > 0 && user.field && (
                    <section>
                      <SH icon={FileText} title={`Pour ta filière — ${user.field}`} count={bySkill.length} color="#2563eb" />
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,340px))", gap:16 }}>
                        {bySkill.map(opp => <OpportunityCard key={opp.id} opp={opp} user={userCtx} />)}
                      </div>
                    </section>
                  )}
                  {rest.length > 0 && (
                    <section>
                      <SH icon={LayoutGridIcon} title="Explorer toutes les opportunités" count={sorted.length} />
                      <div style={{ background:"var(--bg-card)", borderRadius:14, border:"1px solid var(--border)",
                        overflow:"hidden", marginBottom:16 }}>
                        {rest.map(opp => <OpportunityListRow key={opp.id} opp={opp} />)}
                      </div>
                      {!showMore && sorted.length > 14 && (
                        <div style={{ textAlign:"center" }}>
                          <button onClick={() => setShowMore(true)} style={{
                            fontSize:14, fontWeight:600, color:"var(--accent-dark)",
                            background:"var(--accent-light)", border:"1px solid var(--sidebar-active-border)",
                            padding:"13px 30px", borderRadius:12, cursor:"pointer",
                          }}>Voir plus ({sorted.length - 14} opportunités) →</button>
                        </div>
                      )}
                    </section>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <aside className="dashboard-aside" style={{ width:266, flexShrink:0, display:"flex", flexDirection:"column",
          gap:14, alignSelf:"flex-start", position:"sticky", top:16 }}>

          <div style={{ background:"var(--bg-card)", borderRadius:16, border:"1px solid var(--border)",
            padding:"16px", boxShadow:"var(--shadow-sm)" }}>
            {stats && (
              <>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                  <span style={{ fontSize:12, color:"var(--text-secondary)", fontWeight:600 }}>Profil complété</span>
                  <span style={{ fontSize:13, fontWeight:700,
                    color: stats.profile_pct >= 80 ? "var(--accent)" : "var(--text-warning)" }}>{stats.profile_pct}%</span>
                </div>
                <div style={{ background:"var(--bg-surface-2)", height:6, borderRadius:3, overflow:"hidden", marginBottom:13 }}>
                  <div style={{ height:"100%", borderRadius:3, width:`${stats.profile_pct}%`,
                    background: stats.profile_pct >= 80 ? "var(--accent)" : "var(--text-warning)" }} />
                </div>
              </>
            )}
            <Link href="/dashboard/profile" style={{ display:"block", textAlign:"center", fontSize:13,
              fontWeight:600, color:"var(--accent-dark)", background:"var(--accent-light)",
              border:"1px solid var(--sidebar-active-border)", padding:"9px", borderRadius:10,
              textDecoration:"none" }}>Améliorer mon profil →</Link>
          </div>

          <div style={{ background:"var(--bg-hero)", borderRadius:16, padding:"17px",
            border:"1px solid rgba(139,92,246,.2)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:11 }}>
              <Bot size={16} color="#a78bfa" />
              <p style={{ fontWeight:600, fontSize:13, color:"#fff", flex:1 }}>Insight IA</p>
              <span style={{ fontSize:10, fontWeight:700, color:"#a78bfa",
                background:"rgba(167,139,250,.2)", padding:"3px 8px", borderRadius:20 }}>IA</span>
            </div>
            <p style={{ fontSize:12, color:"rgba(255,255,255,.55)", lineHeight:1.6,
              marginBottom: topMatches.length > 0 ? 11 : 0 }}>
              {topMatches.length > 0
                ? `${topMatches.length} opportunité${topMatches.length>1?"s":""} correspondent à +80% de ton profil.`
                : stats?.profile_pct && stats.profile_pct < 60
                ? "Complète ton profil pour débloquer les recommandations."
                : "Ton feed est actualisé automatiquement."}
            </p>
            {topMatches.length > 0 && (
              <Link href={`/opportunity/${topMatches[0].id}`} style={{ display:"block", fontSize:12,
                fontWeight:600, color:"#fff", background:"linear-gradient(135deg,#7c3aed,#a78bfa)",
                padding:"9px", borderRadius:10, textDecoration:"none", textAlign:"center" }}>
                Voir mon meilleur match →
              </Link>
            )}
          </div>

          {deadlines.length > 0 && (
            <div style={{ background:"var(--bg-card)", borderRadius:16, border:"1px solid var(--border)",
              overflow:"hidden", boxShadow:"var(--shadow-sm)" }}>
              <div style={{ padding:"12px 15px", borderBottom:"1px solid var(--border-subtle)",
                display:"flex", alignItems:"center", gap:7 }}>
                <CalendarClock size={14} color="var(--text-secondary)" />
                <p style={{ fontWeight:600, fontSize:13, color:"var(--text-primary)" }}>Deadlines · 14 jours</p>
              </div>
              {deadlines.map(opp => {
                const d = daysLeft(opp.deadline)!;
                return (
                  <Link key={opp.id} href={`/opportunity/${opp.id}`} className="sidebar-item" style={{
                    display:"flex", alignItems:"center", gap:9, padding:"9px 15px",
                    borderBottom:"1px solid var(--border-subtle)", textDecoration:"none" }}>
                    <div style={{ width:5, height:5, borderRadius:"50%", flexShrink:0,
                      background: d <= 3 ? "var(--text-danger)" : d <= 7 ? "var(--text-warning)" : "var(--text-muted)" }} />
                    <p style={{ flex:1, fontSize:12, fontWeight:500, color:"var(--text-primary)",
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{opp.title}</p>
                    <Badge variant={d <= 7 ? "danger" : "neutral"}>J-{d}</Badge>
                  </Link>
                );
              })}
            </div>
          )}

        </aside>
      </div>

    </div>
  );
}

const LayoutGridIcon: LucideIcon = Sparkles;

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"80vh" }}>
        <LoaderCircle size={32} color="var(--accent)" className="spin" />
      </div>
    }>
      <DashboardInner />
    </Suspense>
  );
}
