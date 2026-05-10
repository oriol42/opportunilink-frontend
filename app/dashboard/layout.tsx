"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/store/useStore";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { logout } from "@/lib/auth";

const NAV = [
  { href: "/dashboard",              label: "Feed",         icon: "⚡", countKey: "feed" },
  { href: "/dashboard/applications", label: "Candidatures", icon: "📋", countKey: "apps" },
  { href: "/dashboard/saved",        label: "Favoris",      icon: "🔖", countKey: "saved" },
  { href: "/dashboard/documents",    label: "Documents",    icon: "📁", countKey: "docs" },
  { href: "/dashboard/profile",      label: "Profil",       icon: "👤", countKey: null },
];

function useSidebarCounts() {
  const { data: apps }  = useQuery({ queryKey: ["applications"], queryFn: async () => (await api.get("/applications")).data, staleTime: 60000 });
  const { data: saved } = useQuery({ queryKey: ["saved"],        queryFn: async () => (await api.get("/opportunities/saved")).data, staleTime: 60000 });
  const { data: docs }  = useQuery({ queryKey: ["documents"],    queryFn: async () => (await api.get("/documents")).data, staleTime: 60000 });
  return {
    apps:  (apps as unknown[])?.length ?? 0,
    saved: (saved as unknown[])?.length ?? 0,
    docs:  `${(docs as { documents?: unknown[] })?.documents?.length ?? 0}/4`,
  };
}

function Sidebar() {
  const pathname = usePathname();
  const { user }  = useStore();
  const counts    = useSidebarCounts();

  const initials = user?.full_name
    ? user.full_name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const profileFields = [user?.level, user?.field, user?.gpa, user?.city, user?.phone,
    (user?.languages?.length ?? 0) > 0 ? "ok" : "", (user?.skills?.length ?? 0) > 0 ? "ok" : ""];
  const completeness = Math.round(profileFields.filter(Boolean).length / profileFields.length * 100);

  const countMap: Record<string, string | number> = {
    apps: counts.apps, saved: counts.saved, docs: counts.docs,
  };

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 h-screen sticky top-0 overflow-hidden"
      style={{ background: "#0f0f0f" }}>

      {/* Logo */}
      <div className="px-5 py-4 border-b" style={{ borderColor: "#222" }}>
        <span className="font-black text-lg" style={{ color: "#34d399", letterSpacing: "-.3px" }}>
          OpportuLink
        </span>
      </div>

      {/* User */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b" style={{ borderColor: "#222" }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ background: "#065f46", color: "#34d399" }}>
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate" style={{ color: "#e5e7eb" }}>{user?.full_name}</p>
          <p className="text-[10px] truncate" style={{ color: "#6b7280" }}>{user?.email}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {/* Section principale */}
        <p className="text-[9px] font-bold uppercase tracking-widest px-2 pt-3 pb-1.5" style={{ color: "#4b5563" }}>
          Principal
        </p>
        {NAV.slice(0, 3).map(item => {
          const active = pathname === item.href;
          const count  = item.countKey ? countMap[item.countKey] : null;
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all"
              style={active
                ? { background: "#065f46", color: "#34d399" }
                : { color: "#9ca3af" }}>
              <span className="text-sm w-4 shrink-0">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {count !== null && count !== 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={active ? { background: "#064e3b", color: "#34d399" } : { background: "#1f2937", color: "#6b7280" }}>
                  {count}
                </span>
              )}
            </Link>
          );
        })}

        <p className="text-[9px] font-bold uppercase tracking-widest px-2 pt-4 pb-1.5" style={{ color: "#4b5563" }}>
          Mon dossier
        </p>
        {NAV.slice(3).map(item => {
          const active = pathname === item.href;
          const count  = item.countKey ? countMap[item.countKey] : null;
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all"
              style={active
                ? { background: "#065f46", color: "#34d399" }
                : { color: "#9ca3af" }}>
              <span className="text-sm w-4 shrink-0">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {count !== null && count !== 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: "#1f2937", color: "#6b7280" }}>
                  {count}
                </span>
              )}
            </Link>
          );
        })}

        <p className="text-[9px] font-bold uppercase tracking-widest px-2 pt-4 pb-1.5" style={{ color: "#4b5563" }}>
          Autre
        </p>
        <Link href="/org"
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all"
          style={{ color: "#9ca3af" }}>
          <span className="text-sm w-4">🏢</span>
          <span>Espace Organisation</span>
        </Link>
      </nav>

      {/* Profile progress */}
      <div className="m-2.5 rounded-xl p-3" style={{ background: "#1f2937" }}>
        <div className="flex justify-between text-[10px] mb-1.5">
          <span style={{ color: "#6b7280" }}>Profil complété</span>
          <span className="font-bold" style={{ color: "#34d399" }}>{completeness}%</span>
        </div>
        <div className="rounded-full h-1.5 overflow-hidden" style={{ background: "#374151" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${completeness}%`, background: "#34d399" }} />
        </div>
        {completeness < 100 && (
          <Link href="/dashboard/profile"
            className="block text-[10px] mt-2 leading-relaxed hover:underline transition-all"
            style={{ color: "#6b7280" }}>
            ⚡ {!user?.gpa ? "Ajoute ta moyenne → +40% de reco." : !user?.skills?.length ? "Ajoute tes compétences →" : "Complète ton profil →"}
          </Link>
        )}
        <button onClick={logout}
          className="mt-2.5 text-[10px] w-full text-left transition-all hover:underline"
          style={{ color: "#4b5563" }}>
          Déconnexion →
        </button>
      </div>
    </aside>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const NAV_MOBILE = NAV.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar mobile */}
        <header className="lg:hidden bg-white border-b border-gray-100 sticky top-0 z-20 shrink-0">
          <div className="px-4 h-14 flex items-center justify-between">
            <span className="font-black text-emerald-600 text-lg">OpportuLink</span>
            <button onClick={logout} className="text-xs text-gray-400 font-medium hover:text-red-500 transition">Déco</button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-24 lg:pb-8 min-w-0">
          {children}
        </main>

        {/* Bottom nav mobile */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-20 border-t border-gray-100"
          style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)" }}>
          <div className="flex">
            {NAV_MOBILE.map(item => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  className="flex-1 flex flex-col items-center py-2.5 gap-0.5 relative transition-colors"
                  style={{ color: active ? "#059669" : "#9ca3af" }}>
                  {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-emerald-500" />}
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-[9px] font-bold">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
