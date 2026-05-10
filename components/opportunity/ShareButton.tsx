"use client";
import { useState } from "react";
import { useToast } from "@/components/ui/Toast";

interface ShareButtonProps {
  title: string;
  oppId: string;
}

export default function ShareButton({ title, oppId }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const { success } = useToast();

  async function handleShare() {
    const url = `${window.location.origin}/opportunity/${oppId}`;
    const text = `Découvre cette opportunité sur OpportuLink : ${title}`;

    // Web Share API — natif sur mobile
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // Annulé par l'utilisateur — ne rien faire
        return;
      }
    }

    // Fallback desktop — copier le lien
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      success("Lien copié dans le presse-papiers !");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ultime — prompt
      window.prompt("Copie ce lien :", url);
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-100
                 hover:bg-gray-200 hover:text-gray-700 px-3 py-2 rounded-xl transition-all"
      aria-label="Partager cette opportunité"
    >
      <span className="text-base">{copied ? "✓" : "🔗"}</span>
      {copied ? "Copié !" : "Partager"}
    </button>
  );
}
