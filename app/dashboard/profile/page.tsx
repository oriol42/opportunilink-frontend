"use client";
import { useState, Suspense } from "react";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { useQuery } from "@tanstack/react-query";
import {
  User, GraduationCap, Target, Languages as LanguagesIcon, Zap, Check, X,
  TriangleAlert, Smartphone, ThumbsUp, Rocket, Sparkles, Globe, BookOpen,
  Lightbulb, LoaderCircle, Award, Save, Plus, LucideIcon,
} from "lucide-react";

const LEVELS = ["Licence","Master","Doctorat","BTS","DUT","Ingénieur","Technicien Supérieur"];
const FIELDS = [
  "Informatique","Génie Logiciel","Réseaux & Télécoms","Intelligence Artificielle",
  "Droit","Sciences Politiques","Relations Internationales",
  "Médecine","Pharmacie","Santé Publique",
  "Économie","Gestion","Finance","Marketing","Comptabilité",
  "Lettres & Sciences Humaines","Langues","Journalisme","Communication",
  "Sciences","Mathématiques","Physique","Chimie","Biologie",
  "Ingénierie Civile","Architecture","Mécanique","Électronique",
  "Agriculture","Environnement","Éducation","Psychologie","Sociologie",
  "Art & Design","Audiovisuel","Tourisme & Hôtellerie","Autre",
];
const MAIN_LANGS = [
  { code:"fr", flag:"🇫🇷", label:"Français" },
  { code:"en", flag:"🇬🇧", label:"Anglais" },
  { code:"de", flag:"🇩🇪", label:"Allemand" },
  { code:"es", flag:"🇪🇸", label:"Espagnol" },
  { code:"pt", flag:"🇵🇹", label:"Portugais" },
  { code:"ar", flag:"🇸🇦", label:"Arabe" },
  { code:"zh", flag:"🇨🇳", label:"Chinois" },
  { code:"it", flag:"🇮🇹", label:"Italien" },
];
const SKILLS_BY_FIELD: Record<string,string[]> = {
  "Informatique":       ["Python","JavaScript","React","SQL","Git","Docker","Node.js","Java","C++","Machine Learning","TypeScript","Linux"],
  "Génie Logiciel":     ["Python","Java","C#","Git","Agile","Docker","Kubernetes","Tests unitaires","DevOps"],
  "Réseaux & Télécoms": ["Cisco","Linux","TCP/IP","Cybersécurité","Wireshark","Python","Routage","Firewall"],
  "Intelligence Artificielle": ["Python","TensorFlow","PyTorch","Scikit-learn","SQL","R","NLP","Computer Vision"],
  "Économie":           ["Excel","Power BI","SPSS","Stata","Analyse financière","Macroéconomie","R","Python"],
  "Gestion":            ["Excel","ERP","Management","Leadership","Gestion de projet","Communication","SAP"],
  "Finance":            ["Excel","Bloomberg","Analyse financière","Comptabilité","Audit","Power BI","VBA"],
  "Marketing":          ["SEO","Google Ads","Canva","Social media","Excel","Content marketing","Analytics"],
  "Droit":              ["Rédaction juridique","Recherche juridique","Droit des affaires","Droit international"],
  "Médecine":           ["Clinique","Pharmacologie","Recherche médicale","Anatomie","Biologie","Epidémiologie"],
  "Santé Publique":     ["Épidémiologie","SPSS","R","Gestion de projets santé","Plaidoyer","OMS"],
  "Architecture":       ["AutoCAD","Revit","SketchUp","ArchiCAD","3D Max","BIM"],
  "Communication":      ["Rédaction","Community management","Canva","Adobe","Relations presse","Stratégie digitale"],
  "Journalisme":        ["Rédaction","Investigation","Vidéo","Audio","Réseaux sociaux","WordPress"],
};
const OBJECTIVES: { key:string; icon:LucideIcon; label:string; desc:string }[] = [
  { key:"bourse",  icon:GraduationCap, label:"Décrocher une bourse",           desc:"Financer mes études à l'étranger" },
  { key:"stage",   icon:Award,         label:"Trouver un stage",               desc:"Gagner de l'expérience" },
  { key:"emploi",  icon:Rocket,        label:"Trouver un emploi",              desc:"Lancer ma carrière" },
  { key:"echange", icon:Globe,         label:"Programme d'échange",            desc:"Étudier à l'étranger" },
  { key:"master",  icon:BookOpen,      label:"Intégrer un master à l'étranger",desc:"Poursuivre mes études" },
  { key:"startup", icon:Lightbulb,     label:"Lancer mon projet",              desc:"Entrepreneuriat & concours" },
];
const SKILL_LEVELS = [
  { val:25,  label:"Débutant",      color:"#ef4444" },
  { val:50,  label:"Intermédiaire", color:"#f59e0b" },
  { val:75,  label:"Avancé",        color:"#3b82f6" },
  { val:100, label:"Expert",        color:"#10b981" },
];

const inputStyle: React.CSSProperties = {
  width:"100%", padding:"10px 14px", border:"1px solid var(--border)", borderRadius:12,
  fontSize:13, background:"var(--bg-input)", color:"var(--text-primary)", outline:"none",
  boxSizing:"border-box",
};
const labelStyle: React.CSSProperties = {
  display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)",
  marginBottom:6, textTransform:"uppercase", letterSpacing:".04em",
};

function computeEmployabilityScore(form: {
  full_name:string; level:string; field:string; city:string;
  gpa:string; phone:string; languages:string[]; skills:Record<string,number>;
  objectives:string[];
}): { score:number; breakdown:{ label:string; val:number; max:number; color:string }[] } {
  const b = [
    { label:"Niveau d'études",   val:form.level?20:0,                               max:20, color:"#7c3aed" },
    { label:"Filière",           val:form.field?15:0,                               max:15, color:"#2563eb" },
    { label:"Langues",           val:Math.min(form.languages.length*8,20),          max:20, color:"#059669" },
    { label:"Compétences",       val:Math.min(Object.keys(form.skills).length*3,20),max:20, color:"#f59e0b" },
    { label:"Moyenne",           val:form.gpa?10:0,                                 max:10, color:"#ec4899" },
    { label:"Profil complet",    val:(form.full_name?3:0)+(form.city?3:0)+(form.phone?4:0), max:10, color:"#06b6d4" },
    { label:"Objectifs définis", val:form.objectives.length>0?5:0,                 max:5,  color:"#8b5cf6" },
  ];
  return { score: b.reduce((s,x)=>s+x.val,0), breakdown:b };
}

const SECTIONS: { key:string; label:string; icon:LucideIcon }[] = [
  { key:"identity",   label:"Identité",    icon:User },
  { key:"academic",   label:"Académique",  icon:GraduationCap },
  { key:"objectives", label:"Objectifs",   icon:Target },
  { key:"languages",  label:"Langues",     icon:LanguagesIcon },
  { key:"skills",     label:"Compétences", icon:Zap },
];
type SectionKey = typeof SECTIONS[number]["key"];

function ProfileInner() {
  const { user, setUser } = useStore();
  const { success, error: toastError } = useToast();
  const [form, setForm] = useState({
    full_name:  user?.full_name ?? "",
    level:      user?.level ?? "",
    field:      user?.field ?? "",
    city:       user?.city ?? "",
    gpa:        user?.gpa?.toString() ?? "",
    age:        user?.age?.toString() ?? "",
    phone:      user?.phone ?? "",
    languages:  (user?.languages as string[]) ?? ["fr","en"],
    skills:     (user?.skills_with_level as Record<string,number>) ?? {},
    objectives: (user?.objectives as string[]) ?? [],
  });
  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading]       = useState(false);
  const [section, setSection]       = useState<SectionKey>("identity");

  const { data: stats } = useQuery({
    queryKey:["my-stats"],
    queryFn: async () => (await api.get("/users/me/stats")).data,
    staleTime:60000,
  });

  const { score, breakdown } = computeEmployabilityScore(form);
  const missing = [
    !form.full_name && "Nom complet",
    !form.level     && "Niveau d'études",
    !form.field     && "Filière",
    !form.gpa       && "Moyenne",
    !form.city      && "Ville",
    !form.phone     && "Téléphone",
    form.languages.length===0 && "Langues",
    Object.keys(form.skills).length===0 && "Compétences",
    form.objectives.length===0 && "Objectifs carrière",
  ].filter(Boolean) as string[];

  function toggleLang(code:string) {
    setForm(f=>({...f, languages:f.languages.includes(code)?f.languages.filter(l=>l!==code):[...f.languages,code]}));
  }
  function toggleObjective(key:string) {
    setForm(f=>({...f, objectives:f.objectives.includes(key)?f.objectives.filter(o=>o!==key):[...f.objectives,key]}));
  }
  function addSkill(name:string, level=50) {
    const sk=name.trim(); if(!sk||sk in form.skills) return;
    setForm(f=>({...f, skills:{...f.skills,[sk]:level}})); setSkillInput("");
  }
  function updateSkillLevel(name:string, level:number) {
    setForm(f=>({...f, skills:{...f.skills,[name]:level}}));
  }
  function removeSkill(name:string) {
    setForm(f=>{ const s={...f.skills}; delete s[name]; return {...f,skills:s}; });
  }

  const suggestedSkills = (SKILLS_BY_FIELD[form.field]??[]).filter(s=>!(s in form.skills));

  async function save(e:React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      const res = await api.put("/users/me",{
        ...form, gpa: form.gpa ? parseFloat(form.gpa) : null,
        age: form.age ? parseInt(form.age, 10) : null,
        skills: Object.keys(form.skills), skills_with_level: form.skills,
      });
      setUser(res.data); success("Profil mis à jour !");
    } catch(err:unknown) {
      toastError((err as {response?:{data?:{detail?:string}}})?.response?.data?.detail??"Erreur.");
    } finally { setLoading(false); }
  }

  const scoreColor = score>=80?"var(--accent)":score>=60?"var(--text-warning)":score>=40?"#f97316":"var(--text-danger)";
  const scoreLabel = score>=80?"Excellent":score>=60?"Bon":score>=40?"Moyen":"Incomplet";

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <div style={{ background:"var(--bg-card)", borderBottom:"1px solid var(--border-subtle)", padding:"18px 24px", flexShrink:0 }}>
        <h1 style={{ fontFamily:"var(--font-voice)", fontWeight:500, fontSize:22, color:"var(--text-primary)", marginBottom:4 }}>Mon ADN Carrière</h1>
        <p style={{ fontSize:13, color:"var(--text-muted)" }}>Ton profil intelligent — plus il est complet, plus tes recommandations sont précises.</p>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>
        <form onSubmit={save}>
          <div className="profile-grid" style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:24, alignItems:"start" }}>

            <div style={{ display:"flex", flexDirection:"column", gap:16, position:"sticky", top:0 }}>

              <div style={{ background:"var(--bg-card)", borderRadius:20, border:"1px solid var(--border)",
                overflow:"hidden", boxShadow:"var(--shadow-md)" }}>

                <div style={{ background:`linear-gradient(135deg, ${scoreColor}18, ${scoreColor}08)`,
                  borderBottom:`1px solid ${scoreColor}30`,
                  padding:"22px 20px 18px", textAlign:"center" }}>
                  {(()=>{
                    const size=90; const r=37; const circ=2*Math.PI*r;
                    const dash=(score/100)*circ;
                    return (
                      <div style={{ position:"relative", display:"inline-block", marginBottom:10 }}>
                        <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
                          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={6} />
                          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={scoreColor} strokeWidth={6}
                            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                            style={{ transition:"stroke-dasharray .8s ease" }} />
                        </svg>
                        <div style={{ position:"absolute", inset:0, display:"flex",
                          flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                          <div style={{ width:48, height:48, borderRadius:"50%",
                            background:`linear-gradient(135deg,${scoreColor},${scoreColor}bb)`,
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:16, fontWeight:700, color:"#fff",
                            boxShadow:`0 3px 12px ${scoreColor}50` }}>
                            {form.full_name?form.full_name.split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase():"?"}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  <p style={{ fontWeight:700, fontSize:14, color:"var(--text-primary)", marginBottom:2 }}>
                    {form.full_name||"Ton nom"}
                  </p>
                  <p style={{ fontSize:11, color:"var(--text-muted)", marginBottom:10 }}>
                    {form.level||"Niveau"} · {form.field||"Filière"}
                  </p>
                  {user?.email && (
                    <p style={{ fontSize:11, color:"var(--text-muted)", marginBottom:10, wordBreak:"break-all" }}>
                      {user.email}
                    </p>
                  )}
                  <div style={{ display:"inline-flex", alignItems:"center", gap:6,
                    background:`${scoreColor}18`, border:`1px solid ${scoreColor}35`,
                    borderRadius:20, padding:"5px 14px" }}>
                    <div style={{ width:6, height:6, borderRadius:"50%", background:scoreColor }} />
                    <span style={{ fontSize:12, fontWeight:700, color:scoreColor }}>{score}/100</span>
                    <span style={{ fontSize:11, color:"var(--text-muted)" }}>· {scoreLabel}</span>
                  </div>
                </div>

                <div style={{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:8 }}>
                  {breakdown.map(b=>(
                    <div key={b.label}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                        <span style={{ fontSize:11, color:"var(--text-secondary)", fontWeight:500 }}>{b.label}</span>
                        {b.val===b.max
                          ? <Check size={12} color={b.color} strokeWidth={3} />
                          : <span style={{ fontSize:10, fontWeight:600, color:b.val>0?"var(--text-muted)":"var(--border)" }}>
                              {b.val>0 ? `${Math.round((b.val/b.max)*100)}%` : "—"}
                            </span>
                        }
                      </div>
                      <div style={{ height:4, background:"var(--border)", borderRadius:3, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${(b.val/b.max)*100}%`,
                          background:b.val>0?b.color:"transparent",
                          borderRadius:3, transition:"width .5s ease" }} />
                      </div>
                    </div>
                  ))}
                </div>

                {stats&&(
                  <div style={{ borderTop:"1px solid var(--border-subtle)",
                    display:"grid", gridTemplateColumns:"1fr 1fr" }}>
                    {[
                      { val:stats.applications?.total??0, label:"Candidatures", color:"#3b82f6", bg:"var(--bg-surface-2)" },
                      { val:stats.saved_count??0, label:"Favoris", color:"var(--text-warning)", bg:"var(--bg-surface-2)" },
                    ].map((s,i)=>(
                      <div key={s.label} style={{ padding:"12px 10px", textAlign:"center",
                        borderRight:i===0?"1px solid var(--border-subtle)":"none",
                        background:s.bg }}>
                        <p style={{ fontFamily:"var(--font-voice)", fontWeight:600, fontSize:18, color:s.color, lineHeight:1 }}>{s.val}</p>
                        <p style={{ fontSize:10, color:"var(--text-muted)", marginTop:3, fontWeight:500 }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {missing.length>0&&(
                <div style={{ background:"var(--bg-card)", borderRadius:16, border:"1px solid var(--border-danger)",
                  padding:"14px", boxShadow:"var(--shadow-sm)" }}>
                  <p style={{ fontSize:11, fontWeight:700, color:"var(--text-danger)",
                    textTransform:"uppercase", letterSpacing:".06em", marginBottom:8,
                    display:"flex", alignItems:"center", gap:5 }}>
                    <TriangleAlert size={12} /> À compléter
                  </p>
                  <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                    {missing.slice(0,5).map(m=>(
                      <div key={m} style={{ display:"flex", gap:8, alignItems:"center",
                        background:"var(--bg-danger)", borderRadius:10, padding:"6px 10px" }}>
                        <div style={{ width:5, height:5, borderRadius:"50%", background:"var(--text-danger)", flexShrink:0 }} />
                        <span style={{ fontSize:12, fontWeight:600, color:"var(--text-danger)" }}>{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ background:"var(--bg-card)", borderRadius:16, border:"1px solid var(--border)",
                padding:"8px", boxShadow:"var(--shadow-sm)" }}>
                {SECTIONS.map(s=>{
                  const active = section===s.key;
                  return (
                    <button key={s.key} type="button" onClick={()=>setSection(s.key)}
                      style={{ width:"100%", display:"flex", alignItems:"center", gap:10,
                        padding:"10px 12px", borderRadius:12, border:"none", cursor:"pointer",
                        marginBottom:2, transition:"all .15s",
                        background:active?"var(--text-primary)":"transparent",
                        color:active?"var(--bg-card)":"var(--text-secondary)" }}>
                      <s.icon size={16} />
                      <span style={{ flex:1, fontSize:13, fontWeight:700, textAlign:"left" }}>{s.label}</span>
                      {active&&<span style={{ fontSize:13, color:"var(--accent)" }}>→</span>}
                    </button>
                  );
                })}
              </div>

              <button type="submit" disabled={loading}
                style={{ width:"100%", background:loading?"var(--border)":"linear-gradient(135deg,var(--accent),#0d9488)",
                  color:"#fff", fontWeight:700, fontSize:14, padding:"14px 0",
                  borderRadius:14, border:"none", cursor:loading?"not-allowed":"pointer",
                  boxShadow:loading?"none":"0 4px 16px rgba(5,150,105,0.3)",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                {loading ? <LoaderCircle size={16} className="spin" /> : <Save size={16} />}
                {loading?"Enregistrement...":"Sauvegarder le profil"}
              </button>
            </div>

            <div>
              {section==="identity"&&(
                <div style={{ background:"var(--bg-card)", borderRadius:20, border:"1px solid var(--border)",
                  padding:28, boxShadow:"var(--shadow-sm)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
                    <div style={{ width:40, height:40, borderRadius:12, background:"var(--bg-success)",
                      display:"flex", alignItems:"center", justifyContent:"center" }}><User size={19} color="var(--text-success)" /></div>
                    <div>
                      <p style={{ fontWeight:700, fontSize:16, color:"var(--text-primary)" }}>Identité</p>
                      <p style={{ fontSize:12, color:"var(--text-muted)" }}>Informations personnelles de base</p>
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                    <div>
                      <label style={labelStyle}>Nom complet *</label>
                      <input type="text" value={form.full_name}
                        onChange={e=>setForm({...form,full_name:e.target.value})}
                        style={inputStyle} placeholder="Jean Dupont" />
                    </div>
                    <div>
                      <label style={labelStyle}>Email</label>
                      <input type="email" value={user?.email??""} disabled
                        style={{ ...inputStyle, background:"var(--bg-surface-2)", color:"var(--text-muted)" }} />
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      <div>
                        <label style={labelStyle}>Ville</label>
                        <input type="text" value={form.city}
                          onChange={e=>setForm({...form,city:e.target.value})}
                          style={inputStyle} placeholder="Yaoundé" />
                      </div>
                      <div>
                        <label style={labelStyle}>Téléphone</label>
                        <input type="tel" value={form.phone}
                          onChange={e=>setForm({...form,phone:e.target.value})}
                          style={inputStyle} placeholder="+237 6XX XXX XXX" />
                      </div>
                    </div>
                    <div style={{ background:"var(--bg-success)", borderRadius:12, padding:"12px 14px",
                      border:"1px solid var(--border-success)", display:"flex", gap:10 }}>
                      <Smartphone size={16} color="var(--text-success)" style={{ flexShrink:0, marginTop:1 }} />
                      <p style={{ fontSize:12, color:"var(--text-success)", lineHeight:1.5 }}>
                        Le téléphone active les alertes 7 jours et 1 jour avant chaque deadline.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {section==="academic"&&(
                <div style={{ background:"var(--bg-card)", borderRadius:20, border:"1px solid var(--border)",
                  padding:28, boxShadow:"var(--shadow-sm)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
                    <div style={{ width:40, height:40, borderRadius:12, background:"rgba(124,58,237,.12)",
                      display:"flex", alignItems:"center", justifyContent:"center" }}><GraduationCap size={19} color="#7c3aed" /></div>
                    <div>
                      <p style={{ fontWeight:700, fontSize:16, color:"var(--text-primary)" }}>Parcours académique</p>
                      <p style={{ fontSize:12, color:"var(--text-muted)" }}>Détermine 65% de ton score de matching</p>
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
                    <div>
                      <label style={{ ...labelStyle, marginBottom:10 }}>Niveau d'études *</label>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:8 }}>
                        {LEVELS.map(l=>(
                          <button key={l} type="button" onClick={()=>setForm({...form,level:l})}
                            style={{ padding:"12px 14px", borderRadius:12, border:"2px solid",
                              borderColor:form.level===l?"#7c3aed":"var(--border)",
                              background:form.level===l?"rgba(124,58,237,.1)":"var(--bg-surface-2)",
                              color:form.level===l?"#7c3aed":"var(--text-secondary)",
                              fontWeight:700, fontSize:13, cursor:"pointer", transition:"all .15s",
                              display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                            {l}{form.level===l&&<Check size={14} />}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Filière *</label>
                      <select value={form.field} onChange={e=>setForm({...form,field:e.target.value})}
                        style={{ ...inputStyle, cursor:"pointer" }}>
                        <option value="">Sélectionner ta filière</option>
                        {FIELDS.map(f=><option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                      <div>
                        <label style={labelStyle}>Moyenne / 20</label>
                        <div style={{ position:"relative" }}>
                          <input type="number" min="0" max="20" step="0.01" value={form.gpa}
                            onChange={e=>setForm({...form,gpa:e.target.value})}
                            style={{ ...inputStyle, paddingRight:60 }} placeholder="Ex: 14.5" />
                          <span style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)",
                            fontSize:12, color:"var(--text-muted)", fontWeight:700 }}>/20</span>
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>Age</label>
                        <div style={{ position:"relative" }}>
                          <input type="number" min="14" max="100" value={form.age}
                            onChange={e=>setForm({...form,age:e.target.value})}
                            style={{ ...inputStyle, paddingRight:44 }} placeholder="Ex: 22" />
                          <span style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)",
                            fontSize:12, color:"var(--text-muted)", fontWeight:700 }}>ans</span>
                        </div>
                      </div>
                    </div>
                    {form.gpa&&(
                        <div style={{ marginTop:8 }}>
                          <div style={{ height:6, background:"var(--border)", borderRadius:3, overflow:"hidden" }}>
                            <div style={{ height:"100%", borderRadius:3, transition:"width .5s",
                              width:`${(parseFloat(form.gpa)/20)*100}%`,
                              background:parseFloat(form.gpa)>=14?"var(--accent)":parseFloat(form.gpa)>=12?"var(--text-warning)":"var(--text-danger)" }} />
                          </div>
                          <p style={{ fontSize:11, fontWeight:700, marginTop:4, display:"flex", alignItems:"center", gap:4,
                            color:parseFloat(form.gpa)>=14?"var(--text-success)":parseFloat(form.gpa)>=12?"var(--text-warning)":"var(--text-danger)" }}>
                            {parseFloat(form.gpa)>=16 ? <><Sparkles size={12}/>Excellent</> : parseFloat(form.gpa)>=14 ? <><Check size={12}/>Très bien</> : parseFloat(form.gpa)>=12 ? <><ThumbsUp size={12}/>Bien</> : "Passable"}
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {section==="objectives"&&(
                <div style={{ background:"var(--bg-card)", borderRadius:20, border:"1px solid var(--border)",
                  padding:28, boxShadow:"var(--shadow-sm)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
                    <div style={{ width:40, height:40, borderRadius:12, background:"var(--bg-warning)",
                      display:"flex", alignItems:"center", justifyContent:"center" }}><Target size={19} color="var(--text-warning)" /></div>
                    <div>
                      <p style={{ fontWeight:700, fontSize:16, color:"var(--text-primary)" }}>Objectifs carrière</p>
                      <p style={{ fontSize:12, color:"var(--text-muted)" }}>Sélectionne tout ce qui te correspond</p>
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {OBJECTIVES.map(obj=>{
                      const selected = form.objectives.includes(obj.key);
                      return (
                        <button key={obj.key} type="button" onClick={()=>toggleObjective(obj.key)}
                          style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 18px",
                            borderRadius:16, border:"2px solid",
                            borderColor:selected?"var(--accent)":"var(--border)",
                            background:selected?"var(--bg-success)":"var(--bg-surface-2)",
                            cursor:"pointer", transition:"all .15s", textAlign:"left" }}>
                          <div style={{ width:40, height:40, borderRadius:11, flexShrink:0,
                            background:selected?"var(--accent)":"var(--bg-input)",
                            display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <obj.icon size={18} color={selected?"#fff":"var(--text-muted)"} />
                          </div>
                          <div style={{ flex:1 }}>
                            <p style={{ fontWeight:700, fontSize:14, color:selected?"var(--text-success)":"var(--text-primary)", marginBottom:2 }}>{obj.label}</p>
                            <p style={{ fontSize:12, color:"var(--text-muted)" }}>{obj.desc}</p>
                          </div>
                          {selected&&<Check size={18} color="var(--accent)" />}
                        </button>
                      );
                    })}
                  </div>
                  {form.objectives.length>0&&(
                    <div style={{ marginTop:16, background:"var(--bg-success)", borderRadius:12,
                      padding:"12px 14px", border:"1px solid var(--border-success)", display:"flex", alignItems:"center", gap:7 }}>
                      <Target size={13} color="var(--text-success)" />
                      <p style={{ fontSize:12, color:"var(--text-success)" }}>
                        <strong>{form.objectives.length} objectif{form.objectives.length>1?"s":""}</strong> — ton feed sera priorisé en conséquence.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {section==="languages"&&(
                <div style={{ background:"var(--bg-card)", borderRadius:20, border:"1px solid var(--border)",
                  padding:28, boxShadow:"var(--shadow-sm)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
                    <div style={{ width:40, height:40, borderRadius:12, background:"rgba(59,130,246,.12)",
                      display:"flex", alignItems:"center", justifyContent:"center" }}><LanguagesIcon size={19} color="#3b82f6" /></div>
                    <div>
                      <p style={{ fontWeight:700, fontSize:16, color:"var(--text-primary)" }}>Langues maîtrisées</p>
                      <p style={{ fontSize:12, color:"var(--text-muted)" }}>Langues dans lesquelles tu peux postuler</p>
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
                    {MAIN_LANGS.map(({code,flag,label})=>{
                      const selected = form.languages.includes(code);
                      return (
                        <button key={code} type="button" onClick={()=>toggleLang(code)}
                          style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px",
                            borderRadius:14, border:"2px solid",
                            borderColor:selected?"var(--accent)":"var(--border)",
                            background:selected?"var(--bg-success)":"var(--bg-card)",
                            cursor:"pointer", transition:"all .15s" }}>
                          <span style={{ fontSize:22 }}>{flag}</span>
                          <div style={{ flex:1, textAlign:"left" }}>
                            <p style={{ fontWeight:700, fontSize:14, color:selected?"var(--text-success)":"var(--text-secondary)" }}>{label}</p>
                          </div>
                          {selected&&<Check size={16} color="var(--accent)" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {section==="skills"&&(
                <div style={{ background:"var(--bg-card)", borderRadius:20, border:"1px solid var(--border)",
                  padding:28, boxShadow:"var(--shadow-sm)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
                    <div style={{ width:40, height:40, borderRadius:12, background:"var(--bg-warning)",
                      display:"flex", alignItems:"center", justifyContent:"center" }}><Zap size={19} color="var(--text-warning)" /></div>
                    <div>
                      <p style={{ fontWeight:700, fontSize:16, color:"var(--text-primary)" }}>Compétences avec niveau</p>
                      <p style={{ fontSize:12, color:"var(--text-muted)" }}>Évalue honnêtement ton niveau pour chaque skill</p>
                    </div>
                  </div>
                  {suggestedSkills.length>0&&(
                    <div style={{ marginBottom:20 }}>
                      <p style={{ ...labelStyle, marginBottom:10 }}>Suggestions pour {form.field||"ta filière"}</p>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                        {suggestedSkills.slice(0,12).map(s=>(
                          <button key={s} type="button" onClick={()=>addSkill(s,50)}
                            style={{ fontSize:12, fontWeight:600, color:"var(--accent-dark)",
                              background:"var(--bg-success)", border:"1px solid var(--border-success)",
                              borderRadius:20, padding:"5px 12px", cursor:"pointer",
                              display:"flex", alignItems:"center", gap:3 }}>
                            <Plus size={11} />{s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ display:"flex", gap:8, marginBottom:20 }}>
                    <input type="text" value={skillInput}
                      onChange={e=>setSkillInput(e.target.value)}
                      onKeyDown={e=>e.key==="Enter"&&(e.preventDefault(),addSkill(skillInput))}
                      placeholder="Ajouter une compétence..."
                      style={{ ...inputStyle, flex:1 }} />
                    <button type="button" onClick={()=>addSkill(skillInput)}
                      style={{ padding:"10px 16px", background:"var(--bg-success)", border:"1px solid var(--border-success)",
                        borderRadius:12, color:"var(--accent-dark)", cursor:"pointer",
                        display:"flex", alignItems:"center", justifyContent:"center" }}><Plus size={16} /></button>
                  </div>
                  {Object.keys(form.skills).length>0?(
                    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                      {Object.entries(form.skills).map(([name,level])=>{
                        const lvlConfig = SKILL_LEVELS.find(l=>level<=l.val)||SKILL_LEVELS[3];
                        return (
                          <div key={name} style={{ background:"var(--bg-surface-2)", borderRadius:14,
                            padding:"12px 14px", border:"1px solid var(--border-subtle)" }}>
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                              <p style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>{name}</p>
                              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                <span style={{ fontSize:11, fontWeight:700, color:lvlConfig.color,
                                  background:`${lvlConfig.color}18`, padding:"2px 9px", borderRadius:20 }}>
                                  {lvlConfig.label}
                                </span>
                                <button type="button" onClick={()=>removeSkill(name)}
                                  style={{ color:"var(--text-muted)", background:"none",
                                    border:"none", cursor:"pointer", display:"flex" }}><X size={14} /></button>
                              </div>
                            </div>
                            <div style={{ display:"flex", gap:4 }}>
                              {SKILL_LEVELS.map(sl=>(
                                <button key={sl.val} type="button" onClick={()=>updateSkillLevel(name,sl.val)}
                                  style={{ flex:1, padding:"5px 0", borderRadius:8, border:"none",
                                    cursor:"pointer", fontSize:10, fontWeight:700, transition:"all .15s",
                                    background:level===sl.val?sl.color:level>sl.val-1?`${sl.color}30`:"var(--border)",
                                    color:level===sl.val?"#fff":level>sl.val-1?sl.color:"var(--text-muted)" }}>
                                  {sl.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ):(
                    <div style={{ textAlign:"center", padding:"32px 0", color:"var(--text-muted)" }}>
                      <Zap size={30} style={{ marginBottom:8, opacity:.5 }} />
                      <p style={{ fontSize:13, fontWeight:600 }}>Aucune compétence ajoutée</p>
                      <p style={{ fontSize:11, marginTop:4 }}>Utilise les suggestions ci-dessus</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"80vh" }}>
        <LoaderCircle size={32} color="var(--accent)" className="spin" />
      </div>
    }>
      <ProfileInner />
    </Suspense>
  );
}
