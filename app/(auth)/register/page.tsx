"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, User, LoaderCircle } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { clearStaleLocalCaches } from "@/lib/auth";

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

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
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
      clearStaleLocalCaches();
      localStorage.setItem("access_token", loginData.access_token);
      router.push("/onboarding");
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell eyebrow="30 secondes" title="Créer mon compte" subtitle="Sans carte bancaire, accès immédiat.">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={label}>Nom complet</label>
          <div style={inputWrap}>
            <User size={16} style={iconLeft} />
            <input
              type="text" value={form.full_name} autoFocus
              onChange={e => update("full_name", e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={inputStyle}
              placeholder="Jean Dupont"
            />
          </div>
        </div>

        <div>
          <label style={label}>Email</label>
          <div style={inputWrap}>
            <Mail size={16} style={iconLeft} />
            <input
              type="email" value={form.email}
              onChange={e => update("email", e.target.value)}
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
              onChange={e => update("password", e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={{ ...inputStyle, paddingRight: 40 }}
              placeholder="8 caractères minimum"
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
          {loading ? <><LoaderCircle size={16} className="spin" /> Création...</> : "Créer mon compte →"}
        </button>
      </div>

      <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", marginTop: 24 }}>
        Déjà un compte ?{" "}
        <Link href="/login" style={{ color: "var(--accent-dark)", fontWeight: 600, textDecoration: "none" }}>
          Se connecter
        </Link>
      </p>
    </AuthShell>
  );
}
