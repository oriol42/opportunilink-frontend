"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface Props {
  oppId: string;
  compact?: boolean;
}

export default function SaveButton({ oppId, compact }: Props) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Vérifie si déjà sauvegardé via localStorage pour éviter un appel API
    const savedList = JSON.parse(localStorage.getItem("saved_opps") || "[]");
    setSaved(savedList.includes(oppId));
  }, [oppId]);

  async function toggle() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await api.post(`/opportunities/${oppId}/save`);
      const isSaved = res.data.saved;
      setSaved(isSaved);
      // Sync localStorage
      const savedList: string[] = JSON.parse(localStorage.getItem("saved_opps") || "[]");
      if (isSaved) {
        localStorage.setItem("saved_opps", JSON.stringify([...savedList, oppId]));
      } else {
        localStorage.setItem("saved_opps", JSON.stringify(savedList.filter((id: string) => id !== oppId)));
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  if (compact) {
    return (
      <button
        onClick={e => { e.preventDefault(); toggle(); }}
        title={saved ? "Retirer des favoris" : "Sauvegarder"}
        style={{
          width: 34, height: 34, borderRadius: 8, border: "none",
          background: saved ? "rgba(239,68,68,.12)" : "var(--bg-surface-2)",
          cursor: loading ? "wait" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, transition: "all .15s",
          fontSize: 16,
        }}
      >
        {saved ? "❤️" : "🤍"}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        display: "flex", alignItems: "center", gap: 7,
        padding: "10px 18px", borderRadius: 10, border: "1.5px solid",
        borderColor: saved ? "rgba(239,68,68,.3)" : "var(--border)",
        background: saved ? "rgba(239,68,68,.08)" : "var(--bg-surface-2)",
        color: saved ? "#dc2626" : "var(--text-secondary)",
        fontWeight: 700, fontSize: 14, cursor: loading ? "wait" : "pointer",
        transition: "all .15s",
      }}
    >
      {saved ? "❤️ Sauvegardé" : "🤍 Sauvegarder"}
    </button>
  );
}
