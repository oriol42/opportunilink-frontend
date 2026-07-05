// components/auth/AuthShell.tsx
"use client";
import Link from "next/link";
import { ReactNode } from "react";
import { ShieldCheck, Sparkles, BellRing } from "lucide-react";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}

const FEATURES = [
  { icon: ShieldCheck, label: "Opportunités vérifiées", desc: "Fini les arnaques et les liens morts" },
  { icon: Sparkles,    label: "Classées par l'IA",       desc: "Selon ton profil et tes objectifs" },
  { icon: BellRing,    label: "Alertes deadlines",       desc: "Ne rate plus jamais une date limite" },
];

export default function AuthShell({ eyebrow, title, subtitle, children }: AuthShellProps) {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", background: "var(--bg-base)" }}>
      <div
        className="auth-brand-panel"
        style={{
          flex: "0 0 42%",
          background: "var(--bg-hero)",
          padding: "48px 48px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Effet décoratif */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320,
          background: "radial-gradient(circle, rgba(16,185,129,.18) 0%, transparent 70%)", pointerEvents: "none" }} />

        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
          <div
            style={{
              width: 34, height: 34, borderRadius: 10,
              background: "rgba(255,255,255,0.15)", display: "flex",
              alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-voice)", fontWeight: 600, fontSize: 16,
            }}
          >
            O
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-.2px", color: "#fff" }}>
            OpportuniLink
          </span>
        </Link>

        <div style={{ position: "relative" }}>
          <p
            style={{
              fontFamily: "var(--font-voice)", fontStyle: "italic", fontWeight: 500,
              fontSize: 28, lineHeight: 1.3, margin: "0 0 24px", maxWidth: 380,
            }}
          >
            Le bon dossier, déposé au bon moment, change une trajectoire.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {FEATURES.map(f => (
              <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                  background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.14)",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <f.icon size={18} color="#6ee7b7" />
                </div>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", margin: 0 }}>{f.label}</p>
                  <p style={{ fontSize: 12, opacity: 0.65, margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 12, opacity: 0.55, margin: 0, position: "relative" }}>
          Bourses · Stages · Emplois · Échanges · Concours
        </p>
      </div>

      <div
        className="auth-form-panel"
        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}
      >
        <div className="animate-fade-up-soft" style={{ width: "100%", maxWidth: 380 }}>
          <p
            style={{
              fontSize: 12, fontWeight: 600, color: "var(--accent-dark)",
              textTransform: "uppercase", letterSpacing: ".06em", margin: "0 0 6px",
            }}
          >
            {eyebrow}
          </p>
          <h1 style={{ fontFamily: "var(--font-voice)", fontSize: 26, fontWeight: 500, color: "var(--text-primary)", margin: "0 0 6px" }}>
            {title}
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 28 }}>{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
