// components/auth/AuthShell.tsx
"use client";
import Link from "next/link";
import { ReactNode } from "react";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function AuthShell({ eyebrow, title, subtitle, children }: AuthShellProps) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--bg-base)" }}>
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
        }}
      >
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
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
            OpportuLink
          </span>
        </Link>

        <div>
          <p
            style={{
              fontFamily: "var(--font-voice)", fontStyle: "italic", fontWeight: 500,
              fontSize: 28, lineHeight: 1.3, margin: "0 0 16px", maxWidth: 380,
            }}
          >
            Le bon dossier, déposé au bon moment, change une trajectoire.
          </p>
          <p style={{ fontSize: 14, opacity: 0.7, maxWidth: 360, lineHeight: 1.6, margin: 0 }}>
            Bourses, stages, emplois et concours vérifiés, classés selon ton profil — sans
            passer des heures sur WhatsApp et Facebook.
          </p>
        </div>

        <p style={{ fontSize: 12, opacity: 0.55, margin: 0 }}>
          Bourses · Stages · Emplois · Échanges · Concours
        </p>
      </div>

      <div
        className="auth-form-panel"
        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}
      >
        <div style={{ width: "100%", maxWidth: 380 }}>
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
