"use client";
import { useState, Suspense } from "react";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { useQuery } from "@tanstack/react-query";

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
const OBJECTIVES = [
  { key:"bourse",  icon:"🎓", label:"Décrocher une bourse",           desc:"Financer mes études à l'étranger" },
  { key:"stage",   icon:"💼", label:"Trouver un stage",                desc:"Gagner de l'expérience" },
  { key:"emploi",  icon:"🚀", label:"Trouver un emploi",               desc:"Lancer ma carrière" },
  { key:"echange", icon:"🌍", label:"Programme d'échange",             desc:"Étudier à l'étranger" },
  { key:"master",  icon:"📚", label:"Intégrer un master à l'étranger", desc:"Poursuivre mes études" },
  { key:"startup", icon:"💡", label:"Lancer mon projet",               desc:"Entrepreneuriat & concours" },
];
const SKILL_LEVELS = [
  { val:25,  label:"Débutant",      color:"#ef4444" },
  { val:50,  label:"Intermédiaire", color:"#f59e0b" },
  { val:75,  label:"Avancé",        color:"#3b82f6" },
  { val:100, label:"Expert",        color:"#10b981" },
];
const F = "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm bg-white transition";

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

const SECTIONS = [
  { key:"identity",   label:"Identité",    icon:"👤" },
  { key:"academic",   label:"Académique",  icon:"🎓" },
  { key:"objectives", label:"Objectifs",   icon:"🎯" },
  { key:"languages",  label:"Langues",     icon:"🗣️" },
  { key:"skills",     label:"Compétences", icon:"⚡" },
] as const;
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
        skills: Object.keys(form.skills), skills_with_level: form.skills,
      });
      setUser(res.data); success("Profil mis à jour !");
    } catch(err:unknown) {
      toastError((err as {response?:{data?:{detail?:string}}})?.response?.data?.detail??"Erreur.");
    } finally { setLoading(false); }
  }

  const scoreColor = score>=80?"#10b981":score>=60?"#f59e0b":score>=40?"#f97316":"#ef4444";
  const scoreLabel = score>=80?"Excellent 🎉":score>=60?"Bon ⚡":score>=40?"Moyen ⚠️":"Incomplet ❌";

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <div style={{ background:"#fff", borderBottom:"0.5px solid #f3f4f6", padding:"18px 24px", flexShrink:0 }}>
        <h1 style={{ fontWeight:900, fontSize:22, color:"#111827", marginBottom:4 }}>Mon ADN Carrière</h1>
        <p style={{ fontSize:13, color:"#9ca3af" }}>Ton profil intelligent — plus il est complet, plus tes recommandations sont précises.</p>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>
        <form onSubmit={save}>
          <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:24, alignItems:"start" }}>

            {/* Colonne gauche */}
            <div style={{ display:"flex", flexDirection:"column", gap:16, position:"sticky", top:0 }}>

              {/* Score card — thème clair cohérent */}
              <div style={{ background:"#fff", borderRadius:20, border:"1px solid #e2e8f0",
                overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.07)" }}>

                {/* Header avec gradient léger */}
                <div style={{ background:`linear-gradient(135deg, ${scoreColor}12, ${scoreColor}06)`,
                  borderBottom:`1px solid ${scoreColor}20`,
                  padding:"22px 20px 18px", textAlign:"center" }}>
                  {(()=>{
                    const size=90; const r=37; const circ=2*Math.PI*r;
                    const dash=(score/100)*circ;
                    return (
                      <div style={{ position:"relative", display:"inline-block", marginBottom:10 }}>
                        <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
                          <circle cx={size/2} cy={size/2} r={r} fill="none"
                            stroke="#f1f5f9" strokeWidth={6} />
                          <circle cx={size/2} cy={size/2} r={r} fill="none"
                            stroke={scoreColor} strokeWidth={6}
                            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                            style={{ transition:"stroke-dasharray .8s ease" }} />
                        </svg>
                        <div style={{ position:"absolute", inset:0, display:"flex",
                          flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                          <div style={{ width:48, height:48, borderRadius:"50%",
                            background:`linear-gradient(135deg,${scoreColor},${scoreColor}bb)`,
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:16, fontWeight:900, color:"#fff",
                            boxShadow:`0 3px 12px ${scoreColor}50` }}>
                            {form.full_name?form.full_name.split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase():"?"}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  <p style={{ fontWeight:800, fontSize:14, color:"#111827", marginBottom:2 }}>
                    {form.full_name||"Ton nom"}
                  </p>
                  <p style={{ fontSize:11, color:"#6b7280", marginBottom:10 }}>
                    {form.level||"Niveau"} · {form.field||"Filière"}
                  </p>
                  <div style={{ display:"inline-flex", alignItems:"center", gap:6,
                    background:`${scoreColor}15`, border:`1px solid ${scoreColor}30`,
                    borderRadius:20, padding:"5px 14px" }}>
                    <div style={{ width:6, height:6, borderRadius:"50%", background:scoreColor }} />
                    <span style={{ fontSize:12, fontWeight:800, color:scoreColor }}>{score}/100</span>
                    <span style={{ fontSize:11, color:"#6b7280" }}>· {scoreLabel}</span>
                  </div>
                </div>

                {/* Breakdown — barres uniquement, pas de chiffres x/20 */}
                <div style={{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:8 }}>
                  {breakdown.map(b=>(
                    <div key={b.label}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                        <span style={{ fontSize:11, color:"#6b7280", fontWeight:500 }}>{b.label}</span>
                        {b.val===b.max
                          ? <span style={{ fontSize:10, fontWeight:700, color:b.color }}>✓</span>
                          : <span style={{ fontSize:10, fontWeight:600, color:b.val>0?"#94a3b8":"#cbd5e1" }}>
                              {b.val>0 ? `${Math.round((b.val/b.max)*100)}%` : "—"}
                            </span>
                        }
                      </div>
                      <div style={{ height:4, background:"#f1f5f9", borderRadius:3, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${(b.val/b.max)*100}%`,
                          background:b.val>0?b.color:"transparent",
                          borderRadius:3, transition:"width .5s ease" }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                {stats&&(
                  <div style={{ borderTop:"1px solid #f1f5f9",
                    display:"grid", gridTemplateColumns:"1fr 1fr" }}>
                    {[
                      { val:stats.applications?.total??0, label:"Candidatures", color:"#3b82f6", bg:"#eff6ff" },
                      { val:stats.saved_count??0, label:"Favoris", color:"#f59e0b", bg:"#fffbeb" },
                    ].map((s,i)=>(
                      <div key={s.label} style={{ padding:"12px 10px", textAlign:"center",
                        borderRight:i===0?"1px solid #f1f5f9":"none",
                        background:s.bg, cursor:"default" }}>
                        <p style={{ fontWeight:900, fontSize:18, color:s.color, lineHeight:1 }}>{s.val}</p>
                        <p style={{ fontSize:10, color:"#6b7280", marginTop:3, fontWeight:500 }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Champs manquants */}
              {missing.length>0&&(
                <div style={{ background:"#fff", borderRadius:16, border:"1px solid #fecaca",
                  padding:"14px", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                  <p style={{ fontSize:11, fontWeight:800, color:"#dc2626",
                    textTransform:"uppercase", letterSpacing:".06em", marginBottom:8 }}>
                    ❌ À compléter
                  </p>
                  <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                    {missing.slice(0,5).map(m=>(
                      <div key={m} style={{ display:"flex", gap:8, alignItems:"center",
                        background:"#fef2f2", borderRadius:10, padding:"6px 10px" }}>
                        <span style={{ fontSize:11 }}>⚠️</span>
                        <span style={{ fontSize:12, fontWeight:600, color:"#7f1d1d" }}>{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nav sections */}
              <div style={{ background:"#fff", borderRadius:16, border:"1px solid #f1f5f9",
                padding:"8px", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                {SECTIONS.map(s=>{
                  const active = section===s.key;
                  return (
                    <button key={s.key} type="button" onClick={()=>setSection(s.key)}
                      style={{ width:"100%", display:"flex", alignItems:"center", gap:10,
                        padding:"10px 12px", borderRadius:12, border:"none", cursor:"pointer",
                        marginBottom:2, transition:"all .15s",
                        background:active?"#0f172a":"transparent",
                        color:active?"#fff":"#374151" }}>
                      <span style={{ fontSize:15 }}>{s.icon}</span>
                      <span style={{ flex:1, fontSize:13, fontWeight:700, textAlign:"left" }}>{s.label}</span>
                      {active&&<span style={{ fontSize:13, color:"#10b981" }}>→</span>}
                    </button>
                  );
                })}
              </div>

              {/* Save */}
              <button type="submit" disabled={loading}
                style={{ width:"100%", background:loading?"#d1d5db":"linear-gradient(135deg,#059669,#0d9488)",
                  color:"#fff", fontWeight:800, fontSize:14, padding:"14px 0",
                  borderRadius:14, border:"none", cursor:loading?"not-allowed":"pointer",
                  boxShadow:loading?"none":"0 4px 16px rgba(5,150,105,0.3)" }}>
                {loading?"Enregistrement...":"💾 Sauvegarder le profil"}
              </button>
            </div>

            {/* Colonne droite */}
            <div>
              {section==="identity"&&(
                <div style={{ background:"#fff", borderRadius:20, border:"1px solid #f1f5f9",
                  padding:28, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
                    <div style={{ width:40, height:40, borderRadius:12, background:"#f0fdf4",
                      display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>👤</div>
                    <div>
                      <p style={{ fontWeight:900, fontSize:16, color:"#0f172a" }}>Identité</p>
                      <p style={{ fontSize:12, color:"#94a3b8" }}>Informations personnelles de base</p>
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                    <div>
                      <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#6b7280",
                        marginBottom:6, textTransform:"uppercase", letterSpacing:".04em" }}>Nom complet *</label>
                      <input type="text" value={form.full_name}
                        onChange={e=>setForm({...form,full_name:e.target.value})}
                        className={F} placeholder="Jean Dupont" />
                    </div>
                    <div>
                      <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#6b7280",
                        marginBottom:6, textTransform:"uppercase", letterSpacing:".04em" }}>Email</label>
                      <input type="email" value={user?.email??""} disabled
                        style={{ width:"100%", padding:"10px 14px", border:"0.5px solid #f3f4f6",
                          borderRadius:12, fontSize:13, background:"#f9fafb", color:"#9ca3af" }} />
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      <div>
                        <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#6b7280",
                          marginBottom:6, textTransform:"uppercase", letterSpacing:".04em" }}>Ville</label>
                        <input type="text" value={form.city}
                          onChange={e=>setForm({...form,city:e.target.value})}
                          className={F} placeholder="Yaoundé" />
                      </div>
                      <div>
                        <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#6b7280",
                          marginBottom:6, textTransform:"uppercase", letterSpacing:".04em" }}>Téléphone</label>
                        <input type="tel" value={form.phone}
                          onChange={e=>setForm({...form,phone:e.target.value})}
                          className={F} placeholder="+237 6XX XXX XXX" />
                      </div>
                    </div>
                    <div style={{ background:"#f0fdf4", borderRadius:12, padding:"12px 14px",
                      border:"1px solid #bbf7d0", display:"flex", gap:10 }}>
                      <span style={{ fontSize:16 }}>📱</span>
                      <p style={{ fontSize:12, color:"#065f46", lineHeight:1.5 }}>
                        Le téléphone active les alertes SMS 7 jours et 1 jour avant chaque deadline.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {section==="academic"&&(
                <div style={{ background:"#fff", borderRadius:20, border:"1px solid #f1f5f9",
                  padding:28, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
                    <div style={{ width:40, height:40, borderRadius:12, background:"#f3e8ff",
                      display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🎓</div>
                    <div>
                      <p style={{ fontWeight:900, fontSize:16, color:"#0f172a" }}>Parcours académique</p>
                      <p style={{ fontSize:12, color:"#94a3b8" }}>Détermine 65% de ton score de matching</p>
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
                    <div>
                      <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#6b7280",
                        marginBottom:10, textTransform:"uppercase", letterSpacing:".04em" }}>Niveau d'études *</label>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:8 }}>
                        {LEVELS.map(l=>(
                          <button key={l} type="button" onClick={()=>setForm({...form,level:l})}
                            style={{ padding:"12px 14px", borderRadius:12, border:"2px solid",
                              borderColor:form.level===l?"#7c3aed":"#f1f5f9",
                              background:form.level===l?"#f3e8ff":"#fafafa",
                              color:form.level===l?"#7c3aed":"#374151",
                              fontWeight:700, fontSize:13, cursor:"pointer", transition:"all .15s",
                              display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                            {l}{form.level===l&&<span>✅</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#6b7280",
                        marginBottom:6, textTransform:"uppercase", letterSpacing:".04em" }}>Filière *</label>
                      <select value={form.field} onChange={e=>setForm({...form,field:e.target.value})}
                        style={{ width:"100%", padding:"12px 14px", border:"1px solid #e5e7eb",
                          borderRadius:12, fontSize:14, background:"#fff", outline:"none", cursor:"pointer" }}>
                        <option value="">Sélectionner ta filière</option>
                        {FIELDS.map(f=><option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#6b7280",
                        marginBottom:6, textTransform:"uppercase", letterSpacing:".04em" }}>Moyenne / 20</label>
                      <div style={{ position:"relative" }}>
                        <input type="number" min="0" max="20" step="0.01" value={form.gpa}
                          onChange={e=>setForm({...form,gpa:e.target.value})}
                          className={F} placeholder="Ex: 14.5" style={{ paddingRight:60 }} />
                        <span style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)",
                          fontSize:12, color:"#9ca3af", fontWeight:700 }}>/20</span>
                      </div>
                      {form.gpa&&(
                        <div style={{ marginTop:8 }}>
                          <div style={{ height:6, background:"#f1f5f9", borderRadius:3, overflow:"hidden" }}>
                            <div style={{ height:"100%", borderRadius:3, transition:"width .5s",
                              width:`${(parseFloat(form.gpa)/20)*100}%`,
                              background:parseFloat(form.gpa)>=14?"#10b981":parseFloat(form.gpa)>=12?"#f59e0b":"#ef4444" }} />
                          </div>
                          <p style={{ fontSize:11, fontWeight:700, marginTop:4,
                            color:parseFloat(form.gpa)>=14?"#059669":parseFloat(form.gpa)>=12?"#d97706":"#dc2626" }}>
                            {parseFloat(form.gpa)>=16?"🌟 Excellent":parseFloat(form.gpa)>=14?"✅ Très bien":parseFloat(form.gpa)>=12?"👍 Bien":"💪 Passable"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {section==="objectives"&&(
                <div style={{ background:"#fff", borderRadius:20, border:"1px solid #f1f5f9",
                  padding:28, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
                    <div style={{ width:40, height:40, borderRadius:12, background:"#fef3c7",
                      display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🎯</div>
                    <div>
                      <p style={{ fontWeight:900, fontSize:16, color:"#0f172a" }}>Objectifs carrière</p>
                      <p style={{ fontSize:12, color:"#94a3b8" }}>Sélectionne tout ce qui te correspond</p>
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {OBJECTIVES.map(obj=>{
                      const selected = form.objectives.includes(obj.key);
                      return (
                        <button key={obj.key} type="button" onClick={()=>toggleObjective(obj.key)}
                          style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 18px",
                            borderRadius:16, border:"2px solid",
                            borderColor:selected?"#10b981":"#f1f5f9",
                            background:selected?"#f0fdf4":"#fafafa",
                            cursor:"pointer", transition:"all .15s", textAlign:"left" }}>
                          <span style={{ fontSize:26, flexShrink:0 }}>{obj.icon}</span>
                          <div style={{ flex:1 }}>
                            <p style={{ fontWeight:800, fontSize:14, color:selected?"#065f46":"#0f172a", marginBottom:2 }}>{obj.label}</p>
                            <p style={{ fontSize:12, color:"#94a3b8" }}>{obj.desc}</p>
                          </div>
                          {selected&&<span style={{ fontSize:18, flexShrink:0 }}>✅</span>}
                        </button>
                      );
                    })}
                  </div>
                  {form.objectives.length>0&&(
                    <div style={{ marginTop:16, background:"#f0fdf4", borderRadius:12,
                      padding:"12px 14px", border:"1px solid #bbf7d0" }}>
                      <p style={{ fontSize:12, color:"#065f46" }}>
                        🎯 <strong>{form.objectives.length} objectif{form.objectives.length>1?"s":""}</strong> — ton feed sera priorisé en conséquence.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {section==="languages"&&(
                <div style={{ background:"#fff", borderRadius:20, border:"1px solid #f1f5f9",
                  padding:28, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
                    <div style={{ width:40, height:40, borderRadius:12, background:"#dbeafe",
                      display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🗣️</div>
                    <div>
                      <p style={{ fontWeight:900, fontSize:16, color:"#0f172a" }}>Langues maîtrisées</p>
                      <p style={{ fontSize:12, color:"#94a3b8" }}>Langues dans lesquelles tu peux postuler</p>
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
                    {MAIN_LANGS.map(({code,flag,label})=>{
                      const selected = form.languages.includes(code);
                      return (
                        <button key={code} type="button" onClick={()=>toggleLang(code)}
                          style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px",
                            borderRadius:14, border:"2px solid",
                            borderColor:selected?"#10b981":"#e5e7eb",
                            background:selected?"#f0fdf4":"#fff",
                            cursor:"pointer", transition:"all .15s" }}>
                          <span style={{ fontSize:22 }}>{flag}</span>
                          <div style={{ flex:1, textAlign:"left" }}>
                            <p style={{ fontWeight:700, fontSize:14, color:selected?"#065f46":"#374151" }}>{label}</p>
                          </div>
                          {selected&&<span style={{ fontSize:15 }}>✅</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {section==="skills"&&(
                <div style={{ background:"#fff", borderRadius:20, border:"1px solid #f1f5f9",
                  padding:28, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
                    <div style={{ width:40, height:40, borderRadius:12, background:"#fef3c7",
                      display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>⚡</div>
                    <div>
                      <p style={{ fontWeight:900, fontSize:16, color:"#0f172a" }}>Compétences avec niveau</p>
                      <p style={{ fontSize:12, color:"#94a3b8" }}>Évalue honnêtement ton niveau pour chaque skill</p>
                    </div>
                  </div>
                  {suggestedSkills.length>0&&(
                    <div style={{ marginBottom:20 }}>
                      <p style={{ fontSize:11, fontWeight:700, color:"#6b7280",
                        textTransform:"uppercase", letterSpacing:".04em", marginBottom:10 }}>
                        Suggestions pour {form.field||"ta filière"}
                      </p>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                        {suggestedSkills.slice(0,12).map(s=>(
                          <button key={s} type="button" onClick={()=>addSkill(s,50)}
                            style={{ fontSize:12, fontWeight:600, color:"#059669",
                              background:"#f0fdf4", border:"1px solid #bbf7d0",
                              borderRadius:20, padding:"5px 12px", cursor:"pointer" }}
                            className="hover:bg-emerald-100">+ {s}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ display:"flex", gap:8, marginBottom:20 }}>
                    <input type="text" value={skillInput}
                      onChange={e=>setSkillInput(e.target.value)}
                      onKeyDown={e=>e.key==="Enter"&&(e.preventDefault(),addSkill(skillInput))}
                      placeholder="Ajouter une compétence..."
                      style={{ flex:1, padding:"10px 14px", border:"1px solid #e5e7eb",
                        borderRadius:12, fontSize:13, outline:"none" }}
                      className="focus:border-emerald-400" />
                    <button type="button" onClick={()=>addSkill(skillInput)}
                      style={{ padding:"10px 16px", background:"#f0fdf4", border:"1px solid #bbf7d0",
                        borderRadius:12, color:"#059669", fontWeight:800, fontSize:16, cursor:"pointer" }}>+</button>
                  </div>
                  {Object.keys(form.skills).length>0?(
                    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                      {Object.entries(form.skills).map(([name,level])=>{
                        const lvlConfig = SKILL_LEVELS.find(l=>level<=l.val)||SKILL_LEVELS[3];
                        return (
                          <div key={name} style={{ background:"#f8fafc", borderRadius:14,
                            padding:"12px 14px", border:"1px solid #f1f5f9" }}>
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                              <p style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{name}</p>
                              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                <span style={{ fontSize:11, fontWeight:700, color:lvlConfig.color,
                                  background:`${lvlConfig.color}15`, padding:"2px 9px", borderRadius:20 }}>
                                  {lvlConfig.label}
                                </span>
                                <button type="button" onClick={()=>removeSkill(name)}
                                  style={{ fontSize:14, color:"#94a3b8", background:"none",
                                    border:"none", cursor:"pointer" }}>×</button>
                              </div>
                            </div>
                            <div style={{ display:"flex", gap:4 }}>
                              {SKILL_LEVELS.map(sl=>(
                                <button key={sl.val} type="button" onClick={()=>updateSkillLevel(name,sl.val)}
                                  style={{ flex:1, padding:"5px 0", borderRadius:8, border:"none",
                                    cursor:"pointer", fontSize:10, fontWeight:700, transition:"all .15s",
                                    background:level===sl.val?sl.color:level>sl.val-1?`${sl.color}30`:"#f1f5f9",
                                    color:level===sl.val?"#fff":level>sl.val-1?sl.color:"#9ca3af" }}>
                                  {sl.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ):(
                    <div style={{ textAlign:"center", padding:"32px 0", color:"#d1d5db" }}>
                      <p style={{ fontSize:32, marginBottom:8 }}>⚡</p>
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
    <Suspense fallback={<div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"80vh" }}><div className="animate-spin rounded-full" style={{ width:40, height:40, border:"3px solid #10b981", borderTopColor:"transparent" }} /></div>}>
      <ProfileInner />
    </Suspense>
  );
}
