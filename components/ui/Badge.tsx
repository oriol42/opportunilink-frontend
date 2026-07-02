// components/ui/Badge.tsx
import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

type BadgeVariant = "success" | "warning" | "danger" | "urgent" | "neutral";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  icon?: LucideIcon;
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  success: { bg: "var(--bg-success)", text: "var(--text-success)", border: "var(--border-success)" },
  warning: { bg: "var(--bg-warning)", text: "var(--text-warning)", border: "var(--border-warning)" },
  danger:  { bg: "var(--bg-danger)",  text: "var(--text-danger)",  border: "var(--border-danger)" },
  urgent:  { bg: "var(--bg-urgent)",  text: "var(--text-urgent)",  border: "var(--border-urgent)" },
  neutral: { bg: "var(--bg-surface-2)", text: "var(--text-secondary)", border: "var(--border)" },
};

export default function Badge({ children, variant = "neutral", icon: Icon }: BadgeProps) {
  const s = VARIANT_STYLES[variant];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 9px",
        borderRadius: 20,
        background: s.bg,
        color: s.text,
        border: `1px solid ${s.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {Icon && <Icon size={12} strokeWidth={2.5} />}
      {children}
    </span>
  );
}

export function ReliabilityBadge({ score }: { score: number }) {
  if (score >= 70) return <Badge variant="success">Fiable</Badge>;
  if (score >= 40) return <Badge variant="warning">À vérifier</Badge>;
  return <Badge variant="danger">Risque élevé</Badge>;
}
