"use client";
import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import {
  FileText, ChartColumn, CreditCard, ScrollText, Image as ImageIcon, Paperclip,
  Check, X, CloudUpload, FolderOpen, Eye, Trash2, Lightbulb, LoaderCircle, LucideIcon,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import DocAnalyzer from "@/components/ai/DocAnalyzer";

interface DocumentItem {
  id: string; type: string; file_name: string; file_path: string;
  is_valid: boolean; expires_at: string | null; created_at: string;
}
interface DocumentVault {
  documents: DocumentItem[]; has_cv: boolean; has_releve: boolean;
  has_cni: boolean; has_attestation: boolean; completeness_pct: number;
}

const DOC_TYPES: { value:string; label:string; icon:LucideIcon; desc:string }[] = [
  { value:"cv",          label:"CV",               icon:FileText,   desc:"Ton curriculum vitae à jour" },
  { value:"releve",      label:"Relevé de notes",  icon:ChartColumn, desc:"Bulletins et transcriptions" },
  { value:"cni",         label:"CNI / Passeport",  icon:CreditCard, desc:"Pièce d'identité valide" },
  { value:"attestation", label:"Attestation",      icon:ScrollText, desc:"Attestation de scolarité" },
  { value:"photo",       label:"Photo",            icon:ImageIcon,  desc:"Photo d'identité récente" },
  { value:"autre",       label:"Autre",            icon:Paperclip,  desc:"Tout autre document utile" },
];

const ESSENTIAL: { key:string; type:string; icon:LucideIcon; label:string; impact:string }[] = [
  { key:"has_cv",          type:"cv",          icon:FileText,   label:"CV",              impact:"Requis pour 100% des candidatures" },
  { key:"has_releve",      type:"releve",      icon:ChartColumn, label:"Relevé de notes", impact:"Requis pour 80% des bourses" },
  { key:"has_cni",         type:"cni",         icon:CreditCard, label:"CNI / Passeport", impact:"Requis pour les candidatures officielles" },
  { key:"has_attestation", type:"attestation", icon:ScrollText, label:"Attestation",     impact:"Requis pour les programmes d'échange" },
];

function DocumentsInner() {
  const router = useRouter();
  const { user, isAuthLoading } = useStore();
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const [selectedType, setSelectedType] = useState("cv");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthLoading && !user) router.push("/login");
  }, [isAuthLoading, user, router]);

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

  const selectedIcon = DOC_TYPES.find(d=>d.value===selectedType)?.icon ?? FileText;
  const SelectedIcon = selectedIcon;

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", overflow:"hidden" }}>

      <div style={{ background:"var(--bg-card)", borderBottom:"1px solid var(--border-subtle)",
        padding:"18px 24px", flexShrink:0 }}>
        <h1 style={{ fontFamily:"var(--font-voice)", fontWeight:500, fontSize:22, color:"var(--text-primary)", marginBottom:4 }}>
          Coffre-fort documentaire
        </h1>
        <p style={{ fontSize:13, color:"var(--text-muted)" }}>
          Upload une fois, réutilise pour toutes tes candidatures.
        </p>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>

        {isLoading && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ background:"var(--bg-card)", borderRadius:20, border:"1px solid var(--border)",
                height:120 }} className="animate-pulse" />
            ))}
          </div>
        )}

        {vault && (
          <div className="documents-grid" style={{ display:"grid", gridTemplateColumns:"340px 1fr", gap:24, alignItems:"start" }}>

            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

              <div style={{ background:"var(--bg-card)", borderRadius:20, border:"1px solid var(--border)",
                overflow:"hidden", boxShadow:"var(--shadow-sm)" }}>

                <div style={{ background:"var(--bg-hero)", padding:"20px 20px 24px" }}>
                  <p style={{ fontWeight:700, fontSize:13, color:"#6ee7b7",
                    textTransform:"uppercase", letterSpacing:".06em", marginBottom:12 }}>
                    Dossier complet
                  </p>
                  {(() => {
                    const size=80; const r=32; const circ=2*Math.PI*r;
                    const dash=(vault.completeness_pct/100)*circ;
                    const color=vault.completeness_pct===100?"var(--accent)":vault.completeness_pct>=50?"var(--text-warning)":"#ef4444";
                    return (
                      <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                        <div style={{ position:"relative", flexShrink:0 }}>
                          <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
                            <circle cx={size/2} cy={size/2} r={r} fill="none"
                              stroke="rgba(255,255,255,0.12)" strokeWidth={8} />
                            <circle cx={size/2} cy={size/2} r={r} fill="none"
                              stroke={color} strokeWidth={8}
                              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                              style={{ transition:"stroke-dasharray .8s ease" }} />
                          </svg>
                          <div style={{ position:"absolute", inset:0, display:"flex",
                            flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                            <span style={{ fontFamily:"var(--font-voice)", fontSize:20, fontWeight:600, color, lineHeight:1 }}>
                              {vault.completeness_pct}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <p style={{ fontWeight:700, fontSize:15, color:"#fff", marginBottom:4 }}>
                            {vault.completeness_pct===100
                              ? "Dossier complet"
                              : `${ESSENTIAL.filter(e => vault[e.key as keyof DocumentVault]).length}/4 documents`}
                          </p>
                          <p style={{ fontSize:12, color:"#a7f3d0", lineHeight:1.4 }}>
                            {vault.completeness_pct===100
                              ? "Tu peux postuler à toutes les opportunités"
                              : "Complète ton dossier pour augmenter tes chances"}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div style={{ padding:"16px" }}>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {ESSENTIAL.map(doc => {
                      const present = vault[doc.key as keyof DocumentVault] as boolean;
                      return (
                        <div key={doc.key} style={{ display:"flex", alignItems:"center", gap:12,
                          padding:"10px 14px", borderRadius:14, border:"1px solid",
                          borderColor: present ? "var(--border-success)" : "var(--border-danger)",
                          background: present ? "var(--bg-success)" : "var(--bg-danger)" }}>
                          <doc.icon size={19} color={present ? "var(--text-success)" : "var(--text-danger)"} style={{ flexShrink:0 }} />
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ fontSize:13, fontWeight:700,
                              color: present ? "var(--text-success)" : "var(--text-danger)" }}>{doc.label}</p>
                            <p style={{ fontSize:11, color: present ? "var(--text-success)" : "var(--text-danger)",
                              marginTop:2, opacity:.85 }}>{doc.impact}</p>
                          </div>
                          {present ? <Check size={16} color="var(--text-success)" style={{ flexShrink:0 }} />
                            : <X size={16} color="var(--text-danger)" style={{ flexShrink:0 }} />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={{ background:"var(--bg-card)", borderRadius:20, border:"1px solid var(--border)",
                padding:"20px", boxShadow:"var(--shadow-sm)" }}>
                <p style={{ fontWeight:700, fontSize:14, color:"var(--text-primary)", marginBottom:14 }}>
                  Type de document à uploader
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {DOC_TYPES.map(dt => (
                    <button key={dt.value} type="button" onClick={() => setSelectedType(dt.value)}
                      style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px",
                        borderRadius:12, border:"1.5px solid",
                        borderColor: selectedType===dt.value ? "var(--accent)" : "var(--border)",
                        background: selectedType===dt.value ? "var(--bg-success)" : "var(--bg-surface-2)",
                        cursor:"pointer", transition:"all .15s", textAlign:"left" }}>
                      <dt.icon size={19} color={selectedType===dt.value ? "var(--text-success)" : "var(--text-muted)"} style={{ flexShrink:0 }} />
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:13, fontWeight:700,
                          color: selectedType===dt.value ? "var(--text-success)" : "var(--text-secondary)" }}>{dt.label}</p>
                        <p style={{ fontSize:11, color:"var(--text-muted)" }}>{dt.desc}</p>
                      </div>
                      {selectedType===dt.value && <Check size={16} color="var(--accent)" style={{ flexShrink:0 }} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !uploadMutation.isPending && fileInputRef.current?.click()}
                style={{ background: dragOver ? "var(--bg-success)" : "var(--bg-card)",
                  borderRadius:20, border:`2px dashed ${dragOver ? "var(--accent)" : "var(--border)"}`,
                  padding:"40px 24px", textAlign:"center", cursor:"pointer",
                  transition:"all .2s", boxShadow:"var(--shadow-sm)" }}>
                <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
                  {uploadMutation.isPending
                    ? <LoaderCircle size={40} color="var(--accent)" className="spin" />
                    : dragOver
                    ? <FolderOpen size={40} color="var(--accent)" />
                    : <CloudUpload size={40} color="var(--text-muted)" />}
                </div>
                <p style={{ fontWeight:700, fontSize:16, color:"var(--text-primary)", marginBottom:8 }}>
                  {uploadMutation.isPending
                    ? "Upload en cours..."
                    : dragOver
                    ? "Relâche pour uploader"
                    : `Uploader un ${DOC_TYPES.find(d=>d.value===selectedType)?.label ?? "document"}`}
                </p>
                <p style={{ fontSize:13, color:"var(--text-muted)", marginBottom:20 }}>
                  Glisse ton fichier ici ou clique pour choisir
                </p>
                <div style={{ display:"inline-flex", alignItems:"center", gap:8,
                  background: uploadMutation.isPending ? "var(--border)" : "var(--accent)",
                  color:"#fff", fontWeight:700, fontSize:14,
                  padding:"12px 24px", borderRadius:12 }}>
                  <SelectedIcon size={15} />
                  {uploadMutation.isPending ? "Upload en cours..." : "Choisir un fichier"}
                </div>
                <p style={{ fontSize:11, color:"var(--text-muted)", marginTop:12 }}>
                  PDF, JPG ou PNG · Maximum 5MB
                </p>
                <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange} style={{ display:"none" }} />
              </div>

              {vault.documents.length === 0 ? (
                <div style={{ background:"var(--bg-card)", borderRadius:20, border:"1px solid var(--border)",
                  boxShadow:"var(--shadow-sm)" }}>
                  <EmptyState variant="documents" />
                </div>
              ) : (
                <div style={{ background:"var(--bg-card)", borderRadius:20, border:"1px solid var(--border)",
                  overflow:"hidden", boxShadow:"var(--shadow-sm)" }}>
                  <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border-subtle)",
                    display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <p style={{ fontWeight:700, fontSize:14, color:"var(--text-primary)" }}>
                      Mes documents
                    </p>
                    <span style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)",
                      background:"var(--bg-surface-2)", padding:"2px 10px", borderRadius:20 }}>
                      {vault.documents.length} fichier{vault.documents.length>1?"s":""}
                    </span>
                  </div>
                  <div>
                    {vault.documents.map((doc, idx) => {
                      const docType = DOC_TYPES.find(d => d.value === doc.type);
                      const DocIcon = docType?.icon ?? FileText;
                      const date = new Date(doc.created_at).toLocaleDateString("fr-FR",
                        {day:"numeric",month:"short",year:"numeric"});
                      return (
                        <div key={doc.id} style={{ display:"flex", alignItems:"center", gap:14,
                          padding:"14px 20px",
                          borderBottom: idx < vault.documents.length-1 ? "1px solid var(--border-subtle)" : "none" }}>

                          <div style={{ width:44, height:44, borderRadius:12,
                            background:"var(--bg-surface-2)", border:"1px solid var(--border-subtle)",
                            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                            <DocIcon size={20} color="var(--text-secondary)" />
                          </div>

                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)",
                              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                              {doc.file_name}
                            </p>
                            <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:3 }}>
                              <span style={{ fontSize:11, fontWeight:700, color:"var(--accent-dark)",
                                background:"var(--bg-success)", padding:"1px 7px", borderRadius:20 }}>
                                {docType?.label ?? doc.type}
                              </span>
                              <span style={{ fontSize:11, color:"var(--text-muted)" }}>· {date}</span>
                              {doc.is_valid && (
                                <span style={{ fontSize:11, color:"var(--text-success)", fontWeight:700, display:"flex", alignItems:"center", gap:2 }}>
                                  <Check size={11} /> Valide
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0, flexWrap:"wrap", justifyContent:"flex-end" }}>
                            <DocAnalyzer docId={doc.id} fileName={doc.file_name} />
                            <a href={doc.file_path} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize:12, fontWeight:700, color:"#2563eb",
                                background:"rgba(37,99,235,.1)", padding:"6px 12px", borderRadius:10,
                                textDecoration:"none", border:"1px solid rgba(37,99,235,.25)",
                                display:"flex", alignItems:"center", gap:5 }}>
                              <Eye size={13} /> Voir
                            </a>
                            <button onClick={() => { if (confirm("Supprimer ce document ?")) deleteMutation.mutate(doc.id); }}
                              style={{ fontSize:12, fontWeight:700, color:"var(--text-danger)",
                                background:"var(--bg-danger)", padding:"6px 10px", borderRadius:10,
                                border:"1px solid var(--border-danger)", cursor:"pointer",
                                display:"flex", alignItems:"center" }}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ background:"var(--bg-warning)",
                borderRadius:16, padding:"16px 20px", border:"1px solid var(--border-warning)" }}>
                <p style={{ fontSize:13, fontWeight:700, color:"var(--text-warning)", marginBottom:8,
                  display:"flex", alignItems:"center", gap:6 }}>
                  <Lightbulb size={14} /> Conseil OpportuLink
                </p>
                <p style={{ fontSize:12, color:"var(--text-warning)", lineHeight:1.6, opacity:.9 }}>
                  Scanne tes documents en <strong>PDF haute qualité</strong> (300 DPI minimum).
                  Nomme tes fichiers clairement : <em>CV_NomPrenom_2026.pdf</em>.
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

export default function DocumentsPage() {
  return (
    <Suspense fallback={
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"80vh" }}>
        <LoaderCircle size={32} color="var(--accent)" className="spin" />
      </div>
    }>
      <DocumentsInner />
    </Suspense>
  );
}
