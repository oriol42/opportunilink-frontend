"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { useStore } from "@/store/useStore";
import {
  Sparkles, Printer, Copy, Check, GraduationCap, Zap, Heart,
  Languages as LangIcon, Mail, Phone, MapPin, Lightbulb, LoaderCircle,
} from "lucide-react";

interface FormationItem { periode: string; titre: string; etablissement: string; }
interface LangueItem { langue: string; niveau: string; }
interface CVData {
  titre_accroche: string;
  resume_profil: string;
  formation: FormationItem[];
  competences_techniques: string[];
  competences_transverses: string[];
  langues: LangueItem[];
  points_forts: string[];
  conseils_amelioration: string[];
  opportunity_title: string;
}

type BuilderState = "idle" | "loading" | "done" | "error";

export default function CVBuilder({ oppId }: { oppId: string }) {
  const { user } = useStore();
  const [state, setState] = useState<BuilderState>("idle");
  const [cv, setCv] = useState<CVData | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setState("loading");
    setCv(null);
    try {
      const res = await api.post<CVData>("/ai/generate-cv", { opportunity_id: oppId });
      setCv(res.data);
      setState("done");
    } catch {
      setState("error");
    }
  }

  async function handleCopy() {
    if (!cv) return;
    const text = [
      user?.full_name ?? "",
      cv.titre_accroche,
      [user?.email, user?.phone, user?.city].filter(Boolean).join(" · "),
      "",
      "RÉSUMÉ",
      cv.resume_profil,
      "",
      "FORMATION",
      ...cv.formation.map(f => `${f.periode} — ${f.titre}, ${f.etablissement}`),
      "",
      "COMPÉTENCES TECHNIQUES",
      cv.competences_techniques.join(", "),
      "",
      "COMPÉTENCES TRANSVERSALES",
      cv.competences_transverses.join(", "),
      "",
      "LANGUES",
      ...cv.langues.map(l => `${l.langue} — ${l.niveau}`),
      "",
      "POINTS FORTS",
      ...cv.points_forts.map(p => `• ${p}`),
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div style={{ background: "var(--bg-card)", borderRadius: 18, border: "1px solid var(--border)", overflow: "hidden" }}>
      <div style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Créer mon CV</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              Génère un CV complet à partir de ton profil, adapté à cette opportunité
            </p>
          </div>
          <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, padding: "3px 10px",
            borderRadius: 20, background: "rgba(13,148,136,.12)", color: "#0d9488" }}>IA</span>
        </div>

        <button onClick={handleGenerate} disabled={state === "loading"}
          style={{ marginTop: 14, width: "100%", padding: "13px", borderRadius: 13,
            border: "1.5px solid #0d9488", background: state === "loading" ? "var(--bg-surface-2)" : "transparent",
            color: state === "loading" ? "var(--text-muted)" : "#0d9488",
            fontWeight: 700, fontSize: 13, cursor: state === "loading" ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {state === "loading"
            ? <><LoaderCircle size={15} className="spin" /> Génération en cours...</>
            : state === "done"
            ? <><Sparkles size={15} /> Régénérer le CV</>
            : <><Sparkles size={15} /> Créer mon CV pour cette opportunité</>}
        </button>

        {state === "error" && (
          <p style={{ marginTop: 10, fontSize: 12, color: "var(--text-danger)", textAlign: "center" }}>
            Erreur lors de la génération. Réessaie dans quelques secondes.
          </p>
        )}
      </div>

      {state === "done" && cv && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 20px", background: "var(--bg-surface-2)", borderTop: "1px solid var(--border-subtle)",
            borderBottom: "1px solid var(--border-subtle)" }} className="no-print">
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>CV prêt</span>
            <div style={{ display: "flex", gap: 14 }}>
              <button onClick={handleCopy} style={{ fontSize: 11, fontWeight: 700, color: "#0d9488",
                background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                {copied ? <><Check size={12} />Copié</> : <><Copy size={12} />Copier</>}
              </button>
              <button onClick={handlePrint} style={{ fontSize: 11, fontWeight: 700, color: "#0d9488",
                background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                <Printer size={12} />Imprimer / PDF
              </button>
            </div>
          </div>

          <div id="cv-print-area" style={{ padding: "24px 22px", background: "#fff" }}>
            <div style={{ borderBottom: "3px solid #0d9488", paddingBottom: 14, marginBottom: 16 }}>
              <h2 style={{ fontFamily: "var(--font-voice)", fontWeight: 600, fontSize: 22, color: "#0f172a", marginBottom: 4 }}>
                {user?.full_name ?? "Ton nom"}
              </h2>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#0d9488", marginBottom: 8 }}>{cv.titre_accroche}</p>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {user?.email && <span style={{ fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}><Mail size={11} />{user.email}</span>}
                {user?.phone && <span style={{ fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}><Phone size={11} />{user.phone}</span>}
                {user?.city && <span style={{ fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} />{user.city}</span>}
              </div>
            </div>

            <section style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: "#334155", lineHeight: 1.7 }}>{cv.resume_profil}</p>
            </section>

            <section style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#0d9488", textTransform: "uppercase",
                letterSpacing: ".06em", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                <GraduationCap size={13} /> Formation
              </p>
              {cv.formation.map((f, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div>
                    <p style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}>{f.titre}</p>
                    <p style={{ fontSize: 11, color: "#64748b" }}>{f.etablissement}</p>
                  </div>
                  <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0, whiteSpace: "nowrap" }}>{f.periode}</span>
                </div>
              ))}
            </section>

            <section style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#0d9488", textTransform: "uppercase",
                letterSpacing: ".06em", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                <Zap size={13} /> Compétences techniques
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {cv.competences_techniques.map((c, i) => (
                  <span key={i} style={{ fontSize: 11, fontWeight: 600, color: "#0f766e",
                    background: "#f0fdfa", padding: "3px 10px", borderRadius: 20, border: "1px solid #ccfbf1" }}>{c}</span>
                ))}
              </div>
            </section>

            <section style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#0d9488", textTransform: "uppercase",
                letterSpacing: ".06em", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                <Heart size={13} /> Compétences transversales
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {cv.competences_transverses.map((c, i) => (
                  <span key={i} style={{ fontSize: 11, fontWeight: 600, color: "#475569",
                    background: "#f8fafc", padding: "3px 10px", borderRadius: 20, border: "1px solid #e2e8f0" }}>{c}</span>
                ))}
              </div>
            </section>

            <section style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#0d9488", textTransform: "uppercase",
                letterSpacing: ".06em", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                <LangIcon size={13} /> Langues
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {cv.langues.map((l, i) => (
                  <span key={i} style={{ fontSize: 12, color: "#334155" }}>
                    <strong>{l.langue}</strong> — {l.niveau}
                  </span>
                ))}
              </div>
            </section>

            <section>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#0d9488", textTransform: "uppercase",
                letterSpacing: ".06em", marginBottom: 8 }}>Points forts pour cette opportunité</p>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {cv.points_forts.map((p, i) => (
                  <li key={i} style={{ fontSize: 12, color: "#334155", lineHeight: 1.7, marginBottom: 3 }}>{p}</li>
                ))}
              </ul>
            </section>
          </div>

          {cv.conseils_amelioration.length > 0 && (
            <div className="no-print" style={{ padding: "16px 20px", borderTop: "1px solid var(--border-subtle)" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-warning)", textTransform: "uppercase",
                letterSpacing: ".05em", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                <Lightbulb size={12} /> Pour renforcer ton dossier
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {cv.conseils_amelioration.map((c, i) => (
                  <div key={i} style={{ background: "var(--bg-warning)", borderRadius: 10, padding: "8px 12px",
                    border: "1px solid var(--border-warning)" }}>
                    <p style={{ fontSize: 12, color: "var(--text-warning)" }}>{c}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
