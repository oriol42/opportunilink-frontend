"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";

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
      {[0,1,2].map(i => <span key={i} style={{ width:6, height:6, borderRadius:"50%", background:"#10b981", animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
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
      setMessages([{ role:"assistant", content:`Bonjour ${user.full_name?.split(" ")[0]} ! 👋 Je suis ton coach IA powered by Llama 3.3.\n\nJe connais ton profil et peux t'aider à :\n• Trouver les opportunités qui te correspondent\n• Préparer tes candidatures\n• Rédiger ou améliorer ta lettre de motivation\n• Planifier ton développement de carrière\n\nQue veux-tu travailler aujourd'hui ?`, ts:Date.now() }]);
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
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:"#fff" }}>
      <div style={{ padding:"14px 20px", borderBottom:"0.5px solid #f3f4f6", flexShrink:0, display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:36, height:36, borderRadius:"50%", background:"#f0fdf4", border:"1.5px solid #bbf7d0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🤖</div>
        <div>
          <p style={{ fontWeight:800, fontSize:15, color:"#111827" }}>Coach IA</p>
          <p style={{ fontSize:11, color:"#10b981" }}>● En ligne · Llama 3.3 70B</p>
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"16px 20px", display:"flex", flexDirection:"column", gap:12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", gap:8, alignItems:"flex-end" }}>
            {m.role === "assistant" && <div style={{ width:28, height:28, borderRadius:"50%", background:"#f0fdf4", border:"1px solid #bbf7d0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0, marginBottom:2 }}>🤖</div>}
            <div style={{ maxWidth:"75%", padding:"10px 14px", borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px", background:m.role==="user"?"#059669":"#f9fafb", border:m.role==="assistant"?"0.5px solid #f3f4f6":"none", color:m.role==="user"?"#fff":"#1f2937", fontSize:13.5, lineHeight:1.55, whiteSpace:"pre-wrap" }}>
              {m.content}
            </div>
            {m.role === "user" && <div style={{ width:28, height:28, borderRadius:"50%", background:"#059669", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff", flexShrink:0, marginBottom:2 }}>{user.full_name?.split(" ").map((n:string)=>n[0]).slice(0,2).join("").toUpperCase()}</div>}
          </div>
        ))}
        {loading && (
          <div style={{ display:"flex", alignItems:"flex-end", gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:"#f0fdf4", border:"1px solid #bbf7d0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>🤖</div>
            <div style={{ background:"#f9fafb", border:"0.5px solid #f3f4f6", borderRadius:"18px 18px 18px 4px" }}><TypingDots /></div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      {messages.length <= 1 && (
        <div style={{ padding:"0 20px 12px", display:"flex", gap:6, overflowX:"auto", flexShrink:0 }}>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => sendMessage(s)} style={{ flexShrink:0, fontSize:11, fontWeight:600, color:"#059669", background:"#f0fdf4", border:"0.5px solid #bbf7d0", borderRadius:20, padding:"6px 12px", cursor:"pointer", whiteSpace:"nowrap" }}>{s}</button>
          ))}
        </div>
      )}
      <div style={{ padding:"12px 16px", borderTop:"0.5px solid #f3f4f6", flexShrink:0, display:"flex", gap:10, alignItems:"flex-end" }}>
        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
          placeholder="Pose ta question au coach... (Entrée pour envoyer)" rows={1}
          style={{ flex:1, border:"0.5px solid #e5e7eb", borderRadius:12, padding:"10px 14px", fontSize:13, outline:"none", resize:"none", fontFamily:"inherit", maxHeight:120, overflowY:"auto", lineHeight:1.5 }}
          onInput={e => { const t=e.target as HTMLTextAreaElement; t.style.height="auto"; t.style.height=Math.min(t.scrollHeight,120)+"px"; }} />
        <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
          style={{ width:40, height:40, borderRadius:"50%", border:"none", cursor:"pointer", background:input.trim()&&!loading?"#059669":"#e5e7eb", color:input.trim()&&!loading?"#fff":"#9ca3af", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s", flexShrink:0 }}>↑</button>
      </div>
    </div>
  );
}

export default function CoachChatPage() {
  return (
    <Suspense fallback={<div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"80vh" }}><div className="animate-spin rounded-full" style={{ width:40, height:40, border:"3px solid #10b981", borderTopColor:"transparent" }} /></div>}>
      <CoachInner />
    </Suspense>
  );
}
