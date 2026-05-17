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

type AppMethod = {
  type: "form"|"email"|"platform"|"external";
  label: string; icon: string; color: string; bg: string; border: string;
  cta: string; email?: string; steps: string[];
};

function detectMethod(sourceUrl: string, description: string): AppMethod {
  const url  = (sourceUrl || "").toLowerCase();
  const desc = (description || "").toLowerCase();

  if (url.includes("forms.google") || url.includes("typeform") || url.includes("jotform") ||
      desc.includes("formulaire en ligne") || desc.includes("fill out the form") ||
      desc.includes("remplir le formulaire") || desc.includes("online application")) {
    return {
      type:"form", label:"Formulaire en ligne", icon:"📝",
      color:"#7c3aed", bg:"#f3e8ff", border:"#ddd6fe", cta:"Ouvrir le formulaire",
      steps:[
        "Clique sur le bouton pour accéder au formulaire officiel",
        "Prépare tes documents avant de commencer (CV, relevés, lettre)",
        "Remplis toutes les sections — ne laisse rien vide",
        "Soumets avant la deadline — pas de modifications après envoi",
      ],
    };
  }

  const emailMatch = (sourceUrl+" "+description).match(/([a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch || url.startsWith("mailto:") ||
      (desc.includes("email") && (desc.includes("envoyer") || desc.includes("send") || desc.includes("postuler"))) ||
      desc.includes("candidature par email") || desc.includes("apply by email")) {
    const email = emailMatch?.[0] || url.replace("mailto:","");
    return {
      type:"email", label:"Candidature par email", icon:"📧",
      color:"#0369a1", bg:"#e0f2fe", border:"#bae6fd",
      cta: email ? `Écrire à ${email}` : "Envoyer ma candidature", email,
      steps:[
        `Objet de l'email : "Candidature — [Ton nom complet]"`,
        "Attache ton CV (PDF), ta lettre de motivation et tes relevés",
        email ? `Adresse d'envoi : ${email}` : "Utilise l'adresse indiquée dans la description",
        "Garde une copie de l'email envoyé pour ton suivi",
      ],
    };
  }

  if (url.includes("daad.de") || url.includes("campusfrance") ||
      url.includes("erasmus") || url.includes("auf.org") ||
      url.includes("opportunitydesk") || url.includes("scholars4dev")) {
    return {
      type:"platform", label:"Portail officiel", icon:"🎓",
      color:"#059669", bg:"#f0fdf4", border:"#bbf7d0", cta:"Accéder au portail",
      steps:[
        "Crée un compte sur le portail si tu n'en as pas encore",
        "Complète ton dossier de candidature en ligne étape par étape",
        "Upload tous les documents requis en PDF (scan lisible)",
        "Soumets au moins 3 jours avant la deadline — les serveurs saturent",
      ],
    };
  }

  if (url.includes("linkedin.com")) {
    return {
      type:"platform", label:"Via LinkedIn", icon:"💼",
      color:"#0a66c2", bg:"#eff6ff", border:"#bfdbfe", cta:"Voir sur LinkedIn",
      steps:[
        "Connecte-toi à ton compte LinkedIn",
        "Assure-toi que ton profil est complet et à jour",
        "Clique sur 'Postuler' directement sur la page de l'offre",
        "Personnalise ta lettre de motivation si le champ est disponible",
      ],
    };
  }

  return {
    type:"external", label:"Site officiel", icon:"🌐",
    color:"#374151", bg:"#f9fafb", border:"#e5e7eb", cta:"Voir les instructions officielles",
    steps:[
      "Consulte la page officielle pour les instructions complètes",
      "Prépare tous tes documents en PDF avant de commencer",
      "Respecte le format demandé (taille max généralement 5MB par fichier)",
      "Note la deadline dans ton calendrier et postule au moins 3 jours avant",
    ],
  };
}

function dl(d: string|null) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

function MethodCard({ opp }: { opp: Opp }) {
  const m = detectMethod(opp.source_url, opp.description);
  function handleCTA() {
    if (m.type === "email" && m.email) {
      window.open(`mailto:${m.email}?subject=Candidature — &body=Bonjour,%0A%0AJe me permets de vous adresser ma candidature pour l'opportunité "${opp.title}".%0A%0ACordialement,`,"_blank");
    } else if (opp.source_url) {
      window.open(opp.source_url,"_blank","noopener,noreferrer");
    }
  }
  return (
    <div style={{ background:m.bg, border:`1.5px solid ${m.border}`, borderRadius:18, overflow:"hidden" }}>
      <div style={{ padding:"16px 20px 12px", display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:44, height:44, borderRadius:12, background:"rgba(255,255,255,0.7)",
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
          {m.icon}
        </div>
        <div>
          <p style={{ fontSize:11, fontWeight:700, color:m.color, textTransform:"uppercase",
            letterSpacing:".06em", marginBottom:2 }}>Méthode de candidature</p>
          <p style={{ fontSize:16, fontWeight:900, color:"#0f172a" }}>{m.label}</p>
        </div>
      </div>
      <div style={{ padding:"0 20px 16px", display:"flex", flexDirection:"column", gap:8 }}>
        {m.steps.map((step,i) => (
          <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
            <div style={{ width:24, height:24, borderRadius:"50%", flexShrink:0,
              background:m.color, color:"#fff", display:"flex", alignItems:"center",
              justifyContent:"center", fontSize:11, fontWeight:800, marginTop:1 }}>
              {i+1}
            </div>
            <p style={{ fontSize:13, color:"#374151", lineHeight:1.55, flex:1 }}>{step}</p>
          </div>
        ))}
      </div>
      <div style={{ padding:"12px 20px 18px" }}>
        <button onClick={handleCTA} style={{ width:"100%", fontWeight:800, fontSize:14,
          padding:"13px", borderRadius:13, border:"none", cursor:"pointer",
          background:m.color, color:"#fff", boxShadow:`0 4px 16px ${m.color}44`,
          transition:"all .15s", display:"flex", alignItems:"center",
          justifyContent:"center", gap:8 }}>
          <span style={{ fontSize:16 }}>{m.icon}</span>{m.cta} →
        </button>
      </div>
    </div>
  );
}

function PrepSection({ oppId }: { oppId: string }) {
  const { data, isLoading } = useQuery<PrepScore>({
    queryKey: ["prep", oppId],
    queryFn: async () => (await api.get(`/opportunities/${oppId}/prep-score`)).data,
  });
  if (isLoading) return <div style={{ height:120, background:"#f8fafc", borderRadius:16 }} className="animate-pulse" />;
  if (!data) return null;
  const barColor = data.score>=70?"#10b981":data.score>=40?"#f59e0b":"#ef4444";
  const theme = data.score>=70?{bg:"#f0fdf4",border:"#bbf7d0",text:"#065f46"}
    :data.score>=40?{bg:"#fffbeb",border:"#fde68a",text:"#78350f"}
    :{bg:"#fef2f2",border:"#fecaca",text:"#7f1d1d"};
  const size=80; const r=32; const circ=2*Math.PI*r; const dash=(data.score/100)*circ;
  return (
    <div style={{ background:theme.bg, border:`1.5px solid ${theme.border}`, borderRadius:18, padding:20 }}>
      <p style={{ fontWeight:800, fontSize:14, color:"#0f172a", marginBottom:16 }}>Score de préparation</p>
      <div style={{ display:"flex", gap:16, alignItems:"center", marginBottom:16 }}>
        <div style={{ position:"relative", flexShrink:0 }}>
          <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={8} />
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={barColor} strokeWidth={8}
              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
              style={{ transition:"stroke-dasharray .7s ease" }} />
          </svg>
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:18, fontWeight:900, color:barColor, lineHeight:1 }}>{data.score}</span>
            <span style={{ fontSize:9, fontWeight:700, color:"#94a3b8" }}>/ 100</span>
          </div>
        </div>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:13, color:"#374151", lineHeight:1.55 }}>{data.message}</p>
        </div>
      </div>
      {data.missing.map((m,i) => (
        <div key={i} style={{ display:"flex", gap:10, background:"rgba(255,255,255,0.8)",
          borderRadius:10, padding:"8px 12px", marginBottom:6,
          border:"1px solid rgba(255,255,255,0.5)" }}>
          <span style={{ fontSize:14, flexShrink:0 }}>❌</span>
          <div>
            <p style={{ fontSize:12, fontWeight:700, color:theme.text }}>{m.label}</p>
            <p style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>{m.fix}</p>
          </div>
        </div>
      ))}
      {data.missing.length===0 && (
        <div style={{ background:"rgba(255,255,255,0.8)", borderRadius:10, padding:"8px 12px",
          display:"flex", gap:10, alignItems:"center" }}>
          <span style={{ fontSize:16 }}>🎉</span>
          <p style={{ fontSize:13, fontWeight:700, color:"#065f46" }}>Dossier complet !</p>
        </div>
      )}
    </div>
  );
}

function ApplySection({ oppId }: { oppId: string }) {
  const router = useRouter();
  const { success, error: toastError, warning } = useToast();
  const [state, setState] = useState<"idle"|"loading"|"done"|"already">("idle");
  async function apply() {
    setState("loading");
    try {
      await api.post("/applications", { opportunity_id: oppId });
      setState("done");
      success("Candidature créée !");
    } catch (err: unknown) {
      const s = (err as { response?: { status?: number } }).response?.status;
      if (s===400) { setState("already"); warning("Tu as déjà candidaté."); }
      else { setState("idle"); toastError("Erreur. Réessaie."); }
    }
  }
  if (state==="done"||state==="already") {
    return (
      <button onClick={() => router.push("/dashboard/applications")}
        style={{ width:"100%", background:"#f1f5f9", color:"#374151", fontWeight:700,
          fontSize:14, padding:"14px", borderRadius:14, border:"1px solid #e2e8f0", cursor:"pointer" }}>
        {state==="done"?"✓ Voir mes candidatures →":"Déjà candidaté → Voir mes candidatures"}
      </button>
    );
  }
  return (
    <button onClick={apply} disabled={state==="loading"}
      style={{ width:"100%", fontWeight:800, fontSize:15, padding:"16px", borderRadius:14, border:"none",
        cursor:state==="loading"?"not-allowed":"pointer",
        background:state==="loading"?"#d1d5db":"linear-gradient(135deg,#059669,#0d9488)",
        color:"#fff", boxShadow:"0 4px 16px rgba(5,150,105,0.3)", transition:"all .15s" }}>
      {state==="loading"?"Création...":"Suivre cette candidature →"}
    </button>
  );
}

function LetterSection({ oppId }: { oppId: string }) {
  const { error: toastError } = useToast();
  const [state, setState] = useState<"idle"|"loading"|"done">("idle");
  const [letter, setLetter] = useState("");
  const [words, setWords] = useState(0);
  const [copied, setCopied] = useState(false);
  async function generate() {
    setState("loading");
    try {
      const res = await api.post<LetterResp>("/ai/generate-letter",{ opportunity_id:oppId });
      setLetter(res.data.letter); setWords(res.data.word_count); setState("done");
    } catch { setState("idle"); toastError("Erreur IA. Réessaie."); }
  }
  async function copy() {
    await navigator.clipboard.writeText(letter);
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  }
  return (
    <div style={{ background:"#fff", borderRadius:16, border:"1px solid #f1f5f9", overflow:"hidden" }}>
      <div style={{ padding:"16px 20px", borderBottom:state==="done"?"1px solid #f8fafc":"none" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <div>
            <p style={{ fontWeight:800, fontSize:14, color:"#0f172a" }}>Lettre de motivation IA</p>
            <p style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>Llama 3.3 70B · Personnalisée</p>
          </div>
          <span style={{ fontSize:10, fontWeight:800, color:"#7c3aed", background:"#f3e8ff", padding:"3px 8px", borderRadius:20 }}>IA</span>
        </div>
        <button onClick={generate} disabled={state==="loading"}
          style={{ width:"100%", fontWeight:700, fontSize:13, padding:"11px", borderRadius:12,
            border:"1.5px solid #7c3aed", background:"transparent",
            cursor:state==="loading"?"not-allowed":"pointer",
            color:state==="loading"?"#9ca3af":"#7c3aed", transition:"all .15s" }}
          className="hover:bg-purple-50">
          {state==="loading"?"Génération en cours...":state==="done"?"Régénérer":"Générer ma lettre →"}
        </button>
      </div>
      {state==="done"&&letter&&(
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"10px 20px", background:"#f8fafc", borderBottom:"1px solid #f1f5f9" }}>
            <span style={{ fontSize:11, color:"#94a3b8" }}>{words} mots</span>
            <button onClick={copy} style={{ fontSize:11, fontWeight:700, color:"#7c3aed",
              background:"none", border:"none", cursor:"pointer" }}>
              {copied?"✓ Copié !":"Copier"}
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
  if (isError||!opp) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:12 }}>
      <p style={{ fontSize:40 }}>😕</p>
      <p style={{ fontSize:15, fontWeight:700, color:"#374151" }}>Opportunité introuvable</p>
      <button onClick={() => router.push("/dashboard")} style={{ fontSize:13, fontWeight:700,
        color:"#059669", background:"#f0fdf4", border:"1px solid #bbf7d0",
        padding:"8px 20px", borderRadius:10, cursor:"pointer" }}>← Retour au feed</button>
    </div>
  );

  const cfg = TYPE[opp.type]??{label:opp.type,color:"#6b7280",bg:"#f3f4f6",gradient:"135deg,#374151,#6b7280"};
  const d   = dl(opp.deadline);

  return (
    <div style={{ height:"100%", overflowY:"auto", background:"#f8fafc" }}>

      {/* Hero */}
      <div style={{ background:`linear-gradient(${cfg.gradient})`, padding:"20px 24px 32px",
        position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-60, right:-30, width:220, height:220,
          background:"rgba(255,255,255,0.06)", borderRadius:"50%", pointerEvents:"none" }} />

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22 }}>
          <button onClick={() => router.back()} style={{ display:"flex", alignItems:"center", gap:6,
            fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.85)",
            background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.15)",
            padding:"7px 14px", borderRadius:10, cursor:"pointer" }}>
            ← Retour
          </button>
          <div style={{ display:"flex", gap:8 }}>
            <ShareButton title={opp.title} oppId={id} />
            <SaveButton oppId={id} />
          </div>
        </div>

        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
          <span style={{ fontSize:11, fontWeight:800, color:"rgba(255,255,255,0.95)",
            background:"rgba(255,255,255,0.18)", padding:"4px 12px", borderRadius:20,
            border:"1px solid rgba(255,255,255,0.2)" }}>{cfg.label}</span>
          {opp.is_verified&&(
            <span style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.9)",
              background:"rgba(255,255,255,0.12)", padding:"4px 12px", borderRadius:20,
              border:"1px solid rgba(255,255,255,0.15)" }}>✓ Vérifié</span>
          )}
          {d!==null&&d>=0&&d<=14&&(
            <span style={{ fontSize:11, fontWeight:800, color:"#fff",
              background:d<=7?"rgba(239,68,68,0.8)":"rgba(245,158,11,0.8)",
              padding:"4px 12px", borderRadius:20 }}>
              {d===0?"🔥 Aujourd'hui !":d<=7?`🔥 J-${d}`:`⚡ J-${d}`}
            </span>
          )}
        </div>

        <h1 style={{ fontWeight:900, fontSize:22, color:"#fff", lineHeight:1.3, marginBottom:10 }}>
          {opp.title}
        </h1>
        <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
          <span style={{ fontSize:13, color:"rgba(255,255,255,0.8)" }}>🌍 {opp.country}</span>
          {opp.deadline&&(
            <span style={{ fontSize:13, color:"rgba(255,255,255,0.8)" }}>
              📅 {new Date(opp.deadline).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}
            </span>
          )}
          <span style={{ fontSize:13, color:"rgba(255,255,255,0.8)" }}>⭐ Fiabilité {opp.reliability_score}/100</span>
        </div>
      </div>

      {/* Contenu */}
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"24px 24px 48px",
        display:"grid", gridTemplateColumns:"1fr 380px", gap:24, alignItems:"start" }}>

        {/* Colonne gauche */}
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

          {/* Méthode de candidature */}
          <MethodCard opp={opp} />

          {/* Description COMPLÈTE — aucune troncature */}
          <div style={{ background:"#fff", borderRadius:18, border:"1px solid #f1f5f9",
            padding:24, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
            <p style={{ fontWeight:800, fontSize:15, color:"#0f172a", marginBottom:16 }}>
              📄 À propos de cette opportunité
            </p>
            {/* On affiche le texte complet, paragraphe par paragraphe */}
            {opp.description.split(/\n+/).filter(p => p.trim()).map((para, i) => (
              <p key={i} style={{ fontSize:14, color:"#374151", lineHeight:1.85, marginBottom:12 }}>
                {para.trim()}
              </p>
            ))}
            {/* Si une seule ligne (pas de \n), afficher directement */}
            {!opp.description.includes("\n") && (
              <p style={{ fontSize:14, color:"#374151", lineHeight:1.85 }}>{opp.description}</p>
            )}
          </div>

          {/* Critères d'éligibilité */}
          <div style={{ background:"#fff", borderRadius:18, border:"1px solid #f1f5f9",
            padding:24, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
            <p style={{ fontWeight:800, fontSize:15, color:"#0f172a", marginBottom:16 }}>
              ✅ Critères d'éligibilité
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[
                { icon:"🎓", label:"Niveau requis",   val: opp.required_level.length>0 ? opp.required_level.join(", ") : "Tous niveaux — ouvert à tous" },
                { icon:"📚", label:"Filières",         val: opp.required_fields.length>0 ? opp.required_fields.join(", ") : "Toutes filières — ouvert à tous" },
                { icon:"🗣️", label:"Langues",          val: opp.required_languages.length>0 ? opp.required_languages.map(l=>LANGS[l]??l).join(", ") : "Aucune langue spécifique" },
                { icon:"📊", label:"Moyenne min.",     val: opp.min_gpa ? `${opp.min_gpa}/20` : "Aucune moyenne requise" },
                { icon:"🛡️", label:"Fiabilité",        val: `${opp.reliability_score}/100` },
                { icon:"📅", label:"Date limite",      val: opp.deadline
                    ? new Date(opp.deadline).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})
                    : "Non précisée" },
              ].map(({icon,label,val}) => (
                <div key={label} style={{ background:"#f8fafc", borderRadius:12, padding:"12px 14px",
                  border:"1px solid #f1f5f9" }}>
                  <p style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase",
                    letterSpacing:".05em", marginBottom:6 }}>{icon} {label}</p>
                  <p style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Deadline visuelle */}
          {opp.deadline&&d!==null&&d>=0&&(
            <div style={{ background:d<=7?"#fef2f2":d<=14?"#fffbeb":"#f0fdf4",
              border:`1.5px solid ${d<=7?"#fecaca":d<=14?"#fde68a":"#bbf7d0"}`,
              borderRadius:18, padding:"18px 22px",
              display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <p style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase",
                  letterSpacing:".05em", marginBottom:6 }}>⏰ Temps restant</p>
                <p style={{ fontSize:15, fontWeight:800,
                  color:d<=7?"#dc2626":d<=14?"#d97706":"#059669" }}>
                  {new Date(opp.deadline).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}
                </p>
              </div>
              <div style={{ textAlign:"right" }}>
                <p style={{ fontSize:48, fontWeight:900, lineHeight:1,
                  color:d<=7?"#dc2626":d<=14?"#d97706":"#059669" }}>{d}</p>
                <p style={{ fontSize:12, fontWeight:700,
                  color:d<=7?"#dc2626":d<=14?"#d97706":"#059669" }}>
                  jour{d>1?"s":""} restant{d>1?"s":""}
                </p>
              </div>
            </div>
          )}

          <CVBuilder oppId={id} />

          {opp.source_url&&(
            <a href={opp.source_url} target="_blank" rel="noopener noreferrer"
              style={{ display:"block", textAlign:"center", fontSize:12, color:"#94a3b8",
                textDecoration:"none", padding:"8px" }} className="hover:text-emerald-600">
              🔗 Voir la source officielle →
            </a>
          )}
        </div>

        {/* Colonne droite sticky */}
        <div style={{ display:"flex", flexDirection:"column", gap:16, position:"sticky", top:20 }}>
          <PrepSection oppId={id} />
          <ApplySection oppId={id} />
          <LetterSection oppId={id} />
        </div>
      </div>
    </div>
  );
}
