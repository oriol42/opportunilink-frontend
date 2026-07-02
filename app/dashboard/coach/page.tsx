"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import { Bot, ArrowUp, LoaderCircle } from "lucide-react";

interface Message { role: "user" | "assistant"; content: string; ts: number }
const SUGGESTIONS = [
  "Quelles bourses correspondent à mon profil ?",
  "Comment rédiger une bonne lettre de motivation ?",
  "Que faire pour améliorer mon dossier ?",
  "Comment candidater à un stage au Cameroun ?",
  "Quelles compétences dois-je développer ?",
];

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
  const { user, isAuthLoading } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!isAuthLoading && !user) router.push("/login"); }, [isAuthLoading, user, router]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);
  useEffect(() => {
    if (user && messages.length === 0) {
      setMessages([{ role:"assistant", content:`Bonjour ${user.full_name?.split(" ")[0]} ! Je suis ton coach IA, propulsé par Llama 3.3.\n\nJe connais ton profil et peux t'aider à :\n• Trouver les opportunités qui te correspondent\n• Préparer tes candidatures\n• Rédiger ou améliorer ta lettre de motivation\n• Planifier ton développement de carrière\n\nQue veux-tu travailler aujourd'hui ?`, ts:Date.now() }]);
    }
  }, [user, messages.length]);

  async function sendMessage(text?: string) {
    const msg = text ?? input.trim();
    if (!msg || loading) return;
    setInput("");
    const userMsg: Message = { role:"user", content:msg, ts:Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await api.post("/ai/chat", { message:msg, history:messages.slice(-10) });
      setMessages(prev => [...prev, { role:"assistant", content:res.data.reply, ts:Date.now() }]);
    } catch {
      setMessages(prev => [...prev, { role:"assistant", content:"Désolé, une erreur est survenue. Réessaie dans quelques secondes.", ts:Date.now() }]);
    } finally { setLoading(false); }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  if (isAuthLoading || !user) return null;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:"var(--bg-card)" }}>
      <div style={{ padding:"14px 20px", borderBottom:"1px solid var(--border-subtle)", flexShrink:0, display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:36, height:36, borderRadius:"50%", background:"var(--bg-success)", border:"1.5px solid var(--border-success)", display:"flex", alignItems:"center", justifyContent:"center" }}><Bot size={18} color="var(--text-success)" /></div>
        <div>
          <p style={{ fontWeight:700, fontSize:15, color:"var(--text-primary)" }}>Coach IA</p>
          <p style={{ fontSize:11, color:"var(--accent-dark)", display:"flex", alignItems:"center", gap:4 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--accent)", display:"inline-block" }} /> En ligne · Llama 3.3 70B
          </p>
        </div>
      </div>
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
      {messages.length <= 1 && (
        <div style={{ padding:"0 20px 12px", display:"flex", gap:6, overflowX:"auto", flexShrink:0 }}>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => sendMessage(s)} style={{ flexShrink:0, fontSize:11, fontWeight:600, color:"var(--accent-dark)", background:"var(--bg-success)", border:"1px solid var(--border-success)", borderRadius:20, padding:"6px 12px", cursor:"pointer", whiteSpace:"nowrap" }}>{s}</button>
          ))}
        </div>
      )}
      <div style={{ padding:"12px 16px", borderTop:"1px solid var(--border-subtle)", flexShrink:0, display:"flex", gap:10, alignItems:"flex-end" }}>
        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
          placeholder="Pose ta question au coach... (Entrée pour envoyer)" rows={1}
          style={{ flex:1, border:"1px solid var(--border)", background:"var(--bg-input)", color:"var(--text-primary)", borderRadius:12, padding:"10px 14px", fontSize:13, outline:"none", resize:"none", fontFamily:"inherit", maxHeight:120, overflowY:"auto", lineHeight:1.5 }}
          onInput={e => { const t=e.target as HTMLTextAreaElement; t.style.height="auto"; t.style.height=Math.min(t.scrollHeight,120)+"px"; }} />
        <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
          style={{ width:40, height:40, borderRadius:"50%", border:"none", cursor:"pointer", background:input.trim()&&!loading?"var(--accent)":"var(--border)", color:input.trim()&&!loading?"#fff":"var(--text-muted)", display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s", flexShrink:0 }}><ArrowUp size={18} /></button>
      </div>
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
