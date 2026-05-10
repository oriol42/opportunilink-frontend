import Link from "next/link";

const STATS = [
  { value: "500+", label: "Opportunités actives",  sub: "bourses, stages, emplois" },
  { value: "10",   label: "Sources automatisées",  sub: "crawlées 24h/24" },
  { value: "100%", label: "Gratuit pour toujours", sub: "zéro frais cachés" },
];

const FEATURES = [
  { icon: "⚡", title: "Feed personnalisé par IA",    desc: "Chaque opportunité scorée sur 5 dimensions : niveau, filière, langues, deadline, fiabilité.", accent: "bg-amber-50 border-amber-100", iconBg: "bg-amber-100" },
  { icon: "✍️", title: "Lettre de motivation en 10 sec", desc: "Llama 3.3 70B génère une lettre personnalisée. Plus de page blanche.", accent: "bg-violet-50 border-violet-100", iconBg: "bg-violet-100" },
  { icon: "📁", title: "Coffre-fort documentaire",    desc: "Upload CV, relevés, CNI une fois. Réutilise partout.", accent: "bg-blue-50 border-blue-100", iconBg: "bg-blue-100" },
  { icon: "🎯", title: "Score de préparation",        desc: "Sache exactement ce qu'il te manque pour postuler.", accent: "bg-emerald-50 border-emerald-100", iconBg: "bg-emerald-100" },
  { icon: "🔖", title: "Favoris & suivi",             desc: "Sauvegarde les opportunités. Suis l'état de chaque candidature.", accent: "bg-pink-50 border-pink-100", iconBg: "bg-pink-100" },
  { icon: "🤖", title: "Optimisation CV par IA",       desc: "Titre, accroche, compétences à mettre en avant — adapté à chaque offre.", accent: "bg-teal-50 border-teal-100", iconBg: "bg-teal-100" },
];

const STEPS = [
  { n: "01", title: "Crée ton compte",    desc: "Email + mot de passe. 30 secondes." },
  { n: "02", title: "Complète ton profil", desc: "Niveau, filière, langues, moyenne. 2 minutes." },
  { n: "03", title: "Découvre ton feed",  desc: "Opportunités classées par pertinence pour toi." },
  { n: "04", title: "Génère ta lettre",   desc: "IA personnalisée. Copie. Candidature envoyée." },
];

const SOURCES = ["OpportunityDesk", "DAAD", "Erasmus+", "AUF", "ReliefWeb", "Remotive", "The Muse", "Campus France", "EURAXESS", "MTN Cameroun"];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Navbar — full width */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-syne font-black text-emerald-600 text-xl">OpportuLink</span>
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
              S'inscrire →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — fond sombre pleine largeur */}
      <section className="relative pt-14 bg-gray-950 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-full mb-8">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Plateforme gratuite · Yaoundé & Douala · 10 sources crawlées
          </div>
          <h1 className="font-syne font-black text-white text-5xl sm:text-7xl leading-tight mb-6">
            Ne rate plus jamais<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              une opportunité
            </span>
          </h1>
          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            Bourses, stages, emplois — découverts automatiquement sur 10 sources fiables
            et classés selon ton profil. L'IA rédige ta lettre en 10 secondes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Link href="/register"
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-10 py-4 rounded-2xl transition shadow-lg shadow-emerald-500/20 text-base">
              Commencer gratuitement →
            </Link>
            <Link href="/login"
              className="border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-semibold px-10 py-4 rounded-2xl transition text-base">
              J'ai déjà un compte
            </Link>
          </div>

          {/* Stats — 3 colonnes */}
          <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
            {STATS.map((s) => (
              <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <p className="text-2xl font-syne font-black text-emerald-400 mb-0.5">{s.value}</p>
                <p className="text-xs text-gray-300 font-semibold leading-tight">{s.label}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="h-16 bg-gradient-to-b from-gray-950 to-white" />
      </section>

      {/* Sources — ticker */}
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

      {/* Features — grille 3 colonnes */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">Ce qu'on fait pour toi</p>
            <h2 className="font-syne font-black text-gray-900 text-4xl sm:text-5xl">Tout ce dont tu as besoin</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title}
                className={`rounded-2xl border p-6 transition-all hover:-translate-y-0.5 hover:shadow-md ${f.accent}`}>
                <div className={`w-11 h-11 ${f.iconBg} rounded-xl flex items-center justify-center text-2xl mb-4`}>{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2 text-base">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How — steps */}
      <section id="how" className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">Démarrer en 4 étapes</p>
            <h2 className="font-syne font-black text-gray-900 text-4xl">Simple comme bonjour</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {STEPS.map((step, i) => (
              <div key={step.n} className="flex gap-4 items-start bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white font-syne font-black text-sm flex items-center justify-center shrink-0">
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

      {/* CTA final */}
      <section className="py-24 px-6 bg-gray-950">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">🚀</div>
          <h2 className="font-syne font-black text-white text-4xl sm:text-5xl mb-4">
            Ton avenir commence<br /><span className="text-emerald-400">maintenant</span>
          </h2>
          <p className="text-gray-400 mb-10 text-lg">Gratuit. Toujours.</p>
          <Link href="/register"
            className="inline-block bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-12 py-5 rounded-2xl transition shadow-lg shadow-emerald-500/20 text-lg">
            Créer mon compte →
          </Link>
          <p className="text-gray-600 text-xs mt-4">Aucune carte bancaire · Aucun engagement</p>
        </div>
      </section>

      <footer className="bg-gray-950 border-t border-gray-900 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-syne font-black text-emerald-600 text-lg">OpportuLink</span>
          <p className="text-gray-600 text-sm">© 2025 OpportuLink · Fait avec ❤️ au Cameroun</p>
          <div className="flex gap-4 text-sm text-gray-600">
            <Link href="/login" className="hover:text-gray-400 transition">Connexion</Link>
            <Link href="/register" className="hover:text-gray-400 transition">S'inscrire</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
