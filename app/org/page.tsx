"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";

interface OrgResponse {
  id: string; name: string; type: string | null;
  domain: string | null; website: string | null;
  is_verified: boolean; plan: string;
}
interface Analytics {
  total_opportunities: number; active_opportunities: number;
  total_applications: number; applications_by_status: Record<string, number>;
  top_opportunity: string | null;
}
interface OrgOpp {
  id: string; title: string; type: string;
  deadline: string | null; is_active: boolean;
  country: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  bourse:"Bourse", stage:"Stage", emploi:"Emploi",
  echange:"Échange", concours:"Concours",
};

export default function OrgDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const [orgId, setOrgId] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("org_id") : null
  );
  const [showRegister, setShowRegister] = useState(!orgId);
  const [showPublish, setShowPublish] = useState(false);
  const [form, setForm] = useState({ name: "", type: "entreprise", domain: "", website: "" });
  const [oppForm, setOppForm] = useState({
    title: "", type: "emploi", description: "", country: "Cameroun",
    deadline: "", required_languages: ["fr"],
    required_level: [] as string[], required_fields: [] as string[],
    source_url: "",
  });

  // Analytics
  const { data: analytics } = useQuery<Analytics>({
    queryKey: ["org-analytics", orgId],
    queryFn: async () => (await api.get(`/org/analytics?org_id=${orgId}`)).data,
    enabled: !!orgId,
  });

  // Mes opportunités
  const { data: opps } = useQuery<OrgOpp[]>({
    queryKey: ["org-opportunities", orgId],
    queryFn: async () => (await api.get(`/org/opportunities?org_id=${orgId}`)).data,
    enabled: !!orgId,
  });

  // Créer org
  const registerMutation = useMutation({
    mutationFn: (data: typeof form) => api.post("/org/register", data),
    onSuccess: (res) => {
      const id = res.data.id;
      localStorage.setItem("org_id", id);
      setOrgId(id);
      setShowRegister(false);
      queryClient.invalidateQueries({ queryKey: ["org-analytics"] });
      success("Organisation créée !");
    },
    onError: () => toastError("Erreur lors de la création."),
  });

  // Publier opportunité
  const publishMutation = useMutation({
    mutationFn: (data: typeof oppForm) =>
      api.post(`/org/opportunities?org_id=${orgId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["org-analytics"] });
      setShowPublish(false);
      setOppForm({ title: "", type: "emploi", description: "", country: "Cameroun", deadline: "", required_languages: ["fr"], required_level: [], required_fields: [], source_url: "" });
      success("Opportunité publiée ! Elle apparaît dans le feed.");
    },
    onError: () => toastError("Erreur lors de la publication."),
  });

  // ── Register form ─────────────────────────────────────────────
  if (showRegister) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-black text-emerald-600 text-2xl">OpportuLink</Link>
          <p className="text-gray-500 mt-2 text-sm">Espace Organisations</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-black text-gray-900 text-xl mb-1">Créer mon organisation</h2>
          <p className="text-sm text-gray-400 mb-5">Publie des opportunités directement dans le feed.</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Nom de l'organisation</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Ex: MTN Cameroun, Ambassade de France..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Type</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white">
                {["entreprise","université","ong","ambassade","gouvernement"].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Site web (optionnel)</label>
              <input type="url" value={form.website} onChange={e => setForm({...form, website: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="https://www.monorganisation.cm" />
            </div>
            <button onClick={() => registerMutation.mutate(form)} disabled={!form.name || registerMutation.isPending}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition text-sm">
              {registerMutation.isPending ? "Création..." : "Créer mon organisation →"}
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">
            <Link href="/dashboard" className="text-emerald-600 hover:underline">← Retour au feed étudiant</Link>
          </p>
        </div>
      </div>
    </div>
  );

  // ── Dashboard ─────────────────────────────────────────────────
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
            <Link href="/dashboard" className="text-xs text-gray-400 hover:text-gray-600 transition">
              Voir le feed étudiant
            </Link>
            <button onClick={() => setShowPublish(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition">
              + Publier une opportunité
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-6">

        {/* Stats */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Opportunités publiées", val: analytics.total_opportunities, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Actives",               val: analytics.active_opportunities, color: "text-blue-600",    bg: "bg-blue-50" },
              { label: "Candidatures reçues",   val: analytics.total_applications,   color: "text-purple-600",  bg: "bg-purple-50" },
              { label: "Soumises",              val: analytics.applications_by_status?.submitted ?? 0, color: "text-amber-600", bg: "bg-amber-50" },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
                <p className={`text-3xl font-black ${s.color}`}>{s.val}</p>
                <p className="text-xs font-semibold text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Candidatures par statut */}
        {analytics && analytics.total_applications > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4 text-sm">Répartition des candidatures</h3>
            <div className="space-y-2">
              {Object.entries(analytics.applications_by_status).map(([status, count]) => {
                const pct = analytics.total_applications > 0
                  ? Math.round((count / analytics.total_applications) * 100) : 0;
                const colors: Record<string, string> = {
                  draft:"bg-gray-400", submitted:"bg-blue-500",
                  accepted:"bg-emerald-500", rejected:"bg-red-400",
                };
                const labels: Record<string, string> = {
                  draft:"Brouillons", submitted:"Soumises",
                  accepted:"Acceptées", rejected:"Refusées",
                };
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-20 font-medium">{labels[status]}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className={`h-full rounded-full ${colors[status]}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-bold text-gray-700 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
            {analytics.top_opportunity && (
              <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50">
                🏆 Plus populaire : <strong className="text-gray-600">{analytics.top_opportunity}</strong>
              </p>
            )}
          </div>
        )}

        {/* Liste des opportunités */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Mes opportunités publiées</h3>
            <button onClick={() => setShowPublish(true)}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-800 transition">
              + Nouvelle
            </button>
          </div>
          {!opps || opps.length === 0 ? (
            <div className="text-center py-14 text-gray-400">
              <p className="text-4xl mb-3">📢</p>
              <p className="font-semibold text-gray-600 mb-1">Aucune opportunité publiée</p>
              <p className="text-sm">Publie ta première offre pour atteindre les étudiants.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {opps.map((opp) => {
                const daysLeft = opp.deadline
                  ? Math.ceil((new Date(opp.deadline).getTime() - Date.now()) / 86400000)
                  : null;
                return (
                  <div key={opp.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{opp.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {TYPE_LABELS[opp.type] ?? opp.type} · {opp.country}
                        {daysLeft !== null && (
                          <span className={`ml-2 font-semibold ${daysLeft <= 7 ? "text-red-500" : "text-gray-400"}`}>
                            · {daysLeft <= 0 ? "Expirée" : `J-${daysLeft}`}
                          </span>
                        )}
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={() => setShowPublish(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-gray-900 text-lg">Publier une opportunité</h3>
              <button onClick={() => setShowPublish(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              {[
                { label: "Titre", field: "title", type: "text", placeholder: "Ex: Stage Développeur Python" },
                { label: "Lien officiel", field: "source_url", type: "url", placeholder: "https://..." },
                { label: "Pays", field: "country", type: "text", placeholder: "Cameroun" },
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
                    {["emploi","stage","bourse","echange","concours"].map(t => (
                      <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Deadline</label>
                  <input type="date" value={oppForm.deadline}
                    onChange={e => setOppForm({...oppForm, deadline: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Description</label>
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
