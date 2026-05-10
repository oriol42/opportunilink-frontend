"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";

const BANNED_DOMAINS = ["gmail.com","yahoo.com","hotmail.com","outlook.com","icloud.com","live.com","ymail.com","protonmail.com","aol.com","mail.com","zoho.com","gmx.com"];

function isProEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return !!domain && !BANNED_DOMAINS.includes(domain);
}

interface OrgOpp { id: string; title: string; type: string; deadline: string | null; is_active: boolean; country: string | null }
interface Analytics { total_opportunities: number; active_opportunities: number; total_applications: number; applications_by_status: Record<string, number>; top_opportunity: string | null }

const TYPE_LABELS: Record<string, string> = { bourse:"Bourse", stage:"Stage", emploi:"Emploi", echange:"Échange", concours:"Concours" };

export default function OrgDashboard() {
  const { success, error: toastError, warning } = useToast();
  const queryClient = useQueryClient();
  const [orgId, setOrgId] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("org_id") : null
  );
  const [form, setForm] = useState({ name: "", type: "entreprise", email: "", website: "", domain: "" });
  const [emailError, setEmailError] = useState("");
  const [showPublish, setShowPublish] = useState(false);
  const [oppForm, setOppForm] = useState({ title: "", type: "emploi", description: "", country: "Cameroun", deadline: "", required_languages: ["fr"], required_level: [] as string[], required_fields: [] as string[], source_url: "" });

  const { data: analytics } = useQuery<Analytics>({ queryKey: ["org-analytics", orgId], queryFn: async () => (await api.get(`/org/analytics?org_id=${orgId}`)).data, enabled: !!orgId });
  const { data: opps }      = useQuery<OrgOpp[]>({ queryKey: ["org-opps", orgId], queryFn: async () => (await api.get(`/org/opportunities?org_id=${orgId}`)).data, enabled: !!orgId });

  const registerMutation = useMutation({
    mutationFn: (data: typeof form) => api.post("/org/register", { name: data.name, type: data.type, domain: data.email.split("@")[1], website: data.website }),
    onSuccess: (res) => {
      const id = res.data.id;
      localStorage.setItem("org_id", id);
      setOrgId(id);
      success("Organisation créée ! En attente de vérification.");
    },
    onError: () => toastError("Erreur lors de la création."),
  });

  const publishMutation = useMutation({
    mutationFn: (data: typeof oppForm) => api.post(`/org/opportunities?org_id=${orgId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-opps"] });
      queryClient.invalidateQueries({ queryKey: ["org-analytics"] });
      setShowPublish(false);
      success("Opportunité publiée dans le feed !");
    },
    onError: () => toastError("Erreur lors de la publication."),
  });

  function handleEmailChange(val: string) {
    setForm(f => ({ ...f, email: val }));
    if (val.includes("@")) {
      if (!isProEmail(val)) setEmailError("Utilise ton email professionnel (pas Gmail/Yahoo/etc.)");
      else setEmailError("");
    }
  }

  function handleRegister() {
    if (!form.name.trim()) { toastError("Le nom de l'organisation est requis."); return; }
    if (!form.email.trim() || !isProEmail(form.email)) { toastError("Email professionnel requis (ex: contact@monorg.cm)"); return; }
    registerMutation.mutate(form);
  }

  if (!orgId) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: "#10b981" }} />
      </div>
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/"><span className="font-black text-2xl" style={{ color: "#34d399" }}>OpportuLink</span></Link>
          <p className="text-sm mt-2" style={{ color: "#6b7280" }}>Espace Organisations</p>
        </div>
        <div className="rounded-3xl p-8 shadow-2xl border" style={{ background: "#111", borderColor: "#222" }}>
          <h2 className="font-black text-white text-xl mb-1">Créer mon organisation</h2>
          <p className="text-sm mb-6" style={{ color: "#6b7280" }}>Publie des opportunités directement dans le feed étudiant.</p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "#4b5563" }}>Nom de l'organisation *</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="w-full px-4 py-3 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 border"
                style={{ background: "#1f2937", borderColor: "#374151" }}
                placeholder="Ex: MTN Cameroun, Université de Yaoundé I..." />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "#4b5563" }}>Email professionnel * <span style={{ color: "#4b5563", fontWeight: 400 }}>(pas Gmail)</span></label>
              <input type="email" value={form.email} onChange={e => handleEmailChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-white text-sm focus:outline-none focus:ring-2 border"
                style={{ background: "#1f2937", borderColor: emailError ? "#ef4444" : "#374151", outline: "none" }}
                placeholder="recrutement@monorganisation.cm" />
              {emailError && <p className="text-xs mt-1.5" style={{ color: "#f87171" }}>{emailError}</p>}
              {!emailError && form.email.includes("@") && isProEmail(form.email) && (
                <p className="text-xs mt-1.5" style={{ color: "#34d399" }}>✓ Email professionnel valide</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "#4b5563" }}>Type d'organisation</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                className="w-full px-3 py-3 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 border"
                style={{ background: "#1f2937", borderColor: "#374151" }}>
                {["entreprise","université","ong","ambassade","gouvernement","fondation"].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "#4b5563" }}>Site web (optionnel)</label>
              <input type="url" value={form.website} onChange={e => setForm({...form, website: e.target.value})}
                className="w-full px-4 py-3 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 border"
                style={{ background: "#1f2937", borderColor: "#374151" }}
                placeholder="https://www.monorganisation.cm" />
            </div>

            <div className="rounded-xl p-3 text-xs border" style={{ background: "#1a2e1a", borderColor: "#166534", color: "#86efac" }}>
              ✓ Vérification : notre équipe validera ton organisation sous 24-48h avant que les opportunités apparaissent dans le feed.
            </div>

            <button onClick={handleRegister} disabled={!form.name || !form.email || !!emailError || registerMutation.isPending}
              className="w-full font-bold py-3.5 rounded-xl transition text-sm disabled:opacity-50"
              style={{ background: "#10b981", color: "#fff" }}>
              {registerMutation.isPending ? "Création..." : "Créer mon organisation →"}
            </button>
          </div>

          <p className="text-center text-xs mt-4">
            <Link href="/dashboard" style={{ color: "#34d399" }}>← Retour au feed étudiant</Link>
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-black text-emerald-600 text-lg">OpportuLink</Link>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-semibold text-gray-600">Espace Organisation</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xs text-gray-400 hover:text-gray-600">Voir le feed →</Link>
            <button onClick={() => setShowPublish(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition">
              + Publier
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-5">
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Opportunités",     val: analytics.total_opportunities, bg: "bg-emerald-50", text: "text-emerald-700" },
              { label: "Actives",          val: analytics.active_opportunities, bg: "bg-blue-50",    text: "text-blue-700" },
              { label: "Candidatures",     val: analytics.total_applications,   bg: "bg-purple-50",  text: "text-purple-700" },
              { label: "Soumises",         val: analytics.applications_by_status?.submitted ?? 0, bg: "bg-amber-50", text: "text-amber-700" },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
                <p className={`text-3xl font-black ${s.text}`}>{s.val}</p>
                <p className="text-xs font-semibold text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Mes opportunités</h3>
            <button onClick={() => setShowPublish(true)} className="text-xs font-bold text-emerald-600 hover:text-emerald-800">+ Nouvelle</button>
          </div>
          {!opps || opps.length === 0 ? (
            <div className="text-center py-14 text-gray-400">
              <p className="text-4xl mb-3">📢</p>
              <p className="font-semibold text-gray-600 mb-1">Aucune opportunité publiée</p>
              <p className="text-sm">Publie ta première offre pour atteindre les étudiants.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {opps.map(opp => {
                const days = opp.deadline ? Math.ceil((new Date(opp.deadline).getTime() - Date.now()) / 86400000) : null;
                return (
                  <div key={opp.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{opp.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{TYPE_LABELS[opp.type] ?? opp.type} · {opp.country}
                        {days !== null && <span className={`ml-2 font-semibold ${days <= 7 ? "text-red-500" : "text-gray-400"}`}>· {days <= 0 ? "Expirée" : `J-${days}`}</span>}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${opp.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {opp.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal publication */}
      {showPublish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)", minHeight: "100vh" }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-gray-900 text-lg">Publier une opportunité</h3>
              <button onClick={() => setShowPublish(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              {[
                { label:"Titre *", field:"title", type:"text", placeholder:"Ex: Stage Développeur Python" },
                { label:"Lien officiel", field:"source_url", type:"url", placeholder:"https://..." },
                { label:"Pays", field:"country", type:"text", placeholder:"Cameroun" },
              ].map(({ label, field, type, placeholder }) => (
                <div key={field}>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">{label}</label>
                  <input type={type} value={(oppForm as Record<string, string>)[field]}
                    onChange={e => setOppForm({...oppForm, [field]: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder={placeholder} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Type</label>
                  <select value={oppForm.type} onChange={e => setOppForm({...oppForm, type: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white">
                    {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Deadline</label>
                  <input type="date" value={oppForm.deadline} onChange={e => setOppForm({...oppForm, deadline: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Description *</label>
                <textarea value={oppForm.description} onChange={e => setOppForm({...oppForm, description: e.target.value})}
                  rows={4} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                  placeholder="Décris l'opportunité, les missions, les avantages..." />
              </div>
              <button onClick={() => publishMutation.mutate(oppForm)}
                disabled={!oppForm.title || !oppForm.description || publishMutation.isPending}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition text-sm">
                {publishMutation.isPending ? "Publication..." : "Publier dans le feed →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
