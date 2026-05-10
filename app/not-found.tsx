import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                      w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="relative text-center">
        <p className="font-black text-emerald-500/30 text-[120px] leading-none mb-0">
          404
        </p>
        <h1 className="font-black text-white text-2xl -mt-4 mb-3">
          Page introuvable
        </h1>
        <p className="text-gray-500 text-sm mb-8 max-w-xs mx-auto">
          Cette page n'existe pas ou a été déplacée. Retourne au feed pour explorer les opportunités.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard"
            className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm">
            Retour au feed →
          </Link>
          <Link href="/"
            className="border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-gray-200 font-semibold px-6 py-3 rounded-xl transition-all text-sm">
            Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
