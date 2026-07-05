"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/store/useStore";
import { useChatStore } from "@/store/useChatStore";
import { api } from "@/lib/api";
import { Bot, ArrowUp, LoaderCircle, Plus, MessageSquare, Trash2, X } from "lucide-react";

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
    <div style={{ display:"flex", gap:4, padding:"10px 14px", alignItems:"center" }}>
      {[0,1,2].map(i => <span key={i} style={{ width:6, height:6, borderRadius:"50%", background:"var(--accent)", animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
      <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }`}</style>
    </div>
  );
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
      <LoaderCircle size={30} color="var(--accent)" className="spin" />
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:"var(--bg-card)", position:"relative" }}>
      {/* Header */}
      <div style={{ padding:"14px 20px", borderBottom:"1px solid var(--border-subtle)", flexShrink:0, display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:36, height:36, borderRadius:"50%", background:"var(--bg-success)", border:"1.5px solid var(--border-success)", display:"flex", alignItems:"center", justifyContent:"center" }}><Bot size={18} color="var(--text-success)" /></div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontWeight:700, fontSize:15, color:"var(--text-primary)" }}>Link IA</p>
          <p style={{ fontSize:11, color:"var(--accent-dark)", display:"flex", alignItems:"center", gap:4 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--accent)", display:"inline-block" }} /> En ligne · Llama 3.3 70B
          </p>
        </div>
        <button onClick={() => setShowHistory(true)} title="Historique des conversations"
          style={{ display:"flex", alignItems:"center", gap:6, fontSize:12.5, fontWeight:600, color:"var(--text-secondary)",
            background:"var(--bg-surface-2)", border:"1px solid var(--border)", padding:"7px 11px", borderRadius:10, cursor:"pointer" }}>
          <MessageSquare size={14} /> Historique
        </button>
        <button onClick={startNew} title="Nouvelle conversation"
          style={{ display:"flex", alignItems:"center", justifyContent:"center", width:34, height:34, color:"#fff",
            background:"var(--accent)", border:"none", borderRadius:10, cursor:"pointer", flexShrink:0 }}>
          <Plus size={17} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"16px 20px", display:"flex", flexDirection:"column", gap:12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", gap:8, alignItems:"flex-end" }}>
            {m.role === "assistant" && <div style={{ width:28, height:28, borderRadius:"50%", background:"var(--bg-success)", border:"1px solid var(--border-success)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginBottom:2 }}><Bot size={14} color="var(--text-success)" /></div>}
            <div style={{ maxWidth:"75%", padding:"10px 14px", borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px", background:m.role==="user"?"var(--accent)":"var(--bg-surface-2)", border:m.role==="assistant"?"1px solid var(--border-subtle)":"none", color:m.role==="user"?"#fff":"var(--text-primary)", fontSize:13.5, lineHeight:1.55, whiteSpace:"pre-wrap" }}>
              {m.content}
            </div>
            {m.role === "user" && <div style={{ width:28, height:28, borderRadius:"50%", background:"var(--accent)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff", flexShrink:0, marginBottom:2 }}>{user.full_name?.split(" ").map((n:string)=>n[0]).slice(0,2).join("").toUpperCase()}</div>}
          </div>
        ))}
        {loading && (
          <div style={{ display:"flex", alignItems:"flex-end", gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:"var(--bg-success)", border:"1px solid var(--border-success)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Bot size={14} color="var(--text-success)" /></div>
            <div style={{ background:"var(--bg-surface-2)", border:"1px solid var(--border-subtle)", borderRadius:"18px 18px 18px 4px" }}><TypingDots /></div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div style={{ padding:"0 20px 12px", display:"flex", gap:6, overflowX:"auto", flexShrink:0 }} className="scrollbar-hide">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => sendMessage(s)} style={{ flexShrink:0, fontSize:11, fontWeight:600, color:"var(--accent-dark)", background:"var(--bg-success)", border:"1px solid var(--border-success)", borderRadius:20, padding:"6px 12px", cursor:"pointer", whiteSpace:"nowrap" }}>{s}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding:"12px 16px", borderTop:"1px solid var(--border-subtle)", flexShrink:0, display:"flex", gap:10, alignItems:"flex-end" }}>
        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
          placeholder="Pose ta question à Link IA... (Entrée pour envoyer)" rows={1}
          style={{ flex:1, border:"1px solid var(--border)", background:"var(--bg-input)", color:"var(--text-primary)", borderRadius:12, padding:"10px 14px", fontSize:13, outline:"none", resize:"none", fontFamily:"inherit", maxHeight:120, overflowY:"auto", lineHeight:1.5 }}
          onInput={e => { const t=e.target as HTMLTextAreaElement; t.style.height="auto"; t.style.height=Math.min(t.scrollHeight,120)+"px"; }} />
        <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
          style={{ width:40, height:40, borderRadius:"50%", border:"none", cursor:"pointer", background:input.trim()&&!loading?"var(--accent)":"var(--border)", color:input.trim()&&!loading?"#fff":"var(--text-muted)", display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s", flexShrink:0 }}><ArrowUp size={18} /></button>
      </div>

      {/* Drawer historique */}
      {showHistory && (
        <>
          <div onClick={() => setShowHistory(false)} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.45)", zIndex:20 }} />
          <div style={{ position:"absolute", top:0, left:0, bottom:0, width:290, maxWidth:"85%", background:"var(--bg-card)",
            borderRight:"1px solid var(--border)", zIndex:21, display:"flex", flexDirection:"column", boxShadow:"4px 0 24px rgba(0,0,0,.12)" }}>
            <div style={{ padding:"14px 16px", borderBottom:"1px solid var(--border-subtle)", display:"flex", alignItems:"center", gap:8 }}>
              <p style={{ fontWeight:700, fontSize:14, color:"var(--text-primary)", flex:1 }}>Conversations</p>
              <button onClick={() => setShowHistory(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", display:"flex" }}><X size={18} /></button>
            </div>
            <button onClick={startNew} style={{ margin:"12px 16px", display:"flex", alignItems:"center", justifyContent:"center", gap:7,
              padding:"10px", borderRadius:10, border:"1px dashed var(--accent)", background:"var(--bg-success)", color:"var(--accent-dark)",
              fontSize:13, fontWeight:700, cursor:"pointer" }}>
              <Plus size={15} /> Nouvelle conversation
            </button>
            <div style={{ flex:1, overflowY:"auto", padding:"0 10px 12px", display:"flex", flexDirection:"column", gap:4 }}>
              {conversations.length === 0 && (
                <p style={{ fontSize:12.5, color:"var(--text-muted)", textAlign:"center", padding:"20px 10px" }}>Aucune conversation pour l'instant.</p>
              )}
              {[...conversations].sort((a,b)=>b.updatedAt-a.updatedAt).map(c => (
                <div key={c.id} onClick={() => openConversation(c.id)} className="sidebar-item" style={{
                  display:"flex", alignItems:"center", gap:9, padding:"10px 11px", borderRadius:10, cursor:"pointer",
                  background: c.id===activeId ? "var(--sidebar-active-bg)" : "transparent",
                  border: c.id===activeId ? "1px solid var(--sidebar-active-border)" : "1px solid transparent" }}>
                  <MessageSquare size={14} color="var(--text-muted)" style={{ flexShrink:0 }} />
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
        <LoaderCircle size={32} color="var(--accent)" className="spin" />
      </div>
    }>
      <CoachInner />
    </Suspense>
  );
}
