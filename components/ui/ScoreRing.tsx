// components/ui/ScoreRing.tsx
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
  const color = colorForScore(clamped);
  const inner = size - strokeWidth * 2;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: `conic-gradient(${color} ${clamped}%, var(--bg-surface-2) 0)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.08))",
      }}
      role="img"
      aria-label={`Score : ${clamped} sur 100`}
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
            {clamped}%
          </span>
        )}
      </div>
    </div>
  );
}
