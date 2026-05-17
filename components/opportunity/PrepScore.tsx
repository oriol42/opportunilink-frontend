"use client";

interface CheckItem {
  label: string;
  fix: string;
  ok: boolean;
  category?: string;
}

interface PrepScoreData {
  score: number;
  message: string;
  missing: CheckItem[];
  checks?: CheckItem[];
  ok_count?: number;
  total_checks?: number;
}

interface PrepScoreProps {
  data: PrepScoreData;
  compact?: boolean;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string; border: string }> = {
  academic: { label: "Académique", icon: "🎓", color: "#7c3aed", bg: "#f3e8ff", border: "#ddd6fe" },
  document: { label: "Documents",  icon: "📁", color: "#2563eb", bg: "#dbeafe", border: "#bfdbfe" },
  profile:  { label: "Profil",     icon: "👤", color: "#059669", bg: "#d1fae5", border: "#a7f3d0" },
};

function getScoreTheme(score: number) {
  if (score >= 80) return { color: "#10b981", bg: "#f0fdf4", border: "#bbf7d0", label: "Excellent", emoji: "🎉" };
  if (score >= 60) return { color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", label: "Bon",       emoji: "⚡" };
  if (score >= 40) return { color: "#f97316", bg: "#fff7ed", border: "#fed7aa", label: "Moyen",     emoji: "⚠️" };
  return             { color: "#ef4444", bg: "#fef2f2", border: "#fecaca", label: "Incomplet",  emoji: "❌" };
}

export default function PrepScore({ data, compact = false }: PrepScoreProps) {
  const theme = getScoreTheme(data.score);
  const checks = data.checks ?? [];
  const okCount = data.ok_count ?? (checks.filter(c => c.ok).length);
  const total   = data.total_checks ?? (checks.length || 8);

  // SVG ring
  const size = compact ? 72 : 96;
  const r    = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (data.score / 100) * circ;

  // Grouper les checks par catégorie
  const byCategory: Record<string, CheckItem[]> = {};
  checks.forEach(c => {
    const cat = c.category ?? "profile";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(c);
  });
  const hasCategories = Object.keys(byCategory).length > 0;

  return (
    <div style={{
      background: theme.bg,
      border: `1.5px solid ${theme.border}`,
      borderRadius: compact ? 14 : 18,
      overflow: "hidden",
    }}>

      {/* ── Header : ring + score + message ── */}
      <div style={{ padding: compact ? "16px" : "20px", display: "flex", gap: 16, alignItems: "center" }}>

        {/* Ring SVG animé */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            {/* Track */}
            <circle cx={size/2} cy={size/2} r={r}
              fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={9} />
            {/* Progress */}
            <circle cx={size/2} cy={size/2} r={r}
              fill="none" stroke={theme.color} strokeWidth={9}
              strokeDasharray={`${dash} ${circ}`}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray .8s cubic-bezier(.4,0,.2,1)" }} />
          </svg>
          {/* Texte centré */}
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: compact ? 20 : 26, fontWeight: 900, color: theme.color, lineHeight: 1 }}>
              {data.score}
            </span>
            <span style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", marginTop: 2 }}>/ 100</span>
          </div>
        </div>

        {/* Info droite */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: compact ? 14 : 16 }}>{theme.emoji}</span>
            <span style={{ fontSize: compact ? 14 : 15, fontWeight: 900, color: "#0f172a" }}>
              {theme.label}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, color: theme.color,
              background: "rgba(255,255,255,0.7)", padding: "2px 8px", borderRadius: 20,
              border: `1px solid ${theme.border}` }}>
              {okCount}/{total} critères
            </span>
          </div>
          <p style={{ fontSize: compact ? 11 : 12, color: "#374151", lineHeight: 1.55 }}>
            {data.message}
          </p>
        </div>
      </div>

      {/* ── Checklist par catégorie ── */}
      {!compact && checks.length > 0 && (
        <div style={{ borderTop: `1px solid ${theme.border}` }}>

          {hasCategories ? (
            // Groupée par catégorie
            Object.entries(byCategory).map(([cat, items]) => {
              const cfg = CATEGORY_CONFIG[cat] ?? CATEGORY_CONFIG.profile;
              const catOk = items.filter(i => i.ok).length;
              return (
                <div key={cat} style={{ borderBottom: `1px solid ${theme.border}` }}>
                  {/* Header catégorie */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 20px 8px",
                    background: "rgba(255,255,255,0.4)" }}>
                    <span style={{ fontSize: 14 }}>{cfg.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: cfg.color,
                      textTransform: "uppercase", letterSpacing: ".06em" }}>
                      {cfg.label}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: catOk === items.length ? "#059669" : "#94a3b8",
                      marginLeft: "auto", background: "rgba(255,255,255,0.7)",
                      padding: "1px 7px", borderRadius: 20 }}>
                      {catOk}/{items.length}
                    </span>
                  </div>
                  {/* Items */}
                  <div style={{ padding: "0 20px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                    {items.map((item, i) => (
                      <CheckRow key={i} item={item} />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            // Liste plate (pas de catégories)
            <div style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
              {checks.map((item, i) => <CheckRow key={i} item={item} />)}
            </div>
          )}
        </div>
      )}

      {/* ── Version compacte : juste les manquants ── */}
      {compact && data.missing.length > 0 && (
        <div style={{ borderTop: `1px solid ${theme.border}`, padding: "10px 16px",
          display: "flex", flexDirection: "column", gap: 5 }}>
          {data.missing.slice(0, 2).map((m, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ fontSize: 12, flexShrink: 0, marginTop: 1 }}>❌</span>
              <p style={{ fontSize: 11, color: "#374151", lineHeight: 1.4 }}>
                <strong>{m.label}</strong> — {m.fix}
              </p>
            </div>
          ))}
          {data.missing.length > 2 && (
            <p style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>
              + {data.missing.length - 2} autre{data.missing.length - 2 > 1 ? "s" : ""} élément{data.missing.length - 2 > 1 ? "s" : ""} manquant{data.missing.length - 2 > 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}

      {/* ── Succès total ── */}
      {data.missing.length === 0 && (
        <div style={{ borderTop: `1px solid ${theme.border}`,
          padding: "12px 20px", display: "flex", gap: 10, alignItems: "center",
          background: "rgba(255,255,255,0.5)" }}>
          <span style={{ fontSize: 20 }}>🎉</span>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#065f46" }}>
            Dossier complet — tu peux postuler maintenant !
          </p>
        </div>
      )}
    </div>
  );
}

function CheckRow({ item }: { item: CheckItem }) {
  return (
    <div style={{
      display: "flex", gap: 10, alignItems: "flex-start",
      background: item.ok ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.8)",
      borderRadius: 10, padding: "8px 12px",
      border: item.ok ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(239,68,68,0.15)",
    }}>
      <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>
        {item.ok ? "✅" : "❌"}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 700,
          color: item.ok ? "#065f46" : "#7f1d1d" }}>
          {item.label}
        </p>
        {!item.ok && (
          <p style={{ fontSize: 11, color: "#6b7280", marginTop: 2, lineHeight: 1.4 }}>
            {item.fix}
          </p>
        )}
      </div>
    </div>
  );
}
