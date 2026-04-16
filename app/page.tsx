import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 to-teal-700 flex flex-col items-center justify-center text-white p-4">
      <h1 className="text-5xl font-black text-center mb-4">OpportuLink</h1>
      <p className="text-xl text-emerald-100 text-center max-w-md mb-10">
        Bourses, stages, emplois — découverts automatiquement,
        avec un coach IA pour maximiser tes chances.
      </p>
      <div className="flex gap-4">
        <Link
          href="/register"
          className="bg-white text-emerald-600 font-bold px-8 py-4 rounded-xl hover:bg-emerald-50 transition"
        >
          Commencer gratuitement
        </Link>
        <Link
          href="/login"
          className="border-2 border-white text-white font-bold px-8 py-4 rounded-xl hover:bg-emerald-700 transition"
        >
          Connexion
        </Link>
      </div>
    </div>
  );
}
