// components/ai/DocAnalyzer.tsx
// Bouton "Analyser IA" sur un document PDF : l'IA lit le document, en extrait des
// informations (compétences, filière, niveau, moyenne) et propose de les ajouter
// au profil — ce qui améliore ensuite la génération de CV et de lettres.
"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { useStore } from "@/store/useStore";
import { useToast } from "@/components/ui/Toast";
import { Sparkles, X, LoaderCircle, Check, Plus } from "lucide-react";

interface AnalyzeResult {
  skills?: string[];
  field?: string | null;
  level?: string | null;
  gpa?: number | null;
  summary?: string;
}

export default function DocAnalyzer({ docId, fileName }: { docId: string; fileName: string }) {
  const { user, setUser } = useStore();
  const { success, error: toastError } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  const isPdf = fileName.toLowerCase().endsWith(".pdf");
  if (!isPdf) return null;

  async function analyze() {
    setOpen(true); setLoading(true); setResult(null); setApplied(false);
    try {
      const res = await api.post<AnalyzeResult>(`/documents/${docId}/analyze`);
      setResult(res.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toastError(msg ?? "Analyse impossible.");
      setOpen(false);
    } finally { setLoading(false); }
  }

  async function applyToProfile() {
    if (!result) return;
    setApplying(true);
    try {
      const existingSkills = (user?.skills as string[]) ?? [];
      const existingSWL = (user?.skills_with_level as Record<string, number>) ?? {};
      const detected = result.skills ?? [];
      const mergedSkills = Array.from(new Set([...existingSkills, ...detected]));
      const swl = { ...existingSWL };
      detected.forEach(s => { if (!(s in swl)) swl[s] = 50; });

      const payload: Record<string, unknown> = { skills: mergedSkills, skills_with_level: swl };
      if (result.field && !user?.field) payload.field = result.field;
      if (result.level && !user?.level) payload.level = result.level;
      if (result.gpa && !user?.gpa) payload.gpa = result.gpa;

      const res = await api.put("/users/me", payload);
      setUser(res.data);
      setApplied(true);
      success("Profil enrichi depuis ton document !");
    } catch { toastError("Impossible d'enrichir le profil."); }
    finally { setApplying(false); }
  }

  return (
    <>
      <button onClick={analyze}
        style={{ fontSize:12, fontWeight:700, color:"#7c3aed", background:"rgba(124,58,237,.1)",
          padding:"6px 12px", borderRadius:10, border:"1px solid rgba(124,58,237,.25)", cursor:"pointer",
          display:"flex", alignItems:"center", gap:5 }}>
        <Sparkles size={13} /> Analyser IA
      </button>

      {open && (
        <div onClick={() => setOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)",
          zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"var(--bg-card)", borderRadius:18,
            width:"100%", maxWidth:440, maxHeight:"85vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,.25)" }}>
            <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border-subtle)",
              display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:10, background:"rgba(124,58,237,.12)",
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Sparkles size={17} color="#7c3aed" />
              </div>
              <p style={{ flex:1, fontWeight:700, fontSize:15, color:"var(--text-primary)" }}>Analyse IA du document</p>
              <button onClick={() => setOpen(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", display:"flex" }}><X size={18} /></button>
            </div>

            <div style={{ padding:20 }}>
              {loading && (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10, padding:"20px 0" }}>
                  <LoaderCircle size={28} color="#7c3aed" className="spin" />
                  <p style={{ fontSize:13, color:"var(--text-muted)" }}>L'IA lit ton document…</p>
                </div>
              )}

              {!loading && result && (
                <>
                  {result.summary && (
                    <p style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.6, marginBottom:16,
                      background:"var(--bg-surface-2)", padding:"12px 14px", borderRadius:12 }}>{result.summary}</p>
                  )}
                  <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:18 }}>
                    {(result.field || result.level || result.gpa) && (
                      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                        {result.field && <Tag label="Filière" value={result.field} />}
                        {result.level && <Tag label="Niveau" value={result.level} />}
                        {result.gpa != null && <Tag label="Moyenne" value={`${result.gpa}/20`} />}
                      </div>
                    )}
                    {result.skills && result.skills.length > 0 && (
                      <div>
                        <p style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase",
                          letterSpacing:".04em", marginBottom:7 }}>Compétences détectées</p>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                          {result.skills.map(s => (
                            <span key={s} style={{ fontSize:11.5, fontWeight:600, color:"#7c3aed",
                              background:"rgba(124,58,237,.1)", padding:"3px 10px", borderRadius:20,
                              border:"1px solid rgba(124,58,237,.2)" }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button onClick={applyToProfile} disabled={applying || applied}
                    style={{ width:"100%", padding:"12px", borderRadius:12, border:"none",
                      cursor: applying||applied ? "default" : "pointer",
                      background: applied ? "var(--bg-success)" : "linear-gradient(135deg,#7c3aed,#a78bfa)",
                      color: applied ? "var(--text-success)" : "#fff", fontWeight:700, fontSize:13.5,
                      display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                    {applied ? <><Check size={16} /> Profil enrichi</>
                      : applying ? <><LoaderCircle size={16} className="spin" /> Application…</>
                      : <><Plus size={16} /> Ajouter ces infos à mon profil</>}
                  </button>
                  <p style={{ fontSize:11, color:"var(--text-muted)", textAlign:"center", marginTop:8 }}>
                    Tes champs déjà remplis ne seront pas écrasés.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Tag({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background:"var(--bg-surface-2)", borderRadius:10, padding:"7px 12px", border:"1px solid var(--border-subtle)" }}>
      <span style={{ fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase" }}>{label}</span>
      <p style={{ fontSize:12.5, fontWeight:700, color:"var(--text-primary)" }}>{value}</p>
    </div>
  );
}
