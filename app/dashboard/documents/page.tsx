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
  cv: "CV",
  releve: "Releve de notes",
  cni: "CNI / Passeport",
  attestation: "Attestation",
  photo: "Photo",
  autre: "Autre",
};

const ESSENTIAL_DOCS = [
  { key: "has_cv",          label: "CV",              type: "cv" },
  { key: "has_releve",      label: "Releve de notes", type: "releve" },
  { key: "has_cni",         label: "CNI / Passeport", type: "cni" },
  { key: "has_attestation", label: "Attestation",     type: "attestation" },
];

async function fetchVault(): Promise<DocumentVault> {
  const res = await api.get("/documents");
  return res.data;
}

async function uploadDocument(formData: FormData): Promise<DocumentItem> {
  const res = await api.post("/documents/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

async function deleteDocument(id: string): Promise<void> {
  await api.delete(`/documents/${id}`);
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

  const { data: vault, isLoading, isError } = useQuery({
    queryKey: ["documents"],
    queryFn: fetchVault,
    enabled: !!user,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setUploadError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (error: any) => {
      setUploadError(error.response?.data?.detail ?? "Erreur upload.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("doc_type", selectedType);
    uploadMutation.mutate(formData);
  }

  if (isAuthLoading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-emerald-600">OpportuLink</h1>
          <button onClick={() => router.push("/dashboard/profile")} className="text-sm text-gray-500 hover:text-emerald-600 transition">
            Mon profil
          </button>
        </div>
        <div className="max-w-2xl mx-auto flex gap-1 mt-3">
          <button onClick={() => router.push("/dashboard")} className="text-sm font-medium px-4 py-1.5 rounded-full text-gray-500 hover:bg-gray-100 transition">Feed</button>
          <button onClick={() => router.push("/dashboard/applications")} className="text-sm font-medium px-4 py-1.5 rounded-full text-gray-500 hover:bg-gray-100 transition">Candidatures</button>
          <button className="text-sm font-semibold px-4 py-1.5 rounded-full bg-emerald-600 text-white">Documents</button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-gray-800">Mon coffre-fort</h2>
          <p className="text-gray-500 mt-1 text-sm">Uploade une fois, reutilise partout.</p>
        </div>

        {isLoading && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-full" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-5 text-red-600 text-sm mb-4">
            Erreur chargement documents.
          </div>
        )}

        {vault && (
          <>
            <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700 text-sm">Documents essentiels</h3>
                <span className={`text-sm font-bold ${vault.completeness_pct === 100 ? "text-emerald-600" : "text-amber-500"}`}>
                  {vault.completeness_pct}%
                </span>
              </div>
              <div className="bg-gray-100 rounded-full h-2 mb-4">
                <div
                  className={`h-2 rounded-full transition-all ${vault.completeness_pct === 100 ? "bg-emerald-500" : "bg-amber-400"}`}
                  style={{ width: `${vault.completeness_pct}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ESSENTIAL_DOCS.map((doc) => {
                  const present = vault[doc.key as keyof DocumentVault] as boolean;
                  return (
                    <div key={doc.key} className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${present ? "bg-emerald-50 text-emerald-700" : "bg-gray-50 text-gray-400"}`}>
                      <span>{present ? "v" : "o"}</span>
                      <span>{doc.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5">
              <h3 className="font-semibold text-gray-700 text-sm mb-3">Ajouter un document</h3>
              <div className="flex gap-2 mb-3">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
                >
                  {Object.entries(DOC_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadMutation.isPending}
                  className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 whitespace-nowrap"
                >
                  {uploadMutation.isPending ? "Upload..." : "Choisir fichier"}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />
              <p className="text-xs text-gray-400">PDF, JPG ou PNG — max 5MB</p>
              {uploadError && <p className="text-xs text-red-500 mt-2">{uploadError}</p>}
              {uploadMutation.isSuccess && <p className="text-xs text-emerald-600 mt-2">Document uploade avec succes</p>}
            </div>

            {vault.documents.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-3">🗂️</p>
                <p className="font-medium">Ton coffre-fort est vide.</p>
                <p className="text-sm mt-1">Commence par uploader ton CV.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {vault.documents.map((doc) => (
                  <div key={doc.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{doc.file_name.endsWith(".pdf") ? "📄" : "🖼️"}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{doc.file_name}</p>
                        <p className="text-xs text-gray-400">
                          {DOC_TYPE_LABELS[doc.type] ?? doc.type} · {new Date(doc.uploaded_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={doc.file_path} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline">Voir</a>
                      <button
                        onClick={() => { if (confirm("Supprimer ce document ?")) deleteMutation.mutate(doc.id); }}
                        disabled={deleteMutation.isPending}
                        className="text-xs text-gray-400 hover:text-red-500 transition px-2"
                      >x</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
