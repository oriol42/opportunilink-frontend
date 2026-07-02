"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import CVBuilder from "@/components/ai/CVBuilder";
import SaveButton from "@/components/opportunity/SaveButton";
import ShareButton from "@/components/opportunity/ShareButton";
import ReportButton from "@/components/opportunity/ReportButton";
import { useToast } from "@/components/ui/Toast";
import Badge from "@/components/ui/Badge";
import ScoreRing from "@/components/ui/ScoreRing";
import {
  ArrowLeft, ShieldCheck, Flame, Globe, CalendarClock, FileText, Mail,
  GraduationCap, Link2, X, PartyPopper, ListChecks, Percent, Clock,
  SearchX, ExternalLink, Copy, Check, LucideIcon, Languages as LanguagesIcon,
} from "lucide-react";
import { typeConfig, daysLeft, reliabilityMeta } from "@/lib/opportunityHelpers";

interface Opp {
  id: string; title: string; type: string; description: string;
  source_url: string; deadline: string | null; country: string;
  required_level: string[]; required_fields: string[];
  required_languages: string[]; min_gpa: number | null;
  reliability_score: number; is_verified: boolean;
}
interface PrepScore { score: number; missing: { label: string; fix: string }[]; message: string }
interface LetterResp { letter: string; opportunity_title: string; word_count: number }

const LANGS: Record<string, string> = {
  fr:"Français", en:"Anglais", de:"Allemand",
  es:"Espagnol", zh:"Chinois", ar:"Arabe", pt:"Portugais"
};

type AppMethod = {
  icon: LucideIcon; label: string; color: string; bg: string; border: string;
  cta: string; email?: string; steps: string[];
};

function detectMethod(sourceUrl: string, description: string): AppMethod {
  const url  = (sourceUrl || "").toLowerCase();
  const desc = (description || "").toLowerCase();

  if (url.includes("forms.google") || url.includes("typeform") || url.includes("jotform") ||
      desc.includes("formulaire en ligne") || desc.includes("fill out the form") ||
      desc.includes("remplir le formulaire") || desc.includes("online application")) {
    return {
      icon: FileText, label:"Formulaire en ligne",
      color:"#7c3aed", bg:"rgba(124,58,237,.1)", border:"rgba(124,58,237,.25)", cta:"Ouvrir le formulaire",
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
      icon: Mail, label:"Candidature par email",
      color:"#0369a1", bg:"rgba(3,105,161,.1)", border:"rgba(3,105,161,.25)",
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
      icon: GraduationCap, label:"Portail officiel",
      color:"#059669", bg:"rgba(5,150,105,.1)", border:"rgba(5,150,105,.25)", cta:"Accéder au portail",
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
      icon: Link2, label:"Via LinkedIn",
      color:"#0a66c2", bg:"rgba(10,102,194,.1)", border:"rgba(10,102,194,.25)", cta:"Voir sur LinkedIn",
      steps:[
        "Connecte-toi à ton compte LinkedIn",
        "Assure-toi que ton profil est complet et à jour",
        "Clique sur 'Postuler' directement sur la page de l'offre",
        "Personnalise ta lettre de motivation si le champ est disponible",
      ],
    };
  }

  return {
    icon: Globe, label:"Site officiel",
    color:"#64748b", bg:"var(--bg-surface-2)", border:"var(--border)", cta:"Voir les instructions officielles",
    steps:[
      "Consulte la page officielle pour les instructions complètes",
      "Prépare tous tes documents en PDF avant de commencer",
      "Respecte le format demandé (taille max généralement 5MB par fichier)",
      "Note la deadline dans ton calendrier et postule au moins 3 jours avant",
    ],
  };
}

function MethodCard({ opp }: { opp: Opp }) {
  const m = detectMethod(opp.source_url, opp.description);
  function handleCTA() {
    if (m.email) {
      window.open(`mailto:${m.email}?subject=Candidature — &body=Bonjour,%0A%0AJe me permets de vous adresser ma candidature pour l'opportunité "${opp.title}".%0A%0ACordialement,`,"_blank");
    } else if (opp.source_url) {
      window.open(opp.source_url,"_blank","noopener,noreferrer");
    }
  }
  return (
    <div style={{ background:"var(--bg-card)", border:`1.5px solid ${m.border}`, borderLeft:`3px solid ${m.color}`, borderRadius:18, overflow:"hidden" }}>
      <div style={{ padding:"16px 20px 12px", display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:44, height:44, borderRadius:12, background:m.bg,
          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <m.icon size={21} color={m.color} />
        </div>
        <div>
          <p style={{ fontSize:11, fontWeight:700, color:m.color, textTransform:"uppercase",
            letterSpacing:".06em", marginBottom:2 }}>Méthode de candidature</p>
          <p style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)" }}>{m.label}</p>
        </div>
      </div>
      <div style={{ padding:"0 20px 16px", display:"flex", flexDirection:"column", gap:8 }}>
        {m.steps.map((step,i) => (
          <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
            <div style={{ width:22, height:22, borderRadius:"50%", flexShrink:0,
              background:m.color, color:"#fff", display:"flex", alignItems:"center",
              justifyContent:"center", fontSize:11, fontWeight:700, marginTop:1 }}>
              {i+1}
            </div>
            <p style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.55, flex:1 }}>{step}</p>
          </div>
        ))}
      </div>
      <div style={{ padding:"12px 20px 18px" }}>
        <button onClick={handleCTA} style={{ width:"100%", fontWeight:700, fontSize:14,
          padding:"13px", borderRadius:13, border:"none", cursor:"pointer",
          background:m.color, color:"#fff", boxShadow:`0 4px 16px ${m.color}44`,
          display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          <m.icon size={16} />{m.cta} →
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
  if (isLoading) return <div style={{ height:120, background:"var(--bg-surface-2)", borderRadius:16 }} className="animate-pulse" />;
  if (!data) return null;
  const theme = data.score>=70 ? { bg:"var(--bg-success)", border:"var(--border-success)", text:"var(--text-success)" }
    : data.score>=40 ? { bg:"var(--bg-warning)", border:"var(--border-warning)", text:"var(--text-warning)" }
    : { bg:"var(--bg-danger)", border:"var(--border-danger)", text:"var(--text-danger)" };
  return (
    <div style={{ background:theme.bg, border:`1.5px solid ${theme.border}`, borderRadius:18, padding:20 }}>
      <p style={{ fontWeight:700, fontSize:14, color:"var(--text-primary)", marginBottom:16 }}>Score de préparation</p>
      <div style={{ display:"flex", gap:16, alignItems:"center", marginBottom:16 }}>
        <ScoreRing score={data.score} size={72} strokeWidth={5} />
        <div style={{ flex:1 }}>
          <p style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.55 }}>{data.message}</p>
        </div>
      </div>
      {data.missing.map((m,i) => (
        <div key={i} style={{ display:"flex", gap:10, background:"var(--bg-card)",
          borderRadius:10, padding:"8px 12px", marginBottom:6,
          border:"1px solid var(--border-subtle)" }}>
          <div style={{ width:20, height:20, borderRadius:"50%", flexShrink:0, background:theme.bg,
            display:"flex", alignItems:"center", justifyContent:"center", marginTop:1 }}>
            <X size={12} color={theme.text} strokeWidth={3} />
          </div>
          <div>
            <p style={{ fontSize:12, fontWeight:700, color:theme.text }}>{m.label}</p>
            <p style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>{m.fix}</p>
          </div>
        </div>
      ))}
      {data.missing.length===0 && (
        <div style={{ background:"var(--bg-card)", borderRadius:10, padding:"8px 12px",
          display:"flex", gap:10, alignItems:"center" }}>
          <PartyPopper size={17} color="var(--text-success)" />
          <p style={{ fontSize:13, fontWeight:700, color:"var(--text-success)" }}>Dossier complet !</p>
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
        style={{ width:"100%", background:"var(--bg-surface-2)", color:"var(--text-primary)", fontWeight:700,
          fontSize:14, padding:"14px", borderRadius:14, border:"1px solid var(--border)", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
        <Check size={16} />{state==="done"?"Voir mes candidatures →":"Déjà candidaté → Voir mes candidatures"}
      </button>
    );
  }
  return (
    <button onClick={apply} disabled={state==="loading"}
      style={{ width:"100%", fontWeight:700, fontSize:15, padding:"16px", borderRadius:14, border:"none",
        cursor:state==="loading"?"not-allowed":"pointer",
        background:state==="loading"?"var(--border)":"linear-gradient(135deg,var(--accent),#0d9488)",
        color: state==="loading" ? "var(--text-muted)" : "#fff",
        boxShadow: state==="loading" ? "none" : "0 4px 16px rgba(5,150,105,0.3)" }}>
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
    <div style={{ background:"var(--bg-card)", borderRadius:16, border:"1px solid var(--border)", overflow:"hidden" }}>
      <div style={{ padding:"16px 20px", borderBottom:state==="done"?"1px solid var(--border-subtle)":"none" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <div>
            <p style={{ fontWeight:700, fontSize:14, color:"var(--text-primary)" }}>Lettre de motivation IA</p>
            <p style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>Llama 3.3 70B · Personnalisée</p>
          </div>
          <Badge>IA</Badge>
        </div>
        <button onClick={generate} disabled={state==="loading"}
          style={{ width:"100%", fontWeight:600, fontSize:13, padding:"11px", borderRadius:12,
            border:"1.5px solid #7c3aed", background:"transparent",
            cursor:state==="loading"?"not-allowed":"pointer",
            color:state==="loading"?"var(--text-muted)":"#7c3aed" }}>
          {state==="loading"?"Génération en cours...":state==="done"?"Régénérer":"Générer ma lettre →"}
        </button>
      </div>
      {state==="done"&&letter&&(
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"10px 20px", background:"var(--bg-surface-2)", borderBottom:"1px solid var(--border-subtle)" }}>
            <span style={{ fontSize:11, color:"var(--text-muted)" }}>{words} mots</span>
            <button onClick={copy} style={{ fontSize:11, fontWeight:700, color:"#7c3aed",
              background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
              {copied ? <><Check size={12} />Copié !</> : <><Copy size={12} />Copier</>}
            </button>
          </div>
          <div style={{ padding:"16px 20px", maxHeight:300, overflowY:"auto" }}>
            <p style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.7, whiteSpace:"pre-wrap" }}>{letter}</p>
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
      <div className="spin" style={{ width:32, height:32, border:"4px solid var(--accent)", borderTopColor:"transparent", borderRadius:"50%" }} />
    </div>
  );
  if (isError||!opp) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:12 }}>
      <SearchX size={38} color="var(--text-muted)" />
      <p style={{ fontSize:15, fontWeight:700, color:"var(--text-primary)" }}>Opportunité introuvable</p>
      <button onClick={() => router.push("/dashboard")} style={{ fontSize:13, fontWeight:700,
        color:"var(--accent-dark)", background:"var(--accent-light)", border:"1px solid var(--sidebar-active-border)",
        padding:"8px 20px", borderRadius:10, cursor:"pointer" }}>← Retour au feed</button>
    </div>
  );

  const cfg = typeConfig(opp.type);
  const d = daysLeft(opp.deadline);
  const reliability = reliabilityMeta(opp.reliability_score ?? 0);

  const CRITERIA: { icon: LucideIcon; label: string; val: string }[] = [
    { icon: GraduationCap, label:"Niveau requis", val: opp.required_level.length>0 ? opp.required_level.join(", ") : "Tous niveaux — ouvert à tous" },
    { icon: FileText,      label:"Filières",      val: opp.required_fields.length>0 ? opp.required_fields.join(", ") : "Toutes filières — ouvert à tous" },
    { icon: LanguagesIcon, label:"Langues",        val: opp.required_languages.length>0 ? opp.required_languages.map(l=>LANGS[l]??l).join(", ") : "Aucune langue spécifique" },
    { icon: Percent,       label:"Moyenne min.",   val: opp.min_gpa ? `${opp.min_gpa}/20` : "Aucune moyenne requise" },
    { icon: ShieldCheck,   label:"Fiabilité",      val: `${opp.reliability_score}/100` },
    { icon: CalendarClock, label:"Date limite",    val: opp.deadline ? new Date(opp.deadline).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}) : "Non précisée" },
  ];

  return (
    <div style={{ height:"100%", overflowY:"auto", background:"var(--bg-base)" }}>

      <div style={{ background:`linear-gradient(135deg,${cfg.gradient})`, padding:"20px 24px 32px",
        position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-60, right:-30, width:220, height:220,
          background:"rgba(255,255,255,0.08)", borderRadius:"50%", pointerEvents:"none" }} />

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22 }}>
          <button onClick={() => router.back()} style={{ display:"flex", alignItems:"center", gap:6,
            fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.9)",
            background:"rgba(255,255,255,0.14)", border:"1px solid rgba(255,255,255,0.18)",
            padding:"7px 14px", borderRadius:10, cursor:"pointer" }}>
            <ArrowLeft size={15} /> Retour
          </button>
          <div style={{ display:"flex", gap:8 }}>
            <ReportButton oppId={id} />
            <ShareButton title={opp.title} oppId={id} />
            <SaveButton oppId={id} />
          </div>
        </div>

        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
          <span style={{ fontSize:11, fontWeight:700, color:"#fff",
            background:"rgba(255,255,255,0.2)", padding:"4px 12px", borderRadius:20,
            border:"1px solid rgba(255,255,255,0.22)" }}>{cfg.label}</span>
          {opp.is_verified && (
            <span style={{ fontSize:11, fontWeight:700, color:"#fff",
              background:"rgba(255,255,255,0.14)", padding:"4px 12px", borderRadius:20,
              border:"1px solid rgba(255,255,255,0.18)", display:"flex", alignItems:"center", gap:4 }}>
              <ShieldCheck size={12} /> Vérifié
            </span>
          )}
          {d!==null && d>=0 && d<=14 && (
            <span style={{ fontSize:11, fontWeight:700, color:"#fff",
              background: d<=7 ? "rgba(220,38,38,.85)" : "rgba(245,158,11,.85)",
              padding:"4px 12px", borderRadius:20, display:"flex", alignItems:"center", gap:4 }}>
              <Flame size={12} /> {d===0 ? "Aujourd'hui !" : `J-${d}`}
            </span>
          )}
        </div>

        <h1 style={{ fontFamily:"var(--font-voice)", fontWeight:500, fontSize:24, color:"#fff", lineHeight:1.3, marginBottom:12 }}>
          {opp.title}
        </h1>
        <div style={{ display:"flex", gap:18, flexWrap:"wrap" }}>
          <span style={{ fontSize:13, color:"rgba(255,255,255,0.82)", display:"flex", alignItems:"center", gap:5 }}>
            <Globe size={14} /> {opp.country}
          </span>
          {opp.deadline && (
            <span style={{ fontSize:13, color:"rgba(255,255,255,0.82)", display:"flex", alignItems:"center", gap:5 }}>
              <CalendarClock size={14} /> {new Date(opp.deadline).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}
            </span>
          )}
          <span style={{ fontSize:13, color:"rgba(255,255,255,0.82)", display:"flex", alignItems:"center", gap:5 }}>
            <reliability.icon size={14} /> Fiabilité {opp.reliability_score}/100
          </span>
        </div>
      </div>

      <div className="opp-detail-grid" style={{ maxWidth:1200, margin:"0 auto", padding:"24px 24px 48px",
        display:"grid", gridTemplateColumns:"1fr 380px", gap:24, alignItems:"start" }}>

        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

          <MethodCard opp={opp} />

          <div style={{ background:"var(--bg-card)", borderRadius:18, border:"1px solid var(--border)",
            padding:24, boxShadow:"var(--shadow-sm)" }}>
            <p style={{ fontWeight:700, fontSize:15, color:"var(--text-primary)", marginBottom:16,
              display:"flex", alignItems:"center", gap:7 }}>
              <FileText size={16} color="var(--text-secondary)" /> À propos de cette opportunité
            </p>
            {opp.description.split(/\n+/).filter(p => p.trim()).map((para, i) => (
              <p key={i} style={{ fontSize:14, color:"var(--text-secondary)", lineHeight:1.85, marginBottom:12 }}>
                {para.trim()}
              </p>
            ))}
            {!opp.description.includes("\n") && (
              <p style={{ fontSize:14, color:"var(--text-secondary)", lineHeight:1.85 }}>{opp.description}</p>
            )}
          </div>

          <div style={{ background:"var(--bg-card)", borderRadius:18, border:"1px solid var(--border)",
            padding:24, boxShadow:"var(--shadow-sm)" }}>
            <p style={{ fontWeight:700, fontSize:15, color:"var(--text-primary)", marginBottom:16,
              display:"flex", alignItems:"center", gap:7 }}>
              <ListChecks size={16} color="var(--text-secondary)" /> Critères d'éligibilité
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {CRITERIA.map(({icon: Icon, label, val}) => (
                <div key={label} style={{ background:"var(--bg-surface-2)", borderRadius:12, padding:"12px 14px",
                  border:"1px solid var(--border-subtle)" }}>
                  <p style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase",
                    letterSpacing:".05em", marginBottom:6, display:"flex", alignItems:"center", gap:5 }}>
                    <Icon size={12} /> {label}
                  </p>
                  <p style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>{val}</p>
                </div>
              ))}
            </div>
          </div>

          {opp.deadline && d!==null && d>=0 && (
            <div style={{
              background: d<=7 ? "var(--bg-danger)" : d<=14 ? "var(--bg-warning)" : "var(--bg-success)",
              border: `1.5px solid ${d<=7 ? "var(--border-danger)" : d<=14 ? "var(--border-warning)" : "var(--border-success)"}`,
              borderRadius:18, padding:"18px 22px",
              display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <p style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase",
                  letterSpacing:".05em", marginBottom:6, display:"flex", alignItems:"center", gap:5 }}>
                  <Clock size={12} /> Temps restant
                </p>
                <p style={{ fontSize:15, fontWeight:700,
                  color: d<=7 ? "var(--text-danger)" : d<=14 ? "var(--text-warning)" : "var(--text-success)" }}>
                  {new Date(opp.deadline).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}
                </p>
              </div>
              <div style={{ textAlign:"right" }}>
                <p style={{ fontFamily:"var(--font-voice)", fontSize:44, fontWeight:600, lineHeight:1,
                  color: d<=7 ? "var(--text-danger)" : d<=14 ? "var(--text-warning)" : "var(--text-success)" }}>{d}</p>
                <p style={{ fontSize:12, fontWeight:700,
                  color: d<=7 ? "var(--text-danger)" : d<=14 ? "var(--text-warning)" : "var(--text-success)" }}>
                  jour{d>1?"s":""} restant{d>1?"s":""}
                </p>
              </div>
            </div>
          )}

          <CVBuilder oppId={id} />

          {opp.source_url && (
            <a href={opp.source_url} target="_blank" rel="noopener noreferrer"
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, textAlign:"center",
                fontSize:12, color:"var(--text-muted)", textDecoration:"none", padding:"8px" }}>
              <ExternalLink size={12} /> Voir la source officielle
            </a>
          )}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:16, position:"sticky", top:20 }}>
          <PrepSection oppId={id} />
          <ApplySection oppId={id} />
          <LetterSection oppId={id} />
        </div>
      </div>
    </div>
  );
}
