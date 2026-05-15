"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";
import { Building2, Plus, BarChart3, Users, CheckCircle, XCircle, Clock, Send, Trash2, Eye, Globe, Calendar, Award, FileText, Sparkles, Shield, Zap, Edit2, ToggleLeft, ToggleRight } from "lucide-react";

interface OrgOpp { id: string; title: string; type: string; deadline: string|null; is_active: boolean; country: string|null; description: string; }
interface Analytics { total_opportunities: number; active_opportunities: number; total_applications: number; applications_by_status: Record<string,number>; top_opportunity: string|null; }

const BANNED = ["gmail.com","yahoo.com","hotmail.com","outlook.com","icloud.com","live.com","protonmail.com","aol.com"];
const isProEmail = (e: string) => { const d = e.split("@")[1]?.toLowerCase(); return !!d && !BANNED.includes(d); };
const TYPE_LABELS: Record<string,string> = { bourse:"Bourse", stage:"Stage", emploi:"Emploi", echange:"Échange", concours:"Concours" };
const TYPE_COLORS: Record<string,string> = { bourse:"#7c3aed", stage:"#2563eb", emploi:"#059669", echange:"#d97706", concours:"#dc2626" };
const ORG_TYPES = ["entreprise","université","ong","ambassade","gouvernement","fondation"];
const LEVELS = ["Licence","Master","Doctorat","BTS","DUT","Ingénieur"];
const FIELDS = ["Informatique","Génie Logiciel","Réseaux & Télécoms","Droit","Économie","Gestion","Finance","Marketing","Médecine","Sciences","Mathématiques","Ingénierie Civile","Architecture","Agriculture","Éducation","Langues","Psychologie"];
const LANGS = [{code:"fr",label:"Français"},{code:"en",label:"Anglais"},{code:"de",label:"Allemand"},{code:"es",label:"Espagnol"},{code:"ar",label:"Arabe"}];
const dL = (d: string|null) => d ? Math.ceil((new Date(d).getTime()-Date.now())/86400000) : null;
const SI: React.CSSProperties = { width:"100%", padding:"11px 14px", border:"1.5px solid #e2e8f0", borderRadius:12, fontSize:14, outline:"none", background:"#fff", color:"#0f172a" };
const DI: React.CSSProperties = { width:"100%", padding:"12px 16px", background:"#0d1a0e", border:"1.5px solid #1a3a22", borderRadius:12, color:"#f0fdf4", fontSize:14, outline:"none" };
const EMPTY = { title:"", type:"emploi", description:"", country:"Cameroun", deadline:"", source_url:"", required_languages:["fr"] as string[], required_level:[] as string[], required_fields:[] as string[], min_gpa:"" };

export default function OrgDashboard() {
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();
  const [orgId, setOrgId] = useState<string|null>(null);
  const [mounted, setMounted] = useState(false);
  const [regForm, setRegForm] = useState({ name:"", type:"entreprise", email:"", website:"" });
  const [emailError, setEmailError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingOpp, setEditingOpp] = useState<OrgOpp|null>(null);
  const [activeTab, setActiveTab] = useState<"opportunities"|"analytics">("opportunities");
  const [oppForm, setOppForm] = useState(EMPTY);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("org_id");
    if (stored) setOrgId(stored);
  }, []);

  const { data: analytics } = useQuery<Analytics>({
    queryKey: ["org-analytics", orgId],
    queryFn: async () => (await api.get(`/org/analytics?org_id=${orgId}`)).data,
    enabled: !!orgId,
  });
  const { data: opps, isLoading } = useQuery<OrgOpp[]>({
    queryKey: ["org-opps", orgId],
    queryFn: async () => (await api.get(`/org/opportunities?org_id=${orgId}`)).data,
    enabled: !!orgId,
  });

  const registerMutation = useMutation({
    mutationFn: (d: typeof regForm) => api.post("/org/register", { name:d.name, type:d.type, domain:d.email.split("@")[1], website:d.website||null }),
    onSuccess: (res) => { const id = res.data.id; localStorage.setItem("org_id", id); setOrgId(id); success("Organisation créée !"); },
    onError: () => toastError("Erreur lors de la création."),
  });

  const publishMutation = useMutation({
    mutationFn: (d: typeof oppForm) => api.post(`/org/opportunities?org_id=${orgId}`, { ...d, deadline:d.deadline||null, min_gpa:d.min_gpa?parseFloat(d.min_gpa):null }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey:["org-opps"] }); queryClient.invalidateQueries({ queryKey:["org-analytics"] }); setShowModal(false); setOppForm(EMPTY); success("Opportunité publiée !"); },
    onError: (e: unknown) => { const det = (e as {response?:{data?:{detail?:string}}})?.response?.data?.detail; toastError(det ?? "Erreur."); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id:string; active:boolean }) => api.patch(`/org/opportunities/${id}?org_id=${orgId}`, { is_active: active }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey:["org-opps"] }); queryClient.invalidateQueries({ queryKey:["org-analytics"] }); success("Statut mis à jour !"); },
    onError: () => toastError("Erreur."),
  });

  function openNew() { setEditingOpp(null); setOppForm(EMPTY); setShowModal(true); }
  function openEdit(opp: OrgOpp) {
    setEditingOpp(opp);
    setOppForm({ title:opp.title, type:opp.type, description:opp.description, country:opp.country??"Cameroun", deadline:opp.deadline??"", source_url:"", required_languages:["fr"], required_level:[], required_fields:[], min_gpa:"" });
    setShowModal(true);
  }
  function toggleLang(code: string) { setOppForm(f => ({ ...f, required_languages: f.required_languages.includes(code) ? f.required_languages.filter(l=>l!==code) : [...f.required_languages,code] })); }
  function toggleLevel(l: string) { setOppForm(f => ({ ...f, required_level: f.required_level.includes(l) ? f.required_level.filter(x=>x!==l) : [...f.required_level,l] })); }
  function toggleField(l: string) { setOppForm(f => ({ ...f, required_fields: f.required_fields.includes(l) ? f.required_fields.filter(x=>x!==l) : [...f.required_fields,l] })); }

  if (!mounted) return null;

  if (!orgId) return (
    <div style={{ minHeight:"100vh", background:"#030712", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ position:"fixed", top:"30%", left:"50%", transform:"translate(-50%,-50%)", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)", pointerEvents:"none" }} />
      <div style={{ position:"relative", width:"100%", maxWidth:520 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <Link href="/"><span style={{ fontWeight:900, fontSize:26, color:"#4ade80" }}>Opportu<span style={{ color:"#fff" }}>Link</span></span></Link>
          <p style={{ color:"#6b7280", fontSize:14, marginTop:8 }}>Portail Organisations · B2B</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:28 }}>
          {[{Icon:Users,label:"Ciblage précis",sub:"Profils filtrés"},{Icon:Zap,label:"Instantané",sub:"Feed temps réel"},{Icon:BarChart3,label:"Analytics",sub:"Stats détaillées"}].map(({Icon,label,sub}) => (
            <div key={label} style={{ background:"#0a0f0a", border:"1px solid #1a2e1a", borderRadius:14, padding:"14px 12px", textAlign:"center" }}>
              <Icon size={20} color="#4ade80" style={{ margin:"0 auto 8px" }} />
              <p style={{ fontSize:12, fontWeight:700, color:"#f0fdf4" }}>{label}</p>
              <p style={{ fontSize:10, color:"#4b6b52", marginTop:2 }}>{sub}</p>
            </div>
          ))}
        </div>
        <div style={{ background:"#0a0f0a", border:"1px solid #1a2e1a", borderRadius:24, padding:32, boxShadow:"0 25px 50px rgba(0,0,0,0.5)" }}>
          <h2 style={{ fontWeight:900, fontSize:22, color:"#fff", marginBottom:4 }}>Créer mon organisation</h2>
          <p style={{ fontSize:14, color:"#4b6b52", marginBottom:24 }}>Gratuit · Publie dans le feed de milliers d'étudiants</p>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div><DLbl t="Nom *" /><input type="text" value={regForm.name} onChange={e=>setRegForm({...regForm,name:e.target.value})} style={DI} placeholder="MTN Cameroun, Université de Yaoundé I..." /></div>
            <div>
              <DLbl t="Email professionnel *" />
              <input type="email" value={regForm.email} onChange={e=>{ setRegForm({...regForm,email:e.target.value}); if(e.target.value.includes("@")) setEmailError(isProEmail(e.target.value)?"":"Email professionnel requis (pas Gmail/Yahoo)"); }} style={{ ...DI, borderColor: emailError?"#7f1d1d": regForm.email&&isProEmail(regForm.email)?"#166534":"#1a3a22" }} placeholder="recrutement@monorganisation.cm" />
              {emailError && <p style={{ fontSize:12, color:"#f87171", marginTop:4 }}>{emailError}</p>}
              {!emailError && regForm.email.includes("@") && isProEmail(regForm.email) && <p style={{ fontSize:12, color:"#4ade80", marginTop:4 }}>✓ Email validé</p>}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div><DLbl t="Type" /><select value={regForm.type} onChange={e=>setRegForm({...regForm,type:e.target.value})} style={DI}>{ORG_TYPES.map(t=><option key={t} value={t} style={{background:"#111"}}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}</select></div>
              <div><DLbl t="Site web" /><input type="url" value={regForm.website} onChange={e=>setRegForm({...regForm,website:e.target.value})} style={DI} placeholder="https://..." /></div>
            </div>
            <div style={{ background:"#0a1a0c", border:"1px solid #1a3a22", borderRadius:12, padding:"12px 16px", display:"flex", gap:10 }}>
              <Shield size={16} color="#4ade80" style={{ flexShrink:0, marginTop:1 }} />
              <p style={{ fontSize:12, color:"#4ade80", lineHeight:1.5 }}>Vérification sous 24-48h. Les opportunités seront visibles après validation.</p>
            </div>
            <button onClick={()=>registerMutation.mutate(regForm)} disabled={!regForm.name||!regForm.email||!!emailError||registerMutation.isPending} style={{ width:"100%", background:"linear-gradient(135deg,#16a34a,#15803d)", color:"#fff", fontWeight:700, fontSize:15, padding:"14px", borderRadius:14, border:"none", cursor:"pointer", opacity:(!regForm.name||!regForm.email||!!emailError)?0.5:1 }}>
              {registerMutation.isPending?"Création...":"Créer mon organisation →"}
            </button>
          </div>
          <p style={{ textAlign:"center", marginTop:20, fontSize:13 }}><Link href="/dashboard" style={{ color:"#4ade80", textDecoration:"none" }}>← Retour au feed étudiant</Link></p>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#f8fafc" }}>
      <div style={{ background:"#060e07", borderBottom:"1px solid #1a2a1a", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 24px", height:60, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontWeight:900, fontSize:18, color:"#4ade80" }}>OpportuLink</span>
            <span style={{ color:"#1a3a22" }}>|</span>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}><Building2 size={15} color="#4b6b52" /><span style={{ fontSize:13, color:"#4b6b52", fontWeight:600 }}>Espace Organisation</span></div>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <Link href="/dashboard" style={{ fontSize:13, color:"#4b6b52", textDecoration:"none", fontWeight:500 }}>Feed étudiant →</Link>
            <button onClick={openNew} style={{ display:"flex", alignItems:"center", gap:8, background:"linear-gradient(135deg,#16a34a,#15803d)", color:"#fff", fontWeight:700, fontSize:13, padding:"8px 18px", borderRadius:10, border:"none", cursor:"pointer" }}><Plus size={15} />Publier</button>
          </div>
        </div>
      </div>

      <main style={{ maxWidth:1200, margin:"0 auto", padding:"28px 24px" }}>
        {analytics && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:28 }}>
            {[
              { label:"Publiées", value:analytics.total_opportunities, Icon:FileText, color:"#0f172a", bg:"#fff", sub:`${analytics.active_opportunities} actives` },
              { label:"Candidatures", value:analytics.total_applications, Icon:Users, color:"#2563eb", bg:"#eff6ff", sub:`${analytics.applications_by_status?.submitted??0} soumises` },
              { label:"Acceptées", value:analytics.applications_by_status?.accepted??0, Icon:CheckCircle, color:"#16a34a", bg:"#f0fdf4", sub:analytics.total_applications>0?`${Math.round(((analytics.applications_by_status?.accepted??0)/analytics.total_applications)*100)}% taux`:"—" },
              { label:"Top opportunité", value:"🏆", Icon:Award, color:"#d97706", bg:"#fffbeb", sub:analytics.top_opportunity?.substring(0,30)??"Aucune encore" },
            ].map(({label,value,Icon,color,bg,sub}) => (
              <div key={label} style={{ background:bg, border:"1px solid #f1f5f9", borderRadius:16, padding:"20px", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}><Icon size={18} color={color} /><span style={{ fontSize:26, fontWeight:900, color }}>{value}</span></div>
                <p style={{ fontSize:13, fontWeight:700, color:"#374151", marginBottom:2 }}>{label}</p>
                <p style={{ fontSize:11, color:"#94a3b8" }}>{sub}</p>
              </div>
            ))}
          </div>
        )}

        <div style={{ display:"flex", gap:2, background:"#f1f5f9", padding:4, borderRadius:14, marginBottom:24, width:"fit-content" }}>
          {[{key:"opportunities",label:"Mes opportunités",Icon:FileText},{key:"analytics",label:"Analytics",Icon:BarChart3}].map(({key,label,Icon}) => (
            <button key={key} onClick={()=>setActiveTab(key as typeof activeTab)} style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 18px", borderRadius:10, border:"none", cursor:"pointer", fontSize:13, fontWeight:activeTab===key?700:500, background:activeTab===key?"#060e07":"transparent", color:activeTab===key?"#4ade80":"#64748b", transition:"all 0.15s" }}>
              <Icon size={14} />{label}
            </button>
          ))}
        </div>

        {activeTab==="opportunities" && (
          <div>
            {isLoading && [1,2,3].map(i=><div key={i} style={{ background:"#fff", borderRadius:16, height:90, border:"1px solid #f1f5f9", marginBottom:10 }} className="animate-pulse" />)}
            {!isLoading && (!opps||opps.length===0) && (
              <div style={{ textAlign:"center", padding:"80px 20px", background:"#fff", borderRadius:20, border:"1px solid #f1f5f9" }}>
                <FileText size={32} color="#94a3b8" style={{ margin:"0 auto 16px" }} />
                <p style={{ fontWeight:800, fontSize:18, color:"#0f172a", marginBottom:8 }}>Aucune opportunité publiée</p>
                <p style={{ fontSize:14, color:"#94a3b8", marginBottom:24 }}>Publie ta première offre pour atteindre des milliers d'étudiants.</p>
                <button onClick={openNew} style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#059669", color:"#fff", fontWeight:700, fontSize:14, padding:"10px 24px", borderRadius:12, border:"none", cursor:"pointer" }}><Plus size={15} />Publier ma première opportunité</button>
              </div>
            )}
            {opps && opps.length>0 && (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {opps.map(opp => {
                  const d = dL(opp.deadline);
                  const tc = TYPE_COLORS[opp.type]??"#6b7280";
                  return (
                    <div key={opp.id} style={{ background:"#fff", border:"1px solid #f1f5f9", borderRadius:16, overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
                      <div style={{ height:3, background:tc }} />
                      <div style={{ padding:"16px 20px", display:"flex", alignItems:"center", gap:16 }}>
                        <div style={{ width:44, height:44, borderRadius:12, background:tc+"15", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          <FileText size={18} color={tc} />
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                            <p style={{ fontWeight:700, fontSize:15, color:"#0f172a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{opp.title}</p>
                            <span style={{ fontSize:11, fontWeight:700, color:tc, background:tc+"15", padding:"2px 8px", borderRadius:20, flexShrink:0 }}>{TYPE_LABELS[opp.type]??opp.type}</span>
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                            {opp.country&&<span style={{ fontSize:12, color:"#94a3b8", display:"flex", alignItems:"center", gap:4 }}><Globe size={11}/>{opp.country}</span>}
                            {d!==null&&<span style={{ fontSize:12, fontWeight:600, color:d<0?"#94a3b8":d<=7?"#dc2626":"#64748b", display:"flex", alignItems:"center", gap:4 }}><Calendar size={11}/>{d<0?"Expirée":`J-${d}`}</span>}
                          </div>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                          <span style={{ fontSize:12, fontWeight:700, color:opp.is_active?"#16a34a":"#94a3b8", background:opp.is_active?"#f0fdf4":"#f8fafc", border:`1px solid ${opp.is_active?"#bbf7d0":"#e2e8f0"}`, padding:"4px 12px", borderRadius:20 }}>
                            {opp.is_active?"Active":"Inactive"}
                          </span>
                          <button onClick={()=>openEdit(opp)} style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, fontWeight:600, color:"#2563eb", background:"#eff6ff", border:"1px solid #bfdbfe", padding:"6px 12px", borderRadius:10, cursor:"pointer" }}>
                            <Edit2 size={13}/>Modifier
                          </button>
                          <button
                            onClick={()=>toggleMutation.mutate({id:opp.id, active:!opp.is_active})}
                            style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, fontWeight:600, color:opp.is_active?"#dc2626":"#16a34a", background:opp.is_active?"#fef2f2":"#f0fdf4", border:`1px solid ${opp.is_active?"#fecaca":"#bbf7d0"}`, padding:"6px 12px", borderRadius:10, cursor:"pointer" }}
                          >
                            {opp.is_active?<><XCircle size={13}/>Désactiver</>:<><CheckCircle size={13}/>Réactiver</>}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab==="analytics" && analytics && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <div style={{ background:"#fff", borderRadius:20, border:"1px solid #f1f5f9", padding:24 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}><BarChart3 size={16} color="#059669"/><p style={{ fontWeight:700, fontSize:15, color:"#0f172a" }}>Candidatures par statut</p></div>
              {analytics.total_applications===0 ? <p style={{ fontSize:14, color:"#94a3b8", textAlign:"center", padding:"20px 0" }}>Aucune candidature reçue.</p> : (
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {[{key:"draft",label:"En cours",Icon:Clock,color:"#94a3b8"},{key:"submitted",label:"Soumises",Icon:Send,color:"#3b82f6"},{key:"accepted",label:"Acceptées",Icon:CheckCircle,color:"#16a34a"},{key:"rejected",label:"Refusées",Icon:XCircle,color:"#dc2626"}].map(({key,label,Icon,color}) => {
                    const count = analytics.applications_by_status?.[key]??0;
                    const pct = analytics.total_applications>0 ? Math.round((count/analytics.total_applications)*100) : 0;
                    return (
                      <div key={key}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><div style={{ display:"flex", alignItems:"center", gap:6 }}><Icon size={13} color={color}/><span style={{ fontSize:13, fontWeight:600, color:"#374151" }}>{label}</span></div><span style={{ fontSize:13, fontWeight:700, color }}>{count}</span></div>
                        <div style={{ height:6, background:"#f1f5f9", borderRadius:3, overflow:"hidden" }}><div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:3, transition:"width 0.7s" }}/></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div style={{ background:"linear-gradient(135deg,#f0fdf4,#ecfdf5)", border:"1px solid #bbf7d0", borderRadius:20, padding:24 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}><Sparkles size={16} color="#059669"/><p style={{ fontWeight:700, fontSize:15, color:"#065f46" }}>Conseils pour + de candidatures</p></div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {[{tip:"Date limite claire",detail:"Les opport. avec deadline reçoivent 3x plus de candidatures"},{tip:"Description détaillée",detail:"Inclue les avantages, le rôle et les critères d'éligibilité"},{tip:"Lien source officiel",detail:"Booste le score de fiabilité et rassure les candidats"},{tip:"Niveaux et filières",detail:"Un ciblage précis génère des candidatures plus qualifiées"}].map(({tip,detail}) => (
                  <div key={tip} style={{ background:"rgba(255,255,255,0.7)", borderRadius:12, padding:"12px 14px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}><CheckCircle size={13} color="#059669"/><p style={{ fontSize:12, fontWeight:700, color:"#065f46" }}>{tip}</p></div>
                    <p style={{ fontSize:11, color:"#4b6b52", lineHeight:1.5 }}>{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {showModal && (
        <div style={{ position:"fixed", inset:0, zIndex:100, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={()=>setShowModal(false)}>
          <div style={{ background:"#fff", borderRadius:24, padding:28, width:"100%", maxWidth:620, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 25px 50px rgba(0,0,0,0.25)" }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <div><h3 style={{ fontWeight:900, fontSize:18, color:"#0f172a" }}>{editingOpp?"Modifier l'opportunité":"Publier une opportunité"}</h3><p style={{ fontSize:13, color:"#94a3b8", marginTop:2 }}>Visible dans le feed étudiant après publication</p></div>
              <button onClick={()=>setShowModal(false)} style={{ width:32, height:32, borderRadius:"50%", background:"#f1f5f9", border:"none", cursor:"pointer", fontSize:16, color:"#64748b" }}>✕</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div><Lbl t="Titre *"/><input type="text" value={oppForm.title} onChange={e=>setOppForm({...oppForm,title:e.target.value})} style={SI} placeholder="Stage Développeur Python — 6 mois"/></div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div><Lbl t="Type *"/><select value={oppForm.type} onChange={e=>setOppForm({...oppForm,type:e.target.value})} style={SI}>{Object.entries(TYPE_LABELS).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
                <div><Lbl t="Pays"/><input type="text" value={oppForm.country} onChange={e=>setOppForm({...oppForm,country:e.target.value})} style={SI} placeholder="Cameroun"/></div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div><Lbl t="Date limite"/><input type="date" value={oppForm.deadline} onChange={e=>setOppForm({...oppForm,deadline:e.target.value})} style={SI}/></div>
                <div><Lbl t="Lien officiel"/><input type="url" value={oppForm.source_url} onChange={e=>setOppForm({...oppForm,source_url:e.target.value})} style={SI} placeholder="https://..."/></div>
              </div>
              <div><Lbl t="Moyenne minimum (optionnel)"/><input type="number" min="0" max="20" step="0.5" value={oppForm.min_gpa} onChange={e=>setOppForm({...oppForm,min_gpa:e.target.value})} style={SI} placeholder="Ex: 12 (laisser vide si pas de minimum)"/></div>
              <div>
                <Lbl t="Niveaux acceptés"/>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {LEVELS.map(l=><button key={l} type="button" onClick={()=>toggleLevel(l)} style={{ padding:"6px 14px", borderRadius:20, border:`1.5px solid ${oppForm.required_level.includes(l)?"#059669":"#e2e8f0"}`, background:oppForm.required_level.includes(l)?"#f0fdf4":"#fff", color:oppForm.required_level.includes(l)?"#065f46":"#64748b", fontSize:12, fontWeight:600, cursor:"pointer" }}>{l}</button>)}
                </div>
                <p style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>Laisser vide = tous les niveaux acceptés</p>
              </div>
              <div>
                <Lbl t="Filières acceptées"/>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, maxHeight:120, overflowY:"auto" }}>
                  {FIELDS.map(f=><button key={f} type="button" onClick={()=>toggleField(f)} style={{ padding:"6px 14px", borderRadius:20, border:`1.5px solid ${oppForm.required_fields.includes(f)?"#2563eb":"#e2e8f0"}`, background:oppForm.required_fields.includes(f)?"#eff6ff":"#fff", color:oppForm.required_fields.includes(f)?"#1d4ed8":"#64748b", fontSize:12, fontWeight:600, cursor:"pointer" }}>{f}</button>)}
                </div>
                <p style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>Laisser vide = toutes les filières acceptées</p>
              </div>
              <div>
                <Lbl t="Langues requises"/>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {LANGS.map(({code,label})=><button key={code} type="button" onClick={()=>toggleLang(code)} style={{ padding:"6px 14px", borderRadius:20, border:`1.5px solid ${oppForm.required_languages.includes(code)?"#d97706":"#e2e8f0"}`, background:oppForm.required_languages.includes(code)?"#fffbeb":"#fff", color:oppForm.required_languages.includes(code)?"#92400e":"#64748b", fontSize:12, fontWeight:600, cursor:"pointer" }}>{label}</button>)}
                </div>
              </div>
              <div><Lbl t="Description *"/><textarea value={oppForm.description} onChange={e=>setOppForm({...oppForm,description:e.target.value})} rows={5} style={{ ...SI, resize:"vertical", fontFamily:"inherit" }} placeholder="Décris l'opportunité : missions, avantages, critères d'éligibilité, processus de candidature..."/></div>
              <button onClick={()=>publishMutation.mutate(oppForm)} disabled={!oppForm.title||!oppForm.description||publishMutation.isPending} style={{ width:"100%", background:!oppForm.title||!oppForm.description?"#e2e8f0":"linear-gradient(135deg,#059669,#0d9488)", color:!oppForm.title||!oppForm.description?"#94a3b8":"#fff", fontWeight:700, fontSize:15, padding:"14px", borderRadius:14, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                {publishMutation.isPending?"Publication...":editingOpp?"Enregistrer les modifications":"Publier dans le feed →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const Lbl = ({t}: {t:string}) => <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#374151", textTransform:"uppercase" as const, letterSpacing:"0.05em", marginBottom:8 }}>{t}</label>;
const DLbl = ({t}: {t:string}) => <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#4b6b52", textTransform:"uppercase" as const, letterSpacing:"0.05em", marginBottom:8 }}>{t}</label>;
