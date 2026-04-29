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

  function toggleLanguage(lang: string) {
    setForm((f) => ({
      ...f,
      languages: f.languages.includes(lang)
        ? f.languages.filter((l) => l !== lang)
        : [...f.languages, lang],
    }));
  }

  function addSkill() {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) {
      setForm((f) => ({ ...f, skills: [...f.skills, s] }));
    }
    setSkillInput("");
  }

  function removeSkill(skill: string) {
    setForm((f) => ({ ...f, skills: f.skills.filter((s) => s !== skill) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const payload = {
        ...form,
        gpa: form.gpa ? parseFloat(form.gpa) : null,
      };
      const res = await api.put("/users/me", payload);
      setUser(res.data);
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Erreur lors de la mise à jour.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold text-emerald-600">OpportuLink</h1>
        <button onClick={() => router.push("/dashboard")} className="text-sm text-gray-500 hover:text-gray-700">
          ← Retour au feed
        </button>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Mon profil</h2>
        <p className="text-gray-500 text-sm mb-6">
          Plus ton profil est complet, plus tes recommandations sont précises.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nom complet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {/* Niveau + Filière */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Niveau d'études</label>
              <select
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
              >
                <option value="">-- Choisir --</option>
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filière</label>
              <select
                value={form.field}
                onChange={(e) => setForm({ ...form, field: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
              >
                <option value="">-- Choisir --</option>
                {FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {/* Ville + GPA */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Yaoundé"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Moyenne / 20</label>
              <input
                type="number"
                min="0"
                max="20"
                step="0.01"
                value={form.gpa}
                onChange={(e) => setForm({ ...form, gpa: e.target.value })}
                placeholder="14.5"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone (pour alertes SMS)</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+237 6XX XXX XXX"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {/* Langues */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Langues parlées</label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                    form.languages.includes(lang)
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300"
                  }`}
                >
                  {LANGUAGE_LABELS[lang]}
                </button>
              ))}
            </div>
          </div>

          {/* Compétences */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Compétences</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                placeholder="Ex: Python, Excel, Photoshop..."
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-4 py-2.5 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-200 transition"
              >
                Ajouter
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.skills.map((skill) => (
                <span key={skill} className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} className="text-gray-400 hover:text-red-500 ml-1">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Feedback */}
          {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>}
          {success && <div className="bg-emerald-50 text-emerald-600 px-4 py-3 rounded-xl text-sm">✓ Profil mis à jour ! Redirection...</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition"
          >
            {loading ? "Enregistrement..." : "Sauvegarder le profil"}
          </button>
        </form>
      </main>
    </div>
  );
}
