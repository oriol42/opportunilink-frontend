"use client";
import { useState } from "react";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import StatsWidget from "@/components/dashboard/StatsWidget";
import {
  User,
  Lock,
  Globe,
  GraduationCap,
  MapPin,
  Phone,
  Star,
  Plus,
  X,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";

const LEVELS = ["Licence", "Master", "Doctorat", "BTS", "DUT", "Ingénieur", "Technicien Supérieur"];
const FIELDS = [
  "Informatique", "Génie Logiciel", "Réseaux & Télécoms", "Intelligence Artificielle",
  "Droit", "Sciences Politiques", "Relations Internationales",
  "Médecine", "Pharmacie", "Santé Publique",
  "Économie", "Gestion", "Finance", "Marketing", "Comptabilité",
  "Lettres & Sciences Humaines", "Langues", "Journalisme",
  "Sciences", "Mathématiques", "Physique", "Chimie", "Biologie",
  "Ingénierie Civile", "Architecture", "Mécanique", "Électronique",
  "Agriculture", "Environnement", "Éducation", "Psychologie",
];

const MAIN_LANGS = [
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "en", flag: "🇬🇧", label: "Anglais" },
  { code: "de", flag: "🇩🇪", label: "Allemand" },
  { code: "es", flag: "🇪🇸", label: "Espagnol" },
  { code: "pt", flag: "🇵🇹", label: "Portugais" },
  { code: "ar", flag: "🇸🇦", label: "Arabe" },
  { code: "zh", flag: "🇨🇳", label: "Chinois" },
  { code: "it", flag: "🇮🇹", label: "Italien" },
];

const SKILLS_BY_FIELD: Record<string, string[]> = {
  "Informatique": ["Python", "JavaScript", "React", "SQL", "Git", "Docker", "Node.js", "Java", "C++", "Machine Learning"],
  "Génie Logiciel": ["Python", "Java", "C#", "Git", "Agile", "Docker", "Kubernetes", "Tests unitaires"],
  "Réseaux & Télécoms": ["Cisco", "Linux", "TCP/IP", "Cybersécurité", "Wireshark", "Python", "Routage"],
  "Économie": ["Excel", "Power BI", "SPSS", "Stata", "Analyse financière", "Macroéconomie"],
  "Gestion": ["Excel", "ERP", "Management", "Leadership", "Gestion de projet", "Communication"],
  "Finance": ["Excel", "Bloomberg", "Analyse financière", "Comptabilité", "Audit", "Power BI"],
  "Marketing": ["SEO", "Google Ads", "Canva", "Social media", "Excel", "Content marketing"],
  "Droit": ["Rédaction juridique", "Recherche juridique", "Droit des affaires", "Plaidoirie"],
  "Médecine": ["Clinique", "Pharmacologie", "Recherche médicale", "Anatomie", "Biologie"],
  "Architecture": ["AutoCAD", "Revit", "SketchUp", "ArchiCAD", "3D Max"],
};

type ActiveTab = "profile" | "password";

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  border: "1.5px solid #e2e8f0",
  borderRadius: 12,
  fontSize: 14,
  outline: "none",
  background: "#fff",
  color: "#0f172a",
  transition: "border-color 0.15s",
};

export default function ProfilePage() {
  const { user, setUser } = useStore();
  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>("profile");

  // Profile form
  const [form, setForm] = useState({
    full_name: user?.full_name ?? "",
    level: user?.level ?? "",
    field: user?.field ?? "",
    city: user?.city ?? "",
    gpa: user?.gpa?.toString() ?? "",
    phone: user?.phone ?? "",
    languages: user?.languages ?? ["fr", "en"],
    skills: user?.skills ?? [],
  });
  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Password form
  const [pwdForm, setPwdForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });

  const checks = [
    form.full_name, form.level, form.field, form.city, form.gpa, form.phone,
    form.languages.length > 0 ? "ok" : "",
    form.skills.length > 0 ? "ok" : "",
  ];
  const completeness = Math.round(checks.filter(Boolean).length / checks.length * 100);

  function toggleLang(code: string) {
    setForm(f => ({
      ...f,
      languages: f.languages.includes(code)
        ? f.languages.filter(l => l !== code)
        : [...f.languages, code],
    }));
  }

  function addSkill(s?: string) {
    const sk = (s ?? skillInput).trim();
    if (sk && !form.skills.includes(sk)) {
      setForm(f => ({ ...f, skills: [...f.skills, sk] }));
    }
    if (!s) setSkillInput("");
  }

  const suggestedSkills = (SKILLS_BY_FIELD[form.field] ?? []).filter(s => !form.skills.includes(s));

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put("/users/me", {
        ...form,
        gpa: form.gpa ? parseFloat(form.gpa) : null,
      });
      setUser(res.data);
      success("Profil mis à jour ! Ton feed est recalculé.");
    } catch (err: unknown) {
      toastError(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Erreur."
      );
    } finally {
      setLoading(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwdForm.new_password !== pwdForm.confirm_password) {
      toastError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (pwdForm.new_password.length < 8) {
      toastError("Le nouveau mot de passe doit faire au moins 8 caractères.");
      return;
    }
    setPwdLoading(true);
    try {
      await api.post("/auth/change-password", {
        current_password: pwdForm.current_password,
        new_password: pwdForm.new_password,
      });
      success("Mot de passe modifié avec succès !");
      setPwdForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err: unknown) {
      toastError(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
          ?? "Mot de passe actuel incorrect."
      );
    } finally {
      setPwdLoading(false);
    }
  }

  const TAB_STYLE = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 20px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: active ? 700 : 500,
    background: active ? "#059669" : "transparent",
    color: active ? "#fff" : "#64748b",
    transition: "all 0.15s",
  });

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#f8fafc" }}>

      {/* Header */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #f1f5f9",
        padding: "20px 28px 16px",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <User size={22} color="#059669" />
          <h1 style={{ fontWeight: 900, fontSize: 22, color: "#0f172a" }}>Mon profil</h1>
        </div>
        <p style={{ fontSize: 14, color: "#94a3b8", marginLeft: 34 }}>
          Un profil complet améliore tes recommandations de 40%
        </p>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>

        <StatsWidget />

        {/* Barre complétude */}
        <div style={{
          background: "linear-gradient(135deg, #f0fdf4, #fffbeb)",
          border: "1px solid #d1fae5",
          borderRadius: 16,
          padding: "16px 20px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#065f46" }}>Profil complété</span>
              <span style={{
                fontWeight: 900, fontSize: 20,
                color: completeness >= 80 ? "#059669" : "#d97706",
              }}>
                {completeness}%
              </span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.6)", height: 8, borderRadius: 4, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 4, transition: "width 0.7s",
                width: `${completeness}%`,
                background: completeness >= 80 ? "#10b981" : "#f59e0b",
              }} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex",
          gap: 4,
          background: "#f1f5f9",
          padding: 4,
          borderRadius: 14,
          marginBottom: 24,
          width: "fit-content",
        }}>
          <button style={TAB_STYLE(activeTab === "profile")} onClick={() => setActiveTab("profile")}>
            <User size={15} />
            Informations
          </button>
          <button style={TAB_STYLE(activeTab === "password")} onClick={() => setActiveTab("password")}>
            <Lock size={15} />
            Mot de passe
          </button>
        </div>

        {/* ─── Onglet Profil ─────────────────────────── */}
        {activeTab === "profile" && (
          <form onSubmit={saveProfile}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 20,
              marginBottom: 24,
            }}>

              {/* Colonne 1 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Identité */}
                <Section title="Identité" Icon={User}>
                  <Field label="Nom complet">
                    <input
                      type="text"
                      value={form.full_name}
                      onChange={e => setForm({ ...form, full_name: e.target.value })}
                      style={INPUT_STYLE}
                      placeholder="Jean Dupont"
                    />
                  </Field>
                  <Field label="Email (non modifiable)">
                    <input
                      type="email"
                      value={user?.email ?? ""}
                      disabled
                      style={{ ...INPUT_STYLE, background: "#f8fafc", color: "#94a3b8" }}
                    />
                  </Field>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Field label="Ville">
                      <div style={{ position: "relative" }}>
                        <MapPin size={14} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                        <input
                          type="text"
                          value={form.city}
                          onChange={e => setForm({ ...form, city: e.target.value })}
                          style={{ ...INPUT_STYLE, paddingLeft: 34 }}
                          placeholder="Yaoundé"
                        />
                      </div>
                    </Field>
                    <Field label="Téléphone">
                      <div style={{ position: "relative" }}>
                        <Phone size={14} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={e => setForm({ ...form, phone: e.target.value })}
                          style={{ ...INPUT_STYLE, paddingLeft: 34 }}
                          placeholder="+237 6XX..."
                        />
                      </div>
                    </Field>
                  </div>
                </Section>

                {/* Académique */}
                <Section title="Parcours académique" Icon={GraduationCap}>
                  <Field label="Niveau d'études">
                    <select
                      value={form.level}
                      onChange={e => setForm({ ...form, level: e.target.value })}
                      style={{ ...INPUT_STYLE, appearance: "none" }}
                    >
                      <option value="">Sélectionner</option>
                      {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </Field>
                  <Field label="Filière">
                    <select
                      value={form.field}
                      onChange={e => setForm({ ...form, field: e.target.value })}
                      style={{ ...INPUT_STYLE, appearance: "none" }}
                    >
                      <option value="">Sélectionner</option>
                      {FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </Field>
                  <Field label="Moyenne / 20">
                    <div style={{ position: "relative" }}>
                      <Star size={14} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.01"
                        value={form.gpa}
                        onChange={e => setForm({ ...form, gpa: e.target.value })}
                        style={{ ...INPUT_STYLE, paddingLeft: 34 }}
                        placeholder="14.5"
                      />
                    </div>
                  </Field>
                </Section>
              </div>

              {/* Colonne 2 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Langues */}
                <Section title="Langues maîtrisées" Icon={Globe}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {MAIN_LANGS.map(({ code, flag, label }) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => toggleLang(code)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 14px",
                          borderRadius: 12,
                          border: "1.5px solid",
                          borderColor: form.languages.includes(code) ? "#059669" : "#e2e8f0",
                          background: form.languages.includes(code) ? "#f0fdf4" : "#fff",
                          color: form.languages.includes(code) ? "#065f46" : "#64748b",
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{flag}</span>
                        {label}
                        {form.languages.includes(code) && <Check size={13} color="#059669" />}
                      </button>
                    ))}
                  </div>
                </Section>

                {/* Compétences */}
                <Section title="Compétences" Icon={Star} style={{ flex: 1 }}>
                  {/* Suggestions */}
                  {suggestedSkills.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>
                        Suggestions pour {form.field || "ta filière"} :
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {suggestedSkills.slice(0, 8).map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => addSkill(s)}
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#059669",
                              background: "#f0fdf4",
                              border: "1px solid #bbf7d0",
                              borderRadius: 20,
                              padding: "4px 10px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Plus size={11} /> {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input custom */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <input
                      type="text"
                      value={skillInput}
                      onChange={e => setSkillInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())}
                      placeholder="Ajouter une compétence..."
                      style={{ ...INPUT_STYLE, flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => addSkill()}
                      style={{
                        padding: "8px 14px",
                        background: "#f0fdf4",
                        border: "1.5px solid #bbf7d0",
                        borderRadius: 12,
                        color: "#059669",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontSize: 14,
                      }}
                    >
                      +
                    </button>
                  </div>

                  {/* Tags */}
                  {form.skills.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {form.skills.map(sk => (
                        <span
                          key={sk}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "5px 12px",
                            background: "#f1f5f9",
                            border: "1px solid #e2e8f0",
                            borderRadius: 20,
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#374151",
                          }}
                        >
                          {sk}
                          <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, skills: f.skills.filter(s => s !== sk) }))}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
                          >
                            <X size={13} color="#94a3b8" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: "#cbd5e1", fontStyle: "italic" }}>
                      Aucune compétence renseignée. Elles boostent ton score de matching.
                    </p>
                  )}
                </Section>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                background: loading ? "#d1d5db" : "linear-gradient(135deg, #059669, #0d9488)",
                color: "#fff",
                fontWeight: 800,
                fontSize: 15,
                padding: "15px 0",
                borderRadius: 16,
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 16px rgba(5,150,105,0.25)",
                transition: "all 0.15s",
              }}
            >
              {loading ? "Enregistrement..." : "Sauvegarder mon profil"}
            </button>
          </form>
        )}

        {/* ─── Onglet Mot de passe ─────────────────── */}
        {activeTab === "password" && (
          <form onSubmit={changePassword}>
            <div style={{
              maxWidth: 480,
              background: "#fff",
              borderRadius: 20,
              border: "1px solid #f1f5f9",
              padding: 28,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: "#f0fdf4",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Lock size={18} color="#059669" />
                </div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 16, color: "#0f172a" }}>Changer le mot de passe</p>
                  <p style={{ fontSize: 13, color: "#94a3b8" }}>Minimum 8 caractères</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Mot de passe actuel */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                    Mot de passe actuel
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPwd.current ? "text" : "password"}
                      value={pwdForm.current_password}
                      onChange={e => setPwdForm({ ...pwdForm, current_password: e.target.value })}
                      style={{ ...INPUT_STYLE, paddingRight: 44 }}
                      placeholder="Ton mot de passe actuel"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(s => ({ ...s, current: !s.current }))}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}
                    >
                      {showPwd.current ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
                    </button>
                  </div>
                </div>

                {/* Nouveau mot de passe */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                    Nouveau mot de passe
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPwd.new ? "text" : "password"}
                      value={pwdForm.new_password}
                      onChange={e => setPwdForm({ ...pwdForm, new_password: e.target.value })}
                      style={{ ...INPUT_STYLE, paddingRight: 44 }}
                      placeholder="Au moins 8 caractères"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(s => ({ ...s, new: !s.new }))}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}
                    >
                      {showPwd.new ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
                    </button>
                  </div>
                  {/* Force indicateur */}
                  {pwdForm.new_password && (
                    <div style={{ marginTop: 8, display: "flex", gap: 4 }}>
                      {[...Array(4)].map((_, i) => {
                        const strength = pwdForm.new_password.length >= 12 ? 4
                          : pwdForm.new_password.length >= 10 ? 3
                          : pwdForm.new_password.length >= 8 ? 2 : 1;
                        return (
                          <div
                            key={i}
                            style={{
                              flex: 1, height: 3, borderRadius: 2,
                              background: i < strength
                                ? (strength <= 1 ? "#ef4444" : strength <= 2 ? "#f59e0b" : strength <= 3 ? "#3b82f6" : "#22c55e")
                                : "#e2e8f0",
                              transition: "background 0.2s",
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Confirmer */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                    Confirmer le nouveau mot de passe
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPwd.confirm ? "text" : "password"}
                      value={pwdForm.confirm_password}
                      onChange={e => setPwdForm({ ...pwdForm, confirm_password: e.target.value })}
                      style={{
                        ...INPUT_STYLE,
                        paddingRight: 44,
                        borderColor: pwdForm.confirm_password && pwdForm.confirm_password !== pwdForm.new_password
                          ? "#ef4444"
                          : pwdForm.confirm_password && pwdForm.confirm_password === pwdForm.new_password
                          ? "#22c55e"
                          : "#e2e8f0",
                      }}
                      placeholder="Répète le nouveau mot de passe"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(s => ({ ...s, confirm: !s.confirm }))}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}
                    >
                      {showPwd.confirm ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
                    </button>
                  </div>
                  {pwdForm.confirm_password && pwdForm.confirm_password !== pwdForm.new_password && (
                    <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>
                      Les mots de passe ne correspondent pas
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={pwdLoading || !pwdForm.current_password || !pwdForm.new_password || pwdForm.new_password !== pwdForm.confirm_password}
                  style={{
                    width: "100%",
                    background: pwdLoading ? "#d1d5db" : "#059669",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 14,
                    padding: "13px",
                    borderRadius: 12,
                    border: "none",
                    cursor: pwdLoading ? "not-allowed" : "pointer",
                    marginTop: 4,
                  }}
                >
                  {pwdLoading ? "Modification..." : "Changer le mot de passe"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// Composants utilitaires pour la mise en page

function Section({
  title,
  Icon,
  children,
  style,
}: {
  title: string;
  Icon: React.ElementType;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      border: "1px solid #f1f5f9",
      padding: "20px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      ...style,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <Icon size={15} color="#059669" />
        <p style={{ fontWeight: 700, fontSize: 13, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {title}
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}
