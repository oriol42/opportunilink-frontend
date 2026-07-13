"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useStore } from "@/store/useStore";
import {
  GraduationCap, Briefcase, Rocket, Globe, Trophy, Sparkles,
  Check, X, ChevronLeft,
} from "lucide-react";

const LEVELS = ["Bac","Licence","Master","Doctorat","BTS","DUT","Ingénieur","Technicien Supérieur"];

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
  { key:"bourse",   icon: GraduationCap, label:"Bourse d'études",        desc:"Financer mes études à l'étranger ou localement", color:"#7c3aed" },
  { key:"stage",     icon: Briefcase,     label:"Stage professionnel",   desc:"Gagner de l'expérience en entreprise", color:"#2563eb" },
  { key:"emploi",    icon: Rocket,        label:"Emploi",                desc:"Trouver un poste après mes études", color:"#059669" },
  { key:"echange",   icon: Globe,         label:"Programme d'échange",   desc:"Étudier à l'étranger pendant quelques mois", color:"#d97706" },
  { key:"concours",  icon: Trophy,        label:"Concours & compétitions", desc:"Participer à des compétitions et prix", color:"#dc2626" },
  { key:"tout",      icon: Sparkles,      label:"Tout m'intéresse",      desc:"Je veux voir toutes les opportunités", color:"#0d9488" },
];

const STEPS = [
  { key:"level",     title:"Ton niveau d'études",  subtitle:"On personnalise ton feed selon ton niveau" },
  { key:"field",     title:"Ta filière",           subtitle:"Toutes les filières sont bienvenues" },
  { key:"objective", title:"Ce que tu recherches",  subtitle:"Pour prioriser les bonnes opportunités" },
  { key:"gpa",       title:"Ta moyenne (optionnel)", subtitle:"Débloque les bourses avec GPA minimum" },
];

function FieldStep({ value, onChange }: { value: string; onChange: (f: string) => void }) {
  const [search, setSearch] = useState("");
  const filtered = search.length > 0
    ? FIELDS.filter(f => f.toLowerCase().includes(search.toLowerCase()))
    : FIELDS;

  return (
    <div>
      <div style={{ position: "relative", marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Chercher une filière..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", padding: "12px 40px 12px 16px", border: "1px solid var(--border)",
            background: "var(--bg-input)", color: "var(--text-primary)",
            borderRadius: 12, fontSize: 14, outline: "none", boxSizing: "border-box" }}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
            <X size={16} />
          </button>
        )}
      </div>
      {value && (
        <div style={{ background: "var(--bg-success)", borderRadius: 10, padding: "10px 14px",
          border: "1px solid var(--border-success)", marginBottom: 12, display: "flex",
          alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-success)", display: "flex", alignItems: "center", gap: 6 }}>
            <Check size={14} /> {value}
          </span>
          <button type="button" onClick={() => onChange("")}
            style={{ background: "none", border: "none", cursor: "pointer",
              fontSize: 12, color: "var(--text-muted)" }}>Changer</button>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8,
        maxHeight: 300, overflowY: "auto" }}>
        {filtered.length === 0 && (
          <div style={{ gridColumn: "span 2", textAlign: "center", padding: "20px",
            color: "var(--text-muted)", fontSize: 13 }}>Aucune filière trouvée</div>
        )}
        {filtered.map(f => {
          const active = value === f;
          return (
            <button key={f} type="button" onClick={() => { onChange(f); setSearch(""); }}
              style={{ padding: "10px 14px", borderRadius: 12, border: "1.5px solid",
                borderColor: active ? "var(--accent)" : "rgba(16,185,129,0.18)",
                background: active ? "var(--bg-success)" : "rgba(16,185,129,0.05)",
                color: active ? "var(--text-success)" : "var(--text-secondary)",
                fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all .15s",
                textAlign: "left", display: "flex", alignItems: "center", gap: 6 }}>
              {active && <Check size={13} />}{f}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
    return true;
  }

  async function handleNext() {
    if (!isLast) { setStep(s => s + 1); return; }
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
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center",
      justifyContent: "center", padding: 20 }}>

      <div style={{ position: "fixed", top: "30%", left: "50%", transform: "translate(-50%,-50%)",
        width: 500, height: 500, background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
        pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 540, position: "relative" }}>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <p style={{ fontFamily: "var(--font-voice)", fontWeight: 600, fontSize: 22, color: "var(--accent-dark)", marginBottom: 4 }}>OpportuLink</p>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
            Étape {step + 1} sur {STEPS.length}
          </p>
        </div>

        <div style={{ background: "var(--border)", borderRadius: 4, height: 4, marginBottom: 32, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 4, background: "var(--accent)",
            width: `${progress}%`, transition: "width .4s ease" }} />
        </div>

        <div style={{ background: "var(--bg-card)", borderRadius: 24, border: "1px solid var(--border)",
          padding: "32px", boxShadow: "var(--shadow-md)" }}>

          <h2 style={{ fontFamily: "var(--font-voice)", fontWeight: 500, fontSize: 22, color: "var(--text-primary)", marginBottom: 6 }}>
            {current.title}
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 28 }}>{current.subtitle}</p>

          {step === 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              {LEVELS.map(l => {
                const active = form.level === l;
                return (
                  <button key={l} type="button" onClick={() => setForm({...form, level: l})}
                    style={{ padding: "14px 16px", borderRadius: 14, border: "2px solid",
                      borderColor: active ? "var(--accent)" : "rgba(16,185,129,0.18)",
                      background: active ? "var(--bg-success)" : "rgba(16,185,129,0.05)",
                      color: active ? "var(--text-success)" : "var(--text-secondary)",
                      fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all .15s",
                      display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
                    {l}
                    {active && <Check size={16} />}
                  </button>
                );
              })}
            </div>
          )}

          {step === 1 && (
            <FieldStep
              value={form.field}
              onChange={field => setForm({...form, field})}
            />
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {OBJECTIVES.map(obj => {
                const active = form.objective === obj.key;
                const Icon = obj.icon;
                return (
                  <button key={obj.key} type="button" onClick={() => setForm({...form, objective: obj.key})}
                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
                      borderRadius: 16, border: "2px solid",
                      borderColor: active ? obj.color : `${obj.color}30`,
                      background: active ? `${obj.color}14` : `${obj.color}08`,
                      cursor: "pointer", transition: "all .15s", textAlign: "left" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: active ? obj.color : `${obj.color}1c`,
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={20} color={active ? "#fff" : obj.color} strokeWidth={2} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: 14,
                        color: active ? obj.color : "var(--text-primary)", marginBottom: 2 }}>
                        {obj.label}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{obj.desc}</p>
                    </div>
                    {active && <Check size={18} color={obj.color} />}
                  </button>
                );
              })}
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={{ position: "relative", marginBottom: 16 }}>
                <input type="number" min="0" max="20" step="0.1" value={form.gpa}
                  onChange={e => setForm({...form, gpa: e.target.value})}
                  placeholder="Ex: 14.5"
                  style={{ width: "100%", padding: "16px 60px 16px 16px", border: "1px solid var(--border)",
                    background: "var(--bg-input)", color: "var(--text-primary)",
                    borderRadius: 14, fontSize: 20, fontWeight: 600, outline: "none",
                    boxSizing: "border-box", textAlign: "center" }} />
                <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
                  fontSize: 16, color: "var(--text-muted)", fontWeight: 600 }}>/20</span>
              </div>
              {form.gpa && (
                <div style={{ background: "var(--bg-success)", borderRadius: 12, padding: "12px 16px",
                  border: "1px solid var(--border-success)", marginBottom: 16 }}>
                  <p style={{ fontSize: 13, color: "var(--text-success)", fontWeight: 600 }}>
                    {parseFloat(form.gpa) >= 16 ? "Excellent — tu accèdes à 95% des bourses"
                      : parseFloat(form.gpa) >= 14 ? "Très bien — la majorité des bourses sont accessibles"
                      : parseFloat(form.gpa) >= 12 ? "Bien — de nombreuses opportunités correspondent"
                      : "Continue — il y a quand même des opportunités sans GPA minimum"}
                  </p>
                </div>
              )}
              <div style={{ background: "var(--bg-warning)", borderRadius: 12, padding: "12px 16px",
                border: "1px solid var(--border-warning)" }}>
                <p style={{ fontSize: 12, color: "var(--text-warning)" }}>
                  Ce champ est <strong>optionnel</strong>. Tu pourras le renseigner plus tard dans ton profil.
                  Il sert uniquement à filtrer les bourses avec un GPA minimum requis.
                </p>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
            {step > 0 && (
              <button type="button" onClick={() => setStep(s => s - 1)}
                style={{ padding: "14px 20px", borderRadius: 14, border: "1px solid var(--border)",
                  background: "var(--bg-surface-2)", color: "var(--text-secondary)", fontWeight: 600, fontSize: 14,
                  cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
                <ChevronLeft size={16} /> Retour
              </button>
            )}
            <button type="button" onClick={handleNext} disabled={!canNext() || loading}
              style={{ flex: 1, padding: "14px", borderRadius: 14, border: "none",
                background: canNext() && !loading ? "var(--accent)" : "var(--border)",
                color: canNext() && !loading ? "#fff" : "var(--text-muted)",
                fontWeight: 700, fontSize: 15, cursor: canNext() && !loading ? "pointer" : "not-allowed",
                transition: "all .15s" }}>
              {loading ? "Sauvegarde..." : isLast ? "Accéder à mon feed →" : "Continuer →"}
            </button>
          </div>

          {!isLast && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button type="button" onClick={handleSkip}
                style={{ fontSize: 13, color: "var(--text-muted)", background: "none", border: "none",
                  cursor: "pointer", fontWeight: 500 }}>
                Passer cette étape — compléter plus tard
              </button>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 4,
              background: i <= step ? "var(--accent)" : "var(--border)",
              transition: "all .3s ease" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
