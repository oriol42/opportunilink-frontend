"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

interface SaveButtonProps {
  oppId: string;
  initialSaved?: boolean;
  compact?: boolean;   // true = icône seule, false = icône + texte
}

export default function SaveButton({ oppId, initialSaved = false, compact = false }: SaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault(); // Empêche la navigation si dans un <Link>
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await api.post(`/opportunities/${oppId}/save`);
      const nowSaved: boolean = res.data.saved;
      setSaved(nowSaved);
      if (nowSaved) {
        success("Opportunité sauvegardée !");
      } else {
        success("Retiré des favoris");
      }
    } catch {
      error("Impossible de sauvegarder. Réessaie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      aria-label={saved ? "Retirer des favoris" : "Sauvegarder"}
      className={`
        flex items-center gap-1.5 font-semibold text-xs rounded-xl
        transition-all duration-150 disabled:opacity-50
        ${saved
          ? "text-amber-600 bg-amber-100 hover:bg-amber-200"
          : "text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-700"
        }
        ${compact ? "p-2" : "px-3 py-2"}
      `}
    >
      <span className={`text-base transition-transform ${loading ? "animate-pulse" : saved ? "scale-110" : "scale-100"}`}>
        {saved ? "🔖" : "🏷️"}
      </span>
      {!compact && (saved ? "Sauvegardé" : "Sauvegarder")}
    </button>
  );
}
