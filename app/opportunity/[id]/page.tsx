"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import CVBuilder from "@/components/ai/CVBuilder";
import SaveButton from "@/components/opportunity/SaveButton";
import ShareButton from "@/components/opportunity/ShareButton";
import { useToast } from "@/components/ui/Toast";

interface Opp {
  id: string; title: string; type: string; description: string;
  source_url: string; deadline: string | null; country: string;
  required_level: string[]; required_fields: string[];
  required_languages: string[]; min_gpa: number | null;
  reliability_score: number; is_verified: boolean;
}
interface PrepScore { score: number; missing: { label: string; fix: string }[]; message: string }
interface LetterResp { letter: string; opportunity_title: string; word_count: number }

const TYPE: Record<string, { label: string; color: string; bg: string; gradient: string }> = {
  bourse:   { label:"Bourse",   color:"#7c3aed", bg:"#f3e8ff", gradient:"135deg,#4c1d95,#7c3aed" },
  stage:    { label:"Stage",    color:"#2563eb", bg:"#dbeafe", gradient:"135deg,#1e3a8a,#3b82f6" },
  emploi:   { label:"Emploi",   color:"#059669", bg:"#d1fae5", gradient:"135deg,#064e3b,#10b981" },
  echange:  { label:"Échange",  color:"#d97706", bg:"#fef3c7", gradient:"135deg,#78350f,#f59e0b" },
  concours: { label:"Concours", color:"#dc2626", bg:"#fee2e2", gradient:"135deg,#7f1d1d,#ef4444" },
};
const LANGS: Record<string, string> = {
  fr:"Français", en:"Anglais", de:"Allemand",
  es:"Espagnol", zh:"Chinois", ar:"Arabe", pt:"Portugais"
};

function dl(d: string | null) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

// ── PrepScore ──────────────────────────────────────────────────
function PrepSection({ oppId }: { oppId: string }) {
  const { data, isLoading } = useQuery<PrepScore>({
    queryKey: ["prep", oppId],
    queryFn: async () => (await api.get(`/opportunities/${oppId}/prep-score`)).data,
  });
  if (isLoading) return <div style={{ height: 120, background: "#f8fafc", borderRadius: 14 }} className="animate-pulse" />;
  if (!data) return null;
  const barColor = data.score >= 70 ? "#10b981" : data.score >= 40 ? "#f59e0b" : "#ef4444";
  const bg = data.score >= 70 ? { bg:"#f0fdf4", border:"#bbf7d0" } : data.score >= 40 ? { bg:"#fffbeb", border:"#fde68a" } : { bg:"#fef2f2", border:"#fecaca" };
  return (
    <div style={{ background: bg.bg, border: `1px solid ${bg.border}`, borderRadius: 16, padding: 20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <p style={{ fontWeight:800, fontSize:14, color:"#0f172a" }}>Score de préparation</p>
        <span style={{ fontWeight:900, fontSize:24, color:"#0f172a" }}>{data.score}%</span>
      </div>
      <div style={{ background:"rgba(255,255,255,0.7)", height:8, borderRadius:4, overflow:"hidden", marginBottom:12 }}>
        <div style={{ height:"100%", width:`${data.score}%`, background:barColor, borderRadius:4, transition:"width .7s" }} />
      </div>
      <p style={{ fontSize:13, color:"#374151", marginBottom:data.missing.length ? 14 : 0 }}>{data.message}</p>
      {data.missing.map((m, i) => (
        <div key={i} style={{ display:"flex", gap:10, background:"rgba(255,255,255,0.8)", borderRadius:10, padding:"8px 12px", marginBottom:6 }}>
          <span style={{ color:"#ef4444", fontWeight:800, fontSize:12, flexShrink:0 }}>✕</span>
          <div>
            <p style={{ fontSize:12, fontWeight:700, color:"#7f1d1d" }}>{m.label}</p>
            <p style={{ fontSize:11, color:"#b91c1c" }}>{m.fix}</p>
          </div>
        </div>
      ))}
      {data.missing.length === 0 && (
        <div style={{ background:"rgba(255,255,255,0.8)", borderRadius:10, padding:"8px 12px", fontSize:12, fontWeight:700, color:"#065f46" }}>
          ✓ Dossier complet pour cette opportunité !
        </div>
      )}
    </div>
  );
}

// ── Postuler ──────────────────────────────────────────────────
function ApplySection({ oppId, oppTitle }: { oppId: string; oppTitle: string }) {
  const router = useRouter();
  const { success, error: toastError, warning } = useToast();
  const [state, setState] = useState<"idle"|"loading"|"done"|"already">("idle");

  async function apply() {
    setState("loading");
    try {
      await api.post("/applications", { opportunity_id: oppId });
      setState("done");
      success("Candidature créée ! Retrouve-la dans tes candidatures.");
    } catch (err: unknown) {
      const s = (err as { response?: { status?: number } }).response?.status;
      if (s === 400) { setState("already"); warning("Tu as déjà une candidature pour cette opportunité."); }
      else { setState("idle"); toastError("Erreur. Réessaie."); }
    }
  }

  if (state === "done" || state === "already") {
    return (
      <button onClick={() => router.push("/dashboard/applications")}
        style={{ width:"100%", background:"#f1f5f9", color:"#374151", fontWeight:700,
          fontSize:14, padding:"14px", borderRadius:14, border:"none", cursor:"pointer" }}>
        {state === "done" ? "✓ Voir mes candidatures →" : "Déjà candidaté → Voir mes candidatures"}
      </button>
    );
  }

  return (
    <button onClick={apply} disabled={state === "loading"}
      style={{ width:"100%", fontWeight:800, fontSize:15, padding:"16px", borderRadius:14, border:"none",
        cursor:state === "loading" ? "not-allowed" : "pointer",
        background:state === "loading" ? "#d1d5db" : "linear-gradient(135deg,#059669,#0d9488)",
        color:"#fff", boxShadow:"0 4px 16px rgba(5,150,105,0.3)", transition:"all .15s" }}>
      {state === "loading" ? "Création..." : "Postuler à cette opportunité →"}
    </button>
  );
}

// ── Lettre IA ────────────────────────────────────────────────
function LetterSection({ oppId }: { oppId: string }) {
  const { error: toastError } = useToast();
  const [state, setState] = useState<"idle"|"loading"|"done">("idle");
  const [letter, setLetter] = useState("");
  const [words, setWords] = useState(0);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setState("loading");
    try {
      const res = await api.post<LetterResp>("/ai/generate-letter", { opportunity_id: oppId });
      setLetter(res.data.letter);
      setWords(res.data.word_count);
      setState("done");
    } catch { setState("idle"); toastError("Erreur IA. Réessaie."); }
  }

  async function copy() {
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ background:"#fff", borderRadius:16, border:"1px solid #f1f5f9", overflow:"hidden" }}>
      <div style={{ padding:"16px 20px", borderBottom: state === "done" ? "1px solid #f8fafc" : "none" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <div>
            <p style={{ fontWeight:800, fontSize:14, color:"#0f172a" }}>Lettre de motivation IA</p>
            <p style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>Llama 3.3 70B · Personnalisée avec ton profil</p>
          </div>
          <span style={{ fontSize:10, fontWeight:800, color:"#7c3aed", background:"#f3e8ff", padding:"3px 8px", borderRadius:20 }}>IA</span>
        </div>
        <button onClick={state === "idle" ? generate : generate} disabled={state === "loading"}
          style={{ width:"100%", fontWeight:700, fontSize:13, padding:"11px", borderRadius:12,
            border:"1.5px solid #7c3aed", background:"transparent", cursor:state === "loading" ? "not-allowed" : "pointer",
            color:state === "loading" ? "#9ca3af" : "#7c3aed", transition:"all .15s" }}
          className="hover:bg-purple-50">
          {state === "loading" ? "Génération en cours (5-10 sec)..." : state === "done" ? "Régénérer la lettre" : "Générer ma lettre →"}
        </button>
      </div>
      {state === "done" && letter && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"10px 20px", background:"#f8fafc", borderBottom:"1px solid #f1f5f9" }}>
            <span style={{ fontSize:11, color:"#94a3b8" }}>{words} mots</span>
            <button onClick={copy} style={{ fontSize:11, fontWeight:700, color:"#7c3aed",
              background:"none", border:"none", cursor:"pointer" }}>
              {copied ? "✓ Copié !" : "Copier la lettre"}
            </button>
          </div>
          <div style={{ padding:"16px 20px", maxHeight:300, overflowY:"auto" }}>
            <p style={{ fontSize:13, color:"#374151", lineHeight:1.7, whiteSpace:"pre-wrap" }}>{letter}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────
export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const { data: opp, isLoading, isError } = useQuery<Opp>({
    queryKey: ["opportunity", id],
    queryFn: async () => (await api.get(`/opportunities/${id}`)).data,
  });

  if (isLoading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%" }}>
      <div className="animate-spin" style={{ width:32, height:32, border:"4px solid #10b981", borderTopColor:"transparent", borderRadius:"50%" }} />
    </div>
  );

  if (isError || !opp) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:12 }}>
      <p style={{ fontSize:40 }}>😕</p>
      <p style={{ fontSize:15, fontWeight:700, color:"#374151" }}>Opportunité introuvable</p>
      <button onClick={() => router.push("/dashboard")}
        style={{ fontSize:13, fontWeight:700, color:"#059669", background:"#f0fdf4",
          border:"1px solid #bbf7d0", padding:"8px 20px", borderRadius:10, cursor:"pointer" }}>
        ← Retour au feed
      </button>
    </div>
  );

  const cfg = TYPE[opp.type] ?? { label:opp.type, color:"#6b7280", bg:"#f3f4f6", gradient:"135deg,#374151,#6b7280" };
  const d   = dl(opp.deadline);

  return (
    <div style={{ height:"100%", overflowY:"auto", background:"#f8fafc" }}>

      {/* ── Hero banner ──────────────────────────────────── */}
      <div style={{ background:`linear-gradient(${cfg.gradient})`, padding:"20px 24px 28px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-40, right:40, width:200, height:200,
          background:"rgba(255,255,255,0.05)", borderRadius:"50%", pointerEvents:"none" }} />

        {/* Back + actions */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <button onClick={() => router.back()}
            style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, fontWeight:700,
              color:"rgba(255,255,255,0.8)", background:"rgba(255,255,255,0.1)", border:"none",
              padding:"7px 14px", borderRadius:10, cursor:"pointer" }}>
            ← Retour
          </button>
          <div style={{ display:"flex", gap:8 }}>
            <ShareButton title={opp.title} oppId={id} />
            <SaveButton oppId={id} />
          </div>
        </div>

        {/* Titre */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:10 }}>
          <span style={{ fontSize:11, fontWeight:800, color:"rgba(255,255,255,0.9)", background:"rgba(255,255,255,0.15)",
            padding:"3px 10px", borderRadius:20 }}>
            {cfg.label}
          </span>
          {opp.is_verified && (
            <span style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.8)",
              background:"rgba(255,255,255,0.1)", padding:"3px 10px", borderRadius:20 }}>
              ✓ Vérifié
            </span>
          )}
          {d !== null && d >= 0 && d <= 14 && (
            <span style={{ fontSize:11, fontWeight:800, color:"#fff", background:"rgba(239,68,68,0.7)",
              padding:"3px 10px", borderRadius:20 }}>
              {d <= 7 ? `🔥 J-${d}` : `J-${d}`}
            </span>
          )}
        </div>

        <h1 style={{ fontWeight:900, fontSize:22, color:"#fff", lineHeight:1.3, marginBottom:8 }}>
          {opp.title}
        </h1>
        <p style={{ fontSize:13, color:"rgba(255,255,255,0.7)" }}>🌍 {opp.country}</p>
      </div>

      {/* ── Contenu 2 colonnes ────────────────────────────── */}
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"24px 24px 48px",
        display:"grid", gridTemplateColumns:"1fr 360px", gap:24, alignItems:"start" }}>

        {/* Colonne gauche — description + critères */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Description */}
          <div style={{ background:"#fff", borderRadius:16, border:"1px solid #f1f5f9", padding:24,
            boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
            <p style={{ fontWeight:800, fontSize:15, color:"#0f172a", marginBottom:16 }}>À propos</p>
            <p style={{ fontSize:14, color:"#374151", lineHeight:1.75 }}>{opp.description}</p>
          </div>

          {/* Critères d'éligibilité */}
          <div style={{ background:"#fff", borderRadius:16, border:"1px solid #f1f5f9", padding:24,
            boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
            <p style={{ fontWeight:800, fontSize:15, color:"#0f172a", marginBottom:16 }}>Critères d'éligibilité</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {[
                { label:"Niveau requis", val:opp.required_level.join(", ") || "Tous niveaux" },
                { label:"Filières", val:opp.required_fields.join(", ") || "Toutes filières" },
                { label:"Langues", val:opp.required_languages.map(l => LANGS[l] ?? l).join(", ") || "Non précisé" },
                { label:"Moyenne min.", val:opp.min_gpa ? `${opp.min_gpa}/20` : "Non requise" },
                { label:"Fiabilité", val:`${opp.reliability_score}/100` },
                { label:"Deadline", val:opp.deadline ? new Date(opp.deadline).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}) : "Non précisée" },
              ].map(({ label, val }) => (
                <div key={label} style={{ background:"#f8fafc", borderRadius:12, padding:"12px 14px" }}>
                  <p style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase",
                    letterSpacing:".05em", marginBottom:4 }}>{label}</p>
                  <p style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Deadline visuelle */}
          {opp.deadline && d !== null && (
            <div style={{
              background: d <= 7 ? "#fef2f2" : d <= 14 ? "#fffbeb" : "#fff",
              border: `1px solid ${d <= 7 ? "#fecaca" : d <= 14 ? "#fde68a" : "#f1f5f9"}`,
              borderRadius:16, padding:"16px 20px",
              display:"flex", alignItems:"center", justifyContent:"space-between",
            }}>
              <div>
                <p style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase",
                  letterSpacing:".05em", marginBottom:4 }}>Date limite</p>
                <p style={{ fontSize:15, fontWeight:800, color:d <= 7 ? "#dc2626" : "#0f172a" }}>
                  {new Date(opp.deadline).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}
                </p>
              </div>
              {d >= 0 && (
                <div style={{ textAlign:"right" }}>
                  <p style={{ fontSize:36, fontWeight:900, lineHeight:1, color:d <= 7 ? "#dc2626" : "#94a3b8" }}>{d}</p>
                  <p style={{ fontSize:11, color:d <= 7 ? "#dc2626" : "#94a3b8", fontWeight:600 }}>jours</p>
                </div>
              )}
            </div>
          )}

          {/* CVBuilder */}
          <CVBuilder oppId={id} />

          {/* Source */}
          {opp.source_url && (
            <a href={opp.source_url} target="_blank" rel="noopener noreferrer"
              style={{ display:"block", textAlign:"center", fontSize:13, color:"#94a3b8",
                textDecoration:"underline", padding:"8px" }}>
              Voir la source officielle →
            </a>
          )}
        </div>

        {/* Colonne droite — sticky actions */}
        <div style={{ display:"flex", flexDirection:"column", gap:16, position:"sticky", top:20 }}>

          {/* PrepScore */}
          <PrepSection oppId={id} />

          {/* Postuler */}
          <ApplySection oppId={id} oppTitle={opp.title} />

          {/* Lettre IA */}
          <LetterSection oppId={id} />
        </div>
      </div>
    </div>
  );
}
