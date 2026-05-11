"use client";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";

interface Msg { role: "user" | "assistant"; content: string }

const SUGG = [
  "Quelles bourses me correspondent ?",
  "Comment améliorer mon dossier ?",
  "Aide-moi avec ma lettre",
  "Que faire avant la deadline ?",
];

function Dots() {
  return (
    <div style={{ display:"flex", gap:3, padding:"10px 14px" }}>
      {[0,1,2].map(i => (
        <span key={i} style={{ width:5, height:5, borderRadius:"50%", background:"#10b981",
          animation:`db 1.2s ease ${i*.2}s infinite` }} />
      ))}
      <style>{`@keyframes db{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
    </div>
  );
}

export default function FloatingCoach() {
  const { user } = useStore();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Message d'accueil à l'ouverture
  useEffect(() => {
    if (open && msgs.length === 0 && user) {
      setMsgs([{
        role: "assistant",
        content: `Bonjour ${user.full_name?.split(" ")[0]} ! 👋\nJe suis ton coach IA. Comment puis-je t'aider ?`,
      }]);
    }
  }, [open, user]);

  useEffect(() => {
    if (open) setTimeout(() => endRef.current?.scrollIntoView({ behavior:"smooth" }), 100);
  }, [msgs, loading, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    const newMsgs: Msg[] = [...msgs, { role:"user", content:msg }];
    setMsgs(newMsgs);
    setLoading(true);

    try {
      const res = await api.post("/ai/chat", {
        message: msg,
        history: msgs.slice(-8).map(m => ({ role: m.role, content: m.content })),
      });
      setMsgs(prev => [...prev, { role:"assistant", content: res.data.reply }]);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setMsgs(prev => [...prev, {
        role: "assistant",
        content: detail ?? "Erreur de connexion. Vérifie ta connexion et réessaie.",
      }]);
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <>
      {/* Panel */}
      {open && (
        <div style={{
          position:"fixed", bottom:84, right:20, width:340, height:480,
          background:"#fff", borderRadius:20,
          boxShadow:"0 25px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)",
          zIndex:9999, display:"flex", flexDirection:"column", overflow:"hidden",
        }}>
          {/* Header */}
          <div style={{ background:"linear-gradient(135deg,#0f172a,#065f46)",
            padding:"14px 16px", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
            <div style={{ width:34, height:34, borderRadius:"50%", background:"rgba(16,185,129,0.2)",
              border:"1.5px solid #10b981", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>
              🤖
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontWeight:800, fontSize:13, color:"#fff" }}>Coach IA</p>
              <p style={{ fontSize:10, color:"#34d399" }}>● Llama 3.3 · En ligne</p>
            </div>
            <button onClick={() => setOpen(false)}
              style={{ background:"rgba(255,255,255,0.1)", border:"none", cursor:"pointer",
                color:"rgba(255,255,255,0.7)", fontSize:16, width:28, height:28,
                borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:"auto", padding:"14px", display:"flex", flexDirection:"column", gap:10 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
                <div style={{
                  maxWidth:"82%", padding:"9px 13px",
                  borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",
                  background:m.role==="user"?"#059669":"#f8fafc",
                  border:m.role==="assistant"?"1px solid #f1f5f9":"none",
                  color:m.role==="user"?"#fff":"#1e293b",
                  fontSize:13, lineHeight:1.55, whiteSpace:"pre-wrap",
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display:"flex" }}>
                <div style={{ background:"#f8fafc", border:"1px solid #f1f5f9", borderRadius:"16px 16px 16px 4px" }}>
                  <Dots />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Suggestions */}
          {msgs.length <= 1 && (
            <div style={{ padding:"0 12px 8px", display:"flex", gap:5, overflowX:"auto", flexShrink:0 }}
              className="scrollbar-hide">
              {SUGG.map(s => (
                <button key={s} onClick={() => send(s)}
                  style={{ flexShrink:0, fontSize:10, fontWeight:700, color:"#059669",
                    background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:20,
                    padding:"5px 10px", cursor:"pointer", whiteSpace:"nowrap" }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding:"10px 12px", borderTop:"1px solid #f1f5f9", flexShrink:0,
            display:"flex", gap:8, alignItems:"center", background:"#fff" }}>
            <input ref={inputRef} value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Pose une question..."
              style={{ flex:1, border:"1px solid #e2e8f0", borderRadius:12, padding:"9px 13px",
                fontSize:13, outline:"none", background:"#f8fafc" }} />
            <button onClick={() => send()} disabled={!input.trim() || loading}
              style={{ width:36, height:36, borderRadius:"50%", border:"none", cursor:"pointer",
                background:input.trim() && !loading ? "#059669" : "#e2e8f0",
                color:input.trim() && !loading ? "#fff" : "#94a3b8",
                fontSize:18, display:"flex", alignItems:"center", justifyContent:"center",
                flexShrink:0, transition:"all .15s" }}>
              ↑
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button onClick={() => setOpen(o => !o)}
        style={{
          position:"fixed", bottom:20, right:20, width:54, height:54,
          borderRadius:"50%", border:"none", cursor:"pointer",
          background:open ? "#374151" : "linear-gradient(135deg,#059669,#0d9488)",
          color:"#fff", fontSize:24, zIndex:9999,
          boxShadow:"0 4px 24px rgba(5,150,105,0.45)",
          display:"flex", alignItems:"center", justifyContent:"center",
          transition:"all .2s",
        }}>
        {open ? "✕" : "🤖"}
      </button>
    </>
  );
}
