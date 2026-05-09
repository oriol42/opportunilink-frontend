"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";

const LEVELS = ["Licence", "Master", "Doctorat", "BTS", "DUT", "Ingénieur"];
const FIELDS = ["Informatique", "Droit", "Médecine", "Économie", "Gestion", "Lettres", "Sciences", "Ingénierie", "Pharmacie", "Architecture"];
const LANGUAGES = ["fr", "en", "de", "es", "zh", "ar", "pt"];
const LANGUAGE_LABELS: Record<string, string> = { fr: "Français", en: "Anglais", de: "Allemand", es: "Espagnol", zh: "Chinois", ar: "Arabe", pt: "Portugais" };

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser } = useStore();

  const [form, setForm] = useState({
    full_name: user?.full_name ?? "",
    level: user?.level ?? "",
    field: user?.field ?? "",
    city: user?.city ?? "",
    gpa: user?.gpa?.toString() ?? "",
    phone: user?.phone ?? "",
    languages: user?.languages ?? [],
    skills: user?.skills ?? [],
  });

  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Calcul completeness
  const fields = [form.full_name, form.level, form.field, form.city, form.gpa, form.phone];
  const filled = fields.filter(Boolean).length + (form.languages.length > 0 ? 1 : 0) + (form.skills.length > 0 ? 1 : 0);
  const total = fields.length + 2;
  const completeness = Math.round((filled / total) * 100);

  function toggleLanguage(lang: string) {
    setForm((f) => ({
      ...f,
      languages: f.languages.includes(lang) ? f.languages.filter((l) => l !== lang) : [...f.languages, lang],
    }));
  }

  function addSkill() {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) setForm((f) => ({ ...f, skills: [...f.skills, s] }));
    setSkillInput("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const res = await api.put("/users/me", { ...form, gpa: form.gpa ? parseFloat(form.gpa) : null });
      setUser(res.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Erreur lors de la mise à jour.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-5">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Mon profil</h2>
        <p className="text-sm text-gray-400 mt-0.5">Plus ton profil est complet, meilleures sont tes recommandations.</p>
      </div>

      {/* Completeness bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Profil complété</span>
          <span className={`text-sm font-black ${completeness === 100 ? "text-emerald-500" : "text-amber-500"}`}>
            {completeness}%
          </span>
        </div>
        <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${completeness === 100 ? "bg-emerald-500" : "bg-amber-400"}`}
            style={{ width: `${completeness}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nom */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nom complet</label>
          <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm" />
        </div>

        {/* Niveau + Filière */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Niveau</label>
              <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}
                className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white text-sm">
                <option value="">Choisir</option>
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Filière</label>
              <select value={form.field} onChange={(e) => setForm({ ...form, field: e.target.value })}
                className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white text-sm">
                <option value="">Choisir</option>
                {FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Ville + GPA */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ville</label>
              <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Yaoundé" className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Moyenne / 20</label>
              <input type="number" min="0" max="20" step="0.01" value={form.gpa} onChange={(e) => setForm({ ...form, gpa: e.target.value })}
                placeholder="14.5" className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm" />
            </div>
          </div>
        </div>

        {/* Téléphone */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Téléphone</label>
          <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+237 6XX XXX XXX" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm" />
        </div>

        {/* Langues */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Langues parlées</label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <button key={lang} type="button" onClick={() => toggleLanguage(lang)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition ${form.languages.includes(lang) ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300"}`}>
                {LANGUAGE_LABELS[lang]}
              </button>
            ))}
          </div>
        </div>

        {/* Compétences */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Compétences</label>
          <div className="flex gap-2 mb-3">
            <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              placeholder="Ex: Python, Excel, Photoshop..."
              className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm" />
            <button type="button" onClick={addSkill}
              className="px-4 py-2.5 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-200 transition">
              Ajouter
            </button>
          </div>
          {form.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.skills.map((skill) => (
                <span key={skill} className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {skill}
                  <button type="button" onClick={() => setForm((f) => ({ ...f, skills: f.skills.filter((s) => s !== skill) }))}
                    className="text-gray-400 hover:text-red-500 ml-1 transition">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100">{error}</div>}
        {success && <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl text-sm border border-emerald-100 font-medium">✓ Profil mis à jour avec succès !</div>}

        <button type="submit" disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-colors text-sm">
          {loading ? "Enregistrement..." : "Sauvegarder le profil"}
        </button>
      </form>
    </div>
  );
}
