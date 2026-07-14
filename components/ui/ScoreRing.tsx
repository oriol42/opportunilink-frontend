// components/ui/ScoreRing.tsx
"use client";
import { useAnimatedValue } from "@/lib/useAnimatedValue";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

function colorForScore(score: number): string {
  if (score >= 70) return "var(--accent)";
  if (score >= 40) return "var(--text-warning)";
  return "var(--text-muted)";
}

export default function ScoreRing({ score, size = 48, strokeWidth = 3.5, showLabel = true }: ScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const { display, increased } = useAnimatedValue(clamped);
  const shown = Math.round(display);
  const color = colorForScore(shown);
  const inner = size - strokeWidth * 2;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: `conic-gradient(${color} ${display}%, var(--bg-surface-2) 0)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        filter: increased
          ? "drop-shadow(0 0 6px rgba(16,185,129,0.55)) drop-shadow(0 1px 2px rgba(0,0,0,0.08))"
          : "drop-shadow(0 1px 2px rgba(0,0,0,0.08))",
        transition: "filter .4s ease",
      }}
      role="img"
      aria-label={`Score : ${shown} sur 100`}
    >
      <div
        style={{
          width: inner,
          height: inner,
          borderRadius: "50%",
          background: "var(--bg-card)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {showLabel && (
          <span style={{ fontSize: size * 0.27, fontWeight: 500, color: "var(--text-primary)" }}>
            {shown}%
          </span>
        )}
      </div>
    </div>
  );
}
