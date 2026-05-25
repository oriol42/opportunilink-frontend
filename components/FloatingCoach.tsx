"use client";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";

interface Msg { role: "user" | "assistant"; content: string }

const SUGG = [
  "Quelles bourses me correspondent ?",
  "Comment améliorer mon dossier ?",
  "Aide-moi avec ma lettre de motivation",
  "Que faire avant la deadline ?",
];

function Dots() {
  return (
    <div style={{ display:"flex", gap:4, padding:"12px 16px", alignItems:"center" }}>
      <span style={{ fontSize:11, color:"#6b7280", marginRight:4 }}>Coach réfléchit</span>
      {[0,1,2].map(i => (
        <span key={i} style={{ width:5, height:5, borderRadius:"50%", background:"#10b981",
          display:"inline-block",
          animation:`bounce 1.2s ease ${i*.2}s infinite` }} />
      ))}
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
    </div>
  );
}

function CoachAvatar({ size=36 }: { size?: number }) {
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", flexShrink:0,
      background:"linear-gradient(135deg,#059669,#0d9488)",
      display:"flex", alignItems:"center", justifyContent:"center",
      boxShadow:"0 2px 8px rgba(5,150,105,0.35)", fontSize:size*0.45 }}>
      ✦
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

  useEffect(() => {
    if (open && msgs.length === 0 && user) {
      const firstName = user.full_name?.split(" ")[0] ?? "toi";
      setMsgs([{
        role: "assistant",
        content: `Salut ${firstName} ! 👋\n\nJe suis ton coach carrière personnel. Je connais ton profil et les opportunités disponibles — je suis là pour t'aider concrètement.\n\nTu veux qu'on fasse quoi aujourd'hui ?`,
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
        content: detail ?? "Oups, j'ai perdu la connexion. Réessaie dans un instant.",
      }]);
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <>
      {open && (
        <div style={{
          position:"fixed", bottom:84, right:20, width:360, height:500,
          background:"#fff", borderRadius:24,
          boxShadow:"0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)",
          zIndex:9999, display:"flex", flexDirection:"column", overflow:"hidden",
        }}>
          {/* Header */}
          <div style={{ padding:"16px 18px", borderBottom:"1px solid #f1f5f9",
            display:"flex", alignItems:"center", gap:12, flexShrink:0,
            background:"linear-gradient(135deg,#f0fdf4,#f8fafc)" }}>
            <CoachAvatar size={40} />
            <div style={{ flex:1 }}>
              <p style={{ fontWeight:800, fontSize:14, color:"#111827", lineHeight:1.2 }}>Coach IA</p>
              <p style={{ fontSize:11, color:"#059669", fontWeight:600 }}>● En ligne · Prêt à t'aider</p>
            </div>
            <button onClick={() => setOpen(false)}
              style={{ background:"#f1f5f9", border:"none", cursor:"pointer",
                color:"#6b7280", fontSize:14, width:30, height:30,
                borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center",
                transition:"all .15s" }}
              onMouseEnter={e=>(e.currentTarget.style.background="#e2e8f0")}
              onMouseLeave={e=>(e.currentTarget.style.background="#f1f5f9")}>
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:"auto", padding:"16px", display:"flex",
            flexDirection:"column", gap:12 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display:"flex", gap:8,
                justifyContent:m.role==="user"?"flex-end":"flex-start",
                alignItems:"flex-end" }}>
                {m.role==="assistant" && <CoachAvatar size={28} />}
                <div style={{
                  maxWidth:"80%", padding:"10px 14px",
                  borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",
                  background:m.role==="user"
                    ?"linear-gradient(135deg,#059669,#0d9488)"
                    :"#f8fafc",
                  border:m.role==="assistant"?"1px solid #e2e8f0":"none",
                  color:m.role==="user"?"#fff":"#1e293b",
                  fontSize:13, lineHeight:1.6, whiteSpace:"pre-wrap",
                  boxShadow:m.role==="user"?"0 2px 8px rgba(5,150,105,0.25)":"none",
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
                <CoachAvatar size={28} />
                <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0",
                  borderRadius:"18px 18px 18px 4px" }}>
                  <Dots />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Suggestions */}
          {msgs.length <= 1 && (
            <div style={{ padding:"0 14px 10px", display:"flex", gap:6,
              overflowX:"auto", flexShrink:0 }} className="scrollbar-hide">
              {SUGG.map(s => (
                <button key={s} onClick={() => send(s)}
                  style={{ flexShrink:0, fontSize:11, fontWeight:600, color:"#059669",
                    background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:20,
                    padding:"6px 12px", cursor:"pointer", whiteSpace:"nowrap",
                    transition:"all .15s" }}
                  onMouseEnter={e=>{e.currentTarget.style.background="#dcfce7";e.currentTarget.style.borderColor="#86efac"}}
                  onMouseLeave={e=>{e.currentTarget.style.background="#f0fdf4";e.currentTarget.style.borderColor="#bbf7d0"}}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding:"12px 14px", borderTop:"1px solid #f1f5f9", flexShrink:0,
            display:"flex", gap:8, alignItems:"center", background:"#fafafa" }}>
            <input ref={inputRef} value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Pose ta question..."
              style={{ flex:1, border:"1.5px solid #e2e8f0", borderRadius:14, padding:"10px 14px",
                fontSize:13, outline:"none", background:"#fff", transition:"border-color .15s" }}
              onFocus={e=>e.target.style.borderColor="#10b981"}
              onBlur={e=>e.target.style.borderColor="#e2e8f0"} />
            <button onClick={() => send()} disabled={!input.trim() || loading}
              style={{ width:38, height:38, borderRadius:"50%", border:"none", cursor:"pointer",
                background:input.trim() && !loading
                  ? "linear-gradient(135deg,#059669,#0d9488)" : "#f1f5f9",
                color:input.trim() && !loading ? "#fff" : "#94a3b8",
                fontSize:16, display:"flex", alignItems:"center", justifyContent:"center",
                flexShrink:0, transition:"all .2s",
                boxShadow:input.trim() && !loading ? "0 2px 8px rgba(5,150,105,0.3)" : "none" }}>
              ↑
            </button>
          </div>
        </div>
      )}

      {/* FAB — plus élégant */}
      <button onClick={() => setOpen(o => !o)}
        style={{
          position:"fixed", bottom:20, right:20, width:52, height:52,
          borderRadius:"50%", border:"none", cursor:"pointer",
          background:open
            ? "#f1f5f9"
            : "linear-gradient(135deg,#059669,#0d9488)",
          color:open?"#6b7280":"#fff",
          fontSize:open?16:20, zIndex:9999,
          boxShadow:open?"0 2px 8px rgba(0,0,0,0.12)":"0 4px 20px rgba(5,150,105,0.45)",
          display:"flex", alignItems:"center", justifyContent:"center",
          transition:"all .25s",
        }}>
        {open ? "✕" : "✦"}
      </button>
    </>
  );
}
