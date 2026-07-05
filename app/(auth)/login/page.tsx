"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, LoaderCircle } from "lucide-react";
import { login } from "@/lib/auth";
import { useStore } from "@/store/useStore";
import AuthShell from "@/components/auth/AuthShell";

const inputWrap: React.CSSProperties = { position: "relative" };
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px 12px 40px", borderRadius: 12,
  border: "1px solid var(--border)", background: "var(--bg-input)",
  color: "var(--text-primary)", fontSize: 14, outline: "none",
  boxSizing: "border-box",
};
const iconLeft: React.CSSProperties = {
  position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
  color: "var(--text-muted)",
};
const label: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)",
  marginBottom: 6,
};

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useStore();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
    <AuthShell eyebrow="Bon retour" title="Connexion" subtitle="Accède à ton tableau de bord personnalisé.">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={label}>Email</label>
          <div style={inputWrap}>
            <Mail size={16} style={iconLeft} />
            <input
              type="email" value={form.email} autoFocus
              onChange={e => setForm({ ...form, email: e.target.value })}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={inputStyle}
              placeholder="ton.email@exemple.com"
            />
          </div>
        </div>

        <div>
          <label style={label}>Mot de passe</label>
          <div style={inputWrap}>
            <Lock size={16} style={iconLeft} />
            <input
              type={showPassword ? "text" : "password"} value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={{ ...inputStyle, paddingRight: 40 }}
              placeholder="Ton mot de passe"
            />
            <button
              type="button" onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: "var(--bg-danger)", border: "1px solid var(--border-danger)", color: "var(--text-danger)", padding: "10px 14px", borderRadius: 10, fontSize: 13 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit} disabled={loading}
          style={{
            width: "100%", padding: "13px", borderRadius: 12, border: "none",
            background: loading ? "var(--accent-light)" : "var(--accent)",
            color: "#fff", fontWeight: 600, fontSize: 14,
            cursor: loading ? "not-allowed" : "pointer", marginTop: 4,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "background .15s, transform .1s",
          }}
        >
          {loading ? <><LoaderCircle size={16} className="spin" /> Connexion...</> : "Se connecter →"}
        </button>
      </div>

      <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", marginTop: 24 }}>
        Pas encore de compte ?{" "}
        <Link href="/register" style={{ color: "var(--accent-dark)", fontWeight: 600, textDecoration: "none" }}>
          S'inscrire
        </Link>
      </p>
    </AuthShell>
  );
}
