"use client";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";

interface Msg { role: "user" | "assistant"; content: string }

const SUGGESTIONS = [
  "Quelles bourses me correspondent ?",
  "Comment améliorer mon dossier ?",
  "Aide-moi à rédiger une lettre",
  "Que faire avant une deadline ?",
];

function Dots() {
  return (
    <div style={{ display: "flex", gap: 3, padding: "8px 12px" }}>
      {[0,1,2].map(i => (
        <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981",
          animation: `db ${1.2}s ease ${i*0.2}s infinite` }} />
      ))}
      <style>{`@keyframes db{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}`}</style>
    </div>
  );
}

export default function FloatingCoach() {
  const { user } = useStore();
  const [open, setOpen]         = useState(false);
  const [msgs, setMsgs]         = useState<Msg[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [greeted, setGreeted]   = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && !greeted && user) {
      setMsgs([{ role: "assistant", content: `Bonjour ${user.full_name?.split(" ")[0]} ! 👋 Je suis ton coach IA.\nComment puis-je t'aider ?` }]);
      setGreeted(true);
    }
  }, [open, greeted, user]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  async function send(text?: string) {
    const msg = text ?? input.trim();
    if (!msg || loading) return;
    setInput("");
    const history = msgs.slice(-8);
    setMsgs(prev => [...prev, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const res = await api.post("/ai/chat", { message: msg, history });
      setMsgs(prev => [...prev, { role: "assistant", content: res.data.reply }]);
    } catch {
      setMsgs(prev => [...prev, { role: "assistant", content: "Erreur. Réessaie dans un instant." }]);
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
          position: "fixed", bottom: 80, right: 20, width: 340, height: 480,
          background: "#fff", borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          border: "0.5px solid #f3f4f6", zIndex: 9999,
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{ padding: "14px 16px", borderBottom: "0.5px solid #f3f4f6",
            display: "flex", alignItems: "center", gap: 10, background: "#fff", flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f0fdf4",
              border: "1.5px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              🤖
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 800, fontSize: 13, color: "#111827" }}>Coach IA</p>
              <p style={{ fontSize: 10, color: "#10b981" }}>● Llama 3.3 · En ligne</p>
            </div>
            <button onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#9ca3af", padding: 4 }}>
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "82%", padding: "8px 12px",
                  borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: m.role === "user" ? "#059669" : "#f9fafb",
                  border: m.role === "assistant" ? "0.5px solid #f3f4f6" : "none",
                  color: m.role === "user" ? "#fff" : "#1f2937",
                  fontSize: 12.5, lineHeight: 1.5, whiteSpace: "pre-wrap",
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex" }}>
                <div style={{ background: "#f9fafb", border: "0.5px solid #f3f4f6", borderRadius: "16px 16px 16px 4px" }}>
                  <Dots />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Suggestions */}
          {msgs.length <= 1 && (
            <div style={{ padding: "0 12px 8px", display: "flex", gap: 4, overflowX: "auto", flexShrink: 0 }}
              className="scrollbar-hide">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  style={{ flexShrink: 0, fontSize: 10, fontWeight: 600, color: "#059669",
                    background: "#f0fdf4", border: "0.5px solid #bbf7d0", borderRadius: 20,
                    padding: "5px 10px", cursor: "pointer", whiteSpace: "nowrap" }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: "10px 12px", borderTop: "0.5px solid #f3f4f6", flexShrink: 0,
            display: "flex", gap: 8, alignItems: "center" }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Pose une question..."
              style={{ flex: 1, border: "0.5px solid #e5e7eb", borderRadius: 10, padding: "8px 12px",
                fontSize: 12, outline: "none", background: "#f9fafb" }} />
            <button onClick={() => send()} disabled={!input.trim() || loading}
              style={{ width: 32, height: 32, borderRadius: "50%", border: "none", cursor: "pointer",
                background: input.trim() && !loading ? "#059669" : "#e5e7eb",
                color: input.trim() && !loading ? "#fff" : "#9ca3af",
                fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "all .15s" }}>
              ↑
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button onClick={() => setOpen(o => !o)}
        style={{
          position: "fixed", bottom: 20, right: 20,
          width: 52, height: 52, borderRadius: "50%", border: "none", cursor: "pointer",
          background: open ? "#374151" : "#059669",
          color: "#fff", fontSize: 22, zIndex: 9999,
          boxShadow: "0 4px 20px rgba(5,150,105,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all .2s", transform: open ? "rotate(0deg)" : "rotate(0deg)",
        }}>
        {open ? "✕" : "🤖"}
      </button>
    </>
  );
}
