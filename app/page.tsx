import Link from "next/link";
import {
  Zap, PenLine, Archive, Target, Bookmark, ShieldCheck,
  Rocket, ArrowRight, Building2,
} from "lucide-react";

const STATS = [
  { value: "500+", label: "Opportunités actives",  sub: "bourses, stages, emplois" },
  { value: "24+",  label: "Sources automatisées",  sub: "crawlées 24h/24" },
  { value: "100%", label: "Gratuit pour toujours", sub: "zéro frais cachés" },
];

const FEATURES = [
  { icon: Zap,        title: "Feed personnalisé par IA",     desc: "Chaque opportunité scorée sur 5 dimensions : éligibilité, profil, urgence, fiabilité, historique.", accent: "bg-amber-50 border-amber-100",   iconBg: "bg-amber-100",   iconColor: "#b45309" },
  { icon: ShieldCheck, title: "Score anti-arnaque",           desc: "Chaque opportunité passe un pipeline de vérification et affiche un score de fiabilité sur 100.",   accent: "bg-emerald-50 border-emerald-100", iconBg: "bg-emerald-100", iconColor: "#047857" },
  { icon: PenLine,     title: "Lettre de motivation en 10 sec", desc: "Llama 3.3 70B génère une lettre personnalisée. Plus de page blanche.",                          accent: "bg-violet-50 border-violet-100", iconBg: "bg-violet-100", iconColor: "#7c3aed" },
  { icon: Archive,     title: "Coffre-fort documentaire",     desc: "Upload CV, relevés, CNI une fois. Réutilise pour toutes tes candidatures.",                       accent: "bg-blue-50 border-blue-100",     iconBg: "bg-blue-100",    iconColor: "#2563eb" },
  { icon: Target,      title: "Score de préparation",         desc: "Sache exactement ce qu'il te manque pour postuler à chaque opportunité.",                        accent: "bg-rose-50 border-rose-100",     iconBg: "bg-rose-100",    iconColor: "#e11d48" },
  { icon: Bookmark,    title: "Favoris & suivi",               desc: "Sauvegarde les opportunités. Suis l'état de chaque candidature en un coup d'œil.",                accent: "bg-teal-50 border-teal-100",     iconBg: "bg-teal-100",    iconColor: "#0d9488" },
];

const STEPS = [
  { n: "01", title: "Crée ton compte",    desc: "Email + mot de passe. 30 secondes." },
  { n: "02", title: "Complète ton profil", desc: "Niveau, filière, langues, moyenne. 2 minutes." },
  { n: "03", title: "Découvre ton feed",  desc: "Opportunités classées par pertinence pour toi." },
  { n: "04", title: "Génère ta lettre",   desc: "IA personnalisée. Copie. Candidature envoyée." },
];

const SOURCES = ["OpportunityDesk", "DAAD", "Erasmus+", "AUF", "ReliefWeb", "Remotive", "The Muse", "Campus France", "EURAXESS", "UNDP Jobs", "Chevening", "Fulbright"];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">

      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <span style={{ fontFamily: "var(--font-voice)" }} className="font-semibold text-emerald-600 text-xl">OpportuLink</span>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-500 font-medium">
            <a href="#features" className="hover:text-emerald-600 transition">Fonctionnalités</a>
            <a href="#how" className="hover:text-emerald-600 transition">Comment ça marche</a>
            <a href="#sources" className="hover:text-emerald-600 transition">Sources</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm font-semibold text-gray-600 hover:text-emerald-600 px-3 py-2 rounded-xl transition">
              Connexion
            </Link>
            <Link href="/register" className="text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl transition shadow-sm">
              S&apos;inscrire →
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-14 bg-gray-950 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-full mb-8">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Plateforme gratuite · Yaoundé &amp; Douala · 24+ sources crawlées
          </div>
          <h1 style={{ fontFamily: "var(--font-voice)" }} className="font-medium text-white text-5xl sm:text-7xl leading-tight mb-6">
            Ne rate plus jamais<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 italic">
              une opportunité
            </span>
          </h1>
          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            Bourses, stages, emplois — découverts automatiquement sur des dizaines de sources fiables
            et classés selon ton profil. L&apos;IA rédige ta lettre en 10 secondes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Link href="/register"
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-10 py-4 rounded-2xl transition shadow-lg shadow-emerald-500/20 text-base flex items-center justify-center gap-2">
              Commencer gratuitement <ArrowRight size={18} />
            </Link>
            <Link href="/login"
              className="border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-semibold px-10 py-4 rounded-2xl transition text-base">
              J&apos;ai déjà un compte
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
            {STATS.map((s) => (
              <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <p style={{ fontFamily: "var(--font-voice)" }} className="text-2xl font-semibold text-emerald-400 mb-0.5">{s.value}</p>
                <p className="text-xs text-gray-300 font-semibold leading-tight">{s.label}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="h-16 bg-gradient-to-b from-gray-950 to-white" />
      </section>

      <section id="sources" className="py-10 border-y border-gray-100 bg-white overflow-hidden">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-6">
          Opportunités crawlées depuis
        </p>
        <div className="flex gap-4 overflow-x-auto pb-2 px-6 scrollbar-hide justify-center flex-wrap">
          {SOURCES.map((s) => (
            <span key={s} className="shrink-0 text-xs font-semibold text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
              {s}
            </span>
          ))}
        </div>
      </section>

      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">Ce qu&apos;on fait pour toi</p>
            <h2 style={{ fontFamily: "var(--font-voice)" }} className="font-medium text-gray-900 text-4xl sm:text-5xl">Tout ce dont tu as besoin</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title}
                className={`rounded-2xl border p-6 transition-all hover:-translate-y-0.5 hover:shadow-md ${f.accent}`}>
                <div className={`w-11 h-11 ${f.iconBg} rounded-xl flex items-center justify-center mb-4`}>
                  <f.icon size={20} color={f.iconColor} strokeWidth={2} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-base">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">Démarrer en 4 étapes</p>
            <h2 style={{ fontFamily: "var(--font-voice)" }} className="font-medium text-gray-900 text-4xl">Simple comme bonjour</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {STEPS.map((step) => (
              <div key={step.n} className="flex gap-4 items-start bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <div style={{ fontFamily: "var(--font-voice)" }} className="w-10 h-10 rounded-full bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center shrink-0">
                  {step.n}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-500">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-gray-950">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Rocket size={28} color="#34d399" />
          </div>
          <h2 style={{ fontFamily: "var(--font-voice)" }} className="font-medium text-white text-4xl sm:text-5xl mb-4">
            Ton avenir commence<br /><span className="text-emerald-400 italic">maintenant</span>
          </h2>
          <p className="text-gray-400 mb-10 text-lg">Gratuit. Toujours.</p>
          <Link href="/register"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-12 py-5 rounded-2xl transition shadow-lg shadow-emerald-500/20 text-lg">
            Créer mon compte <ArrowRight size={20} />
          </Link>
          <p className="text-gray-600 text-xs mt-4">Aucune carte bancaire · Aucun engagement</p>
        </div>
      </section>

      <section className="py-12 px-6 bg-gray-900 border-t border-gray-800">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-gray-800 rounded-xl flex items-center justify-center shrink-0">
              <Building2 size={20} color="#34d399" />
            </div>
            <div>
              <p className="font-bold text-white text-lg mb-1">Vous êtes une organisation ?</p>
              <p className="text-gray-400 text-sm">Publiez vos opportunités directement dans le feed — gratuitement.</p>
            </div>
          </div>
          <a href="/org"
            className="shrink-0 border border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white font-bold px-6 py-3 rounded-xl transition text-sm">
            Espace Organisation →
          </a>
        </div>
      </section>

      <footer className="bg-gray-950 border-t border-gray-900 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span style={{ fontFamily: "var(--font-voice)" }} className="font-semibold text-emerald-600 text-lg">OpportuLink</span>
          <p className="text-gray-600 text-sm">© 2026 OpportuLink · Fait au Cameroun</p>
          <div className="flex gap-4 text-sm text-gray-600">
            <Link href="/login" className="hover:text-gray-400 transition">Connexion</Link>
            <Link href="/register" className="hover:text-gray-400 transition">S&apos;inscrire</Link>
            <Link href="/org" className="hover:text-gray-400 transition">Espace Organisation</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
