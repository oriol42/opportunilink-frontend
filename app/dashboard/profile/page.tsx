"use client";
import { useState } from "react";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

const LEVELS    = ["Licence", "Master", "Doctorat", "BTS", "DUT", "Ingénieur"];
const FIELDS    = ["Informatique", "Droit", "Médecine", "Économie", "Gestion", "Lettres", "Sciences", "Ingénierie", "Pharmacie", "Architecture"];
const LANGUAGES = [
  { code: "fr", label: "Français",  flag: "🇫🇷" },
  { code: "en", label: "Anglais",   flag: "🇬🇧" },
  { code: "de", label: "Allemand",  flag: "🇩🇪" },
  { code: "es", label: "Espagnol",  flag: "🇪🇸" },
  { code: "zh", label: "Chinois",   flag: "🇨🇳" },
  { code: "ar", label: "Arabe",     flag: "🇸🇦" },
  { code: "pt", label: "Portugais", flag: "🇵🇹" },
];

const INPUT  = "w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm bg-white transition";
const SELECT = "w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white text-sm transition";
const CARD   = "bg-white rounded-2xl border border-gray-100 p-5";
const LABEL  = "block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2";

export default function ProfilePage() {
  const { user, setUser } = useStore();
  const { success, error: toastError } = useToast();

  const [form, setForm] = useState({
    full_name: user?.full_name ?? "",
    level:     user?.level     ?? "",
    field:     user?.field     ?? "",
    city:      user?.city      ?? "",
    gpa:       user?.gpa?.toString() ?? "",
    phone:     user?.phone     ?? "",
    languages: user?.languages ?? [],
    skills:    user?.skills    ?? [],
  });

  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading]       = useState(false);

  const checks = [
    form.full_name, form.level, form.field, form.city,
    form.gpa, form.phone,
    form.languages.length > 0 ? "ok" : "",
    form.skills.length > 0    ? "ok" : "",
  ];
  const completeness = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  function toggleLang(code: string) {
    setForm(f => ({
      ...f,
      languages: f.languages.includes(code)
        ? f.languages.filter(l => l !== code)
        : [...f.languages, code],
    }));
  }

  function addSkill() {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) setForm(f => ({ ...f, skills: [...f.skills, s] }));
    setSkillInput("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put("/users/me", {
        ...form,
        gpa: form.gpa ? parseFloat(form.gpa) : null,
      });
      setUser(res.data);
      success("Profil mis à jour ! Tes recommandations sont recalculées.");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toastError(msg ?? "Erreur lors de la mise à jour.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 lg:px-6 py-5 max-w-4xl">

      {/* Header */}
      <div className="mb-5">
        <h2 className="text-2xl font-black text-gray-900">Mon profil</h2>
        <p className="text-sm text-gray-400 mt-1">
          Un profil complet améliore ton score de recommandation de 40%.
        </p>
      </div>

      {/* Barre de complétude — pleine largeur */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-5 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-emerald-800">Profil complété</span>
          <span className={`text-2xl font-black ${completeness === 100 ? "text-emerald-600" : "text-amber-500"}`}>
            {completeness}%
          </span>
        </div>
        <div className="bg-white/70 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              completeness === 100
                ? "bg-gradient-to-r from-emerald-400 to-teal-400"
                : "bg-gradient-to-r from-amber-400 to-yellow-300"
            }`}
            style={{ width: `${completeness}%` }}
          />
        </div>
        {completeness < 100 && (
          <p className="text-xs text-emerald-700 mt-2 font-medium">
            ✦ Complète tous les champs pour maximiser tes recommandations
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Grille 2 colonnes desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

          {/* Colonne gauche */}
          <div className="space-y-4">

            {/* Nom */}
            <div className={CARD}>
              <label className={LABEL}>Nom complet</label>
              <input type="text" value={form.full_name} className={INPUT}
                onChange={e => setForm({ ...form, full_name: e.target.value })}
                placeholder="Jean Dupont" />
            </div>

            {/* Niveau + Filière */}
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

            {/* Ville + GPA */}
            <div className={CARD}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Ville</label>
                  <input type="text" value={form.city} className={INPUT}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    placeholder="Yaoundé" />
                </div>
                <div>
                  <label className={LABEL}>Moyenne / 20</label>
                  <input type="number" min="0" max="20" step="0.01"
                    value={form.gpa} className={INPUT}
                    onChange={e => setForm({ ...form, gpa: e.target.value })}
                    placeholder="14.5" />
                </div>
              </div>
            </div>

            {/* Téléphone */}
            <div className={CARD}>
              <label className={LABEL}>Téléphone (alertes SMS)</label>
              <input type="tel" value={form.phone} className={INPUT}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+237 6XX XXX XXX" />
            </div>

            {/* Email lecture seule */}
            <div className={`${CARD} opacity-60`}>
              <label className={LABEL}>Email (non modifiable)</label>
              <input type="email" value={user?.email ?? ""} disabled
                className={`${INPUT} cursor-not-allowed bg-gray-50`} />
            </div>

          </div>

          {/* Colonne droite */}
          <div className="space-y-4">

            {/* Langues */}
            <div className={CARD}>
              <label className={LABEL}>Langues parlées</label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(({ code, label, flag }) => (
                  <button key={code} type="button" onClick={() => toggleLang(code)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${
                      form.languages.includes(code)
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-emerald-300"
                    }`}>
                    <span>{flag}</span>{label}
                  </button>
                ))}
              </div>
            </div>

            {/* Compétences */}
            <div className={CARD}>
              <label className={LABEL}>Compétences techniques</label>
              <div className="flex gap-2 mb-3">
                <input type="text" value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  placeholder="Ex: Python, Excel, Figma..."
                  className={`${INPUT} flex-1`} />
                <button type="button" onClick={addSkill}
                  className="px-4 py-2.5 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-200 transition shrink-0">
                  + Ajouter
                </button>
              </div>
              {form.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {form.skills.map(skill => (
                    <span key={skill}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                      {skill}
                      <button type="button"
                        onClick={() => setForm(f => ({ ...f, skills: f.skills.filter(s => s !== skill) }))}
                        className="text-gray-400 hover:text-red-500 transition font-bold">×</button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">Aucune compétence — elles servent au matching !</p>
              )}
            </div>

            {/* Carte conseil */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
              <p className="text-sm font-bold text-amber-800 mb-2">💡 Pourquoi remplir son profil ?</p>
              <ul className="space-y-1.5">
                {[
                  "Ton feed est trié par pertinence — le profil détermine l'ordre",
                  "Le score de préparation vérifie ton éligibilité en temps réel",
                  "La lettre IA utilise ton profil pour se personnaliser",
                  "Les alertes SMS sont envoyées sur les opport. qui te matchent",
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-amber-700">
                    <span className="text-amber-500 shrink-0 font-bold mt-0.5">→</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>

        {/* Bouton submit — pleine largeur */}
        <button type="submit" disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600
                     disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all text-sm
                     shadow-lg shadow-emerald-100">
          {loading ? "Enregistrement..." : "Sauvegarder mon profil"}
        </button>
      </form>
    </div>
  );
}
