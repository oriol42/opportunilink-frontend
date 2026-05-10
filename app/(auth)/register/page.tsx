"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "" });

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  async function handleSubmit() {
    if (!form.full_name.trim() || !form.email.trim() || form.password.length < 8) {
      setError("Remplis tous les champs. Mot de passe : 8 caractères minimum.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const regRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const regData = await regRes.json();
      if (!regRes.ok) {
        const msg = Array.isArray(regData.detail)
          ? regData.detail.map((d: { msg: string }) => d.msg).join(", ")
          : regData.detail || "Erreur lors de l'inscription";
        setError(msg);
        return;
      }
      const loginRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok) { router.push("/login"); return; }
      localStorage.setItem("access_token", loginData.access_token);
      router.push("/dashboard");
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">

      {/* Halo */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
                      w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <span className="font-syne font-black text-emerald-400 text-3xl tracking-tight cursor-pointer">
              OpportuLink
            </span>
          </Link>
          <p className="text-gray-500 mt-2 text-sm">Ton avenir commence ici 🚀</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-1">Créer mon compte</h2>
          <p className="text-gray-500 text-sm mb-6">Gratuit. Complète ton profil après.</p>

          <div className="space-y-4">

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Nom complet
              </label>
              <input type="text" value={form.full_name} autoFocus
                onChange={e => update("full_name", e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl
                           text-white placeholder-gray-600 text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                placeholder="Jean Dupont" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Email
              </label>
              <input type="email" value={form.email}
                onChange={e => update("email", e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl
                           text-white placeholder-gray-600 text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                placeholder="ton.email@exemple.com" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={form.password}
                  onChange={e => update("password", e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl
                             text-white placeholder-gray-600 text-sm pr-12
                             focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  placeholder="8 caractères minimum" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-lg transition">
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50
                         text-white font-bold py-3.5 rounded-xl transition-colors text-sm mt-2
                         shadow-lg shadow-emerald-500/20">
              {loading ? "Création du compte..." : "Créer mon compte gratuitement →"}
            </button>
          </div>

          <p className="text-center text-gray-600 text-sm mt-6">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-emerald-400 font-semibold hover:text-emerald-300 transition">
              Se connecter
            </Link>
          </p>
        </div>

        <p className="text-center text-gray-700 text-xs mt-6">
          Bourses · Stages · Emplois · Échanges
        </p>
      </div>
    </div>
  );
}
