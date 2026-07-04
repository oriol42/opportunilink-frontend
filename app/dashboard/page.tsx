"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  Bot, X, Send, Search, FileText, CircleCheck, Bookmark, User,
  Sparkles, Flame, CalendarClock, ArrowRight, LoaderCircle, LucideIcon,
} from "lucide-react";
import CoachingCard from "@/components/dashboard/CoachingCard";
import OpportunityCard from "@/components/opportunity/OpportunityCard";
import OpportunityListRow from "@/components/opportunity/OpportunityListRow";
import TopMatchCard from "@/components/opportunity/TopMatchCard";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { OpportunityLite, daysLeft } from "@/lib/opportunityHelpers";

interface Stats {
  applications: { total: number; submitted: number; accepted: number };
  saved_count: number; documents_count: number; profile_pct: number;
}

const TABS = ["Tout","Bourses","Stages","Emplois","Formations","Concours"];
const TAB_TYPES = ["","bourse","stage","emploi","formation","concours"];

/* ── Bouton IA flottant ── */
function AIFloatButton({ opps, user }: { opps: OpportunityLite[]; user: { full_name?: string | null; level?: string | null; field?: string | null } }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user"|"ai"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const topOpps = opps.slice(0, 10).map(o =>
    `- "${o.title}" (${o.type}, ${o.country ?? "International"}, score ${Math.round(o.relevance_score)}%, deadline: ${o.deadline ?? "non précisée"})`
  ).join("\n");

  const systemContext = `Tu es le coach IA d'OpportuLink, une plateforme d'opportunités pour étudiants camerounais.
Profil étudiant : ${user.full_name ?? "Étudiant"}, niveau ${user.level ?? "non précisé"}, filière ${user.field ?? "non précisée"}.
Opportunités actuellement dans le feed de l'étudiant :
${topOpps || "Aucune opportunité chargée."}

Tes rôles :
- Conseiller sur les opportunités spécifiques du feed
- Générer un plan d'étude pour combler les manques (langues, docs, niveau)
- Donner des conseils de candidature précis et actionnables
- Répondre en français, de façon concise et bienveillante
- Ne jamais inventer d'opportunités qui ne sont pas dans le feed`;

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role:"user", text:userMsg }]);
    setLoading(true);
    try {
      const res = await api.post("/ai/chat", { message: userMsg, context: systemContext });
      setMessages(prev => [...prev, { role:"ai", text: res.data.reply ?? "Je n'ai pas pu répondre." }]);
    } catch {
      setMessages(prev => [...prev, { role:"ai", text: "Erreur de connexion. Réessaie." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(o => !o)} style={{
        position: "fixed", bottom: 28, right: 28, zIndex: 100,
        width: 56, height: 56, borderRadius: "50%",
        background: "linear-gradient(135deg,var(--accent),var(--accent-dark))",
        border: "none", cursor: "pointer",
        boxShadow: "0 4px 24px rgba(16,185,129,.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "transform .2s, box-shadow .2s",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform="scale(1.08)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform="scale(1)"; }}
      aria-label="Ouvrir le coach IA">
        {open ? <X size={22} color="#fff" /> : <Bot size={24} color="#fff" />}
      </button>

      {open && (
        <div className="ai-panel" style={{
          position: "fixed", bottom: 96, right: 28, zIndex: 100,
          width: 360, background: "var(--bg-card)", borderRadius: 20,
          border: "1px solid var(--border)", boxShadow: "0 8px 48px rgba(0,0,0,.18)",
          display: "flex", flexDirection: "column", maxHeight: 520,
        }}>
          <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border-subtle)",
            background: "var(--bg-hero)", borderRadius: "20px 20px 0 0",
            display: "flex", alignItems: "center", gap: 10 }}>
            <Bot size={20} color="#6ee7b7" />
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>Coach IA OpportuLink</p>
              <p style={{ fontSize: 11, color: "#6ee7b7" }}>Connecté à ton feed · {opps.length} opportunités</p>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px",
            display: "flex", flexDirection: "column", gap: 10, minHeight: 200, maxHeight: 320 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <Bot size={30} color="var(--accent)" style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  Pose-moi une question sur une opportunité de ton feed, ou demande-moi un plan d'étude !
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
                  {[
                    "Quelle est ma meilleure opportunité ?",
                    "Crée-moi un plan pour la bourse DAAD",
                    "Qu'est-ce qui me manque pour postuler ?",
                  ].map(s => (
                    <button key={s} onClick={() => setInput(s)} style={{
                      fontSize: 11, fontWeight: 600, color: "var(--accent-dark)",
                      background: "var(--accent-light)", border: "1px solid var(--sidebar-active-border)",
                      padding: "7px 12px", borderRadius: 20, cursor: "pointer", textAlign: "left",
                    }}>{s}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "82%", padding: "9px 13px", borderRadius: 14, fontSize: 13, lineHeight: 1.6,
                  background: m.role === "user" ? "var(--accent)" : "var(--bg-surface-2)",
                  color: m.role === "user" ? "#fff" : "var(--text-primary)",
                  borderBottomRightRadius: m.role === "user" ? 4 : 14,
                  borderBottomLeftRadius: m.role === "ai" ? 4 : 14,
                }}>{m.text}</div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px",
                background: "var(--bg-surface-2)", borderRadius: 14, width: "fit-content" }}>
                <LoaderCircle size={14} color="var(--accent)" className="spin" />
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Réflexion...</span>
              </div>
            )}
          </div>

          <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border-subtle)", display: "flex", gap: 8 }}>
            <input
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Pose ta question..."
              style={{ flex: 1, background: "var(--bg-input)", border: "1px solid var(--border)",
                borderRadius: 10, padding: "9px 12px", fontSize: 13, color: "var(--text-primary)", outline: "none" }}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()} style={{
              background: "var(--accent)", border: "none", borderRadius: 10, padding: "9px 12px",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              opacity: loading || !input.trim() ? 0.5 : 1,
            }}><Send size={15} color="#fff" /></button>
          </div>
        </div>
      )}
    </>
  );
}

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

  const filtered = searchQ
    ? displayOpps.filter(o =>
        o.title.toLowerCase().includes(searchQ) ||
        (o.description||"").toLowerCase().includes(searchQ) ||
        (o.country||"").toLowerCase().includes(searchQ) ||
        o.type.toLowerCase().includes(searchQ)
      )
    : displayOpps;

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
              <div style={{ display:"flex", flexWrap:"wrap", background:"var(--bg-card)", borderRadius:12, padding:4,
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
            <Card style={{ textAlign:"center", padding:"60px 20px" }}>
              <Search size={32} color="var(--text-muted)" style={{ marginBottom: 12 }} />
              <p style={{ fontWeight:600, fontSize:16, color:"var(--text-primary)", marginBottom:6 }}>
                {searchQ ? `Aucun résultat pour "${searchQ}"` : "Aucune opportunité"}
              </p>
              <p style={{ fontSize:13, color:"var(--text-muted)" }}>
                {searchQ ? "Essaie d'autres mots-clés." : "Essaie un autre onglet."}
              </p>
            </Card>
          )}

          {sorted.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:28 }}>

              {searchQ && (
                <section>
                  <SH icon={Search} title={`Résultats pour "${searchQ}"`} count={sorted.length} />
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))", gap:16 }}>
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
                      <div style={{ background:"var(--bg-urgent)", borderRadius:16,
                        border:"1px solid var(--border-urgent)", padding:16 }}>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))", gap:16 }}>
                          {urgent.map(opp => <OpportunityCard key={opp.id} opp={opp} user={userCtx} />)}
                        </div>
                      </div>
                    </section>
                  )}
                  {recent.length > 0 && (
                    <section>
                      <SH icon={Sparkles} title="Nouvelles opportunités" count={recent.length} />
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))", gap:16 }}>
                        {recent.map(opp => <OpportunityCard key={opp.id} opp={opp} user={userCtx} />)}
                      </div>
                    </section>
                  )}
                  {bySkill.length > 0 && user.field && (
                    <section>
                      <SH icon={FileText} title={`Pour ta filière — ${user.field}`} count={bySkill.length} color="#2563eb" />
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))", gap:16 }}>
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
            overflow:"hidden", boxShadow:"var(--shadow-sm)" }}>
            <div style={{ background:"var(--bg-hero)", padding:"20px" }}>
              <div style={{ width:46, height:46, borderRadius:"50%",
                background:"linear-gradient(135deg,var(--accent),var(--accent-dark))",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:16, fontWeight:700, color:"#fff", marginBottom:11,
                border:"2px solid rgba(16,185,129,.4)" }}>
                {user.full_name?.split(" ").map((n:string)=>n[0]).slice(0,2).join("").toUpperCase() ?? "?"}
              </div>
              <p style={{ fontWeight:600, fontSize:15, color:"#fff", marginBottom:3 }}>{user.full_name}</p>
              <p style={{ fontSize:12, color:"#6ee7b7" }}>{user.level}{user.field ? ` · ${user.field}` : ""}</p>
            </div>
            <div style={{ padding:"15px" }}>
              {stats && (
                <>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ fontSize:12, color:"var(--text-muted)", fontWeight:600 }}>Profil complété</span>
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

      <AIFloatButton opps={displayOpps} user={{ full_name:user.full_name, level:user.level, field:user.field }} />
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
