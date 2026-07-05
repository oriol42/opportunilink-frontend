// components/ui/EmptyState.tsx
// Illustrations SVG dessinées à la main (pas de génération IA) pour les
// écrans vides — remplace les icônes plates par quelque chose de plus
// chaleureux, cohérent avec la charte (émeraude + Fraunces).
"use client";
import Link from "next/link";
import { ReactNode } from "react";

type Variant = "feed" | "saved" | "applications" | "documents" | "search";

function Illustration({ variant }: { variant: Variant }) {
  const common = { width: 148, height: 120, viewBox: "0 0 148 120" };

  if (variant === "saved") {
    return (
      <svg {...common} fill="none">
        <ellipse cx="74" cy="106" rx="46" ry="7" fill="var(--bg-surface-2)" />
        <g transform="rotate(-6 60 55)">
          <rect x="30" y="20" width="68" height="86" rx="10" fill="var(--bg-card)" stroke="var(--border)" strokeWidth="2" />
          <rect x="42" y="34" width="44" height="6" rx="3" fill="var(--border)" />
          <rect x="42" y="46" width="30" height="6" rx="3" fill="var(--border-subtle)" />
        </g>
        <path d="M92 28 L112 28 L112 62 L102 52 L92 62 Z" fill="var(--accent)" opacity="0.9" />
      </svg>
    );
  }

  if (variant === "applications") {
    return (
      <svg {...common} fill="none">
        <ellipse cx="74" cy="106" rx="46" ry="7" fill="var(--bg-surface-2)" />
        <rect x="40" y="18" width="68" height="88" rx="10" fill="var(--bg-card)" stroke="var(--border)" strokeWidth="2" />
        <rect x="58" y="12" width="32" height="14" rx="4" fill="var(--accent)" />
        <rect x="52" y="42" width="44" height="5" rx="2.5" fill="var(--border)" />
        <rect x="52" y="54" width="30" height="5" rx="2.5" fill="var(--border-subtle)" />
        <circle cx="74" cy="80" r="15" fill="none" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4" />
        <path d="M67 80 L72 85 L82 74" stroke="var(--accent)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (variant === "documents") {
    return (
      <svg {...common} fill="none">
        <ellipse cx="74" cy="102" rx="48" ry="7" fill="var(--bg-surface-2)" />
        <path d="M28 48 L28 88 Q28 94 34 94 L114 94 Q120 94 120 88 L120 58 Q120 52 114 52 L78 52 L70 42 L34 42 Q28 42 28 48 Z"
          fill="var(--bg-card)" stroke="var(--border)" strokeWidth="2" />
        <path d="M36 60 L112 60 L104 88 L44 88 Z" fill="var(--bg-surface-2)" stroke="var(--border-subtle)" strokeWidth="1.5" />
        <circle cx="100" cy="30" r="14" fill="var(--accent)" opacity="0.15" />
        <path d="M94 30 L98 34 L106 24" stroke="var(--accent)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (variant === "search") {
    return (
      <svg {...common} fill="none">
        <ellipse cx="74" cy="100" rx="40" ry="6" fill="var(--bg-surface-2)" />
        <circle cx="66" cy="56" r="30" fill="var(--bg-card)" stroke="var(--border)" strokeWidth="3" />
        <path d="M87 78 L106 96" stroke="var(--border)" strokeWidth="6" strokeLinecap="round" />
        <text x="66" y="65" textAnchor="middle" fontSize="26" fontWeight="600" fill="var(--text-muted)" fontFamily="var(--font-voice)">?</text>
      </svg>
    );
  }

  return (
    <svg {...common} fill="none">
      <ellipse cx="74" cy="102" rx="46" ry="7" fill="var(--bg-surface-2)" />
      <rect x="26" y="34" width="96" height="18" rx="9" fill="var(--bg-surface-2)" />
      <rect x="26" y="60" width="70" height="18" rx="9" fill="var(--bg-surface-2)" />
      <circle cx="108" cy="69" r="9" fill="var(--accent)" opacity="0.9" />
      <path d="M108 63 L110 68 L115 69 L110 70 L108 75 L106 70 L101 69 L106 68 Z" fill="#fff" />
    </svg>
  );
}

const COPY: Record<Variant, { title: string; subtitle: string }> = {
  feed:         { title: "Aucune opportunité pour l'instant", subtitle: "Essaie un autre onglet ou reviens plus tard — le feed se met à jour en continu." },
  saved:        { title: "Aucun favori",                       subtitle: "Sauvegarde des opportunités depuis le feed pour les retrouver ici." },
  applications: { title: "Aucune candidature",                 subtitle: "Explore le feed et postule à une opportunité qui te correspond." },
  documents:    { title: "Coffre-fort vide",                   subtitle: "Commence par uploader ton CV — c'est le document le plus important." },
  search:       { title: "Aucun résultat",                     subtitle: "Essaie d'autres mots-clés ou élargis ta recherche." },
};

interface EmptyStateProps {
  variant: Variant;
  title?: string;
  subtitle?: string;
  action?: { label: string; href: string };
  children?: ReactNode;
}

export default function EmptyState({ variant, title, subtitle, action, children }: EmptyStateProps) {
  const copy = COPY[variant];
  return (
    <div style={{ textAlign: "center", padding: "48px 20px" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
        <Illustration variant={variant} />
      </div>
      <p style={{ fontFamily: "var(--font-voice)", fontWeight: 500, fontSize: 17, color: "var(--text-primary)", marginBottom: 6 }}>
        {title ?? copy.title}
      </p>
      <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 320, margin: "0 auto 20px", lineHeight: 1.6 }}>
        {subtitle ?? copy.subtitle}
      </p>
      {action && (
        <Link href={action.href} style={{
          display: "inline-block", background: "var(--accent)", color: "#fff", fontWeight: 700,
          fontSize: 13, padding: "10px 22px", borderRadius: 12, textDecoration: "none",
        }}>{action.label} →</Link>
      )}
      {children}
    </div>
  );
}
