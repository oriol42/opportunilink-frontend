"use client";
import Link from "next/link";

interface Resource { name: string; url: string; free: boolean; duration: string; }
interface Check { label: string; ok: boolean; fix: string; category: string; resources?: Resource[]; }
interface ActionStep { step: number; title: string; actions: string[]; url?: string; urgency: string; }
interface PrepScoreData {
  score: number;
  message: string;
  missing: Check[];
  checks: Check[];
  action_plan: ActionStep[];
  requirements: {
    required_levels: string[];
    required_languages: string[];
    lang_tests: string[];
    min_gpa: number|null;
    required_docs: string[];
    key_skills: string[];
    country: string;
    type: string;
  };
}

function getStyle(score: number) {
  if (score>=80) return { bar:"#10b981", text:"#065f46", bg:"#f0fdf4", border:"#bbf7d0" };
  if (score>=50) return { bar:"#f59e0b", text:"#92400e", bg:"#fffbeb", border:"#fde68a" };
  return { bar:"#ef4444", text:"#7f1d1d", bg:"#fef2f2", border:"#fecaca" };
}

const URGENCY_STYLE: Record<string,{bg:string;border:string;dot:string}> = {
  critical: { bg:"#fef2f2", border:"#fecaca", dot:"#dc2626" },
  high:     { bg:"#fff7ed", border:"#fed7aa", dot:"#ea580c" },
  medium:   { bg:"#eff6ff", border:"#bfdbfe", dot:"#2563eb" },
  low:      { bg:"#f0fdf4", border:"#bbf7d0", dot:"#16a34a" },
};

export default function PrepScore({ data }: { data: PrepScoreData }) {
  const style = getStyle(data.score);
  const skillMissing = data.missing.filter(m=>m.category==="skill");
  const docMissing = data.missing.filter(m=>m.category==="document");

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

      {/* Score principal */}
      <div style={{ background:style.bg, border:`1px solid ${style.border}`, borderRadius:16, padding:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div>
            <p style={{ fontWeight:800, fontSize:15, color:"#0f172a" }}>Score de préparation</p>
            <p style={{ fontSize:12, color:"#64748b", marginTop:2 }}>{data.checks.length} critères analysés</p>
          </div>
          <div style={{ textAlign:"right" }}>
            <p style={{ fontWeight:900, fontSize:32, color:style.text, lineHeight:1 }}>{data.score}%</p>
            <p style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>{data.ok_count}/{data.checks.length} ✓</p>
          </div>
        </div>
        <div style={{ background:"rgba(255,255,255,0.7)", height:8, borderRadius:4, overflow:"hidden", marginBottom:12 }}>
          <div style={{ height:"100%", width:`${data.score}%`, background:style.bar, borderRadius:4, transition:"width 0.7s" }}/>
        </div>
        <p style={{ fontSize:13, color:"#374151", lineHeight:1.5 }}>{data.message}</p>
      </div>

      {/* Critères détectés pour cette opportunité */}
      {data.requirements && (
        <div style={{ background:"#fff", border:"1px solid #f1f5f9", borderRadius:14, padding:16 }}>
          <p style={{ fontWeight:700, fontSize:13, color:"#0f172a", marginBottom:12 }}>🔍 Ce qu'on a analysé pour toi</p>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {data.requirements.required_levels.length>0 && (
              <div style={{ display:"flex", gap:8 }}>
                <span style={{ fontSize:12, color:"#64748b", width:120, flexShrink:0 }}>Niveaux requis</span>
                <span style={{ fontSize:12, fontWeight:600, color:"#0f172a" }}>{data.requirements.required_levels.join(", ")}</span>
              </div>
            )}
            {data.requirements.min_gpa && (
              <div style={{ display:"flex", gap:8 }}>
                <span style={{ fontSize:12, color:"#64748b", width:120, flexShrink:0 }}>Moyenne min.</span>
                <span style={{ fontSize:12, fontWeight:600, color:"#0f172a" }}>{data.requirements.min_gpa}/20</span>
              </div>
            )}
            {data.requirements.required_languages.length>0 && (
              <div style={{ display:"flex", gap:8 }}>
                <span style={{ fontSize:12, color:"#64748b", width:120, flexShrink:0 }}>Langues</span>
                <span style={{ fontSize:12, fontWeight:600, color:"#0f172a" }}>{data.requirements.required_languages.map((l:string)=>({fr:"Français",en:"Anglais",de:"Allemand",es:"Espagnol",ar:"Arabe"}[l]||l)).join(", ")}</span>
              </div>
            )}
            {data.requirements.lang_tests.length>0 && (
              <div style={{ display:"flex", gap:8 }}>
                <span style={{ fontSize:12, color:"#64748b", width:120, flexShrink:0 }}>Tests langue</span>
                <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                  {data.requirements.lang_tests.map(t=><span key={t} style={{ fontSize:11, fontWeight:700, color:"#d97706", background:"#fffbeb", border:"1px solid #fde68a", padding:"2px 8px", borderRadius:20 }}>{t}</span>)}
                </div>
              </div>
            )}
            {data.requirements.required_docs.length>0 && (
              <div style={{ display:"flex", gap:8 }}>
                <span style={{ fontSize:12, color:"#64748b", width:120, flexShrink:0 }}>Documents</span>
                <span style={{ fontSize:12, fontWeight:600, color:"#0f172a" }}>{data.requirements.required_docs.join(", ")}</span>
              </div>
            )}
            {data.requirements.key_skills.length>0 && (
              <div style={{ display:"flex", gap:8 }}>
                <span style={{ fontSize:12, color:"#64748b", width:120, flexShrink:0 }}>Compétences</span>
                <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                  {data.requirements.key_skills.slice(0,5).map(s=><span key={s} style={{ fontSize:11, fontWeight:600, color:"#2563eb", background:"#eff6ff", border:"1px solid #bfdbfe", padding:"2px 8px", borderRadius:20 }}>{s}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Plan d'action */}
      {data.action_plan && data.action_plan.length>0 && (
        <div style={{ background:"#fff", border:"1px solid #f1f5f9", borderRadius:14, padding:16 }}>
          <p style={{ fontWeight:700, fontSize:13, color:"#0f172a", marginBottom:12 }}>🎯 Ton plan d'action</p>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {data.action_plan.map(step => {
              const us = URGENCY_STYLE[step.urgency]||URGENCY_STYLE.medium;
              return (
                <div key={step.step} style={{ background:us.bg, border:`1px solid ${us.border}`, borderRadius:12, padding:"12px 14px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                    <div style={{ width:20, height:20, borderRadius:"50%", background:us.dot, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:900, color:"#fff", flexShrink:0 }}>{step.step}</div>
                    <p style={{ fontWeight:700, fontSize:13, color:"#0f172a" }}>{step.title}</p>
                    {step.url && <Link href={step.url} style={{ marginLeft:"auto", fontSize:11, fontWeight:700, color:us.dot, textDecoration:"none" }}>Aller →</Link>}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                    {step.actions.slice(0,3).map((action,i)=>(
                      <p key={i} style={{ fontSize:12, color:"#374151", lineHeight:1.4, paddingLeft:28 }}>• {action}</p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Compétences à apprendre avec ressources */}
      {skillMissing.length>0 && (
        <div style={{ background:"#fff", border:"1px solid #f1f5f9", borderRadius:14, padding:16 }}>
          <p style={{ fontWeight:700, fontSize:13, color:"#0f172a", marginBottom:12 }}>📚 Compétences prioritaires à développer</p>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {skillMissing.slice(0,4).map(skill => (
              <div key={skill.label} style={{ borderBottom:"1px solid #f8fafc", paddingBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:"#f59e0b", flexShrink:0 }}/>
                  <p style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{skill.label.replace("Compétence : ","")}</p>
                </div>
                {skill.resources && skill.resources.length>0 && (
                  <div style={{ display:"flex", flexDirection:"column", gap:4, paddingLeft:12 }}>
                    {skill.resources.slice(0,2).map(r=>(
                      <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", gap:6, textDecoration:"none" }}>
                        <span style={{ fontSize:11, fontWeight:600, color:r.free?"#16a34a":"#2563eb", background:r.free?"#f0fdf4":"#eff6ff", border:`1px solid ${r.free?"#bbf7d0":"#bfdbfe"}`, padding:"1px 6px", borderRadius:10, flexShrink:0 }}>{r.free?"Gratuit":"Payant"}</span>
                        <span style={{ fontSize:12, color:"#374151", fontWeight:500 }}>{r.name}</span>
                        <span style={{ fontSize:11, color:"#94a3b8", marginLeft:"auto" }}>{r.duration}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents manquants */}
      {docMissing.length>0 && (
        <div style={{ background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:14, padding:16 }}>
          <p style={{ fontWeight:700, fontSize:13, color:"#7c2d12", marginBottom:10 }}>📁 Documents à uploader</p>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {docMissing.map(doc=>(
              <div key={doc.label} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:"#ea580c", flexShrink:0 }}/>
                <p style={{ fontSize:12, color:"#7c2d12", fontWeight:600 }}>{doc.label}</p>
              </div>
            ))}
          </div>
          <Link href="/dashboard/documents" style={{ display:"inline-block", marginTop:10, fontSize:12, fontWeight:700, color:"#ea580c", background:"#fff", border:"1px solid #fed7aa", padding:"6px 14px", borderRadius:10, textDecoration:"none" }}>
            Uploader mes documents →
          </Link>
        </div>
      )}

      {/* Tout bon */}
      {data.missing.length===0 && (
        <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:14, padding:16, textAlign:"center" }}>
          <p style={{ fontSize:24, marginBottom:8 }}>🎉</p>
          <p style={{ fontWeight:700, fontSize:14, color:"#065f46" }}>Ton dossier est complet !</p>
          <p style={{ fontSize:12, color:"#4b6b52", marginTop:4 }}>Tu as tout ce qu'il faut pour candidater à cette opportunité.</p>
        </div>
      )}
    </div>
  );
}
