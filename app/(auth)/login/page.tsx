"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/auth";
import { useStore } from "@/store/useStore";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useStore();
  const [form, setForm]             = useState({ email: "", password: "" });
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit() {
    if (!form.email || !form.password) { setError("Remplis tous les champs."); return; }
    setLoading(true);
    setError("");
    try {
      const user = await login(form);
      setUser(user);
      router.push("/dashboard");
    } catch {
      setError("Email ou mot de passe incorrect.");
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
            <span className="font-display font-black text-emerald-400 text-3xl tracking-tight cursor-pointer">
              OpportuLink
            </span>
          </Link>
          <p className="text-gray-500 mt-2 text-sm">Content de te revoir 👋</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-1">Connexion</h2>
          <p className="text-gray-500 text-sm mb-6">Accède à ton feed personnalisé.</p>

          <div className="space-y-4">

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Email
              </label>
              <input type="email" value={form.email} autoFocus
                onChange={e => setForm({ ...form, email: e.target.value })}
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
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl
                             text-white placeholder-gray-600 text-sm pr-12
                             focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  placeholder="Ton mot de passe" />
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
              {loading ? "Connexion en cours..." : "Se connecter →"}
            </button>
          </div>

          <p className="text-center text-gray-600 text-sm mt-6">
            Pas encore de compte ?{" "}
            <Link href="/register" className="text-emerald-400 font-semibold hover:text-emerald-300 transition">
              S'inscrire gratuitement
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
