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
  LoaderCircle, MessageSquareText, FolderOpen, ChevronRight, Sparkles, Compass,
} from "lucide-react";
import { typeConfig, daysLeft, reliabilityMeta } from "@/lib/opportunityHelpers";

interface Opp {
  id: string; title: string; type: string; description: string;
  source_url: string; deadline: string | null; country: string;
  required_level: string[]; required_fields: string[];
  required_languages: string[]; min_gpa: number | null;
  reliability_score: number; is_verified: boolean;
}
interface PrepCheck { label: string; ok: boolean; fix: string; category: string }
interface PrepScore { score: number; missing: PrepCheck[]; message: string; ok_count: number; total_checks: number }

function prepAction(category: string): { label: string; href: string } | null {
  if (category === "document") return { label: "Coffre-fort", href: "/dashboard/documents" };
  if (category === "profile" || category === "academic" || category === "skills")
    return { label: "Mon profil", href: "/dashboard/profile" };
  return null;
}
interface LetterResp { letter: string; opportunity_title: string; word_count: number }

const LANGS: Record<string, string> = {
  fr:"Français", en:"Anglais", de:"Allemand",
  es:"Espagnol", zh:"Chinois", ar:"Arabe", pt:"Portugais"
};

// ── Motif de grain subtil pour donner de la texture aux fonds unis
// (une des recommandations du design system : de l'atmosphère plutôt
// qu'un aplat de couleur plat). Généré en pur CSS, aucun asset externe.
const DOT_GRID = "radial-gradient(circle at 1px 1px, rgba(255,255,255,.16) 1px, transparent 0)";

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

function DescriptionSection({ description }: { description: string }) {
  const { error: toastError } = useToast();
  const [lang, setLang] = useState<"orig" | "fr" | "en">("orig");
  const [translated, setTranslated] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const text = lang === "orig" ? description : (translated[lang] ?? description);
  const paras = text.split(/\n+/).filter(p => p.trim());

  async function translate(target: "fr" | "en") {
    if (translated[target]) { setLang(target); return; }
    setLoading(true);
    try {
      const res = await api.post("/ai/translate", { text: description, target_lang: target });
      setTranslated(prev => ({ ...prev, [target]: res.data.translated }));
      setLang(target);
    } catch { toastError("Traduction indisponible pour le moment. Réessaie."); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ background:"var(--bg-card)", borderRadius:20, border:"1px solid var(--border)",
      borderLeft:"3px solid var(--accent)", padding:26, boxShadow:"var(--shadow-sm)" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12,
        marginBottom:18, flexWrap:"wrap" }}>
        <p style={{ fontFamily:"var(--font-voice)", fontWeight:600, fontSize:17, color:"var(--text-primary)",
          display:"flex", alignItems:"center", gap:8 }}>
          <FileText size={16} color="var(--accent-dark)" /> À propos de cette opportunité
        </p>
        <div style={{ display:"flex", alignItems:"center", gap:2, background:"var(--bg-surface-2)",
          borderRadius:10, padding:3, border:"1px solid var(--border-subtle)" }}>
          <LanguagesIcon size={13} color="var(--text-muted)" style={{ marginLeft:5, marginRight:2 }} />
          {([["orig","Original"],["fr","FR"],["en","EN"]] as const).map(([key, label]) => {
            const active = lang === key;
            return (
              <button key={key} disabled={loading}
                onClick={() => key === "orig" ? setLang("orig") : translate(key)}
                title={key === "fr" ? "Traduire en français" : key === "en" ? "Translate to English" : "Texte original"}
                style={{ fontSize:11.5, fontWeight:700, padding:"5px 10px", borderRadius:8, border:"none",
                  cursor: loading ? "wait" : "pointer",
                  background: active ? "var(--text-primary)" : "transparent",
                  color: active ? "var(--bg-card)" : "var(--text-muted)", transition:"all .15s" }}>
                {label}
              </button>
            );
          })}
        </div>
      </div>
      {loading ? (
        <div style={{ display:"flex", alignItems:"center", gap:8, color:"var(--text-muted)",
          fontSize:13, padding:"6px 0" }}>
          <LoaderCircle size={15} className="spin" /> Traduction en cours…
        </div>
      ) : paras.length > 0 ? (
        paras.map((para, i) => (
          <p key={i} style={{ fontSize:14, color:"var(--text-secondary)", lineHeight:1.85,
            marginBottom:12, textAlign:"justify", hyphens:"auto", WebkitHyphens:"auto" }}>
            {para.trim()}
          </p>
        ))
      ) : (
        <p style={{ fontSize:14, color:"var(--text-secondary)", lineHeight:1.85, textAlign:"justify" }}>{text}</p>
      )}
    </div>
  );
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
    <div style={{ background:"var(--bg-card)", border:`1.5px solid ${m.border}`, borderRadius:20, overflow:"hidden",
      boxShadow:"var(--shadow-sm)" }}>
      <div style={{ padding:"18px 22px 14px", display:"flex", alignItems:"center", gap:14, background:m.bg }}>
        <div style={{ width:46, height:46, borderRadius:13, background:m.color,
          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
          boxShadow:`0 6px 16px ${m.color}55` }}>
          <m.icon size={22} color="#fff" />
        </div>
        <div>
          <p style={{ fontSize:11, fontWeight:700, color:m.color, textTransform:"uppercase",
            letterSpacing:".08em", marginBottom:3 }}>Méthode de candidature</p>
          <p style={{ fontFamily:"var(--font-voice)", fontSize:18, fontWeight:600, color:"var(--text-primary)" }}>{m.label}</p>
        </div>
      </div>
      <div style={{ padding:"18px 22px 6px", display:"flex", flexDirection:"column" }}>
        {m.steps.map((step,i) => (
          <div key={i} style={{ display:"flex", gap:14, alignItems:"flex-start", position:"relative", paddingBottom: i < m.steps.length-1 ? 20 : 4 }}>
            {i < m.steps.length-1 && (
              <div style={{ position:"absolute", left:11, top:24, bottom:-2, width:2, background:"var(--border-subtle)" }} />
            )}
            <div style={{ width:23, height:23, borderRadius:"50%", flexShrink:0,
              background:m.color, color:"#fff", display:"flex", alignItems:"center",
              justifyContent:"center", fontSize:11, fontWeight:700, marginTop:1, zIndex:1,
              boxShadow:`0 0 0 4px var(--bg-card)` }}>
              {i+1}
            </div>
            <p style={{ fontSize:13.5, color:"var(--text-secondary)", lineHeight:1.6, flex:1, paddingTop:2 }}>{step}</p>
          </div>
        ))}
      </div>
      <div style={{ padding:"14px 22px 20px" }}>
        <button onClick={handleCTA} style={{ width:"100%", fontWeight:700, fontSize:14,
          padding:"14px", borderRadius:14, border:"none", cursor:"pointer",
          background:m.color, color:"#fff", boxShadow:`0 6px 20px ${m.color}44`,
          display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          transition:"transform .15s" }}>
          <m.icon size={16} />{m.cta} →
        </button>
      </div>
    </div>
  );
}

function PrepSection({ oppId }: { oppId: string }) {
  const router = useRouter();
  const { data, isLoading } = useQuery<PrepScore>({
    queryKey: ["prep", oppId],
    queryFn: async () => (await api.get(`/opportunities/${oppId}/prep-score`)).data,
  });
  if (isLoading) return <div style={{ height:120, background:"var(--bg-surface-2)", borderRadius:18 }} className="animate-pulse" />;
  if (!data) return null;
  const theme = data.score>=70 ? { bg:"var(--bg-success)", border:"var(--border-success)", text:"var(--text-success)", bar:"var(--accent)" }
    : data.score>=40 ? { bg:"var(--bg-warning)", border:"var(--border-warning)", text:"var(--text-warning)", bar:"var(--text-warning)" }
    : { bg:"var(--bg-danger)", border:"var(--border-danger)", text:"var(--text-danger)", bar:"var(--text-danger)" };
  const okCount = data.ok_count ?? 0;
  const total = data.total_checks ?? (data.missing?.length ?? 0);
  return (
    <div style={{ background:theme.bg, border:`1.5px solid ${theme.border}`, borderRadius:20, padding:22,
      position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:-40, right:-40, width:140, height:140, borderRadius:"50%",
        background:theme.bar, opacity:.07, pointerEvents:"none" }} />
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <p style={{ fontFamily:"var(--font-voice)", fontWeight:600, fontSize:15.5, color:"var(--text-primary)" }}>Score de préparation</p>
        {total > 0 && (
          <span style={{ fontSize:11, fontWeight:700, color:theme.text, background:"var(--bg-card)",
            padding:"3px 9px", borderRadius:20 }}>{okCount}/{total} critères</span>
        )}
      </div>
      <div style={{ display:"flex", gap:16, alignItems:"center", marginBottom:14 }}>
        <ScoreRing score={data.score} size={72} strokeWidth={5} />
        <div style={{ flex:1 }}>
          <p style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.55 }}>{data.message}</p>
        </div>
      </div>
      {/* Barre de progression */}
      <div style={{ background:"var(--bg-card)", height:7, borderRadius:4, overflow:"hidden", marginBottom:16 }}>
        <div style={{ height:"100%", borderRadius:4, width:`${data.score}%`, background:theme.bar, transition:"width .5s" }} />
      </div>
      {data.missing.map((m,i) => {
        const action = prepAction(m.category);
        return (
          <div key={i} onClick={action ? () => router.push(action.href) : undefined}
            style={{ display:"flex", gap:10, alignItems:"center", background:"var(--bg-card)",
              borderRadius:12, padding:"10px 13px", marginBottom:7, border:"1px solid var(--border-subtle)",
              cursor: action ? "pointer" : "default" }}>
            <div style={{ width:20, height:20, borderRadius:"50%", flexShrink:0, background:theme.bg,
              display:"flex", alignItems:"center", justifyContent:"center", marginTop:1 }}>
              <X size={12} color={theme.text} strokeWidth={3} />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:12, fontWeight:700, color:theme.text }}>{m.label}</p>
              <p style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>{m.fix}</p>
            </div>
            {action && (
              <span style={{ display:"flex", alignItems:"center", gap:2, flexShrink:0, fontSize:11,
                fontWeight:700, color:theme.text }}>
                {action.label} <ChevronRight size={13} />
              </span>
            )}
          </div>
        );
      })}
      {data.missing.length===0 && (
        <div style={{ background:"var(--bg-card)", borderRadius:12, padding:"10px 13px",
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
          fontSize:14, padding:"15px", borderRadius:16, border:"1px solid var(--border)", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
        <Check size={16} />{state==="done"?"Voir mes candidatures →":"Déjà candidaté → Voir mes candidatures"}
      </button>
    );
  }
  return (
    <button onClick={apply} disabled={state==="loading"}
      style={{ width:"100%", fontWeight:700, fontSize:15, padding:"17px", borderRadius:16, border:"none",
        cursor:state==="loading"?"not-allowed":"pointer",
        background:state==="loading"?"var(--border)":"linear-gradient(135deg,var(--accent),#0d9488)",
        color: state==="loading" ? "var(--text-muted)" : "#fff",
        boxShadow: state==="loading" ? "none" : "0 8px 24px rgba(5,150,105,0.32)" }}>
      {state==="loading"?"Création...":"Suivre cette candidature →"}
    </button>
  );
}

function LetterSection({ oppId, title }: { oppId: string; title: string }) {
  const { error: toastError, success } = useToast();
  const [state, setState] = useState<"idle"|"loading"|"done">("idle");
  const [letter, setLetter] = useState("");
  const [words, setWords] = useState(0);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  async function generate() {
    setState("loading"); setSaved(false);
    try {
      const res = await api.post<LetterResp>("/ai/generate-letter",{ opportunity_id:oppId });
      setLetter(res.data.letter); setWords(res.data.word_count); setState("done");
    } catch { setState("idle"); toastError("Erreur IA. Réessaie."); }
  }
  async function copy() {
    await navigator.clipboard.writeText(letter);
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  }
  async function saveToVault() {
    setSaving(true);
    try {
      await api.post("/documents/save-generated", { kind:"lettre", title:`Lettre - ${title}`, body:letter });
      setSaved(true); success("Lettre enregistrée dans ton coffre-fort !");
    } catch { toastError("Impossible d'enregistrer. Réessaie."); }
    finally { setSaving(false); }
  }
  return (
    <div style={{ background:"var(--bg-card)", borderRadius:18, border:"1px solid var(--border)", overflow:"hidden",
      boxShadow:"var(--shadow-sm)" }}>
      <div style={{ padding:"18px 22px", background:"linear-gradient(135deg, rgba(124,58,237,.08), rgba(124,58,237,0))",
        borderBottom:state==="done"?"1px solid var(--border-subtle)":"none" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:10, background:"rgba(124,58,237,.14)",
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Sparkles size={16} color="#7c3aed" />
            </div>
            <div>
              <p style={{ fontFamily:"var(--font-voice)", fontWeight:600, fontSize:15, color:"var(--text-primary)" }}>Lettre de motivation IA</p>
              <p style={{ fontSize:11, color:"var(--text-muted)", marginTop:1 }}>Llama 3.3 70B · Personnalisée</p>
            </div>
          </div>
          <Badge>IA</Badge>
        </div>
        <button onClick={generate} disabled={state==="loading"}
          style={{ width:"100%", fontWeight:700, fontSize:13, padding:"12px", borderRadius:13,
            border:"none", background:state==="loading"?"var(--border)":"linear-gradient(135deg,#7c3aed,#9333ea)",
            cursor:state==="loading"?"not-allowed":"pointer",
            color:state==="loading"?"var(--text-muted)":"#fff",
            boxShadow:state==="loading"?"none":"0 6px 18px rgba(124,58,237,.32)" }}>
          {state==="loading"?"Génération en cours...":state==="done"?"Régénérer":"Générer ma lettre →"}
        </button>
      </div>
      {state==="done"&&letter&&(
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"10px 22px", background:"var(--bg-surface-2)", borderBottom:"1px solid var(--border-subtle)" }}>
            <span style={{ fontSize:11, color:"var(--text-muted)" }}>{words} mots</span>
            <div style={{ display:"flex", gap:14, alignItems:"center" }}>
              <button onClick={saveToVault} disabled={saving||saved} style={{ fontSize:11, fontWeight:700,
                color:saved?"var(--text-success)":"#7c3aed", background:"none", border:"none",
                cursor:saving?"wait":"pointer", display:"flex", alignItems:"center", gap:4 }}>
                {saved ? <><Check size={12} />Enregistré</> : <><FolderOpen size={12} />{saving?"Enregistrement…":"Coffre-fort"}</>}
              </button>
              <button onClick={copy} style={{ fontSize:11, fontWeight:700, color:"#7c3aed",
                background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
                {copied ? <><Check size={12} />Copié !</> : <><Copy size={12} />Copier</>}
              </button>
            </div>
          </div>
          <div style={{ padding:"18px 22px", maxHeight:300, overflowY:"auto" }}>
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
  ];

  const urgencyColor = d===null ? "var(--text-success)" : d<=7 ? "var(--text-danger)" : d<=14 ? "var(--text-warning)" : "var(--text-success)";

  return (
    <div className="animate-fade-in" style={{ height:"100%", overflowY:"auto", background:"var(--bg-base)" }}>
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"20px 24px 48px" }}>

        {/* Barre utilitaire — plus de bandeau plein écran, juste un rappel discret */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22 }}>
          <button onClick={() => router.back()} style={{ display:"flex", alignItems:"center", gap:6,
            fontSize:13, fontWeight:600, color:"var(--text-secondary)",
            background:"var(--bg-surface-2)", border:"1px solid var(--border-subtle)",
            padding:"7px 14px", borderRadius:10, cursor:"pointer" }}>
            <ArrowLeft size={15} /> Retour
          </button>
          <div style={{ display:"flex", gap:8 }}>
            <ReportButton oppId={id} />
            <ShareButton title={opp.title} oppId={id} />
            <SaveButton oppId={id} />
          </div>
        </div>

        {/* Hero éditorial : titre à gauche, carte "en un coup d'œil" flottante à droite —
            la couleur de catégorie devient un accent, pas un bandeau plein écran */}
        <div className="opp-hero-grid" style={{ display:"grid", gap:24, alignItems:"start", marginBottom:28 }}>

          <div style={{ position:"relative", paddingLeft:20 }}>
            <div style={{ position:"absolute", left:0, top:4, bottom:4, width:4, borderRadius:4,
              background:`linear-gradient(${cfg.gradient})` }} />

            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
              <span style={{ fontSize:11, fontWeight:700, color:cfg.color ?? "var(--accent-dark)",
                background:"var(--bg-surface-2)", padding:"4px 12px", borderRadius:20,
                border:"1px solid var(--border-subtle)" }}>{cfg.label}</span>
              {opp.is_verified && (
                <span style={{ fontSize:11, fontWeight:700, color:"var(--text-success)",
                  background:"var(--bg-success)", padding:"4px 12px", borderRadius:20,
                  display:"flex", alignItems:"center", gap:4 }}>
                  <ShieldCheck size={12} /> Vérifié
                </span>
              )}
              {d!==null && d>=0 && d<=14 && (
                <span style={{ fontSize:11, fontWeight:700, color:"#fff",
                  background: d<=7 ? "#dc2626" : "#f59e0b",
                  padding:"4px 12px", borderRadius:20, display:"flex", alignItems:"center", gap:4 }}>
                  <Flame size={12} /> {d===0 ? "Aujourd'hui !" : `J-${d}`}
                </span>
              )}
            </div>

            <h1 style={{ fontFamily:"var(--font-voice)", fontWeight:500, fontSize:32, color:"var(--text-primary)",
              lineHeight:1.2, marginBottom:14, letterSpacing:"-.01em" }}>
              {opp.title}
            </h1>

            <div style={{ display:"flex", gap:16, flexWrap:"wrap", color:"var(--text-secondary)", fontSize:13.5 }}>
              <span style={{ display:"flex", alignItems:"center", gap:6 }}><Globe size={14} /> {opp.country}</span>
              <span style={{ color:"var(--border)" }}>•</span>
              <span style={{ display:"flex", alignItems:"center", gap:6 }}>
                <reliability.icon size={14} /> Fiabilité {opp.reliability_score}/100
              </span>
            </div>
          </div>

          {/* Carte "en un coup d'œil" — l'élément qui donne du relief, flotte légèrement */}
          <div style={{ background:"var(--bg-card)", borderRadius:20, border:"1px solid var(--border)",
            padding:"20px 22px", boxShadow:"var(--shadow-md)", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:-30, right:-30, width:100, height:100, borderRadius:"50%",
              background:`linear-gradient(${cfg.gradient})`, opacity:.12, pointerEvents:"none" }} />
            <p style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase",
              letterSpacing:".06em", marginBottom:14 }}>En un coup d'œil</p>

            {opp.deadline && d!==null && d>=0 ? (
              <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:14 }}>
                <span style={{ fontFamily:"var(--font-voice)", fontSize:40, fontWeight:600, lineHeight:1, color:urgencyColor }}>{d}</span>
                <span style={{ fontSize:12.5, fontWeight:700, color:urgencyColor }}>jour{d>1?"s":""} restant{d>1?"s":""}</span>
              </div>
            ) : (
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                <CalendarClock size={20} color="var(--text-muted)" />
                <span style={{ fontSize:13.5, fontWeight:600, color:"var(--text-secondary)" }}>Deadline non précisée</span>
              </div>
            )}
            {opp.deadline && (
              <p style={{ fontSize:12, color:"var(--text-muted)", marginBottom:16 }}>
                {new Date(opp.deadline).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}
              </p>
            )}

            <div style={{ height:1, background:"var(--border-subtle)", margin:"14px 0" }} />

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:12.5, color:"var(--text-secondary)", display:"flex", alignItems:"center", gap:6 }}>
                <reliability.icon size={14} color={
                  reliability.variant==="success" ? "var(--text-success)" :
                  reliability.variant==="warning" ? "var(--text-warning)" : "var(--text-danger)"
                } /> Fiabilité
              </span>
              <span style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>{opp.reliability_score}/100</span>
            </div>
          </div>
        </div>

        {/* Contenu principal — même agencement 2 colonnes qu'avant, composants inchangés */}
        <div className="opp-detail-grid" style={{ display:"grid", gridTemplateColumns:"1fr 380px", gap:24, alignItems:"start" }}>

          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

            <MethodCard opp={opp} />

            <DescriptionSection description={opp.description} />

            <div style={{ background:"var(--bg-card)", borderRadius:20, border:"1px solid var(--border)",
              padding:26, boxShadow:"var(--shadow-sm)" }}>
              <p style={{ fontFamily:"var(--font-voice)", fontWeight:600, fontSize:17, color:"var(--text-primary)", marginBottom:18,
                display:"flex", alignItems:"center", gap:8 }}>
                <ListChecks size={16} color="var(--accent-dark)" /> Critères d'éligibilité
              </p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {CRITERIA.map(({icon: Icon, label, val}) => (
                  <div key={label} style={{ display:"flex", gap:12, alignItems:"flex-start",
                    background:"var(--bg-surface-2)", borderRadius:14, padding:"14px 16px",
                    border:"1px solid var(--border-subtle)" }}>
                    <div style={{ width:32, height:32, borderRadius:10, background:"var(--bg-card)",
                      display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                      border:"1px solid var(--border-subtle)" }}>
                      <Icon size={14} color="var(--accent-dark)" />
                    </div>
                    <div style={{ minWidth:0 }}>
                      <p style={{ fontSize:10.5, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase",
                        letterSpacing:".06em", marginBottom:4 }}>{label}</p>
                      <p style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", lineHeight:1.4 }}>{val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

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
            <button onClick={() => router.push(`/dashboard/coach?opp=${id}&title=${encodeURIComponent(opp.title)}`)}
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, width:"100%",
                padding:"15px", borderRadius:16, border:"none", cursor:"pointer",
                background:"linear-gradient(135deg,#7c3aed,#a78bfa)", color:"#fff", fontWeight:700, fontSize:14,
                boxShadow:"0 8px 24px rgba(124,58,237,.34)" }}>
              <Compass size={17} /> Discuter avec Link IA
            </button>
            <PrepSection oppId={id} />
            <ApplySection oppId={id} />
            <LetterSection oppId={id} title={opp.title} />
          </div>
        </div>
      </div>
    </div>
  );
}
