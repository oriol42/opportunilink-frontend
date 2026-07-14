// components/ui/Skeletons.tsx
// Skeletons qui calquent la forme reelle du contenu (au lieu de rectangles
// gris plats) — coherent avec SkeletonCard du feed principal.
"use client";

// Ligne skeleton pour les listes plates (page Favoris) :
// barre coloree a gauche + titre + ligne de badges.
export function SkeletonRow() {
  return (
    <div className="animate-pulse" style={{
      background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border)",
      padding: 16, display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{ width: 4, borderRadius: 2, background: "var(--bg-surface-2)", alignSelf: "stretch", flexShrink: 0, minHeight: 48 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ height: 14, width: "70%", background: "var(--bg-surface-2)", borderRadius: 4, marginBottom: 10 }} />
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ height: 18, width: 64, background: "var(--bg-surface-2)", borderRadius: 20 }} />
          <div style={{ height: 18, width: 84, background: "var(--bg-surface-2)", borderRadius: 20 }} />
        </div>
      </div>
    </div>
  );
}

// Carte skeleton pour les grilles (page Candidatures) :
// barre coloree en haut + badge + titre + pill de statut.
export function SkeletonAppCard() {
  return (
    <div className="animate-pulse" style={{
      background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden",
    }}>
      <div style={{ height: 3, background: "var(--bg-surface-2)" }} />
      <div style={{ padding: "16px 18px" }}>
        <div style={{ height: 18, width: 70, background: "var(--bg-surface-2)", borderRadius: 20, marginBottom: 12 }} />
        <div style={{ height: 15, width: "90%", background: "var(--bg-surface-2)", borderRadius: 4, marginBottom: 8 }} />
        <div style={{ height: 15, width: "55%", background: "var(--bg-surface-2)", borderRadius: 4, marginBottom: 14 }} />
        <div style={{ height: 24, width: 100, background: "var(--bg-surface-2)", borderRadius: 20 }} />
      </div>
    </div>
  );
}
