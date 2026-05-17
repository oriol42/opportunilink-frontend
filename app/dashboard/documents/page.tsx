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
  { value:"cv",          label:"CV",               icon:"📄", desc:"Ton curriculum vitae à jour" },
  { value:"releve",      label:"Relevé de notes",  icon:"📊", desc:"Bulletins et transcriptions" },
  { value:"cni",         label:"CNI / Passeport",  icon:"🪪", desc:"Pièce d'identité valide" },
  { value:"attestation", label:"Attestation",      icon:"📜", desc:"Attestation de scolarité" },
  { value:"photo",       label:"Photo",            icon:"🖼️", desc:"Photo d'identité récente" },
  { value:"autre",       label:"Autre",            icon:"📎", desc:"Tout autre document utile" },
];

const ESSENTIAL = [
  { key:"has_cv",          type:"cv",          icon:"📄", label:"CV",              impact:"Requis pour 100% des candidatures" },
  { key:"has_releve",      type:"releve",       icon:"📊", label:"Relevé de notes", impact:"Requis pour 80% des bourses" },
  { key:"has_cni",         type:"cni",          icon:"🪪", label:"CNI / Passeport", impact:"Requis pour les candidatures officielles" },
  { key:"has_attestation", type:"attestation",  icon:"📜", label:"Attestation",     impact:"Requis pour les programmes d'échange" },
];

export default function DocumentsPage() {
  const router = useRouter();
  const { user, isAuthLoading } = useStore();
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const [selectedType, setSelectedType] = useState("cv");
  const [dragOver, setDragOver] = useState(false);
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

  function handleFile(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("doc_type", selectedType);
    uploadMutation.mutate(fd);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  if (isAuthLoading || !user) return null;

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", overflow:"hidden" }}>

      {/* Topbar */}
      <div style={{ background:"#fff", borderBottom:"0.5px solid #f3f4f6",
        padding:"18px 24px", flexShrink:0 }}>
        <h1 style={{ fontWeight:900, fontSize:22, color:"#111827", marginBottom:4 }}>
          Coffre-fort documentaire
        </h1>
        <p style={{ fontSize:13, color:"#9ca3af" }}>
          Upload une fois, réutilise pour toutes tes candidatures.
        </p>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>

        {isLoading && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ background:"#fff", borderRadius:20, border:"1px solid #f1f5f9",
                height:120 }} className="animate-pulse" />
            ))}
          </div>
        )}

        {vault && (
          <div style={{ display:"grid", gridTemplateColumns:"340px 1fr", gap:24, alignItems:"start" }}>

            {/* ── Colonne gauche ── */}
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

              {/* Complétude dossier */}
              <div style={{ background:"#fff", borderRadius:20, border:"1px solid #f1f5f9",
                overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>

                {/* Header dégradé */}
                <div style={{ background:"linear-gradient(135deg,#0f172a,#065f46)", padding:"20px 20px 24px" }}>
                  <p style={{ fontWeight:800, fontSize:13, color:"#6ee7b7",
                    textTransform:"uppercase", letterSpacing:".06em", marginBottom:12 }}>
                    Dossier complet
                  </p>
                  {/* Ring */}
                  {(() => {
                    const size=80; const r=32; const circ=2*Math.PI*r;
                    const dash=(vault.completeness_pct/100)*circ;
                    const color=vault.completeness_pct===100?"#10b981":vault.completeness_pct>=50?"#f59e0b":"#ef4444";
                    return (
                      <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                        <div style={{ position:"relative", flexShrink:0 }}>
                          <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
                            <circle cx={size/2} cy={size/2} r={r} fill="none"
                              stroke="rgba(255,255,255,0.1)" strokeWidth={8} />
                            <circle cx={size/2} cy={size/2} r={r} fill="none"
                              stroke={color} strokeWidth={8}
                              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                              style={{ transition:"stroke-dasharray .8s ease" }} />
                          </svg>
                          <div style={{ position:"absolute", inset:0, display:"flex",
                            flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                            <span style={{ fontSize:20, fontWeight:900, color, lineHeight:1 }}>
                              {vault.completeness_pct}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <p style={{ fontWeight:800, fontSize:15, color:"#fff", marginBottom:4 }}>
                            {vault.completeness_pct===100
                              ? "Dossier complet 🎉"
                              : `${ESSENTIAL.filter(e => vault[e.key as keyof DocumentVault]).length}/4 documents`}
                          </p>
                          <p style={{ fontSize:12, color:"#a7f3d0", lineHeight:1.4 }}>
                            {vault.completeness_pct===100
                              ? "Tu peux postuler à toutes les opportunités"
                              : "Complete ton dossier pour augmenter tes chances"}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Checklist 4 docs essentiels */}
                <div style={{ padding:"16px" }}>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {ESSENTIAL.map(doc => {
                      const present = vault[doc.key as keyof DocumentVault] as boolean;
                      return (
                        <div key={doc.key} style={{ display:"flex", alignItems:"center", gap:12,
                          padding:"10px 14px", borderRadius:14, border:"1px solid",
                          borderColor: present ? "#bbf7d0" : "#fecaca",
                          background: present ? "#f0fdf4" : "#fef2f2" }}>
                          <span style={{ fontSize:20, flexShrink:0 }}>{doc.icon}</span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ fontSize:13, fontWeight:700,
                              color: present ? "#065f46" : "#7f1d1d" }}>{doc.label}</p>
                            <p style={{ fontSize:11, color: present ? "#059669" : "#b91c1c",
                              marginTop:2 }}>{doc.impact}</p>
                          </div>
                          <span style={{ fontSize:18, flexShrink:0 }}>
                            {present ? "✅" : "❌"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sélection type de document */}
              <div style={{ background:"#fff", borderRadius:20, border:"1px solid #f1f5f9",
                padding:"20px", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                <p style={{ fontWeight:800, fontSize:14, color:"#0f172a", marginBottom:14 }}>
                  Type de document à uploader
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {DOC_TYPES.map(dt => (
                    <button key={dt.value} type="button" onClick={() => setSelectedType(dt.value)}
                      style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px",
                        borderRadius:12, border:"1.5px solid",
                        borderColor: selectedType===dt.value ? "#10b981" : "#f1f5f9",
                        background: selectedType===dt.value ? "#f0fdf4" : "#fafafa",
                        cursor:"pointer", transition:"all .15s", textAlign:"left" }}>
                      <span style={{ fontSize:20, flexShrink:0 }}>{dt.icon}</span>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:13, fontWeight:700,
                          color: selectedType===dt.value ? "#065f46" : "#374151" }}>{dt.label}</p>
                        <p style={{ fontSize:11, color:"#94a3b8" }}>{dt.desc}</p>
                      </div>
                      {selectedType===dt.value && (
                        <span style={{ fontSize:16, flexShrink:0 }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Colonne droite ── */}
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

              {/* Zone upload drag & drop */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !uploadMutation.isPending && fileInputRef.current?.click()}
                style={{ background: dragOver ? "#f0fdf4" : "#fff",
                  borderRadius:20, border:`2px dashed ${dragOver ? "#10b981" : "#e5e7eb"}`,
                  padding:"40px 24px", textAlign:"center", cursor:"pointer",
                  transition:"all .2s", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize:48, marginBottom:16 }}>
                  {uploadMutation.isPending ? "⏳" : dragOver ? "📂" : "☁️"}
                </div>
                <p style={{ fontWeight:800, fontSize:16, color:"#0f172a", marginBottom:8 }}>
                  {uploadMutation.isPending
                    ? "Upload en cours..."
                    : dragOver
                    ? "Relâche pour uploader"
                    : `Uploader un ${DOC_TYPES.find(d=>d.value===selectedType)?.label ?? "document"}`}
                </p>
                <p style={{ fontSize:13, color:"#94a3b8", marginBottom:20 }}>
                  Glisse ton fichier ici ou clique pour choisir
                </p>
                <div style={{ display:"inline-flex", alignItems:"center", gap:8,
                  background: uploadMutation.isPending ? "#e5e7eb" : "#059669",
                  color:"#fff", fontWeight:700, fontSize:14,
                  padding:"12px 24px", borderRadius:12 }}>
                  <span>📎</span>
                  {uploadMutation.isPending ? "Upload en cours..." : "Choisir un fichier"}
                </div>
                <p style={{ fontSize:11, color:"#d1d5db", marginTop:12 }}>
                  PDF, JPG ou PNG · Maximum 5MB
                </p>
                <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange} style={{ display:"none" }} />
              </div>

              {/* Liste des documents */}
              {vault.documents.length === 0 ? (
                <div style={{ background:"#fff", borderRadius:20, border:"1px solid #f1f5f9",
                  padding:"48px 24px", textAlign:"center",
                  boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                  <p style={{ fontSize:48, marginBottom:12 }}>🗂️</p>
                  <p style={{ fontWeight:800, fontSize:16, color:"#0f172a", marginBottom:8 }}>
                    Coffre-fort vide
                  </p>
                  <p style={{ fontSize:13, color:"#94a3b8" }}>
                    Commence par uploader ton CV — c'est le document le plus important.
                  </p>
                </div>
              ) : (
                <div style={{ background:"#fff", borderRadius:20, border:"1px solid #f1f5f9",
                  overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                  <div style={{ padding:"16px 20px", borderBottom:"1px solid #f8fafc",
                    display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <p style={{ fontWeight:800, fontSize:14, color:"#0f172a" }}>
                      Mes documents
                    </p>
                    <span style={{ fontSize:12, fontWeight:700, color:"#94a3b8",
                      background:"#f1f5f9", padding:"2px 10px", borderRadius:20 }}>
                      {vault.documents.length} fichier{vault.documents.length>1?"s":""}
                    </span>
                  </div>
                  <div style={{ divide:"y" }}>
                    {vault.documents.map((doc, idx) => {
                      const docType = DOC_TYPES.find(d => d.value === doc.type);
                      const date = new Date(doc.created_at).toLocaleDateString("fr-FR",
                        {day:"numeric",month:"short",year:"numeric"});
                      return (
                        <div key={doc.id} style={{ display:"flex", alignItems:"center", gap:14,
                          padding:"14px 20px",
                          borderBottom: idx < vault.documents.length-1 ? "1px solid #f8fafc" : "none",
                          transition:"background .1s" }}
                          className="hover:bg-gray-50">

                          {/* Icône type */}
                          <div style={{ width:44, height:44, borderRadius:12,
                            background:"#f8fafc", border:"1px solid #f1f5f9",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:22, flexShrink:0 }}>
                            {docType?.icon ?? "📄"}
                          </div>

                          {/* Infos */}
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ fontSize:14, fontWeight:700, color:"#0f172a",
                              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                              {doc.file_name}
                            </p>
                            <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:3 }}>
                              <span style={{ fontSize:11, fontWeight:700, color:"#059669",
                                background:"#f0fdf4", padding:"1px 7px", borderRadius:20 }}>
                                {docType?.label ?? doc.type}
                              </span>
                              <span style={{ fontSize:11, color:"#94a3b8" }}>· {date}</span>
                              {doc.is_valid && (
                                <span style={{ fontSize:11, color:"#059669", fontWeight:700 }}>✓ Valide</span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                            <a href={doc.file_path} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize:12, fontWeight:700, color:"#2563eb",
                                background:"#eff6ff", padding:"6px 12px", borderRadius:10,
                                textDecoration:"none", border:"1px solid #bfdbfe" }}>
                              👁️ Voir
                            </a>
                            <button onClick={() => { if (confirm("Supprimer ce document ?")) deleteMutation.mutate(doc.id); }}
                              style={{ fontSize:12, fontWeight:700, color:"#dc2626",
                                background:"#fef2f2", padding:"6px 12px", borderRadius:10,
                                border:"1px solid #fecaca", cursor:"pointer" }}>
                              🗑️
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Conseil */}
              <div style={{ background:"linear-gradient(135deg,#fffbeb,#fef3c7)",
                borderRadius:16, padding:"16px 20px", border:"1px solid #fde68a" }}>
                <p style={{ fontSize:13, fontWeight:800, color:"#78350f", marginBottom:8 }}>
                  💡 Conseil OpportuLink
                </p>
                <p style={{ fontSize:12, color:"#92400e", lineHeight:1.6 }}>
                  Scanne tes documents en <strong>PDF haute qualité</strong> (300 DPI minimum).
                  Nomme tes fichiers clairement : <em>CV_NomPrenom_2025.pdf</em>.
                  Les organismes rejettent souvent les dossiers avec des fichiers illisibles.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
