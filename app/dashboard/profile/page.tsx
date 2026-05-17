"use client";
import { useState } from "react";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { useQuery } from "@tanstack/react-query";

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

const F = "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm bg-white transition";

// Calcul détaillé de la complétude
function computeCompleteness(form: {
  full_name: string; level: string; field: string; city: string;
  gpa: string; phone: string; languages: string[]; skills: string[];
}) {
  const fields = [
    { key: "full_name", label: "Nom complet",    icon: "👤", done: !!form.full_name.trim(),     impact: "Requis pour la lettre IA" },
    { key: "level",     label: "Niveau d'études", icon: "🎓", done: !!form.level,               impact: "+40% de pertinence sur le feed" },
    { key: "field",     label: "Filière",          icon: "📚", done: !!form.field,               impact: "+25% sur le matching" },
    { key: "gpa",       label: "Moyenne / 20",     icon: "📊", done: !!form.gpa,                 impact: "Débloque 60% des bourses" },
    { key: "city",      label: "Ville",             icon: "📍", done: !!form.city.trim(),         impact: "Opportunités locales prioritaires" },
    { key: "phone",     label: "Téléphone",         icon: "📱", done: !!form.phone.trim(),        impact: "Alertes SMS avant deadlines" },
    { key: "languages", label: "Langues",            icon: "🗣️", done: form.languages.length > 0, impact: "Opportunités internationales" },
    { key: "skills",    label: "Compétences",        icon: "⚡", done: form.skills.length > 0,    impact: "Matching stages & emplois" },
  ];
  const done = fields.filter(f => f.done).length;
  const pct  = Math.round((done / fields.length) * 100);
  return { fields, done, total: fields.length, pct };
}

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
    languages: user?.languages ?? ["fr", "en"],
    skills:    user?.skills ?? [],
  });
  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<"identity"|"academic"|"languages"|"skills">("identity");

  const { data: stats } = useQuery({
    queryKey: ["my-stats"],
    queryFn: async () => (await api.get("/users/me/stats")).data,
    staleTime: 60000,
  });

  const { fields, done, total, pct } = computeCompleteness(form);
  const missing = fields.filter(f => !f.done);

  function toggleLang(code: string) {
    setForm(f => ({
      ...f,
      languages: f.languages.includes(code)
        ? f.languages.filter(l => l !== code)
        : [...f.languages, code],
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

  const sections = [
    { key: "identity",  label: "Identité",   icon: "👤" },
    { key: "academic",  label: "Académique",  icon: "🎓" },
    { key: "languages", label: "Langues",     icon: "🗣️" },
    { key: "skills",    label: "Compétences", icon: "⚡" },
  ] as const;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Topbar */}
      <div style={{ background: "#fff", borderBottom: "0.5px solid #f3f4f6",
        padding: "18px 24px", flexShrink: 0 }}>
        <h1 style={{ fontWeight: 900, fontSize: 22, color: "#111827", marginBottom: 4 }}>Mon profil</h1>
        <p style={{ fontSize: 13, color: "#9ca3af" }}>Un profil complet améliore tes recommandations de 40%.</p>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        <form onSubmit={save}>
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24, alignItems: "start" }}>

            {/* ── Colonne gauche : complétude + navigation ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 0 }}>

              {/* Dashboard complétude */}
              <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9",
                overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>

                {/* Header dégradé */}
                <div style={{ background: "linear-gradient(135deg, #0f172a, #065f46)", padding: "20px" }}>
                  {/* Avatar */}
                  <div style={{ width: 56, height: 56, borderRadius: "50%",
                    background: pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, fontWeight: 900, color: "#fff", marginBottom: 12,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                    {form.full_name ? form.full_name.split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase() : "?"}
                  </div>
                  <p style={{ fontWeight: 800, fontSize: 15, color: "#fff", marginBottom: 2 }}>
                    {form.full_name || "Ton nom"}
                  </p>
                  <p style={{ fontSize: 11, color: "#6ee7b7" }}>
                    {form.level || "Niveau"} · {form.field || "Filière"}
                  </p>
                </div>

                {/* Ring de complétude */}
                <div style={{ padding: "20px", display: "flex", alignItems: "center", gap: 16,
                  borderBottom: "1px solid #f8fafc" }}>
                  {(() => {
                    const size = 72; const r = 28; const circ = 2 * Math.PI * r;
                    const dash = (pct / 100) * circ;
                    const color = pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
                    return (
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={7} />
                          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={7}
                            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                            style={{ transition: "stroke-dasharray .8s ease" }} />
                        </svg>
                        <div style={{ position: "absolute", inset: 0, display: "flex",
                          flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 18, fontWeight: 900, color, lineHeight: 1 }}>{pct}%</span>
                        </div>
                      </div>
                    );
                  })()}
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>
                      {done}/{total} complété
                    </p>
                    <p style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.4 }}>
                      {pct >= 80
                        ? "Profil excellent 🎉"
                        : pct >= 50
                        ? "Continue, tu y es presque !"
                        : "Complète pour voir plus d'opport."}
                    </p>
                  </div>
                </div>

                {/* Liste des champs manquants */}
                {missing.length > 0 && (
                  <div style={{ padding: "12px 16px" }}>
                    <p style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8",
                      textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>
                      Priorités
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {missing.map(f => (
                        <div key={f.key} style={{ display: "flex", gap: 10, alignItems: "flex-start",
                          background: "#fef2f2", borderRadius: 10, padding: "8px 10px",
                          border: "1px solid #fecaca" }}>
                          <span style={{ fontSize: 14, flexShrink: 0 }}>{f.icon}</span>
                          <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#7f1d1d" }}>{f.label}</p>
                            <p style={{ fontSize: 10, color: "#b91c1c", marginTop: 1 }}>{f.impact}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats rapides */}
                {stats && (
                  <div style={{ padding: "12px 16px", borderTop: "1px solid #f8fafc",
                    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      { val: stats.applications?.total ?? 0, label: "Candidatures", color: "#2563eb", bg: "#eff6ff" },
                      { val: stats.saved_count ?? 0,          label: "Favoris",      color: "#d97706", bg: "#fffbeb" },
                    ].map(s => (
                      <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                        <p style={{ fontWeight: 900, fontSize: 20, color: s.color, lineHeight: 1 }}>{s.val}</p>
                        <p style={{ fontSize: 10, color: s.color, fontWeight: 600, marginTop: 3 }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Navigation sections */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9",
                padding: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                {sections.map(s => {
                  const active = activeSection === s.key;
                  // Vérifier si la section est complète
                  const sectionFields = {
                    identity:  ["full_name","city","phone"],
                    academic:  ["level","field","gpa"],
                    languages: ["languages"],
                    skills:    ["skills"],
                  }[s.key];
                  const sectionDone = fields.filter(f => sectionFields.includes(f.key) && f.done).length;
                  const sectionTotal = sectionFields.length;
                  const allDone = sectionDone === sectionTotal;
                  return (
                    <button key={s.key} type="button" onClick={() => setActiveSection(s.key)}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 12px", borderRadius: 12, border: "none", cursor: "pointer",
                        marginBottom: 2, transition: "all .15s",
                        background: active ? "#0f172a" : "transparent",
                        color: active ? "#fff" : "#374151" }}>
                      <span style={{ fontSize: 16 }}>{s.icon}</span>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 700, textAlign: "left" }}>{s.label}</span>
                      <span style={{ fontSize: 10, fontWeight: 800,
                        color: active ? "#6ee7b7" : allDone ? "#059669" : "#94a3b8",
                        background: active ? "rgba(16,185,129,0.2)" : allDone ? "#f0fdf4" : "#f1f5f9",
                        padding: "2px 7px", borderRadius: 20 }}>
                        {sectionDone}/{sectionTotal}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Bouton save */}
              <button type="submit" disabled={loading}
                style={{ width: "100%", background: loading ? "#d1d5db" : "linear-gradient(135deg,#059669,#0d9488)",
                  color: "#fff", fontWeight: 800, fontSize: 14, padding: "14px 0",
                  borderRadius: 14, border: "none", cursor: loading ? "not-allowed" : "pointer",
                  transition: "all .15s", boxShadow: loading ? "none" : "0 4px 16px rgba(5,150,105,0.3)" }}>
                {loading ? "Enregistrement..." : "💾 Sauvegarder"}
              </button>
            </div>

            {/* ── Colonne droite : formulaire par section ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Section Identité */}
              {activeSection === "identity" && (
                <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9",
                  padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0fdf4",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                      👤
                    </div>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>Identité</p>
                      <p style={{ fontSize: 11, color: "#94a3b8" }}>Tes informations personnelles de base</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700,
                        color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".04em" }}>
                        Nom complet *
                      </label>
                      <input type="text" value={form.full_name}
                        onChange={e => setForm({...form, full_name: e.target.value})}
                        className={F} placeholder="Jean Dupont" />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700,
                        color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".04em" }}>
                        Email (non modifiable)
                      </label>
                      <input type="email" value={user?.email ?? ""} disabled
                        style={{ width: "100%", padding: "10px 14px", border: "0.5px solid #f3f4f6",
                          borderRadius: 12, fontSize: 13, background: "#f9fafb", color: "#9ca3af" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700,
                          color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".04em" }}>
                          Ville
                        </label>
                        <input type="text" value={form.city}
                          onChange={e => setForm({...form, city: e.target.value})}
                          className={F} placeholder="Yaoundé" />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700,
                          color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".04em" }}>
                          Téléphone
                        </label>
                        <input type="tel" value={form.phone}
                          onChange={e => setForm({...form, phone: e.target.value})}
                          className={F} placeholder="+237 6XX XXX XXX" />
                      </div>
                    </div>
                    {/* Aide téléphone */}
                    <div style={{ background: "#f0fdf4", borderRadius: 12, padding: "10px 14px",
                      border: "1px solid #bbf7d0", display: "flex", gap: 10 }}>
                      <span style={{ fontSize: 16 }}>📱</span>
                      <p style={{ fontSize: 11, color: "#065f46", lineHeight: 1.5 }}>
                        Le téléphone active les alertes SMS — tu seras notifié 7 jours et 1 jour avant chaque deadline.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Section Académique */}
              {activeSection === "academic" && (
                <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9",
                  padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f3e8ff",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                      🎓
                    </div>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>Parcours académique</p>
                      <p style={{ fontSize: 11, color: "#94a3b8" }}>Ces 3 champs déterminent 65% de ton score de matching</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700,
                        color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".04em" }}>
                        Niveau d'études *
                      </label>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
                        {LEVELS.map(l => (
                          <button key={l} type="button" onClick={() => setForm({...form, level: l})}
                            style={{ padding: "10px 14px", borderRadius: 12, border: "1.5px solid",
                              borderColor: form.level === l ? "#7c3aed" : "#e5e7eb",
                              background: form.level === l ? "#f3e8ff" : "#fff",
                              color: form.level === l ? "#7c3aed" : "#374151",
                              fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all .15s" }}>
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700,
                        color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".04em" }}>
                        Filière *
                      </label>
                      <select value={form.field} onChange={e => setForm({...form, field: e.target.value})}
                        style={{ width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb",
                          borderRadius: 12, fontSize: 13, background: "#fff", outline: "none", cursor: "pointer" }}>
                        <option value="">Sélectionner ta filière</option>
                        {FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700,
                        color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".04em" }}>
                        Moyenne / 20
                      </label>
                      <div style={{ position: "relative" }}>
                        <input type="number" min="0" max="20" step="0.01" value={form.gpa}
                          onChange={e => setForm({...form, gpa: e.target.value})}
                          className={F} placeholder="Ex: 14.5" style={{ paddingRight: 60 }} />
                        <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                          fontSize: 12, color: "#9ca3af", fontWeight: 700 }}>/20</span>
                      </div>
                      {form.gpa && (
                        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, height: 4, background: "#f1f5f9", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ height: "100%", borderRadius: 2, transition: "width .5s",
                              width: `${(parseFloat(form.gpa) / 20) * 100}%`,
                              background: parseFloat(form.gpa) >= 14 ? "#10b981" : parseFloat(form.gpa) >= 12 ? "#f59e0b" : "#ef4444" }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700,
                            color: parseFloat(form.gpa) >= 14 ? "#059669" : parseFloat(form.gpa) >= 12 ? "#d97706" : "#dc2626" }}>
                            {parseFloat(form.gpa) >= 14 ? "Excellent" : parseFloat(form.gpa) >= 12 ? "Bien" : "Passable"}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Impact */}
                    <div style={{ background: "#fffbeb", borderRadius: 12, padding: "12px 14px",
                      border: "1px solid #fde68a" }}>
                      <p style={{ fontSize: 11, fontWeight: 800, color: "#78350f", marginBottom: 6 }}>
                        💡 Impact sur ton feed
                      </p>
                      <p style={{ fontSize: 11, color: "#92400e", lineHeight: 1.5 }}>
                        La moyenne débloque les bourses avec GPA minimum. Le niveau et la filière représentent
                        <strong> 65% du score de pertinence</strong> — sans eux, ton feed est générique.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Section Langues */}
              {activeSection === "languages" && (
                <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9",
                  padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#dbeafe",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                      🗣️
                    </div>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>Langues maîtrisées</p>
                      <p style={{ fontSize: 11, color: "#94a3b8" }}>Sélectionne les langues dans lesquelles tu peux postuler</p>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                    {MAIN_LANGS.map(({ code, flag, label }) => {
                      const selected = form.languages.includes(code);
                      return (
                        <button key={code} type="button" onClick={() => toggleLang(code)}
                          style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                            borderRadius: 14, border: "1.5px solid",
                            borderColor: selected ? "#10b981" : "#e5e7eb",
                            background: selected ? "#f0fdf4" : "#fff",
                            cursor: "pointer", transition: "all .15s", position: "relative" }}>
                          <span style={{ fontSize: 24 }}>{flag}</span>
                          <div style={{ flex: 1, textAlign: "left" }}>
                            <p style={{ fontWeight: 700, fontSize: 14,
                              color: selected ? "#065f46" : "#374151" }}>{label}</p>
                            <p style={{ fontSize: 10, color: selected ? "#059669" : "#9ca3af" }}>
                              {code === "fr" ? "Officiel Cameroun" : code === "en" ? "Opportunités mondiales" : code === "de" ? "DAAD & Bourses" : code === "ar" ? "Pays arabes" : "International"}
                            </p>
                          </div>
                          {selected && (
                            <span style={{ position: "absolute", top: 8, right: 8, fontSize: 14 }}>✅</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {form.languages.length > 0 && (
                    <div style={{ marginTop: 14, background: "#f0fdf4", borderRadius: 12,
                      padding: "10px 14px", border: "1px solid #bbf7d0" }}>
                      <p style={{ fontSize: 11, color: "#065f46" }}>
                        ✓ Tu peux postuler aux opportunités en{" "}
                        <strong>{form.languages.map(l => MAIN_LANGS.find(m => m.code === l)?.label || l).join(", ")}</strong>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Section Compétences */}
              {activeSection === "skills" && (
                <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9",
                  padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fef3c7",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                      ⚡
                    </div>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>Compétences</p>
                      <p style={{ fontSize: 11, color: "#94a3b8" }}>Boostent le score de matching pour les stages et emplois</p>
                    </div>
                  </div>

                  {/* Suggestions */}
                  {suggestedSkills.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280",
                        textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10 }}>
                        Suggestions pour {form.field || "ta filière"}
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                        {suggestedSkills.slice(0, 10).map(s => (
                          <button key={s} type="button" onClick={() => addSkill(s)}
                            style={{ fontSize: 12, fontWeight: 600, color: "#059669",
                              background: "#f0fdf4", border: "1px solid #bbf7d0",
                              borderRadius: 20, padding: "5px 12px", cursor: "pointer",
                              transition: "all .15s" }}
                            className="hover:bg-emerald-100">
                            + {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input ajout */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                    <input type="text" value={skillInput}
                      onChange={e => setSkillInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())}
                      placeholder="Ajouter une compétence..."
                      style={{ flex: 1, padding: "10px 14px", border: "1px solid #e5e7eb",
                        borderRadius: 12, fontSize: 13, outline: "none", transition: "border .15s" }}
                      className="focus:border-emerald-400" />
                    <button type="button" onClick={() => addSkill()}
                      style={{ padding: "10px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0",
                        borderRadius: 12, color: "#059669", fontWeight: 800, fontSize: 16, cursor: "pointer" }}>
                      +
                    </button>
                  </div>

                  {/* Tags compétences */}
                  {form.skills.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                      {form.skills.map(sk => (
                        <span key={sk} style={{ display: "flex", alignItems: "center", gap: 7,
                          padding: "6px 12px", background: "#0f172a", borderRadius: 20,
                          fontSize: 12, fontWeight: 700, color: "#fff" }}>
                          {sk}
                          <button type="button"
                            onClick={() => setForm(f => ({ ...f, skills: f.skills.filter(s => s !== sk) }))}
                            style={{ background: "rgba(255,255,255,0.2)", border: "none", cursor: "pointer",
                              color: "#fff", fontSize: 12, width: 18, height: 18, borderRadius: "50%",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontWeight: 900, padding: 0 }}>×</button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "24px 0", color: "#d1d5db" }}>
                      <p style={{ fontSize: 32, marginBottom: 8 }}>⚡</p>
                      <p style={{ fontSize: 13, fontWeight: 600 }}>Aucune compétence ajoutée</p>
                      <p style={{ fontSize: 11, marginTop: 4 }}>Utilise les suggestions ci-dessus</p>
                    </div>
                  )}

                  {form.skills.length > 0 && (
                    <div style={{ marginTop: 14, background: "#fffbeb", borderRadius: 12,
                      padding: "10px 14px", border: "1px solid #fde68a" }}>
                      <p style={{ fontSize: 11, color: "#78350f" }}>
                        💡 <strong>{form.skills.length} compétence{form.skills.length > 1 ? "s" : ""}</strong> ajoutée{form.skills.length > 1 ? "s" : ""} — elles sont comparées avec les descriptions des opportunités pour calculer ton score de matching.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
