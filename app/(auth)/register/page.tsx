"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const LEVELS = ["BTS", "Licence", "Master", "Doctorat", "Ingénieur"];
const FIELDS = [
  "Informatique", "Droit", "Médecine", "Économie", "Lettres",
  "Sciences", "Génie Civil", "Agronomie", "Journalisme", "Autre",
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    level: "",
    field: "",
    city: "",
    gpa: "",
    phone: "",
    languages: [] as string[],
  });

  const updateForm = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleLanguage = (lang: string) => {
    setForm((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      // Étape 1 — Créer le compte
      const regRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            gpa: form.gpa ? parseFloat(form.gpa) : null,
          }),
        }
      );

      const regData = await regRes.json();

      if (!regRes.ok) {
        const msg = Array.isArray(regData.detail)
          ? regData.detail.map((d: any) => d.msg).join(", ")
          : regData.detail || "Erreur lors de l'inscription";
        setError(msg);
        return;
      }

      // Étape 2 — Connexion automatique (JSON comme le backend l'attend)
      const loginRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, password: form.password }),
        }
      );

      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        // Register ok mais login raté → redirige vers login
        router.push("/login");
        return;
      }

      localStorage.setItem("access_token", loginData.access_token);
      router.push("/dashboard");
    } catch (err) {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-emerald-600">OpportuLink</h1>
          <p className="text-gray-500 mt-1">
            {step === 1 ? "Crée ton compte" : "Complète ton profil"}
          </p>
          <div className="flex gap-2 justify-center mt-4">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-2 w-16 rounded-full transition-colors ${
                  s <= step ? "bg-emerald-500" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => updateForm("full_name", e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Jean Dupont"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="ton.email@exemple.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => updateForm("password", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 pr-12"
                  placeholder="8 caractères minimum"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>
            )}

            <button
              onClick={() => {
                if (!form.full_name || !form.email || form.password.length < 8) {
                  setError("Remplis tous les champs (mot de passe : 8 caractères min).");
                  return;
                }
                setError("");
                setStep(2);
              }}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition"
            >
              Continuer →
            </button>

            <p className="text-center text-gray-500 text-sm">
              Déjà un compte ?{" "}
              <Link href="/login" className="text-emerald-600 font-semibold hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
                <select
                  value={form.level}
                  onChange={(e) => updateForm("level", e.target.value)}
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="">Choisir</option>
                  {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => updateForm("city", e.target.value)}
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="Yaoundé"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filière</label>
              <select
                value={form.field}
                onChange={(e) => updateForm("field", e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="">Choisir ta filière</option>
                {FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Moyenne /20</label>
                <input
                  type="number"
                  min="0" max="20" step="0.1"
                  value={form.gpa}
                  onChange={(e) => updateForm("gpa", e.target.value)}
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="14.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateForm("phone", e.target.value)}
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="+237 6XX XXX XXX"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Langues parlées</label>
              <div className="flex gap-2 flex-wrap">
                {["fr", "en", "de", "es", "zh", "ar"].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                      form.languages.includes(lang)
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : "border-gray-200 text-gray-600 hover:border-emerald-300"
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition"
              >
                ← Retour
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-grow bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition"
              >
                {loading ? "Création..." : "Créer mon compte 🚀"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
