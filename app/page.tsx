import Link from "next/link";

const STATS = [
  { value: "500+", label: "Opportunités" },
  { value: "3", label: "Sources crawlées" },
  { value: "100%", label: "Gratuit" },
];

const FEATURES = [
  { icon: "🎯", title: "Feed personnalisé", desc: "Chaque opportunité scorée selon ton profil. Tu vois en premier ce qui te correspond." },
  { icon: "✍️", title: "Lettre IA en 10 sec", desc: "Llama 3.3 génère une lettre de motivation personnalisée pour chaque opportunité." },
  { icon: "📁", title: "Coffre-fort documentaire", desc: "Upload une fois ton CV, relevés et CNI. Réutilise-les pour toutes tes candidatures." },
  { icon: "⚡", title: "Score de préparation", desc: "Sache exactement ce qu'il te manque pour postuler à chaque opportunité." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-black text-emerald-600 text-xl">OpportuLink</span>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-emerald-600 px-3 py-2 rounded-xl transition-colors">
              Connexion
            </Link>
            <Link href="/register" className="text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl transition-colors">
              S'inscrire
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-16 px-4 bg-gradient-to-b from-emerald-50 to-white">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Plateforme gratuite pour étudiants camerounais
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight mb-5">
            Ne rate plus jamais<br />
            <span className="text-emerald-500">une opportunité</span>
          </h1>

          <p className="text-base sm:text-lg text-gray-500 max-w-lg mx-auto mb-8 leading-relaxed">
            Bourses, stages, emplois — découverts automatiquement et classés selon ton profil.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Link href="/register" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-4 rounded-2xl transition-colors shadow-lg shadow-emerald-200 text-sm sm:text-base">
              Commencer gratuitement →
            </Link>
            <Link href="/login" className="border-2 border-gray-200 hover:border-emerald-300 text-gray-700 font-semibold px-8 py-4 rounded-2xl transition-colors text-sm sm:text-base">
              J'ai déjà un compte
            </Link>
          </div>

          <div className="flex justify-center gap-10">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-black text-emerald-600">{s.value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Types */}
      <section className="py-10 px-4">
        <div className="max-w-2xl mx-auto flex flex-wrap gap-3 justify-center">
          {[
            { label: "Bourses", emoji: "🎓", color: "bg-purple-100 text-purple-700" },
            { label: "Stages", emoji: "💼", color: "bg-blue-100 text-blue-700" },
            { label: "Emplois", emoji: "🏢", color: "bg-green-100 text-green-700" },
            { label: "Échanges", emoji: "✈️", color: "bg-orange-100 text-orange-700" },
          ].map((t) => (
            <span key={t.label} className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm ${t.color}`}>
              {t.emoji} {t.label}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 text-center mb-10">
            Tout ce dont tu as besoin
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1.5">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-br from-emerald-600 to-teal-700 text-center">
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">Prêt à commencer ?</h2>
        <p className="text-emerald-100 mb-8 text-sm sm:text-base">Rejoint des centaines d'étudiants qui ne ratent plus rien.</p>
        <Link href="/register" className="inline-block bg-white text-emerald-600 font-bold px-8 py-4 rounded-2xl hover:bg-emerald-50 transition-colors shadow-lg">
          Créer mon compte →
        </Link>
      </section>

      <footer className="py-6 px-4 bg-gray-900 text-center">
        <p className="text-gray-500 text-sm">© 2025 OpportuLink · Fait avec ❤️ au Cameroun</p>
      </footer>
    </div>
  );
}
