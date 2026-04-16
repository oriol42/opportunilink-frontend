"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-emerald-600">OpportuLink</h1>
        <button
          onClick={() => {
            localStorage.removeItem("access_token");
            router.push("/login");
          }}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          Déconnexion
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🎯 Bienvenue sur OpportuLink !
        </h2>
        <p className="text-gray-500">
          Auth fonctionnelle ✅ — Le feed personnalisé arrive en Phase 1.
        </p>
      </main>
    </div>
  );
}
