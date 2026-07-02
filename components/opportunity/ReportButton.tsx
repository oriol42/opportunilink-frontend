// components/opportunity/ReportButton.tsx
"use client";
import { useState } from "react";
import { Flag, X, TriangleAlert, Link2Off, FileWarning, CalendarX, Check } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

const REASONS = [
  { value: "arnaque",     label: "Arnaque / demande d'argent", icon: TriangleAlert },
  { value: "lien_mort",   label: "Lien mort ou inaccessible",  icon: Link2Off },
  { value: "info_fausse", label: "Informations fausses",        icon: FileWarning },
  { value: "expire",      label: "Opportunité expirée",         icon: CalendarX },
];

export default function ReportButton({ oppId }: { oppId: string }) {
  const { success, error: toastError } = useToast();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!selected) return;
    setLoading(true);
    try {
      await api.post(`/opportunities/${oppId}/report?reason=${encodeURIComponent(selected)}`);
      setDone(true);
      success("Merci, ton signalement a été transmis à l'équipe.");
      setTimeout(() => { setOpen(false); setDone(false); setSelected(""); }, 1500);
    } catch {
      toastError("Erreur lors de l'envoi. Réessaie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Signaler cette opportunité"
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.18)",
          color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 700,
          padding: "7px 12px", borderRadius: 10, cursor: "pointer",
        }}
      >
        <Flag size={13} /> Signaler
      </button>

      {open && (
        <div
          onClick={() => !loading && setOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{
            background: "var(--bg-card)", borderRadius: 20, border: "1px solid var(--border)",
            padding: 24, maxWidth: 380, width: "100%", boxShadow: "0 8px 48px rgba(0,0,0,0.25)",
          }}>
            {done ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--bg-success)",
                  display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <Check size={22} color="var(--text-success)" />
                </div>
                <p style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Signalement envoyé</p>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <p style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>Signaler cette opportunité</p>
                  <button onClick={() => setOpen(false)} style={{ background: "var(--bg-surface-2)", border: "none",
                    width: 28, height: 28, borderRadius: "50%", cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                    <X size={14} />
                  </button>
                </div>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 18 }}>
                  Ton signalement aide à protéger les autres étudiants. L'équipe vérifie chaque cas.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                  {REASONS.map(r => (
                    <button key={r.value} onClick={() => setSelected(r.value)} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "11px 14px",
                      borderRadius: 12, border: "1.5px solid",
                      borderColor: selected === r.value ? "var(--text-danger)" : "var(--border)",
                      background: selected === r.value ? "var(--bg-danger)" : "var(--bg-surface-2)",
                      cursor: "pointer", textAlign: "left", transition: "all .15s",
                    }}>
                      <r.icon size={16} color={selected === r.value ? "var(--text-danger)" : "var(--text-muted)"} />
                      <span style={{ fontSize: 13, fontWeight: 600,
                        color: selected === r.value ? "var(--text-danger)" : "var(--text-secondary)" }}>{r.label}</span>
                    </button>
                  ))}
                </div>
                <button onClick={submit} disabled={!selected || loading} style={{
                  width: "100%", padding: "13px", borderRadius: 12, border: "none",
                  background: selected && !loading ? "var(--text-danger)" : "var(--border)",
                  color: selected && !loading ? "#fff" : "var(--text-muted)",
                  fontWeight: 700, fontSize: 14, cursor: selected && !loading ? "pointer" : "not-allowed",
                }}>
                  {loading ? "Envoi..." : "Envoyer le signalement"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
