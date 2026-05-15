// components/opportunity/ApplyButton.tsx
// Bouton Postuler intelligent
// Detecte la methode et agit en consequence

"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

interface ApplyButtonProps {
  oppId: string;
  oppTitle: string;
  sourceUrl?: string | null;
}

interface ApplyResponse {
  application_id: string;
  method: string;
  action_url: string | null;
  message: string;
  ready: boolean;
}

export default function ApplyButton({ oppId, oppTitle, sourceUrl }: ApplyButtonProps) {
  const { success, warning, error: toastError } = useToast();
  const router = useRouter();
  const [state, setState] = useState<"idle"|"loading"|"done"|"already">("idle");
  const [appId, setAppId] = useState<string | null>(null);

  async function handleApply() {
    setState("loading");
    try {
      // Etape 1 : creer la candidature
      let applicationId = appId;
      if (!applicationId) {
        try {
          const createRes = await api.post("/applications", { opportunity_id: oppId });
          applicationId = createRes.data.id;
          setAppId(applicationId);
        } catch (err: unknown) {
          const status = (err as { response?: { status?: number } }).response?.status;
          if (status === 400) {
            // Candidature deja existante — on recupere son id
            const appsRes = await api.get("/applications");
            const existing = appsRes.data.find(
              (a: { opportunity_id: string; id: string }) => a.opportunity_id === oppId
            );
            if (existing) {
              applicationId = existing.id;
              setAppId(applicationId);
              setState("already");
            }
          } else {
            throw err;
          }
        }
      }

      if (!applicationId) {
        setState("idle");
        return;
      }

      // Etape 2 : appel smart apply pour detecter la methode
      const applyRes = await api.post<ApplyResponse>(
        `/applications/${applicationId}/apply`
      );
      const data = applyRes.data;

      setState("done");

      // Etape 3 : agir selon la methode detectee
      if (data.method === "email" && data.action_url) {
        success("Candidature enregistree ! Ouvre ton email pour envoyer ton dossier.");
        setTimeout(() => {
          window.open(data.action_url!, "_blank");
        }, 800);
      } else if (data.action_url) {
        if (data.ready) {
          success("Dossier complet ! Redirection vers le formulaire officiel...");
        } else {
          warning(data.message);
        }
        setTimeout(() => {
          window.open(data.action_url!, "_blank");
        }, 1000);
      } else if (sourceUrl) {
        success("Candidature enregistree ! Redirection vers le site officiel...");
        setTimeout(() => {
          window.open(sourceUrl, "_blank");
        }, 1000);
      } else {
        success("Candidature enregistree dans tes candidatures !");
      }

    } catch (err: unknown) {
      setState("idle");
      toastError("Erreur. Reessaie.");
    }
  }

  function handleViewApplications() {
    router.push("/dashboard/applications");
  }

  // Etat : deja candidaté
  if (state === "already" || state === "done") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{
          background: "#f0fdf4", border: "1px solid #bbf7d0",
          borderRadius: 14, padding: "12px 16px",
          fontSize: 13, fontWeight: 600, color: "#065f46",
          textAlign: "center",
        }}>
          {state === "done" ? "Candidature soumise !" : "Tu as deja postule"}
        </div>
        <button onClick={handleViewApplications}
          style={{
            width: "100%", fontWeight: 700, fontSize: 13, padding: "12px",
            borderRadius: 14, border: "1px solid #e5e7eb",
            background: "#f9fafb", color: "#374151", cursor: "pointer",
          }}>
          Voir mes candidatures →
        </button>
        {sourceUrl && (
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer"
            style={{
              display: "block", textAlign: "center", fontSize: 12,
              color: "#6b7280", textDecoration: "underline", padding: "4px",
            }}>
            Retourner sur le site officiel →
          </a>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <button onClick={handleApply} disabled={state === "loading"}
        style={{
          width: "100%", fontWeight: 800, fontSize: 15, padding: "16px",
          borderRadius: 14, border: "none",
          cursor: state === "loading" ? "not-allowed" : "pointer",
          background: state === "loading"
            ? "#d1d5db"
            : "linear-gradient(135deg,#059669,#0d9488)",
          color: "#fff",
          boxShadow: state === "loading" ? "none" : "0 4px 16px rgba(5,150,105,0.3)",
          transition: "all .15s",
        }}>
        {state === "loading" ? "Traitement en cours..." : "Postuler a cette opportunite →"}
      </button>

      {sourceUrl && state === "idle" && (
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer"
          style={{
            display: "block", textAlign: "center", fontSize: 12,
            color: "#94a3b8", textDecoration: "underline", padding: "4px",
          }}>
          Voir la page officielle directement →
        </a>
      )}
    </div>
  );
}
