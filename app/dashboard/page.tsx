"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import Link from "next/link";
import SaveButton from "@/components/opportunity/SaveButton";
import CoachingCard from "@/components/dashboard/CoachingCard";

interface Opp {
  id: string; title: string; type: string;
  description?: string | null; deadline: string | null;
  country: string | null; reliability_score: number;
  relevance_score: number; is_verified?: boolean;
  source_url?: string; required_fields?: string[];
  required_level?: string[]; required_languages?: string[];
}
interface Stats {
  applications: { total: number; submitted: number; accepted: number };
  saved_count: number; documents_count: number; profile_pct: number;
}

const TYPE: Record<string, { label: string; color: string; bg: string; gradient: string }> = {
  bourse:    { label:"Bourse",    color:"#7c3aed", bg:"rgba(124,58,237,.12)", gradient:"#7c3aed,#a855f7" },
  stage:     { label:"Stage",     color:"#2563eb", bg:"rgba(37,99,235,.12)",  gradient:"#2563eb,#3b82f6" },
  emploi:    { label:"Emploi",    color:"#059669", bg:"rgba(5,150,105,.12)",  gradient:"#059669,#10b981" },
  echange:   { label:"Échange",   color:"#d97706", bg:"rgba(217,119,6,.12)",  gradient:"#d97706,#f59e0b" },
  concours:  { label:"Concours",  color:"#dc2626", bg:"rgba(220,38,38,.12)",  gradient:"#dc2626,#ef4444" },
  formation: { label:"Formation", color:"#0891b2", bg:"rgba(8,145,178,.12)",  gradient:"#0891b2,#06b6d4" },
};

const TABS = ["Tout","Bourses","Stages","Emplois","Formations","Concours"];
const TAB_TYPES = ["","bourse","stage","emploi","formation","concours"];

function dl(deadline: string | null) {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
}

function detectMethod(sourceUrl: string, description: string) {
  const url = (sourceUrl || "").toLowerCase();
  if (url.includes("forms.google") || url.includes("typeform")) return { icon:"📝", label:"Formulaire" };
  const hasEmail = (sourceUrl+" "+description).match(/[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (hasEmail || url.startsWith("mailto:")) return { icon:"📧", label:"Email" };
  if (url.includes("linkedin.com")) return { icon:"💼", label:"LinkedIn" };
  return { icon:"🌐", label:"Lien" };
}

function whyRecommended(opp: Opp, user: { level?: string | null; field?: string | null; languages?: string[] | null }) {
  const reasons: string[] = [];
  if (user.level && opp.required_level?.includes(user.level)) reasons.push("✅ Ton niveau");
  if (user.field && opp.required_fields?.includes(user.field)) reasons.push("📚 Ta filière");
  if (user.languages?.some(l => opp.required_languages?.includes(l))) reasons.push("🗣️ Langue OK");
  if (opp.is_verified) reasons.push("🛡️ Vérifié");
  const d = dl(opp.deadline);
  if (d !== null && d >= 0 && d <= 14) reasons.push(`⏰ J-${d}`);
  if (reasons.length === 0) reasons.push("⭐ Recommandé");
  return reasons.slice(0, 3);
}

/* ── BOUTON IA FLOTTANT ── */
function AIFloatButton({ opps, user }: { opps: Opp[]; user: { full_name?: string | null; level?: string | null; field?: string | null } }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user"|"ai"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Contexte injecté dans le prompt — opportunités du feed + profil
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
      const res = await api.post("/ai/chat", {
        message: userMsg,
        context: systemContext,
      });
      setMessages(prev => [...prev, { role:"ai", text: res.data.reply ?? "Je n'ai pas pu répondre." }]);
    } catch {
      setMessages(prev => [...prev, { role:"ai", text: "Erreur de connexion. Réessaie." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Bubble flottante */}
      <button onClick={() => setOpen(o => !o)} style={{
        position: "fixed", bottom: 28, right: 28, zIndex: 100,
        width: 58, height: 58, borderRadius: "50%",
        background: "linear-gradient(135deg,#10b981,#059669)",
        border: "none", cursor: "pointer", fontSize: 24,
        boxShadow: "0 4px 24px rgba(16,185,129,.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "transform .2s, box-shadow .2s",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform="scale(1.08)"; e.currentTarget.style.boxShadow="0 6px 32px rgba(16,185,129,.5)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform="scale(1)"; e.currentTarget.style.boxShadow="0 4px 24px rgba(16,185,129,.4)"; }}
      aria-label="Ouvrir le coach IA">
        {open ? "✕" : "🤖"}
      </button>

      {/* Panel chat */}
      {open && (
        <div style={{
          position: "fixed", bottom: 100, right: 28, zIndex: 100,
          width: 360, background: "var(--bg-card)", borderRadius: 20,
          border: "1px solid var(--border)", boxShadow: "0 8px 48px rgba(0,0,0,.18)",
          display: "flex", flexDirection: "column", maxHeight: 520,
        }}>
          {/* Header */}
          <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border-subtle)",
            background: "linear-gradient(135deg,#065f46,#0f172a)", borderRadius: "20px 20px 0 0",
            display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🤖</span>
            <div>
              <p style={{ fontWeight: 800, fontSize: 14, color: "#fff" }}>Coach IA OpportuLink</p>
              <p style={{ fontSize: 11, color: "#6ee7b7" }}>Connecté à ton feed · {opps.length} opportunités</p>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px",
            display: "flex", flexDirection: "column", gap: 10, minHeight: 200, maxHeight: 320 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <p style={{ fontSize: 28, marginBottom: 8 }}>👋</p>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  Pose-moi une question sur une opportunité de ton feed, ou demande-moi un plan d'étude !
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
                  {[
                    "Quelle est ma meilleure opportunité ?",
                    "Crée-moi un plan pour la bourse DAAD",
                    "Qu'est-ce qui me manque pour postuler ?",
                  ].map(s => (
                    <button key={s} onClick={() => { setInput(s); }} style={{
                      fontSize: 11, fontWeight: 600, color: "var(--accent)",
                      background: "var(--accent-light)", border: "1px solid var(--sidebar-active-border)",
                      padding: "7px 12px", borderRadius: 20, cursor: "pointer", textAlign: "left",
                    }}>{s}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  maxWidth: "82%", padding: "9px 13px", borderRadius: 14, fontSize: 13,
                  lineHeight: 1.6,
                  background: m.role === "user"
                    ? "linear-gradient(135deg,#10b981,#059669)" : "var(--bg-surface-2)",
                  color: m.role === "user" ? "#fff" : "var(--text-primary)",
                  borderBottomRightRadius: m.role === "user" ? 4 : 14,
                  borderBottomLeftRadius: m.role === "ai" ? 4 : 14,
                }}>{m.text}</div>
              </div>
            ))}
            {loading && (
              <div style={{ display:"flex", gap:5, padding:"8px 12px",
                background:"var(--bg-surface-2)", borderRadius:14, width:"fit-content" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width:7, height:7, borderRadius:"50%", background:"#10b981",
                    animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border-subtle)",
            display: "flex", gap: 8 }}>
            <input
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Pose ta question..."
              style={{ flex: 1, background: "var(--bg-input)", border: "1px solid var(--border)",
                borderRadius: 10, padding: "9px 12px", fontSize: 13, color: "var(--text-primary)",
                outline: "none" }}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()} style={{
              background: "linear-gradient(135deg,#10b981,#059669)", border: "none",
              borderRadius: 10, padding: "9px 14px", cursor: "pointer",
              fontSize: 16, color: "#fff", opacity: loading || !input.trim() ? 0.5 : 1,
            }}>→</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%,80%,100% { transform:translateY(0); }
          40% { transform:translateY(-6px); }
        }
      `}</style>
    </>
  );
}

function TopMatchCard({ opp, user }: { opp: Opp; user: { level?: string | null; field?: string | null; languages?: string[] | null } }) {
  const cfg = TYPE[opp.type] ?? { label:opp.type, color:"#6b7280", bg:"rgba(107,114,128,.12)", gradient:"#6b7280,#9ca3af" };
  const d = dl(opp.deadline);
  const score = Math.round(opp.relevance_score ?? 0);
  const method = detectMethod(opp.source_url||"", opp.description||"");
  const reasons = whyRecommended(opp, user);
  const excerpt = opp.description?.replace(/\s+/g," ").trim().slice(0,200) + (opp.description && opp.description.length > 200 ? "…" : "");

  return (
    <div style={{ background:"var(--bg-hero)", borderRadius:18, overflow:"hidden",
      border:"1px solid rgba(16,185,129,.25)", position:"relative" }}>
      <div style={{ position:"absolute", top:-50, right:-50, width:180, height:180,
        background:`radial-gradient(circle,${cfg.color}18 0%,transparent 70%)`, pointerEvents:"none" }} />
      <div style={{ padding:"24px 28px", position:"relative" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <span style={{ fontSize:12, fontWeight:800, color:"#fbbf24", background:"rgba(251,191,36,.15)",
              padding:"5px 12px", borderRadius:20, border:"1px solid rgba(251,191,36,.25)" }}>⚡ TOP MATCH IA</span>
            <span style={{ fontSize:12, fontWeight:800, color:cfg.color, background:cfg.bg,
              padding:"5px 12px", borderRadius:20 }}>{cfg.label}</span>
            {d !== null && d >= 0 && d <= 14 && (
              <span style={{ fontSize:12, fontWeight:800, color:"#fff",
                background: d <= 7 ? "rgba(239,68,68,.85)" : "rgba(245,158,11,.75)",
                padding:"5px 12px", borderRadius:20 }}>{d === 0 ? "🔥 Aujourd'hui" : `🔥 J-${d}`}</span>
            )}
          </div>
          <div style={{ textAlign:"right", flexShrink:0 }}>
            <div style={{ fontSize:38, fontWeight:900, lineHeight:1, color:"#10b981" }}>{score}%</div>
            <div style={{ fontSize:11, fontWeight:700, color:"#6ee7b7", letterSpacing:".06em" }}>PERTINENCE</div>
          </div>
        </div>
        <Link href={`/opportunity/${opp.id}`} style={{ textDecoration:"none" }}>
          <h3 style={{ fontWeight:900, fontSize:20, color:"#fff", lineHeight:1.35, marginBottom:10, cursor:"pointer" }}
            className="hover:text-emerald-400 transition-colors">{opp.title}</h3>
        </Link>
        {excerpt && <p style={{ fontSize:14, color:"rgba(255,255,255,.45)", lineHeight:1.65, marginBottom:16 }}>{excerpt}</p>}
        <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:14 }}>
          {reasons.map((r,i) => (
            <span key={i} style={{ fontSize:12, fontWeight:700, color:"#a7f3d0",
              background:"rgba(16,185,129,.1)", padding:"5px 11px", borderRadius:20,
              border:"1px solid rgba(16,185,129,.2)" }}>{r}</span>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          borderTop:"1px solid rgba(255,255,255,.08)", paddingTop:14 }}>
          <span style={{ fontSize:13, color:"rgba(255,255,255,.35)" }}>
            {method.icon} {method.label} · 🌍 {opp.country ?? "International"}
          </span>
          <div style={{ display:"flex", gap:8 }}>
            <SaveButton oppId={opp.id} compact />
            <Link href={`/opportunity/${opp.id}`} style={{ fontSize:14, fontWeight:800, color:"#0f172a",
              background:"linear-gradient(135deg,#10b981,#34d399)",
              padding:"9px 18px", borderRadius:11, textDecoration:"none" }}>Voir →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function OppCard({ opp, user }: { opp: Opp; user: { level?: string | null; field?: string | null; languages?: string[] | null } }) {
  const cfg = TYPE[opp.type] ?? { label:opp.type, color:"#6b7280", bg:"rgba(107,114,128,.12)", gradient:"#6b7280,#9ca3af" };
  const d = dl(opp.deadline);
  const score = Math.round(opp.relevance_score ?? 0);
  const scoreColor = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  const method = detectMethod(opp.source_url||"", opp.description||"");
  const topReason = whyRecommended(opp, user)[0];
  const excerpt = opp.description?.replace(/\s+/g," ").trim().slice(0,140) + (opp.description && opp.description.length > 140 ? "…" : "");

  return (
    <div style={{ background:"var(--bg-card)", borderRadius:16, border:"1px solid var(--border-subtle)",
      overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"var(--shadow-sm)",
      transition:"box-shadow .2s, transform .2s" }} className="opp-hover">
      <div style={{ height:4, background:`linear-gradient(90deg,${cfg.gradient})` }} />
      <div style={{ padding:"16px", flex:1, display:"flex", flexDirection:"column", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
          <span style={{ fontSize:12, fontWeight:800, color:cfg.color, background:cfg.bg,
            padding:"4px 11px", borderRadius:20 }}>{cfg.label}</span>
          <span style={{ fontSize:12, color:"var(--text-muted)", background:"var(--bg-surface-2)",
            padding:"4px 10px", borderRadius:20 }}>{method.icon} {method.label}</span>
          {d !== null && d >= 0 && (
            <span style={{ marginLeft:"auto", fontSize:12, fontWeight:800,
              color: d <= 3 ? "#fff" : d <= 7 ? "#dc2626" : "var(--text-muted)",
              background: d <= 3 ? "#dc2626" : d <= 7 ? "rgba(220,38,38,.1)" : "var(--bg-surface-2)",
              padding:"4px 10px", borderRadius:20 }}>
              {d === 0 ? "🔥" : d <= 7 ? `🔥 J-${d}` : `J-${d}`}
            </span>
          )}
        </div>
        <Link href={`/opportunity/${opp.id}`} style={{ textDecoration:"none" }}>
          <p style={{ fontWeight:800, fontSize:16, color:"var(--text-primary)", lineHeight:1.4,
            display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}
            className="hover:text-emerald-600 transition-colors cursor-pointer">{opp.title}</p>
        </Link>
        <p style={{ fontSize:14, color:"var(--text-secondary)", lineHeight:1.6, flex:1,
          display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
          {excerpt || "Consulte la page détail pour plus d'informations."}
        </p>
        {topReason && (
          <div style={{ background:"var(--accent-light)", borderRadius:9, padding:"5px 11px" }}>
            <p style={{ fontSize:12, color:"var(--sidebar-active-text)", fontWeight:700 }}>{topReason}</p>
          </div>
        )}
        <div style={{ display:"flex", alignItems:"center", gap:10,
          borderTop:"1px solid var(--border-subtle)", paddingTop:12 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
              <span style={{ fontSize:12, color:"var(--text-muted)", fontWeight:600 }}>Match</span>
              <span style={{ fontSize:13, fontWeight:900, color:scoreColor }}>{score}%</span>
            </div>
            <div style={{ height:5, background:"var(--bg-surface-2)", borderRadius:3, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${score}%`, background:scoreColor, borderRadius:3 }} />
            </div>
          </div>
          <SaveButton oppId={opp.id} compact />
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background:"var(--bg-card)", borderRadius:16, border:"1px solid var(--border-subtle)",
      overflow:"hidden", minHeight:250 }} className="animate-pulse">
      <div style={{ height:4, background:"var(--border)" }} />
      <div style={{ padding:16, display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ height:22, width:78, background:"var(--border)", borderRadius:20 }} />
        <div style={{ height:16, background:"var(--border)", borderRadius:4, width:"88%" }} />
        <div style={{ height:16, background:"var(--bg-surface-2)", borderRadius:4, width:"65%" }} />
        <div style={{ height:5, background:"var(--bg-surface-2)", borderRadius:3, marginTop:10 }} />
      </div>
    </div>
  );
}

function SH({ icon, title, count, color }: { icon:string; title:string; count?:number; color?:string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:16 }}>
      <span style={{ fontSize:20 }}>{icon}</span>
      <h2 style={{ fontWeight:900, fontSize:16, color: color ?? "var(--text-primary)", flex:1 }}>{title}</h2>
      {count !== undefined && (
        <span style={{ fontSize:13, fontWeight:700, color:"var(--text-muted)",
          background:"var(--bg-surface-2)", padding:"3px 12px", borderRadius:20,
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

  // On charge tout le feed une seule fois (limit=200, sans filtre type).
  // Le filtre par onglet se fait localement en JS — zero refetch au changement d onglet.
  const { data: opps, isLoading, isFetching } = useQuery<Opp[]>({
    queryKey: ["feed-all"],
    queryFn: async () => {
      const p = new URLSearchParams({ page:"1", limit:"200" });
      return (await api.get(`/opportunities?${p}`)).data;
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,   // 10 min — pas de refetch pendant 10 min
    gcTime: 30 * 60 * 1000,      // garde en memoire 30 min
    placeholderData: (prev) => prev,
  });

  const tabType = TAB_TYPES[activeTab];

  if (isAuthLoading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"80vh" }}>
      <div className="animate-spin rounded-full" style={{ width:40, height:40,
        border:"3px solid var(--accent)", borderTopColor:"transparent" }} />
    </div>
  );
  if (!user) return null;

  const userCtx = { level:user.level, field:user.field, languages:user.languages };
  const allOpps = opps ?? [];

  // Filtre par onglet actif (local, pas de refetch)
  const displayOpps = tabType
    ? allOpps.filter(o => o.type === tabType)
    : allOpps;

  // Filtre local par recherche
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
  const urgent      = sorted.filter(o => { const d = dl(o.deadline); return d !== null && d >= 0 && d <= 7; }).slice(0, 4);
  const recent      = sorted.slice(0, 6);
  const bySkill     = sorted.filter(o => o.required_fields?.includes(user.field ?? "")).slice(0, 4);
  const rest        = showMore ? sorted.slice(6) : sorted.slice(6, 14);
  const urgentCount = filtered.filter(o => { const d = dl(o.deadline); return d !== null && d >= 0 && d <= 7; }).length;
  const firstName   = user.full_name?.split(" ")[0] ?? "toi";
  const deadlines   = filtered.filter(o => { const d = dl(o.deadline); return d !== null && d >= 0 && d <= 14; }).slice(0, 5);

  return (
    <div style={{ display:"flex", gap:24, padding:"24px 28px 80px", minHeight:"100%" }}>

      {/* COLONNE PRINCIPALE */}
      <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:22 }}>

        {/* HERO */}
        <div style={{ background:"var(--bg-hero)", borderRadius:20, padding:"28px 32px",
          position:"relative", overflow:"hidden", border:"1px solid rgba(16,185,129,.2)" }}>
          <div style={{ position:"absolute", top:-60, right:-60, width:260, height:260,
            background:"radial-gradient(circle,rgba(16,185,129,.1) 0%,transparent 70%)", pointerEvents:"none" }} />
          <div style={{ position:"relative" }}>
            <p style={{ fontSize:12, color:"#6ee7b7", fontWeight:700, marginBottom:6, letterSpacing:".06em" }}>
              {new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"}).toUpperCase()}
            </p>
            <h1 style={{ fontWeight:900, fontSize:30, color:"#fff", marginBottom:6, lineHeight:1.2 }}>
              Bonjour, {firstName} 👋
            </h1>
            <p style={{ fontSize:15, color:"rgba(255,255,255,.45)", marginBottom:22 }}>
              {searchQ
                ? `🔍 ${filtered.length} résultat${filtered.length > 1?"s":""} pour "${searchQ}"`
                : isLoading && !opps
                ? "Chargement de ton feed personnalisé..."
                : `${filtered.length} opportunités · ${topMatches.length} top match${topMatches.length>1?"s":""} IA${urgentCount > 0 ? ` · 🔥 ${urgentCount} deadline${urgentCount>1?"s":""}` : ""}`}
            </p>
            {stats && !searchQ && (
              <div style={{ display:"flex", gap:28, flexWrap:"wrap" }}>
                {[
                  { val:stats.applications.total,   label:"Candidatures", icon:"📋" },
                  { val:stats.applications.accepted, label:"Acceptées",   icon:"✅" },
                  { val:stats.saved_count,           label:"Favoris",     icon:"🔖" },
                  { val:`${stats.profile_pct}%`,     label:"Profil",      icon:"👤" },
                ].map(s => (
                  <div key={s.label} style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:22 }}>{s.icon}</span>
                    <div>
                      <p style={{ fontWeight:900, fontSize:24, color:"#fff", lineHeight:1 }}>{s.val}</p>
                      <p style={{ fontSize:12, color:"#6ee7b7", fontWeight:600, marginTop:2 }}>{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COACHING — masqué pendant recherche */}
        {!searchQ && <CoachingCard />}

        {/* TABS */}
        {!searchQ && (
          <div>
            <div style={{ display:"flex", background:"var(--bg-card)", borderRadius:12, padding:4,
              border:"1px solid var(--border-subtle)" }}>
              {TABS.map((tab, i) => (
                <button key={tab} onClick={() => { setActiveTab(i); setShowMore(false); }} style={{
                  flex:1, padding:"10px 6px", borderRadius:9, border:"none", cursor:"pointer",
                  fontWeight:700, fontSize:13, transition:"all .15s",
                  background: activeTab === i ? "var(--text-primary)" : "transparent",
                  color: activeTab === i ? "var(--bg-card)" : "var(--text-muted)",
                }}>{tab}</button>
              ))}
            </div>
            {isFetching && (
              <div style={{ height:2, background:"var(--border-subtle)", borderRadius:2, marginTop:3, overflow:"hidden" }}>
                <div style={{ height:"100%", background:"#10b981", borderRadius:2,
                  animation:"progress-bar 1.2s ease-in-out infinite" }} />
              </div>
            )}
          </div>
        )}

        {/* SKELETON */}
        {isLoading && !opps && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:16 }}>
            {Array.from({ length: 6 }).map((_,i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!isLoading && sorted.length === 0 && (
          <div style={{ textAlign:"center", padding:"60px 20px", background:"var(--bg-card)",
            borderRadius:18, border:"1px solid var(--border-subtle)" }}>
            <p style={{ fontSize:40, marginBottom:12 }}>🔍</p>
            <p style={{ fontWeight:700, fontSize:17, color:"var(--text-primary)", marginBottom:8 }}>
              {searchQ ? `Aucun résultat pour "${searchQ}"` : "Aucune opportunité"}
            </p>
            <p style={{ fontSize:14, color:"var(--text-muted)" }}>
              {searchQ ? "Essaie d'autres mots-clés." : "Essaie un autre onglet."}
            </p>
          </div>
        )}

        {sorted.length > 0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:28 }}>

            {/* Mode recherche — affichage simple */}
            {searchQ && (
              <section>
                <SH icon="🔍" title={`Résultats pour "${searchQ}"`} count={sorted.length} />
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
                  {sorted.map(opp => <OppCard key={opp.id} opp={opp} user={userCtx!} />)}
                </div>
              </section>
            )}

            {/* Mode normal */}
            {!searchQ && (
              <>
                {topMatches.length > 0 && (
                  <section>
                    <SH icon="⚡" title="Top Match IA" count={topMatches.length} color="#059669" />
                    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                      {topMatches.map(opp => <TopMatchCard key={opp.id} opp={opp} user={userCtx!} />)}
                    </div>
                  </section>
                )}
                {urgent.length > 0 && (
                  <section>
                    <SH icon="🔥" title="Deadlines urgentes — cette semaine" count={urgent.length} color="#dc2626" />
                    <div style={{ background:"rgba(220,38,38,.04)", borderRadius:16,
                      border:"1px solid rgba(220,38,38,.12)", padding:16 }}>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
                        {urgent.map(opp => <OppCard key={opp.id} opp={opp} user={userCtx!} />)}
                      </div>
                    </div>
                  </section>
                )}
                {recent.length > 0 && (
                  <section>
                    <SH icon="✨" title="Nouvelles opportunités" count={recent.length} />
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
                      {recent.map(opp => <OppCard key={opp.id} opp={opp} user={userCtx!} />)}
                    </div>
                  </section>
                )}
                {bySkill.length > 0 && user.field && (
                  <section>
                    <SH icon="📚" title={`Pour ta filière — ${user.field}`} count={bySkill.length} color="#2563eb" />
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
                      {bySkill.map(opp => <OppCard key={opp.id} opp={opp} user={userCtx!} />)}
                    </div>
                  </section>
                )}
                {rest.length > 0 && (
                  <section>
                    <SH icon="🌍" title="Explorer toutes les opportunités" count={sorted.length} />
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16, marginBottom:16 }}>
                      {rest.map(opp => <OppCard key={opp.id} opp={opp} user={userCtx!} />)}
                    </div>
                    {!showMore && sorted.length > 14 && (
                      <div style={{ textAlign:"center" }}>
                        <button onClick={() => setShowMore(true)} style={{
                          fontSize:15, fontWeight:700, color:"var(--accent)",
                          background:"var(--accent-light)", border:"1px solid var(--sidebar-active-border)",
                          padding:"14px 32px", borderRadius:12, cursor:"pointer",
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

      {/* PANNEAU DROIT */}
      <aside style={{ width:268, flexShrink:0, display:"flex", flexDirection:"column",
        gap:14, alignSelf:"flex-start", position:"sticky", top:16 }}>

        <div style={{ background:"var(--bg-card)", borderRadius:16, border:"1px solid var(--border-subtle)",
          overflow:"hidden", boxShadow:"var(--shadow-sm)" }}>
          <div style={{ background:"var(--bg-hero)", padding:"22px" }}>
            <div style={{ width:50, height:50, borderRadius:"50%",
              background:"linear-gradient(135deg,#10b981,#059669)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:18, fontWeight:900, color:"#fff", marginBottom:12,
              border:"2px solid rgba(16,185,129,.4)" }}>
              {user.full_name?.split(" ").map((n:string)=>n[0]).slice(0,2).join("").toUpperCase() ?? "?"}
            </div>
            <p style={{ fontWeight:800, fontSize:16, color:"#fff", marginBottom:3 }}>{user.full_name}</p>
            <p style={{ fontSize:13, color:"#6ee7b7" }}>{user.level}{user.field ? ` · ${user.field}` : ""}</p>
          </div>
          <div style={{ padding:"16px" }}>
            {stats && (
              <>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontSize:13, color:"var(--text-muted)", fontWeight:600 }}>Profil complété</span>
                  <span style={{ fontSize:14, fontWeight:900,
                    color: stats.profile_pct >= 80 ? "#10b981" : "#f59e0b" }}>{stats.profile_pct}%</span>
                </div>
                <div style={{ background:"var(--bg-surface-2)", height:6, borderRadius:3, overflow:"hidden", marginBottom:14 }}>
                  <div style={{ height:"100%", borderRadius:3, width:`${stats.profile_pct}%`,
                    background: stats.profile_pct >= 80 ? "linear-gradient(90deg,#10b981,#34d399)" : "#f59e0b" }} />
                </div>
              </>
            )}
            <Link href="/dashboard/profile" style={{ display:"block", textAlign:"center", fontSize:14,
              fontWeight:700, color:"var(--accent)", background:"var(--accent-light)",
              border:"1px solid var(--sidebar-active-border)", padding:"10px", borderRadius:10,
              textDecoration:"none" }}>Améliorer mon profil →</Link>
          </div>
        </div>

        <div style={{ background:"var(--bg-hero)", borderRadius:16, padding:"18px",
          border:"1px solid rgba(139,92,246,.2)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:11 }}>
            <span style={{ fontSize:18 }}>🤖</span>
            <p style={{ fontWeight:800, fontSize:14, color:"#fff", flex:1 }}>Insight IA</p>
            <span style={{ fontSize:11, fontWeight:800, color:"#a78bfa",
              background:"rgba(167,139,250,.2)", padding:"3px 9px", borderRadius:20 }}>IA</span>
          </div>
          <p style={{ fontSize:13, color:"rgba(255,255,255,.5)", lineHeight:1.65,
            marginBottom: topMatches.length > 0 ? 11 : 0 }}>
            {topMatches.length > 0
              ? `⚡ ${topMatches.length} opportunité${topMatches.length>1?"s":""} correspondent à +80% de ton profil.`
              : stats?.profile_pct && stats.profile_pct < 60
              ? "💡 Complète ton profil pour débloquer les recommandations."
              : "🎯 Ton feed est actualisé automatiquement."}
          </p>
          {topMatches.length > 0 && (
            <Link href={`/opportunity/${topMatches[0].id}`} style={{ display:"block", fontSize:13,
              fontWeight:700, color:"#fff", background:"linear-gradient(135deg,#7c3aed,#a78bfa)",
              padding:"9px", borderRadius:10, textDecoration:"none", textAlign:"center" }}>
              Voir mon meilleur match →
            </Link>
          )}
        </div>

        {deadlines.length > 0 && (
          <div style={{ background:"var(--bg-card)", borderRadius:16, border:"1px solid var(--border-subtle)",
            overflow:"hidden", boxShadow:"var(--shadow-sm)" }}>
            <div style={{ padding:"13px 16px", borderBottom:"1px solid var(--border-subtle)",
              display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:15 }}>⏰</span>
              <p style={{ fontWeight:800, fontSize:14, color:"var(--text-primary)" }}>Deadlines · 14 jours</p>
            </div>
            {deadlines.map(opp => {
              const d = dl(opp.deadline)!;
              return (
                <Link key={opp.id} href={`/opportunity/${opp.id}`} style={{
                  display:"flex", alignItems:"center", gap:10, padding:"10px 16px",
                  borderBottom:"1px solid var(--border-subtle)", textDecoration:"none" }}>
                  <div style={{ width:5, height:5, borderRadius:"50%", flexShrink:0,
                    background: d <= 3 ? "#ef4444" : d <= 7 ? "#f59e0b" : "#6b7280" }} />
                  <p style={{ flex:1, fontSize:13, fontWeight:600, color:"var(--text-primary)",
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{opp.title}</p>
                  <span style={{ fontSize:12, fontWeight:800, flexShrink:0,
                    color: d <= 7 ? "#dc2626" : "var(--text-muted)",
                    background: d <= 7 ? "rgba(220,38,38,.1)" : "var(--bg-surface-2)",
                    padding:"3px 8px", borderRadius:20 }}>J-{d}</span>
                </Link>
              );
            })}
          </div>
        )}

        {stats && (
          <div style={{ background:"var(--bg-card)", borderRadius:16, border:"1px solid var(--border-subtle)",
            boxShadow:"var(--shadow-sm)", padding:"16px" }}>
            <p style={{ fontWeight:800, fontSize:14, color:"var(--text-primary)", marginBottom:12 }}>Ton activité</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
              {[
                { val:stats.applications.total,    label:"Candidatures", color:"#3b82f6", icon:"📋" },
                { val:stats.applications.accepted,  label:"Acceptées",   color:"#10b981", icon:"✅" },
                { val:stats.saved_count,            label:"Favoris",     color:"#f59e0b", icon:"🔖" },
                { val:stats.documents_count,        label:"Documents",   color:"#8b5cf6", icon:"📁" },
              ].map(s => (
                <div key={s.label} style={{ background:"var(--bg-surface-2)", borderRadius:11, padding:"13px",
                  display:"flex", flexDirection:"column", gap:4, border:"1px solid var(--border-subtle)" }}>
                  <span style={{ fontSize:18 }}>{s.icon}</span>
                  <p style={{ fontWeight:900, fontSize:22, color:s.color, lineHeight:1 }}>{s.val}</p>
                  <p style={{ fontSize:11, color:"var(--text-muted)", fontWeight:600 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* BOUTON IA FLOTTANT */}
      <AIFloatButton opps={displayOpps} user={{ full_name:user.full_name, level:user.level, field:user.field }} />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"80vh" }}>
        <div className="animate-spin rounded-full" style={{ width:40, height:40,
          border:"3px solid #10b981", borderTopColor:"transparent" }} />
      </div>
    }>
      <DashboardInner />
    </Suspense>
  );
}
