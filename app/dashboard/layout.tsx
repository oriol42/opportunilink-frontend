"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/store/useStore";
import { logout } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/dashboard",              label: "Feed",         icon: "⚡" },
  { href: "/dashboard/applications", label: "Candidatures", icon: "📋" },
  { href: "/dashboard/saved",        label: "Favoris",      icon: "🔖" },
  { href: "/dashboard/documents",    label: "Documents",    icon: "📁" },
  { href: "/dashboard/profile",      label: "Profil",       icon: "👤" },
];

function Sidebar() {
  const pathname = usePathname();
  const { user } = useStore();

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const fields = [user?.level, user?.field, user?.gpa, user?.city, user?.phone,
    (user?.languages?.length ?? 0) > 0 ? "ok" : "", (user?.skills?.length ?? 0) > 0 ? "ok" : ""];
  const completeness = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  return (
    <aside className="hidden lg:flex flex-col w-52 shrink-0 bg-white border-r border-gray-100 h-screen sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-100">
        <span className="font-display font-black text-emerald-600 text-lg tracking-tight">
          OpportuLink
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 p-3 flex-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                active
                  ? "bg-emerald-50 text-emerald-700 border-l-2 border-emerald-500 pl-[10px]"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}>
              <span className="text-base w-5 shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Profile card */}
      {user && (
        <div className="m-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-800 truncate">{user.full_name}</p>
              <p className="text-[10px] text-gray-400">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-400 font-medium">Profil complété</span>
            <span className="text-[10px] font-bold text-emerald-600">{completeness}%</span>
          </div>
          <div className="bg-gray-200 rounded-full h-1 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${completeness}%` }} />
          </div>
          <button onClick={logout}
            className="mt-2.5 w-full text-[10px] text-gray-400 hover:text-red-500 transition text-left font-medium">
            Déconnexion →
          </button>
        </div>
      )}
    </aside>
  );
}

function RightPanel() {
  const { user } = useStore();
  return (
    <aside className="hidden xl:flex flex-col w-56 shrink-0 border-l border-gray-100 bg-white h-screen sticky top-0 overflow-y-auto p-4 gap-4">

      {/* Stats */}
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Ton activité</p>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: "OpportuScore", val: user?.opportuni_score ?? 0, color: "text-emerald-600" },
            { label: "Profil", val: `${Math.round((([user?.level,user?.field,user?.gpa,user?.city,user?.phone,(user?.languages?.length??0)>0?"ok":"",(user?.skills?.length??0)>0?"ok":""].filter(Boolean).length)/7)*100)}%`, color: "text-amber-600" },
          ].map((s) => (
            <div key={s.label} className="bg-gray-50 rounded-xl p-2.5 text-center">
              <p className={`text-lg font-black ${s.color}`}>{s.val}</p>
              <p className="text-[9px] text-gray-400 font-semibold mt-0.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tip */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
        <p className="text-[10px] font-bold text-emerald-700 mb-1">💡 Conseil du jour</p>
        <p className="text-[10px] text-emerald-600 leading-relaxed">
          {!user?.gpa
            ? "Ajoute ta moyenne pour débloquer 40% de recommandations supplémentaires."
            : !user?.skills?.length
            ? "Liste tes compétences pour un matching plus précis."
            : "Ton profil est bien rempli — continue à candidater !"}
        </p>
        <Link href="/dashboard/profile"
          className="block mt-2 text-[10px] font-bold text-emerald-600 hover:text-emerald-800">
          Compléter →
        </Link>
      </div>

    </aside>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Sidebar — desktop */}
      <Sidebar />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar — mobile only */}
        <header className="lg:hidden bg-white border-b border-gray-100 sticky top-0 z-20">
          <div className="px-4 h-14 flex items-center justify-between">
            <span className="font-display font-black text-emerald-600 text-lg">OpportuLink</span>
            <button onClick={logout} className="text-xs text-gray-400 hover:text-red-500 transition font-medium">
              Déconnexion
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 pb-24 lg:pb-6">
          {children}
        </main>

        {/* Bottom nav — mobile only */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-white/95 backdrop-blur border-t border-gray-100">
          <div className="flex">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 relative transition-colors ${
                    active ? "text-emerald-600" : "text-gray-400"
                  }`}>
                  {active && <span className="absolute top-0 inset-x-2 h-[2px] bg-emerald-500 rounded-full" />}
                  <span className={`text-lg ${active ? "scale-110" : "scale-100"} transition-transform`}>{item.icon}</span>
                  <span className={`text-[9px] font-bold tracking-wide ${active ? "text-emerald-600" : "text-gray-400"}`}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Right panel — xl only */}
      <RightPanel />
    </div>
  );
}
