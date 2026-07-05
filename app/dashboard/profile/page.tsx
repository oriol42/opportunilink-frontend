"use client";
import { useState, Suspense } from "react";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { useQuery } from "@tanstack/react-query";
import {
  User, GraduationCap, Target, Languages as LanguagesIcon, Zap, Check, X,
  TriangleAlert, Smartphone, ThumbsUp, Rocket, Sparkles, Globe, BookOpen,
  Lightbulb, LoaderCircle, Award, Save, Plus, Lock, Eye, EyeOff, LucideIcon,
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
  width:"100%", padding:"11px 14px", border:"1px solid var(--border)", borderRadius:12,
  fontSize:14, background:"var(--bg-input)", color:"var(--text-primary)", outline:"none",
  boxSizing:"border-box",
};
const labelStyle: React.CSSProperties = {
  display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)",
  marginBottom:6, textTransform:"uppercase", letterSpacing:".04em",
};

function computeEmployabilityScore(form: {
  full_name:string; level:string; field:string; city:string;
  gpa:string; age:string; phone:string; languages:string[]; skills:Record<string,number>;
  objectives:string[];
}): { score:number; missing:string[] } {
  // Pondération cohérente : chaque champ listé dans « missing » compte dans le
  // score, et le total atteint 100 dès que tout est rempli raisonnablement
  // (2 langues et 3 compétences suffisent pour les catégories progressives).
  const langCount  = form.languages.length;
  const skillCount = Object.keys(form.skills).length;
  const parts = [
    form.full_name ? 8 : 0,
    form.level     ? 15 : 0,
    form.field     ? 15 : 0,
    form.city      ? 7 : 0,
    form.gpa       ? 10 : 0,
    form.age       ? 5 : 0,
    form.phone     ? 5 : 0,
    Math.min(langCount * 8, 15),   // ≥ 2 langues → 15
    Math.min(skillCount * 5, 15),  // ≥ 3 compétences → 15
    form.objectives.length > 0 ? 5 : 0,
  ];
  const score = Math.min(parts.reduce((a,b)=>a+b,0), 100);
  const missing = [
    !form.full_name && "Nom complet", !form.level && "Niveau d'études", !form.field && "Filière",
    !form.age && "Âge", !form.gpa && "Moyenne", !form.city && "Ville", !form.phone && "Téléphone",
    form.languages.length===0 && "Langues", Object.keys(form.skills).length===0 && "Compétences",
    form.objectives.length===0 && "Objectifs carrière",
  ].filter(Boolean) as string[];
  return { score, missing };
}

const TABS: { key:string; label:string; icon:LucideIcon }[] = [
  { key:"identity",   label:"Identité",    icon:User },
  { key:"academic",   label:"Académique",  icon:GraduationCap },
  { key:"objectives", label:"Objectifs",   icon:Target },
  { key:"languages",  label:"Langues",     icon:LanguagesIcon },
  { key:"skills",     label:"Compétences", icon:Zap },
  { key:"security",   label:"Sécurité",    icon:Lock },
];
type TabKey = typeof TABS[number]["key"];

function ProfileInner() {
  const { user, setUser } = useStore();
  const { success, error: toastError } = useToast();
  const [tab, setTab] = useState<TabKey>("identity");
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
  const [loading, setLoading] = useState(false);

  const { data: stats } = useQuery({
    queryKey:["my-stats"],
    queryFn: async () => (await api.get("/users/me/stats")).data,
    staleTime:60000,
  });

  const { score, missing } = computeEmployabilityScore(form);
  const scoreColor = score>=80?"var(--accent)":score>=60?"var(--text-warning)":score>=40?"#f97316":"var(--text-danger)";

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

  async function save() {
    setLoading(true);
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

  const initials = form.full_name ? form.full_name.split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase() : "?";

  return (
    <div style={{ height:"100%", overflowY:"auto", background:"var(--bg-base)" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "20px 20px 60px" }}>

        <div style={{ background:"var(--bg-hero)", borderRadius:20, padding:"22px 24px", marginBottom:16,
          display:"flex", alignItems:"center", gap:18, flexWrap:"wrap", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-40, right:-40, width:180, height:180,
            background:"radial-gradient(circle,rgba(16,185,129,.15) 0%,transparent 70%)", pointerEvents:"none" }} />

          <div style={{ width:64, height:64, borderRadius:"50%", flexShrink:0,
            background:"linear-gradient(135deg,var(--accent),var(--accent-dark))",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:22, fontWeight:700, color:"#fff", border:"2px solid rgba(16,185,129,.4)", zIndex:1 }}>
            {initials}
          </div>

          <div style={{ flex:1, minWidth:180, zIndex:1 }}>
            <p style={{ fontFamily:"var(--font-voice)", fontWeight:500, fontSize:19, color:"#fff", marginBottom:2 }}>
              {form.full_name || "Ton nom"}
            </p>
            <p style={{ fontSize:12.5, color:"#a7f3d0" }}>
              {form.level||"Niveau"} · {form.field||"Filière"}{user?.email ? ` · ${user.email}` : ""}
            </p>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:10, zIndex:1 }}>
            {(() => {
              const size=58; const r=24; const circ=2*Math.PI*r; const dash=(score/100)*circ;
              return (
                <div style={{ position:"relative" }}>
                  <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
                    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.15)" strokeWidth={5} />
                    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={scoreColor} strokeWidth={5}
                      strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition:"stroke-dasharray .6s" }} />
                  </svg>
                  <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <span style={{ fontSize:14, fontWeight:700, color:"#fff" }}>{score}</span>
                  </div>
                </div>
              );
            })()}
            <div>
              <p style={{ fontSize:11, color:"#a7f3d0", fontWeight:700, textTransform:"uppercase", letterSpacing:".05em" }}>Profil</p>
              <p style={{ fontSize:13, fontWeight:600, color:"#fff" }}>{score}/100</p>
            </div>
          </div>
        </div>

        {missing.length>0 && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:16 }}>
            <span style={{ fontSize:11, fontWeight:700, color:"var(--text-danger)", display:"flex", alignItems:"center", gap:4,
              padding:"4px 2px" }}><TriangleAlert size={12} /> À compléter :</span>
            {missing.map(m => (
              <span key={m} style={{ fontSize:11, fontWeight:600, color:"var(--text-danger)",
                background:"var(--bg-danger)", border:"1px solid var(--border-danger)",
                padding:"3px 10px", borderRadius:20 }}>{m}</span>
            ))}
          </div>
        )}

        {stats && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))", gap:10, marginBottom:20 }}>
            {[
              { val:stats.applications?.total??0, label:"Candidatures" },
              { val:stats.saved_count??0, label:"Favoris" },
            ].map(s => (
              <div key={s.label} style={{ background:"var(--bg-card)", border:"1px solid var(--border)",
                borderRadius:14, padding:"12px 14px", textAlign:"center" }}>
                <p style={{ fontFamily:"var(--font-voice)", fontWeight:600, fontSize:20, color:"var(--text-primary)" }}>{s.val}</p>
                <p style={{ fontSize:11, color:"var(--text-muted)", fontWeight:600, marginTop:2 }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        <div style={{ display:"flex", flexWrap:"wrap", gap:6, background:"var(--bg-card)",
          border:"1px solid var(--border)", borderRadius:14, padding:6, marginBottom:16 }}>
          {TABS.map(t => {
            const active = tab===t.key;
            return (
              <button key={t.key} onClick={()=>setTab(t.key)} style={{
                flex:"1 1 auto", minWidth:100, display:"flex", alignItems:"center", justifyContent:"center", gap:7,
                padding:"10px 12px", borderRadius:10, border:"none", cursor:"pointer",
                fontWeight:600, fontSize:12.5, transition:"all .15s",
                background: active ? "var(--text-primary)" : "transparent",
                color: active ? "var(--bg-card)" : "var(--text-muted)" }}>
                <t.icon size={14} />{t.label}
              </button>
            );
          })}
        </div>

        <div style={{ background:"var(--bg-card)", borderRadius:20, border:"1px solid var(--border)",
          padding:24, boxShadow:"var(--shadow-sm)" }}>

          {tab==="identity" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div>
                <label style={labelStyle}>Nom complet *</label>
                <input type="text" value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}
                  style={inputStyle} placeholder="Jean Dupont" />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" value={user?.email??""} disabled
                  style={{ ...inputStyle, background:"var(--bg-surface-2)", color:"var(--text-muted)" }} />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12 }}>
                <div>
                  <label style={labelStyle}>Ville</label>
                  <input type="text" value={form.city} onChange={e=>setForm({...form,city:e.target.value})}
                    style={inputStyle} placeholder="Yaoundé" />
                </div>
                <div>
                  <label style={labelStyle}>Téléphone</label>
                  <input type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}
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
          )}

          {tab==="academic" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <div>
                <label style={{ ...labelStyle, marginBottom:10 }}>Niveau d'études *</label>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:8 }}>
                  {LEVELS.map(l=>(
                    <button key={l} type="button" onClick={()=>setForm({...form,level:l})}
                      style={{ padding:"11px 14px", borderRadius:12, border:"2px solid",
                        borderColor:form.level===l?"#7c3aed":"var(--border)",
                        background:form.level===l?"rgba(124,58,237,.1)":"var(--bg-surface-2)",
                        color:form.level===l?"#7c3aed":"var(--text-secondary)",
                        fontWeight:700, fontSize:12.5, cursor:"pointer", transition:"all .15s",
                        display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      {l}{form.level===l&&<Check size={13} />}
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
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:16 }}>
                <div>
                  <label style={labelStyle}>Moyenne / 20</label>
                  <div style={{ position:"relative" }}>
                    <input type="number" min="0" max="20" step="0.1" value={form.gpa}
                      onChange={e=>setForm({...form,gpa:e.target.value})}
                      style={{ ...inputStyle, paddingRight:44 }} placeholder="14.5" />
                    <span style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)",
                      fontSize:12, color:"var(--text-muted)", fontWeight:700 }}>/20</span>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Âge</label>
                  <div style={{ position:"relative" }}>
                    <input type="number" min="14" max="100" value={form.age}
                      onChange={e=>setForm({...form,age:e.target.value})}
                      style={{ ...inputStyle, paddingRight:40 }} placeholder="22" />
                    <span style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)",
                      fontSize:12, color:"var(--text-muted)", fontWeight:700 }}>ans</span>
                  </div>
                </div>
              </div>
              {form.gpa && (
                <p style={{ fontSize:12, fontWeight:700, display:"flex", alignItems:"center", gap:5, marginTop:-8,
                  color:parseFloat(form.gpa)>=14?"var(--text-success)":parseFloat(form.gpa)>=12?"var(--text-warning)":"var(--text-danger)" }}>
                  {parseFloat(form.gpa)>=16 ? <><Sparkles size={12}/>Excellent</> : parseFloat(form.gpa)>=14 ? <><Check size={12}/>Très bien</> : parseFloat(form.gpa)>=12 ? <><ThumbsUp size={12}/>Bien</> : "Passable"}
                </p>
              )}
            </div>
          )}

          {tab==="objectives" && (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {OBJECTIVES.map(obj=>{
                const selected = form.objectives.includes(obj.key);
                return (
                  <button key={obj.key} type="button" onClick={()=>toggleObjective(obj.key)}
                    style={{ display:"flex", alignItems:"center", gap:14, padding:"15px 16px",
                      borderRadius:14, border:"2px solid",
                      borderColor:selected?"var(--accent)":"var(--border)",
                      background:selected?"var(--bg-success)":"var(--bg-surface-2)",
                      cursor:"pointer", transition:"all .15s", textAlign:"left" }}>
                    <div style={{ width:38, height:38, borderRadius:10, flexShrink:0,
                      background:selected?"var(--accent)":"var(--bg-input)",
                      display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <obj.icon size={17} color={selected?"#fff":"var(--text-muted)"} />
                    </div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontWeight:700, fontSize:13.5, color:selected?"var(--text-success)":"var(--text-primary)", marginBottom:2 }}>{obj.label}</p>
                      <p style={{ fontSize:11.5, color:"var(--text-muted)" }}>{obj.desc}</p>
                    </div>
                    {selected&&<Check size={17} color="var(--accent)" />}
                  </button>
                );
              })}
            </div>
          )}

          {tab==="languages" && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:10 }}>
              {MAIN_LANGS.map(({code,flag,label})=>{
                const selected = form.languages.includes(code);
                return (
                  <button key={code} type="button" onClick={()=>toggleLang(code)}
                    style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px",
                      borderRadius:12, border:"2px solid",
                      borderColor:selected?"var(--accent)":"var(--border)",
                      background:selected?"var(--bg-success)":"var(--bg-card)",
                      cursor:"pointer", transition:"all .15s" }}>
                    <span style={{ fontSize:19 }}>{flag}</span>
                    <span style={{ flex:1, fontWeight:700, fontSize:12.5, textAlign:"left",
                      color:selected?"var(--text-success)":"var(--text-secondary)" }}>{label}</span>
                    {selected&&<Check size={14} color="var(--accent)" />}
                  </button>
                );
              })}
            </div>
          )}

          {tab==="skills" && (
            <div>
              {suggestedSkills.length>0&&(
                <div style={{ marginBottom:18 }}>
                  <p style={{ ...labelStyle, marginBottom:10 }}>Suggestions pour {form.field||"ta filière"}</p>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                    {suggestedSkills.slice(0,12).map(s=>(
                      <button key={s} type="button" onClick={()=>addSkill(s,50)}
                        style={{ fontSize:11.5, fontWeight:600, color:"var(--accent-dark)",
                          background:"var(--bg-success)", border:"1px solid var(--border-success)",
                          borderRadius:20, padding:"5px 12px", cursor:"pointer",
                          display:"flex", alignItems:"center", gap:3 }}>
                        <Plus size={11} />{s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display:"flex", gap:8, marginBottom:18 }}>
                <input type="text" value={skillInput} onChange={e=>setSkillInput(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&(e.preventDefault(),addSkill(skillInput))}
                  placeholder="Ajouter une compétence..." style={{ ...inputStyle, flex:1 }} />
                <button type="button" onClick={()=>addSkill(skillInput)}
                  style={{ padding:"10px 16px", background:"var(--bg-success)", border:"1px solid var(--border-success)",
                    borderRadius:12, color:"var(--accent-dark)", cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center" }}><Plus size={16} /></button>
              </div>
              {Object.keys(form.skills).length>0?(
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {Object.entries(form.skills).map(([name,level])=>{
                    const lvlConfig = SKILL_LEVELS.find(l=>level<=l.val)||SKILL_LEVELS[3];
                    return (
                      <div key={name} style={{ background:"var(--bg-surface-2)", borderRadius:14,
                        padding:"12px 14px", border:"1px solid var(--border-subtle)" }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                          <p style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>{name}</p>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <span style={{ fontSize:11, fontWeight:700, color:lvlConfig.color,
                              background:`${lvlConfig.color}18`, padding:"2px 9px", borderRadius:20 }}>{lvlConfig.label}</span>
                            <button type="button" onClick={()=>removeSkill(name)}
                              style={{ color:"var(--text-muted)", background:"none", border:"none", cursor:"pointer", display:"flex" }}><X size={14} /></button>
                          </div>
                        </div>
                        <div style={{ display:"flex", gap:4 }}>
                          {SKILL_LEVELS.map(sl=>(
                            <button key={sl.val} type="button" onClick={()=>updateSkillLevel(name,sl.val)}
                              style={{ flex:1, padding:"5px 0", borderRadius:8, border:"none",
                                cursor:"pointer", fontSize:10, fontWeight:700, transition:"all .15s",
                                background:level===sl.val?sl.color:level>sl.val-1?`${sl.color}30`:"var(--border)",
                                color:level===sl.val?"#fff":level>sl.val-1?sl.color:"var(--text-muted)" }}>{sl.label}</button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ):(
                <div style={{ textAlign:"center", padding:"28px 0", color:"var(--text-muted)" }}>
                  <Zap size={28} style={{ marginBottom:8, opacity:.5 }} />
                  <p style={{ fontSize:13, fontWeight:600 }}>Aucune compétence ajoutée</p>
                </div>
              )}
            </div>
          )}

          {tab==="security" && <SecuritySection />}
        </div>

        {tab!=="security" && (
          <button onClick={save} disabled={loading} style={{
            width:"100%", marginTop:16, padding:"15px 0", borderRadius:14, border:"none",
            background:loading?"var(--border)":"linear-gradient(135deg,var(--accent),#0d9488)",
            color:"#fff", fontWeight:700, fontSize:14, cursor:loading?"not-allowed":"pointer",
            boxShadow:loading?"none":"0 4px 16px rgba(5,150,105,0.3)",
            display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            {loading ? <LoaderCircle size={16} className="spin" /> : <Save size={16} />}
            {loading?"Enregistrement...":"Sauvegarder le profil"}
          </button>
        )}
      </div>
    </div>
  );
}

function SecuritySection() {
  const { success, error: toastError } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 8) { toastError("Le nouveau mot de passe doit faire 8 caractères minimum."); return; }
    if (next !== confirm) { toastError("Les mots de passe ne correspondent pas."); return; }
    setLoading(true);
    try {
      await api.post("/auth/change-password", { current_password: current, new_password: next });
      success("Mot de passe modifié avec succès !");
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err: unknown) {
      toastError((err as {response?:{data?:{detail?:string}}})?.response?.data?.detail ?? "Erreur — vérifie ton mot de passe actuel.");
    } finally { setLoading(false); }
  }

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <div style={{ width:38, height:38, borderRadius:10, background:"var(--bg-danger)",
          display:"flex", alignItems:"center", justifyContent:"center" }}><Lock size={17} color="var(--text-danger)" /></div>
        <div>
          <p style={{ fontWeight:700, fontSize:14, color:"var(--text-primary)" }}>Sécurité du compte</p>
          <p style={{ fontSize:11.5, color:"var(--text-muted)" }}>Change ton mot de passe régulièrement</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14, maxWidth:420 }}>
        <div>
          <label style={labelStyle}>Mot de passe actuel</label>
          <input type={show?"text":"password"} value={current} onChange={e=>setCurrent(e.target.value)}
            style={inputStyle} placeholder="Ton mot de passe actuel" required />
        </div>
        <div>
          <label style={labelStyle}>Nouveau mot de passe</label>
          <input type={show?"text":"password"} value={next} onChange={e=>setNext(e.target.value)}
            style={inputStyle} placeholder="8 caractères minimum" required />
        </div>
        <div>
          <label style={labelStyle}>Confirmer le nouveau mot de passe</label>
          <input type={show?"text":"password"} value={confirm} onChange={e=>setConfirm(e.target.value)}
            style={inputStyle} placeholder="Retape le nouveau mot de passe" required />
        </div>
        <button type="button" onClick={()=>setShow(s=>!s)} style={{ display:"flex", alignItems:"center", gap:6,
          background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", fontSize:12,
          fontWeight:600, width:"fit-content" }}>
          {show ? <EyeOff size={13} /> : <Eye size={13} />} {show ? "Masquer" : "Afficher"} les mots de passe
        </button>
        <button type="submit" disabled={loading} style={{ padding:"13px", borderRadius:12, border:"none",
          background:loading?"var(--border)":"var(--text-danger)", color:loading?"var(--text-muted)":"#fff",
          fontWeight:700, fontSize:14, cursor:loading?"not-allowed":"pointer", marginTop:4 }}>
          {loading ? "Modification..." : "Changer le mot de passe"}
        </button>
      </form>
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
