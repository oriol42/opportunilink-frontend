"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useStore } from "@/store/useStore";

const LEVELS = ["Licence","Master","Doctorat","BTS","DUT","Ingénieur","Technicien Supérieur"];

const FIELDS = [
  "Informatique","Génie Logiciel","Réseaux & Télécoms","Intelligence Artificielle",
  "Droit","Sciences Politiques","Relations Internationales",
  "Médecine","Pharmacie","Santé Publique",
  "Économie","Gestion","Finance","Marketing","Comptabilité",
  "Lettres & Sciences Humaines","Langues","Journalisme","Communication",
  "Sciences","Mathématiques","Physique","Chimie","Biologie",
  "Ingénierie Civile","Architecture","Mécanique","Électronique",
  "Agriculture","Environnement","Éducation","Psychologie","Sociologie",
  "Art & Design","Audiovisuel","Tourisme & Hôtellerie","Autre",
];

const OBJECTIVES = [
  { key:"bourse",   icon:"🎓", label:"Bourse d'études",     desc:"Financer mes études à l'étranger ou localement" },
  { key:"stage",    icon:"💼", label:"Stage professionnel",  desc:"Gagner de l'expérience en entreprise" },
  { key:"emploi",   icon:"🚀", label:"Emploi",               desc:"Trouver un poste après mes études" },
  { key:"echange",  icon:"🌍", label:"Programme d'échange",  desc:"Étudier à l'étranger pendant quelques mois" },
  { key:"concours", icon:"🏆", label:"Concours & compétitions", desc:"Participer à des compétitions et prix" },
  { key:"tout",     icon:"✨", label:"Tout m'intéresse",     desc:"Je veux voir toutes les opportunités" },
];

const STEPS = [
  { key:"level",     title:"Ton niveau d'études",           subtitle:"On personnalise ton feed selon ton niveau" },
  { key:"field",     title:"Ta filière",                    subtitle:"Toutes les filières sont bienvenues" },
  { key:"objective", title:"Ce que tu recherches",          subtitle:"Pour prioriser les bonnes opportunités" },
  { key:"gpa",       title:"Ta moyenne (optionnel)",        subtitle:"Débloque les bourses avec GPA minimum" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { setUser } = useStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    level: "", field: "", objective: "", gpa: "",
  });

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  function canNext() {
    if (step === 0) return !!form.level;
    if (step === 1) return !!form.field;
    if (step === 2) return !!form.objective;
    return true; // gpa optionnel
  }

  async function handleNext() {
    if (!isLast) { setStep(s => s + 1); return; }
    // Dernier step — sauvegarder et aller au dashboard
    setLoading(true);
    try {
      const payload: Record<string, string | number | null> = {
        level: form.level,
        field: form.field,
      };
      if (form.gpa) payload.gpa = parseFloat(form.gpa);
      const res = await api.put("/users/me", payload);
      setUser(res.data);
      router.push("/dashboard");
    } catch {
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    router.push("/dashboard");
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center",
      justifyContent: "center", padding: 20 }}>

      {/* Halo décoratif */}
      <div style={{ position: "fixed", top: "30%", left: "50%", transform: "translate(-50%,-50%)",
        width: 500, height: 500, background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
        pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 540, position: "relative" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <p style={{ fontWeight: 900, fontSize: 22, color: "#059669", marginBottom: 4 }}>OpportuLink</p>
          <p style={{ fontSize: 14, color: "#94a3b8" }}>
            Étape {step + 1} sur {STEPS.length}
          </p>
        </div>

        {/* Barre de progression */}
        <div style={{ background: "#e5e7eb", borderRadius: 4, height: 4, marginBottom: 32, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 4, background: "linear-gradient(90deg,#059669,#0d9488)",
            width: `${progress}%`, transition: "width .4s ease" }} />
        </div>

        {/* Card principale */}
        <div style={{ background: "#fff", borderRadius: 24, border: "1px solid #f1f5f9",
          padding: "32px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>

          <h2 style={{ fontWeight: 900, fontSize: 22, color: "#0f172a", marginBottom: 6 }}>
            {current.title}
          </h2>
          <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 28 }}>{current.subtitle}</p>

          {/* Step 0 — Niveau */}
          {step === 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              {LEVELS.map(l => (
                <button key={l} type="button" onClick={() => setForm({...form, level: l})}
                  style={{ padding: "14px 16px", borderRadius: 14, border: "2px solid",
                    borderColor: form.level === l ? "#10b981" : "#f1f5f9",
                    background: form.level === l ? "#f0fdf4" : "#fafafa",
                    color: form.level === l ? "#065f46" : "#374151",
                    fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all .15s",
                    display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
                  {l}
                  {form.level === l && <span style={{ fontSize: 16 }}>✅</span>}
                </button>
              ))}
            </div>
          )}

          {/* Step 1 — Filière */}
          {step === 1 && (
            <div>
              <div style={{ position: "relative", marginBottom: 16 }}>
                <input type="text" placeholder="Chercher une filière..."
                  style={{ width: "100%", padding: "12px 16px", border: "1.5px solid #e5e7eb",
                    borderRadius: 12, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  onChange={e => {
                    const val = e.target.value;
                    if (val.length > 2) setForm({...form, field: val});
                  }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8,
                maxHeight: 320, overflowY: "auto" }}>
                {FIELDS.map(f => (
                  <button key={f} type="button" onClick={() => setForm({...form, field: f})}
                    style={{ padding: "10px 14px", borderRadius: 12, border: "1.5px solid",
                      borderColor: form.field === f ? "#10b981" : "#f1f5f9",
                      background: form.field === f ? "#f0fdf4" : "#fafafa",
                      color: form.field === f ? "#065f46" : "#374151",
                      fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all .15s",
                      textAlign: "left" }}>
                    {form.field === f ? "✅ " : ""}{f}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — Objectif */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {OBJECTIVES.map(obj => (
                <button key={obj.key} type="button" onClick={() => setForm({...form, objective: obj.key})}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
                    borderRadius: 16, border: "2px solid",
                    borderColor: form.objective === obj.key ? "#10b981" : "#f1f5f9",
                    background: form.objective === obj.key ? "#f0fdf4" : "#fafafa",
                    cursor: "pointer", transition: "all .15s", textAlign: "left" }}>
                  <span style={{ fontSize: 28, flexShrink: 0 }}>{obj.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 800, fontSize: 14,
                      color: form.objective === obj.key ? "#065f46" : "#0f172a", marginBottom: 2 }}>
                      {obj.label}
                    </p>
                    <p style={{ fontSize: 12, color: "#94a3b8" }}>{obj.desc}</p>
                  </div>
                  {form.objective === obj.key && <span style={{ fontSize: 18 }}>✅</span>}
                </button>
              ))}
            </div>
          )}

          {/* Step 3 — GPA optionnel */}
          {step === 3 && (
            <div>
              <div style={{ position: "relative", marginBottom: 16 }}>
                <input type="number" min="0" max="20" step="0.1" value={form.gpa}
                  onChange={e => setForm({...form, gpa: e.target.value})}
                  placeholder="Ex: 14.5"
                  style={{ width: "100%", padding: "16px 60px 16px 16px", border: "1.5px solid #e5e7eb",
                    borderRadius: 14, fontSize: 20, fontWeight: 700, outline: "none",
                    boxSizing: "border-box", textAlign: "center" }} />
                <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
                  fontSize: 16, color: "#94a3b8", fontWeight: 700 }}>/20</span>
              </div>
              {form.gpa && (
                <div style={{ background: "#f0fdf4", borderRadius: 12, padding: "12px 16px",
                  border: "1px solid #bbf7d0", marginBottom: 16 }}>
                  <p style={{ fontSize: 13, color: "#065f46", fontWeight: 600 }}>
                    {parseFloat(form.gpa) >= 16 ? "🌟 Excellent — tu accèdes à 95% des bourses"
                      : parseFloat(form.gpa) >= 14 ? "✅ Très bien — la majorité des bourses sont accessibles"
                      : parseFloat(form.gpa) >= 12 ? "👍 Bien — de nombreuses opportunités correspondent"
                      : "💪 Continue — il y a quand même des opportunités sans GPA minimum"}
                  </p>
                </div>
              )}
              <div style={{ background: "#fffbeb", borderRadius: 12, padding: "12px 16px",
                border: "1px solid #fde68a" }}>
                <p style={{ fontSize: 12, color: "#78350f" }}>
                  💡 Ce champ est <strong>optionnel</strong>. Tu pourras le renseigner plus tard dans ton profil.
                  Il sert uniquement à filtrer les bourses avec un GPA minimum requis.
                </p>
              </div>
            </div>
          )}

          {/* Boutons navigation */}
          <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
            {step > 0 && (
              <button type="button" onClick={() => setStep(s => s - 1)}
                style={{ padding: "14px 20px", borderRadius: 14, border: "1.5px solid #e5e7eb",
                  background: "#fff", color: "#374151", fontWeight: 700, fontSize: 14,
                  cursor: "pointer", flexShrink: 0 }}>
                ← Retour
              </button>
            )}
            <button type="button" onClick={handleNext} disabled={!canNext() || loading}
              style={{ flex: 1, padding: "14px", borderRadius: 14, border: "none",
                background: canNext() && !loading ? "linear-gradient(135deg,#059669,#0d9488)" : "#e5e7eb",
                color: canNext() && !loading ? "#fff" : "#9ca3af",
                fontWeight: 800, fontSize: 15, cursor: canNext() && !loading ? "pointer" : "not-allowed",
                transition: "all .15s",
                boxShadow: canNext() && !loading ? "0 4px 16px rgba(5,150,105,0.3)" : "none" }}>
              {loading ? "Sauvegarde..." : isLast ? "Accéder à mon feed →" : "Continuer →"}
            </button>
          </div>

          {/* Skip */}
          {!isLast && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button type="button" onClick={handleSkip}
                style={{ fontSize: 13, color: "#94a3b8", background: "none", border: "none",
                  cursor: "pointer", fontWeight: 500 }}>
                Passer cette étape — compléter plus tard
              </button>
            </div>
          )}
        </div>

        {/* Indicateurs de steps */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 4,
              background: i <= step ? "#10b981" : "#e5e7eb",
              transition: "all .3s ease" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
