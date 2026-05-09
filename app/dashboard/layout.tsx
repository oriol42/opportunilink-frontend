"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/store/useStore";
import { logout } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Feed", icon: "🏠" },
  { href: "/dashboard/applications", label: "Candidatures", icon: "📋" },
  { href: "/dashboard/documents", label: "Documents", icon: "📁" },
  { href: "/dashboard/profile", label: "Profil", icon: "👤" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar — visible sur tous les écrans */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-black text-emerald-600 text-lg">OpportuLink</span>
          <div className="flex items-center gap-3">
            {/* Tabs visibles uniquement sur desktop */}
            <nav className="hidden sm:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                      active
                        ? "bg-emerald-500 text-white"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <button
              onClick={logout}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors hidden sm:block"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Contenu principal — padding bottom sur mobile pour la bottom nav */}
      <main className="pb-20 sm:pb-6">
        {children}
      </main>

      {/* Bottom nav — mobile uniquement */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-10">
        <div className="flex">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ${
                  active ? "text-emerald-600" : "text-gray-400"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className={`text-xs font-medium ${active ? "text-emerald-600" : "text-gray-400"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
