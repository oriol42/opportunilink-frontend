"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

interface DocumentItem {
  id: string; type: string; file_name: string; file_path: string;
  is_valid: boolean; expires_at: string | null; created_at: string;
}
interface DocumentVault {
  documents: DocumentItem[]; has_cv: boolean; has_releve: boolean;
  has_cni: boolean; has_attestation: boolean; completeness_pct: number;
}

const DOC_TYPES = [
  { value: "cv",          label: "CV",              icon: "📄" },
  { value: "releve",      label: "Relevé de notes", icon: "📊" },
  { value: "cni",         label: "CNI / Passeport", icon: "🪪" },
  { value: "attestation", label: "Attestation",     icon: "📜" },
  { value: "photo",       label: "Photo",           icon: "🖼️" },
  { value: "autre",       label: "Autre",           icon: "📎" },
];
const ESSENTIAL = [
  { key:"has_cv", type:"cv", icon:"📄", label:"CV" },
  { key:"has_releve", type:"releve", icon:"📊", label:"Relevé" },
  { key:"has_cni", type:"cni", icon:"🪪", label:"CNI" },
  { key:"has_attestation", type:"attestation", icon:"📜", label:"Attestation" },
];

export default function DocumentsPage() {
  const router = useRouter();
  const { user, isAuthLoading } = useStore();
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const [selectedType, setSelectedType] = useState("cv");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthLoading && !user) router.push("/login");
  }, [isAuthLoading, user]);

  const { data: vault, isLoading } = useQuery<DocumentVault>({
    queryKey: ["documents"],
    queryFn: async () => (await api.get("/documents")).data,
    enabled: !!user,
  });

  const uploadMutation = useMutation({
    mutationFn: (fd: FormData) =>
      api.post("/documents/upload", fd, { headers: { "Content-Type": "multipart/form-data" } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      success("Document uploadé avec succès !");
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toastError(msg ?? "Erreur lors de l'upload.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      success("Document supprimé");
    },
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
    <div className="px-4 lg:px-6 py-5 max-w-5xl">
      <div className="mb-5">
        <h2 className="text-2xl font-black text-gray-900">Mon coffre-fort</h2>
        <p className="text-sm text-gray-400 mt-1">Upload une fois, réutilise pour toutes tes candidatures.</p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1,2].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-48 animate-pulse" />)}
        </div>
      )}

      {vault && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

          {/* Colonne gauche — complétude + upload */}
          <div className="space-y-4">
            {/* Complétude */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-gray-800 text-sm">Dossier complet</span>
                <span className={`text-2xl font-black ${vault.completeness_pct === 100 ? "text-emerald-500" : "text-amber-500"}`}>
                  {vault.completeness_pct}%
                </span>
              </div>
              <div className="bg-gray-100 rounded-full h-2 overflow-hidden mb-4">
                <div className={`h-full rounded-full transition-all duration-700 ${vault.completeness_pct === 100 ? "bg-gradient-to-r from-emerald-400 to-teal-400" : "bg-gradient-to-r from-amber-400 to-yellow-300"}`}
                  style={{ width: `${vault.completeness_pct}%` }} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ESSENTIAL.map((doc) => {
                  const present = vault[doc.key as keyof DocumentVault] as boolean;
                  return (
                    <div key={doc.key} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border ${present ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-gray-50 border-gray-100 text-gray-400"}`}>
                      <span className="text-lg shrink-0">{doc.icon}</span>
                      <span className="text-xs font-semibold flex-1">{doc.label}</span>
                      {present ? <span className="text-emerald-500 text-xs font-bold">✓</span> : <span className="text-gray-300 text-xs">—</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upload */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-800 text-sm mb-4">Ajouter un document</h3>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {DOC_TYPES.map((dt) => (
                  <button key={dt.value} onClick={() => setSelectedType(dt.value)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all ${selectedType === dt.value ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-200"}`}>
                    <span className="text-xl">{dt.icon}</span>
                    <span className="text-[10px] font-semibold leading-tight">{dt.label}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2">
                {uploadMutation.isPending ? <><span className="animate-spin">⏳</span> Upload...</> : <><span>📎</span> Choisir un fichier</>}
              </button>
              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" />
              <p className="text-xs text-gray-400 text-center mt-2">PDF, JPG ou PNG · max 5MB</p>
            </div>
          </div>

          {/* Colonne droite — liste des documents */}
          <div>
            {vault.documents.length === 0 ? (
              <div className="text-center py-14 bg-white rounded-2xl border border-gray-100 text-gray-400">
                <p className="text-5xl mb-3">🗂️</p>
                <p className="font-semibold text-gray-600 mb-1">Coffre-fort vide</p>
                <p className="text-sm">Commence par uploader ton CV.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50">
                  <p className="text-sm font-bold text-gray-800">
                    {vault.documents.length} document{vault.documents.length > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="divide-y divide-gray-50">
                  {vault.documents.map((doc) => {
                    const docType = DOC_TYPES.find(d => d.value === doc.type);
                    return (
                      <div key={doc.id} className="p-4 flex items-center gap-3 hover:bg-gray-50 transition">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl shrink-0">
                          {docType?.icon ?? "📄"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{doc.file_name}</p>
                          <p className="text-xs text-gray-400">
                            {docType?.label ?? doc.type} · {new Date(doc.created_at).toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"numeric" })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <a href={doc.file_path} target="_blank" rel="noopener noreferrer"
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition">
                            Voir
                          </a>
                          <button onClick={() => { if (confirm("Supprimer ?")) deleteMutation.mutate(doc.id); }}
                            className="text-xs text-gray-300 hover:text-red-400 transition px-2 py-1.5 font-bold">✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
