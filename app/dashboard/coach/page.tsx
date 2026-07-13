"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/store/useStore";
import { useChatStore } from "@/store/useChatStore";
import { api } from "@/lib/api";
import { Bot, ArrowUp, LoaderCircle, Plus, MessageSquare, Trash2, X, Sparkles, PanelLeftClose } from "lucide-react";

const SUGGESTIONS = [
  "Quelles bourses correspondent à mon profil ?",
  "Fais-moi un plan d'entraînement pour une bourse",
  "Comment améliorer mon dossier ?",
  "Aide-moi à rédiger ma lettre de motivation",
];

function greeting(firstName: string) {
  return `Bonjour ${firstName} ! 👋 Je suis **Link IA**, ton coach carrière.\n\nComment puis-je t'aider aujourd'hui ?`;
}

function TypingDots() {
  return (
    <div style={{ display:"flex", gap:4, padding:"12px 16px", alignItems:"center" }}>
      {[0,1,2].map(i => <span key={i} style={{ width:6, height:6, borderRadius:"50%", background:"#7c3aed", animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
      <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }`}</style>
    </div>
  );
}

// Rendu minimal du markdown produit par le modèle (gras **texte** uniquement,
// suffisant pour les messages de Link IA — pas besoin d'une lib complète).
function renderContent(content: string) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function CoachInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthLoading } = useStore();
  const { conversations, activeId, newConversation, setActive, addMessage, deleteConversation } = useChatStore();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [oppCtx, setOppCtx] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (!isAuthLoading && !user) router.push("/login"); }, [isAuthLoading, user, router]);

  // Amorçage : conversation contextuelle (depuis une opportunité) ou conversation d'accueil.
  useEffect(() => {
    if (!mounted || !user || seededRef.current) return;
    seededRef.current = true;
    const firstName = user.full_name?.split(" ")[0] ?? "toi";
    const opp = searchParams.get("opp");
    const title = searchParams.get("title");
    if (opp) {
      const welcome = {
        role: "assistant" as const, ts: Date.now(),
        content: `Tu regardes **« ${title ?? "cette opportunité"} »**. 👀\n\nEst-ce qu'elle t'intéresse ? Je peux t'aider à voir si elle te correspond, préparer ta candidature ou répondre à tes questions dessus.`,
      };
      newConversation([welcome], title ? `« ${title.slice(0, 28)}${title.length > 28 ? "…" : ""} »` : "Opportunité");
      setOppCtx(opp);
      router.replace("/dashboard/coach"); // nettoie l'URL pour éviter un re-amorçage au refresh
    } else if (!activeId) {
      newConversation([{ role: "assistant", content: greeting(firstName), ts: Date.now() }]);
    }
  }, [mounted, user, activeId, searchParams, newConversation, router]);

  const active = conversations.find(c => c.id === activeId);
  const messages = active?.messages ?? [];

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages.length, loading]);

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading || !user) return;
    if (!activeId) newConversation([]);
    setInput("");
    const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
    addMessage({ role: "user", content: msg, ts: Date.now() });
    setLoading(true);
    try {
      const res = await api.post("/ai/chat", { message: msg, history, opportunity_id: oppCtx || undefined });
      addMessage({ role: "assistant", content: res.data.reply, ts: Date.now() });
    } catch {
      addMessage({ role: "assistant", content: "Désolé, une erreur est survenue. Réessaie dans quelques secondes.", ts: Date.now() });
    } finally { setLoading(false); }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function startNew() {
    const firstName = user?.full_name?.split(" ")[0] ?? "toi";
    setOppCtx(null);
    newConversation([{ role: "assistant", content: greeting(firstName), ts: Date.now() }]);
    setShowHistory(false);
  }

  function openConversation(id: string) {
    setOppCtx(null);
    setActive(id);
    setShowHistory(false);
  }

  if (isAuthLoading || !user || !mounted) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%" }}>
      <LoaderCircle size={30} color="#7c3aed" className="spin" />
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", position:"relative",
      background:"radial-gradient(ellipse 900px 500px at 50% -8%, rgba(124,58,237,.09), transparent 60%), var(--bg-card)" }}>

      {/* Header */}
      <div style={{ padding:"16px 22px", borderBottom:"1px solid var(--border-subtle)", flexShrink:0,
        display:"flex", alignItems:"center", gap:12, backdropFilter:"blur(6px)" }}>
        <div style={{ position:"relative", width:38, height:38, flexShrink:0 }}>
          <div style={{ position:"absolute", inset:-4, borderRadius:"50%",
            background:"conic-gradient(from 0deg, #7c3aed, #a78bfa, #7c3aed)", opacity:.35, filter:"blur(4px)" }} />
          <div style={{ position:"relative", width:38, height:38, borderRadius:"50%",
            background:"linear-gradient(135deg,#7c3aed,#9333ea)", display:"flex", alignItems:"center",
            justifyContent:"center", boxShadow:"0 4px 14px rgba(124,58,237,.4)" }}>
            <Bot size={19} color="#fff" />
          </div>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontFamily:"var(--font-voice)", fontWeight:600, fontSize:16, color:"var(--text-primary)" }}>Link IA</p>
          <p style={{ fontSize:11, color:"#8b5cf6", display:"flex", alignItems:"center", gap:4, fontWeight:600 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"#8b5cf6", display:"inline-block" }} /> En ligne · Prêt à t'aider
          </p>
        </div>
        <button onClick={() => setShowHistory(true)} title="Historique des conversations"
          style={{ display:"flex", alignItems:"center", gap:6, fontSize:12.5, fontWeight:600, color:"var(--text-secondary)",
            background:"var(--bg-surface-2)", border:"1px solid var(--border)", padding:"8px 12px", borderRadius:12, cursor:"pointer" }}>
          <MessageSquare size={14} /> Historique
        </button>
        <button onClick={startNew} title="Nouvelle conversation"
          style={{ display:"flex", alignItems:"center", justifyContent:"center", width:36, height:36, color:"#fff",
            background:"linear-gradient(135deg,#7c3aed,#9333ea)", border:"none", borderRadius:12, cursor:"pointer", flexShrink:0,
            boxShadow:"0 4px 12px rgba(124,58,237,.32)" }}>
          <Plus size={18} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"20px 22px", display:"flex", flexDirection:"column", gap:16 }}>
        {messages.map((m, i) => (
          m.role === "assistant" ? (
            <div key={i} className="animate-fade-up-soft" style={{ display:"flex", gap:12, alignItems:"flex-start", maxWidth:"88%" }}>
              <div style={{ width:30, height:30, borderRadius:"50%", flexShrink:0, marginTop:2,
                background:"linear-gradient(135deg,#7c3aed,#9333ea)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Bot size={15} color="#fff" />
              </div>
              <div style={{ borderLeft:"2.5px solid rgba(124,58,237,.4)", paddingLeft:14,
                fontSize:13.5, lineHeight:1.65, color:"var(--text-primary)", whiteSpace:"pre-wrap" }}>
                {renderContent(m.content)}
              </div>
            </div>
          ) : (
            <div key={i} className="animate-fade-up-soft" style={{ display:"flex", justifyContent:"flex-end" }}>
              <div style={{ maxWidth:"75%", padding:"11px 16px", borderRadius:"16px 16px 4px 16px",
                background:"var(--accent)", color:"#fff", fontSize:13.5, lineHeight:1.55, whiteSpace:"pre-wrap",
                boxShadow:"0 2px 8px rgba(16,185,129,.25)" }}>
                {m.content}
              </div>
            </div>
          )
        ))}
        {loading && (
          <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
            <div style={{ width:30, height:30, borderRadius:"50%", flexShrink:0,
              background:"linear-gradient(135deg,#7c3aed,#9333ea)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Bot size={15} color="#fff" />
            </div>
            <div style={{ background:"var(--bg-surface-2)", border:"1px solid var(--border-subtle)", borderRadius:"4px 16px 16px 16px" }}><TypingDots /></div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div style={{ padding:"0 22px 14px", display:"flex", gap:8, overflowX:"auto", flexShrink:0 }} className="scrollbar-hide">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => sendMessage(s)} style={{ flexShrink:0, display:"flex", alignItems:"center", gap:6,
              fontSize:11.5, fontWeight:600, color:"#7c3aed", background:"rgba(124,58,237,.08)",
              border:"1px solid rgba(124,58,237,.22)", borderRadius:20, padding:"8px 13px", cursor:"pointer", whiteSpace:"nowrap" }}>
              <Sparkles size={11} />{s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding:"14px 18px 18px", borderTop:"1px solid var(--border-subtle)", flexShrink:0 }}>
        <div style={{ display:"flex", gap:10, alignItems:"flex-end", background:"var(--bg-input)",
          border:"1.5px solid var(--border)", borderRadius:18, padding:"6px 6px 6px 16px" }}>
          <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
            placeholder="Pose ta question à Link IA..." rows={1}
            style={{ flex:1, border:"none", background:"transparent", color:"var(--text-primary)",
              padding:"8px 0", fontSize:13.5, outline:"none", resize:"none", fontFamily:"inherit",
              maxHeight:120, overflowY:"auto", lineHeight:1.5 }}
            onInput={e => { const t=e.target as HTMLTextAreaElement; t.style.height="auto"; t.style.height=Math.min(t.scrollHeight,120)+"px"; }} />
          <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
            style={{ width:38, height:38, borderRadius:"50%", border:"none", cursor:"pointer",
              background:input.trim()&&!loading?"linear-gradient(135deg,#7c3aed,#9333ea)":"var(--border)",
              color:input.trim()&&!loading?"#fff":"var(--text-muted)", display:"flex", alignItems:"center",
              justifyContent:"center", transition:"all .15s", flexShrink:0,
              boxShadow:input.trim()&&!loading?"0 4px 12px rgba(124,58,237,.35)":"none" }}>
            <ArrowUp size={17} />
          </button>
        </div>
        <p style={{ fontSize:10.5, color:"var(--text-muted)", textAlign:"center", marginTop:8 }}>
          Link IA peut se tromper — vérifie les infos importantes avant de candidater.
        </p>
      </div>

      {/* Drawer historique */}
      {showHistory && (
        <>
          <div onClick={() => setShowHistory(false)} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.45)", zIndex:20 }} />
          <div style={{ position:"absolute", top:0, left:0, bottom:0, width:300, maxWidth:"85%", background:"var(--bg-card)",
            borderRight:"1px solid var(--border)", zIndex:21, display:"flex", flexDirection:"column", boxShadow:"4px 0 24px rgba(0,0,0,.12)" }}>
            <div style={{ padding:"16px 18px", borderBottom:"1px solid var(--border-subtle)", display:"flex", alignItems:"center", gap:8 }}>
              <PanelLeftClose size={16} color="var(--text-muted)" />
              <p style={{ fontFamily:"var(--font-voice)", fontWeight:600, fontSize:15, color:"var(--text-primary)", flex:1 }}>Conversations</p>
              <button onClick={() => setShowHistory(false)} style={{ background:"var(--bg-surface-2)", border:"none",
                width:28, height:28, borderRadius:"50%", cursor:"pointer", color:"var(--text-muted)",
                display:"flex", alignItems:"center", justifyContent:"center" }}><X size={14} /></button>
            </div>
            <button onClick={startNew} style={{ margin:"14px 16px", display:"flex", alignItems:"center", justifyContent:"center", gap:7,
              padding:"11px", borderRadius:12, border:"1px dashed #7c3aed", background:"rgba(124,58,237,.06)", color:"#7c3aed",
              fontSize:13, fontWeight:700, cursor:"pointer" }}>
              <Plus size={15} /> Nouvelle conversation
            </button>
            <div style={{ flex:1, overflowY:"auto", padding:"0 10px 12px", display:"flex", flexDirection:"column", gap:4 }}>
              {conversations.length === 0 && (
                <p style={{ fontSize:12.5, color:"var(--text-muted)", textAlign:"center", padding:"20px 10px" }}>Aucune conversation pour l'instant.</p>
              )}
              {[...conversations].sort((a,b)=>b.updatedAt-a.updatedAt).map(c => (
                <div key={c.id} onClick={() => openConversation(c.id)} className="sidebar-item" style={{
                  display:"flex", alignItems:"center", gap:9, padding:"11px 12px", borderRadius:12, cursor:"pointer",
                  background: c.id===activeId ? "rgba(124,58,237,.08)" : "transparent",
                  border: c.id===activeId ? "1px solid rgba(124,58,237,.25)" : "1px solid transparent" }}>
                  <MessageSquare size={14} color={c.id===activeId ? "#7c3aed" : "var(--text-muted)"} style={{ flexShrink:0 }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:12.5, fontWeight:600, color:"var(--text-primary)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.title}</p>
                    <p style={{ fontSize:10.5, color:"var(--text-muted)" }}>{new Date(c.updatedAt).toLocaleDateString("fr-FR",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }} title="Supprimer"
                    style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", padding:3, display:"flex", flexShrink:0 }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function CoachChatPage() {
  return (
    <Suspense fallback={
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"80vh" }}>
        <LoaderCircle size={32} color="#7c3aed" className="spin" />
      </div>
    }>
      <CoachInner />
    </Suspense>
  );
}
