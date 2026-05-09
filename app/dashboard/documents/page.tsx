"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";

interface DocumentItem {
  id: string;
  type: string;
  file_name: string;
  file_path: string;
  is_valid: boolean;
  expires_at: string | null;
  uploaded_at: string;
}

interface DocumentVault {
  documents: DocumentItem[];
  has_cv: boolean;
  has_releve: boolean;
  has_cni: boolean;
  has_attestation: boolean;
  completeness_pct: number;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  cv: "CV", releve: "Relevé de notes", cni: "CNI / Passeport",
  attestation: "Attestation", photo: "Photo", autre: "Autre",
};

const ESSENTIAL_DOCS = [
  { key: "has_cv", label: "CV", type: "cv", icon: "📄" },
  { key: "has_releve", label: "Relevé", type: "releve", icon: "📊" },
  { key: "has_cni", label: "CNI", type: "cni", icon: "🪪" },
  { key: "has_attestation", label: "Attestation", type: "attestation", icon: "📜" },
];

async function fetchVault(): Promise<DocumentVault> {
  const res = await api.get("/documents");
  return res.data;
}

export default function DocumentsPage() {
  const router = useRouter();
  const { user, isAuthLoading } = useStore();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState("cv");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthLoading && !user) router.push("/login");
  }, [isAuthLoading, user]);

  const { data: vault, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: fetchVault,
    enabled: !!user,
  });

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => api.post("/documents/upload", formData, { headers: { "Content-Type": "multipart/form-data" } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["documents"] }); setUploadError(null); if (fileInputRef.current) fileInputRef.current.value = ""; },
    onError: (err: any) => setUploadError(err.response?.data?.detail ?? "Erreur upload."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("doc_type", selectedType);
    uploadMutation.mutate(fd);
  }

  if (isAuthLoading || !user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Mon coffre-fort</h2>
        <p className="text-sm text-gray-400 mt-0.5">Upload une fois, réutilise partout.</p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse h-24" />)}
        </div>
      )}

      {vault && (
        <div className="space-y-4">
          {/* Completeness card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-gray-800 text-sm">Complétude du dossier</span>
              <span className={`text-lg font-black ${vault.completeness_pct === 100 ? "text-emerald-500" : "text-amber-500"}`}>
                {vault.completeness_pct}%
              </span>
            </div>
            <div className="bg-gray-100 rounded-full h-2.5 mb-4 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${vault.completeness_pct === 100 ? "bg-emerald-500" : "bg-amber-400"}`}
                style={{ width: `${vault.completeness_pct}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ESSENTIAL_DOCS.map((doc) => {
                const present = vault[doc.key as keyof DocumentVault] as boolean;
                return (
                  <div key={doc.key} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${present ? "bg-emerald-50 text-emerald-700" : "bg-gray-50 text-gray-400"}`}>
                    <span>{doc.icon}</span>
                    <span className="font-medium">{doc.label}</span>
                    {present && <span className="ml-auto text-emerald-500 text-xs">✓</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upload card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 text-sm mb-3">Ajouter un document</h3>
            <div className="flex gap-2 mb-3">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
              >
                {Object.entries(DOC_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition disabled:opacity-50 whitespace-nowrap"
              >
                {uploadMutation.isPending ? "⏳" : "📎 Choisir"}
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" />
            <p className="text-xs text-gray-400">PDF, JPG ou PNG — max 5MB</p>
            {uploadError && <p className="text-xs text-red-500 mt-2">{uploadError}</p>}
            {uploadMutation.isSuccess && <p className="text-xs text-emerald-600 mt-2">✓ Document uploadé avec succès</p>}
          </div>

          {/* Documents list */}
          {vault.documents.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-5xl mb-3">🗂️</p>
              <p className="font-semibold text-gray-600 mb-1">Coffre-fort vide</p>
              <p className="text-sm">Commence par uploader ton CV.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {vault.documents.map((doc) => (
                <div key={doc.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                  <span className="text-2xl shrink-0">{doc.file_name.endsWith(".pdf") ? "📄" : "🖼️"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{doc.file_name}</p>
                    <p className="text-xs text-gray-400">{DOC_TYPE_LABELS[doc.type] ?? doc.type} · {new Date(doc.uploaded_at).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a href={doc.file_path} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-emerald-600 hover:underline">Voir</a>
                    <button onClick={() => { if (confirm("Supprimer ?")) deleteMutation.mutate(doc.id); }} className="text-xs text-gray-300 hover:text-red-400 transition px-1">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
