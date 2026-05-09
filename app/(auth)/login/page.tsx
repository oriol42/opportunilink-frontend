"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/auth";
import { useStore } from "@/store/useStore";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useStore();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white tracking-tight">OpportuLink</h1>
          <p className="text-emerald-100 mt-2 text-sm">Content de te revoir 👋</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Connexion</h2>
          <p className="text-gray-400 text-sm mb-6">Entre tes identifiants pour accéder au feed.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
              <input type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
                placeholder="ton.email@exemple.com" autoFocus />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Mot de passe</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm pr-12"
                  placeholder="Ton mot de passe" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg">
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {error && <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>}

            <button onClick={handleSubmit} disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors text-sm mt-2">
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </div>

          <p className="text-center text-gray-400 text-sm mt-6">
            Pas encore de compte ?{" "}
            <Link href="/register" className="text-emerald-600 font-semibold hover:underline">S'inscrire gratuitement</Link>
          </p>
        </div>

        <p className="text-center text-emerald-100 text-xs mt-6 opacity-70">
          Bourses · Stages · Emplois · Échanges
        </p>
      </div>
    </div>
  );
}
