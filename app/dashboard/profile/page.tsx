"use client";
import { useState } from "react";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import StatsWidget from "@/components/dashboard/StatsWidget";

const LEVELS = ["Licence","Master","Doctorat","BTS","DUT","Ingénieur","Technicien Supérieur"];
const FIELDS = [
  "Informatique","Génie Logiciel","Réseaux & Télécoms","Intelligence Artificielle",
  "Droit","Sciences Politiques","Relations Internationales",
  "Médecine","Pharmacie","Santé Publique",
  "Économie","Gestion","Finance","Marketing","Comptabilité",
  "Lettres & Sciences Humaines","Langues","Journalisme",
  "Sciences","Mathématiques","Physique","Chimie","Biologie",
  "Ingénierie Civile","Architecture","Mécanique","Électronique",
  "Agriculture","Environnement","Éducation","Psychologie",
];

// Langues les plus utiles — courtes et claires
const MAIN_LANGS = [
  { code:"fr", flag:"🇫🇷", label:"Français" },
  { code:"en", flag:"🇬🇧", label:"Anglais" },
  { code:"de", flag:"🇩🇪", label:"Allemand" },
  { code:"es", flag:"🇪🇸", label:"Espagnol" },
  { code:"pt", flag:"🇵🇹", label:"Portugais" },
  { code:"ar", flag:"🇸🇦", label:"Arabe" },
  { code:"zh", flag:"🇨🇳", label:"Chinois" },
  { code:"it", flag:"🇮🇹", label:"Italien" },
];

const SKILLS_BY_FIELD: Record<string, string[]> = {
  "Informatique":         ["Python","JavaScript","React","SQL","Git","Docker","Node.js","Java","C++","Machine Learning"],
  "Génie Logiciel":       ["Python","Java","C#","Git","Agile","Docker","Kubernetes","Tests unitaires"],
  "Réseaux & Télécoms":   ["Cisco","Linux","TCP/IP","Cybersécurité","Wireshark","Python","Routage"],
  "Économie":             ["Excel","Power BI","SPSS","Stata","Analyse financière","Macroéconomie"],
  "Gestion":              ["Excel","ERP","Management","Leadership","Gestion de projet","Communication"],
  "Finance":              ["Excel","Bloomberg","Analyse financière","Comptabilité","Audit","Power BI"],
  "Marketing":            ["SEO","Google Ads","Canva","Social media","Excel","Content marketing"],
  "Droit":                ["Rédaction juridique","Recherche juridique","Droit des affaires","Plaidoirie"],
  "Médecine":             ["Clinique","Pharmacologie","Recherche médicale","Anatomie","Biologie"],
  "Architecture":         ["AutoCAD","Revit","SketchUp","ArchiCAD","3D Max"],
};

const F = "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm bg-white";

export default function ProfilePage() {
  const { user, setUser } = useStore();
  const { success, error: toastError } = useToast();

  const [form, setForm] = useState({
    full_name: user?.full_name ?? "",
    level:     user?.level ?? "",
    field:     user?.field ?? "",
    city:      user?.city ?? "",
    gpa:       user?.gpa?.toString() ?? "",
    phone:     user?.phone ?? "",
    languages: user?.languages ?? ["fr","en"],
    skills:    user?.skills ?? [],
  });
  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading] = useState(false);

  const checks = [form.full_name, form.level, form.field, form.city, form.gpa, form.phone,
    form.languages.length > 0 ? "ok" : "", form.skills.length > 0 ? "ok" : ""];
  const completeness = Math.round(checks.filter(Boolean).length / checks.length * 100);

  function toggleLang(code: string) {
    setForm(f => ({
      ...f,
      languages: f.languages.includes(code) ? f.languages.filter(l => l !== code) : [...f.languages, code],
    }));
  }

  function addSkill(s?: string) {
    const sk = (s ?? skillInput).trim();
    if (sk && !form.skills.includes(sk)) setForm(f => ({ ...f, skills: [...f.skills, sk] }));
    if (!s) setSkillInput("");
  }

  const suggestedSkills = (SKILLS_BY_FIELD[form.field] ?? []).filter(s => !form.skills.includes(s));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put("/users/me", { ...form, gpa: form.gpa ? parseFloat(form.gpa) : null });
      setUser(res.data);
      success("Profil mis à jour ! Feed recalculé.");
    } catch (err: unknown) {
      toastError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Erreur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Topbar */}
      <div style={{ background: "#fff", borderBottom: "0.5px solid #f3f4f6", padding: "18px 24px", flexShrink: 0 }}>
        <h1 style={{ fontWeight: 900, fontSize: 22, color: "#111827", marginBottom: 4 }}>Mon profil</h1>
        <p style={{ fontSize: 13, color: "#9ca3af" }}>Un profil complet améliore tes recommandations de 40%.</p>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        <StatsWidget />

        {/* Barre complétude */}
        <div style={{ background: "linear-gradient(135deg,#f0fdf4,#fffbeb)", border: "0.5px solid #d1fae5",
          borderRadius: 16, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#065f46" }}>Profil complété</span>
              <span style={{ fontWeight: 900, fontSize: 20, color: completeness >= 80 ? "#059669" : "#d97706" }}>
                {completeness}%
              </span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.6)", height: 8, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 4, transition: "width .7s",
                width: `${completeness}%`, background: completeness >= 80 ? "#10b981" : "#f59e0b" }} />
            </div>
          </div>
        </div>

        <form onSubmit={save}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginBottom: 20 }}>

            {/* Colonne 1 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              <div style={{ background: "#fff", borderRadius: 16, border: "0.5px solid #f3f4f6", padding: 20 }}>
                <p style={{ fontWeight: 700, fontSize: 12, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 14 }}>Identité</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>Nom complet</label>
                    <input type="text" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})}
                      className={F} placeholder="Jean Dupont" />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>Email (non modifiable)</label>
                    <input type="email" value={user?.email ?? ""} disabled
                      style={{ width: "100%", padding: "10px 14px", border: "0.5px solid #f3f4f6", borderRadius: 12, fontSize: 13, background: "#f9fafb", color: "#9ca3af" }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>Ville</label>
                      <input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})}
                        className={F} placeholder="Yaoundé" />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>Téléphone</label>
                      <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                        className={F} placeholder="+237 6XX..." />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: "#fff", borderRadius: 16, border: "0.5px solid #f3f4f6", padding: 20 }}>
                <p style={{ fontWeight: 700, fontSize: 12, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 14 }}>Parcours académique</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>Niveau d'études</label>
                    <select value={form.level} onChange={e => setForm({...form, level: e.target.value})}
                      style={{ width: "100%", padding: "10px 14px", border: "0.5px solid #e5e7eb", borderRadius: 12, fontSize: 13, background: "#fff", outline: "none" }}>
                      <option value="">Sélectionner</option>
                      {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>Filière</label>
                    <select value={form.field} onChange={e => setForm({...form, field: e.target.value})}
                      style={{ width: "100%", padding: "10px 14px", border: "0.5px solid #e5e7eb", borderRadius: 12, fontSize: 13, background: "#fff", outline: "none" }}>
                      <option value="">Sélectionner</option>
                      {FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>
                      Moyenne / 20 <span style={{ fontWeight: 400, color: "#d1d5db" }}>— détermine ton éligibilité</span>
                    </label>
                    <input type="number" min="0" max="20" step="0.01" value={form.gpa}
                      onChange={e => setForm({...form, gpa: e.target.value})}
                      className={F} placeholder="14.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne 2 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Langues — 8 boutons simples */}
              <div style={{ background: "#fff", borderRadius: 16, border: "0.5px solid #f3f4f6", padding: 20 }}>
                <p style={{ fontWeight: 700, fontSize: 12, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 14 }}>
                  Langues <span style={{ fontWeight: 400, textTransform: "none", fontSize: 11 }}>— sélectionne celles que tu maîtrises</span>
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {MAIN_LANGS.map(({ code, flag, label }) => (
                    <button key={code} type="button" onClick={() => toggleLang(code)}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
                        borderRadius: 12, border: "0.5px solid",
                        borderColor: form.languages.includes(code) ? "#10b981" : "#e5e7eb",
                        background: form.languages.includes(code) ? "#f0fdf4" : "#fff",
                        color: form.languages.includes(code) ? "#065f46" : "#6b7280",
                        fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all .15s" }}>
                      <span style={{ fontSize: 18 }}>{flag}</span>
                      {label}
                      {form.languages.includes(code) && <span style={{ color: "#10b981", fontWeight: 800 }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compétences */}
              <div style={{ background: "#fff", borderRadius: 16, border: "0.5px solid #f3f4f6", padding: 20, flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: 12, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 14 }}>
                  Compétences <span style={{ fontWeight: 400, textTransform: "none", fontSize: 11 }}>— boostent le score de matching</span>
                </p>

                {/* Suggestions selon filière */}
                {suggestedSkills.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}>Suggestions pour {form.field || "ta filière"} :</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {suggestedSkills.slice(0, 8).map(s => (
                        <button key={s} type="button" onClick={() => addSkill(s)}
                          style={{ fontSize: 11, fontWeight: 600, color: "#059669", background: "#f0fdf4",
                            border: "0.5px solid #bbf7d0", borderRadius: 20, padding: "4px 10px", cursor: "pointer" }}>
                          + {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <input type="text" value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())}
                    placeholder="Ajouter une compétence..."
                    style={{ flex: 1, padding: "8px 12px", border: "0.5px solid #e5e7eb", borderRadius: 10, fontSize: 12, outline: "none" }} />
                  <button type="button" onClick={() => addSkill()}
                    style={{ padding: "8px 14px", background: "#f0fdf4", border: "0.5px solid #bbf7d0",
                      borderRadius: 10, color: "#059669", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                    +
                  </button>
                </div>

                {/* Tags */}
                {form.skills.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {form.skills.map(sk => (
                      <span key={sk} style={{ display: "flex", alignItems: "center", gap: 6,
                        padding: "5px 10px", background: "#f3f4f6", borderRadius: 20, fontSize: 12, fontWeight: 600, color: "#374151" }}>
                        {sk}
                        <button type="button"
                          onClick={() => setForm(f => ({ ...f, skills: f.skills.filter(s => s !== sk) }))}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af",
                            fontSize: 14, lineHeight: 1, padding: 0, fontWeight: 700 }}>×</button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: "#d1d5db", fontStyle: "italic" }}>
                    Aucune compétence — elles servent au matching des stages et emplois.
                  </p>
                )}
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{ width: "100%", background: loading ? "#d1d5db" : "#059669", color: "#fff",
              fontWeight: 800, fontSize: 15, padding: "14px 0", borderRadius: 16, border: "none",
              cursor: loading ? "not-allowed" : "pointer", transition: "background .15s",
              boxShadow: "0 4px 16px rgba(5,150,105,0.2)" }}>
            {loading ? "Enregistrement..." : "Sauvegarder mon profil"}
          </button>
        </form>
      </div>
    </div>
  );
}
