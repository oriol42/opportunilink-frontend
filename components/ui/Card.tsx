// components/ui/Card.tsx
import { CSSProperties, ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  accentColor?: string;
  hoverable?: boolean;
  style?: CSSProperties;
  onClick?: () => void;
}

export default function Card({ children, accentColor, hoverable = false, style, onClick }: CardProps) {
  return (
    <div
      className={hoverable ? "opp-hover" : undefined}
      onClick={onClick}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderLeft: accentColor ? `3px solid ${accentColor}` : "1px solid var(--border)",
        borderRadius: 12,
        padding: "16px 18px",
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
