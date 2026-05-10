"use client";
import { useState } from "react";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import StatsWidget from "@/components/dashboard/StatsWidget";

const LEVELS = ["Licence", "Master", "Doctorat", "BTS", "DUT", "Ingénieur", "Technicien Supérieur"];
const FIELDS = [
  "Informatique", "Génie Logiciel", "Réseaux & Télécoms", "Intelligence Artificielle",
  "Droit", "Sciences Politiques", "Relations Internationales",
  "Médecine", "Pharmacie", "Santé Publique",
  "Économie", "Gestion", "Finance", "Marketing", "Comptabilité",
  "Lettres & Sciences Humaines", "Langues", "Journalisme",
  "Sciences", "Mathématiques", "Physique", "Chimie", "Biologie",
  "Ingénierie Civile", "Architecture", "Mécanique", "Électronique",
  "Agriculture", "Environnement", "Éducation", "Psychologie",
];
const LANGUAGES = [
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "en", flag: "🇬🇧", label: "Anglais" },
  { code: "de", flag: "🇩🇪", label: "Allemand" },
  { code: "es", flag: "🇪🇸", label: "Espagnol" },
  { code: "pt", flag: "🇵🇹", label: "Portugais" },
  { code: "ar", flag: "🇸🇦", label: "Arabe" },
  { code: "zh", flag: "🇨🇳", label: "Chinois" },
  { code: "it", flag: "🇮🇹", label: "Italien" },
  { code: "ru", flag: "🇷🇺", label: "Russe" },
  { code: "ja", flag: "🇯🇵", label: "Japonais" },
  { code: "ko", flag: "🇰🇷", label: "Coréen" },
  { code: "sw", flag: "🌍", label: "Swahili" },
  { code: "ha", flag: "🌍", label: "Haoussa" },
  { code: "yo", flag: "🌍", label: "Yoruba" },
  { code: "ew", flag: "🌿", label: "Ewondo" },
  { code: "ba", flag: "🌿", label: "Bassa" },
  { code: "ff", flag: "🌿", label: "Fulfulde" },
  { code: "du", flag: "🇳🇱", label: "Néerlandais" },
];

const SUGGESTED_SKILLS: Record<string, string[]> = {
  "Informatique":     ["Python", "JavaScript", "React", "Node.js", "SQL", "Git", "Docker", "Machine Learning"],
  "Économie":         ["Excel", "Power BI", "SPSS", "Analyse financière", "Comptabilité", "Audit"],
  "Droit":            ["Rédaction juridique", "Droit des affaires", "Plaidoirie", "Recherche juridique"],
  "Médecine":         ["Clinique", "Pharmacologie", "Recherche médicale", "Premiers secours"],
  "Gestion":          ["Management", "Excel", "ERP", "Communication", "Leadership", "Gestion de projet"],
  "Marketing":        ["SEO", "Google Ads", "Content marketing", "Photoshop", "Canva", "Social media"],
  "Architecture":     ["AutoCAD", "Revit", "SketchUp", "3D Studio Max", "ArchiCAD"],
};

const INPUT  = "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm bg-white transition";
const SELECT = "w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white text-sm transition";
const CARD   = "bg-white rounded-2xl border border-gray-100 p-5";
const LABEL  = "block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2";

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
    languages: user?.languages ?? [],
    skills:    user?.skills ?? [],
  });

  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [langSearch, setLangSearch] = useState("");

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
    const skill = (s ?? skillInput).trim();
    if (skill && !form.skills.includes(skill)) setForm(f => ({ ...f, skills: [...f.skills, skill] }));
    if (!s) setSkillInput("");
  }

  const suggested = (SUGGESTED_SKILLS[form.field] ?? []).filter(s => !form.skills.includes(s));
  const filteredLangs = LANGUAGES.filter(l =>
    !langSearch || l.label.toLowerCase().includes(langSearch.toLowerCase())
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put("/users/me", { ...form, gpa: form.gpa ? parseFloat(form.gpa) : null });
      setUser(res.data);
      success("Profil mis à jour ! Recommandations recalculées.");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toastError(msg ?? "Erreur lors de la mise à jour.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 lg:px-5 py-5 max-w-4xl">
      <div className="mb-5">
        <h2 className="text-2xl font-black text-gray-900">Mon profil</h2>
        <p className="text-sm text-gray-400 mt-1">Un profil complet améliore tes recommandations de 40%.</p>
      </div>

      <StatsWidget />

      {/* Barre de complétude */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-emerald-800">Profil complété</span>
          <span className={`text-2xl font-black ${completeness === 100 ? "text-emerald-600" : "text-amber-500"}`}>
            {completeness}%
          </span>
        </div>
        <div className="bg-white/70 rounded-full h-2 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${completeness === 100 ? "bg-emerald-500" : "bg-amber-400"}`}
            style={{ width: `${completeness}%` }} />
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

          {/* Colonne gauche */}
          <div className="space-y-4">
            <div className={CARD}>
              <label className={LABEL}>Nom complet</label>
              <input type="text" value={form.full_name} className={INPUT}
                onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Jean Dupont" />
            </div>

            <div className={CARD}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Niveau d'études</label>
                  <select value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} className={SELECT}>
                    <option value="">Choisir</option>
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Filière</label>
                  <select value={form.field} onChange={e => setForm({ ...form, field: e.target.value })} className={SELECT}>
                    <option value="">Choisir</option>
                    {FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className={CARD}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Ville</label>
                  <input type="text" value={form.city} className={INPUT}
                    onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Yaoundé" />
                </div>
                <div>
                  <label className={LABEL}>Moyenne / 20</label>
                  <input type="number" min="0" max="20" step="0.01"
                    value={form.gpa} className={INPUT}
                    onChange={e => setForm({ ...form, gpa: e.target.value })} placeholder="14.5" />
                </div>
              </div>
            </div>

            <div className={CARD}>
              <label className={LABEL}>Téléphone (alertes SMS)</label>
              <input type="tel" value={form.phone} className={INPUT}
                onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+237 6XX XXX XXX" />
            </div>

            <div className={`${CARD} opacity-60`}>
              <label className={LABEL}>Email (non modifiable)</label>
              <input type="email" value={user?.email ?? ""} disabled className={`${INPUT} cursor-not-allowed bg-gray-50`} />
            </div>
          </div>

          {/* Colonne droite */}
          <div className="space-y-4">

            {/* Langues — avec recherche */}
            <div className={CARD}>
              <label className={LABEL}>Langues parlées ({form.languages.length} sélectionnée{form.languages.length > 1 ? "s" : ""})</label>
              <input type="text" placeholder="Filtrer les langues..."
                value={langSearch} onChange={e => setLangSearch(e.target.value)}
                className={`${INPUT} mb-3 text-xs`} />
              <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto">
                {filteredLangs.map(({ code, flag, label }) => (
                  <button key={code} type="button" onClick={() => toggleLang(code)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      form.languages.includes(code)
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-emerald-300"
                    }`}>
                    {flag} {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Compétences — avec suggestions */}
            <div className={CARD}>
              <label className={LABEL}>Compétences techniques ({form.skills.length})</label>

              {/* Suggestions selon la filière */}
              {suggested.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] text-gray-400 font-semibold mb-1.5">Suggestions pour {form.field || "ta filière"} :</p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggested.slice(0, 6).map(s => (
                      <button key={s} type="button" onClick={() => addSkill(s)}
                        className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition">
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mb-3">
                <input type="text" value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  placeholder="Ajouter une compétence..."
                  className={`${INPUT} flex-1 text-xs`} />
                <button type="button" onClick={() => addSkill()}
                  className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-200 transition shrink-0">
                  +
                </button>
              </div>

              {form.skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {form.skills.map(skill => (
                    <span key={skill}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold border border-gray-200">
                      {skill}
                      <button type="button"
                        onClick={() => setForm(f => ({ ...f, skills: f.skills.filter(s => s !== skill) }))}
                        className="text-gray-400 hover:text-red-500 transition ml-0.5 font-bold text-sm leading-none">×</button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">Aucune — elles servent au matching !</p>
              )}
            </div>

            {/* Carte pourquoi */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-xs font-bold text-amber-800 mb-2">💡 Impact sur le feed</p>
              <div className="space-y-1.5">
                {[
                  ["Niveau + Filière", "40% du score de pertinence"],
                  ["Langues parlées",  "Filtre les opport. inaccessibles"],
                  ["Moyenne (GPA)",    "Vérifie ton éligibilité en temps réel"],
                  ["Compétences",      "Booste les stages/emplois tech"],
                  ["Téléphone",        "Alertes SMS J-7 et J-1 deadline"],
                ].map(([field, impact]) => (
                  <div key={field} className="flex justify-between text-xs">
                    <span className="font-semibold text-amber-800">{field}</span>
                    <span className="text-amber-600">{impact}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition text-sm shadow-sm shadow-emerald-100">
          {loading ? "Enregistrement..." : "Sauvegarder mon profil"}
        </button>
      </form>
    </div>
  );
}
