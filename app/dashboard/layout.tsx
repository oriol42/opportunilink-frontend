"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/store/useStore";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { logout } from "@/lib/auth";

const NAV = [
  { href: "/dashboard",              label: "Feed",         icon: "⚡",  countKey: null },
  { href: "/dashboard/applications", label: "Candidatures", icon: "📋",  countKey: "apps" },
  { href: "/dashboard/saved",        label: "Favoris",      icon: "🔖",  countKey: "saved" },
  { href: "/dashboard/documents",    label: "Documents",    icon: "📁",  countKey: "docs" },
  { href: "/dashboard/profile",      label: "Profil",       icon: "👤",  countKey: null },
  { href: "/dashboard/coach",        label: "Coach IA",     icon: "🤖",  countKey: null },
];

function useCounts() {
  const { data: apps }  = useQuery({ queryKey: ["applications"], queryFn: async () => (await api.get("/applications")).data as unknown[], staleTime: 60000, enabled: true });
  const { data: saved } = useQuery({ queryKey: ["saved"],        queryFn: async () => (await api.get("/opportunities/saved")).data as unknown[], staleTime: 60000, enabled: true });
  const { data: vault } = useQuery({ queryKey: ["documents"],    queryFn: async () => (await api.get("/documents")).data as { completeness_pct: number }, staleTime: 60000, enabled: true });
  return {
    apps:  apps?.length ?? 0,
    saved: saved?.length ?? 0,
    docs:  vault?.completeness_pct ? `${vault.completeness_pct}%` : "0%",
  };
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user }  = useStore();
  const counts    = useCounts();

  const initials = user?.full_name
    ? user.full_name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const profileFields = [user?.level, user?.field, user?.gpa, user?.city,
    (user?.languages?.length ?? 0) > 0 ? "ok" : "",
    (user?.skills?.length ?? 0) > 0 ? "ok" : ""];
  const completeness = Math.round(profileFields.filter(Boolean).length / profileFields.length * 100);

  const countMap: Record<string, string | number> = { apps: counts.apps, saved: counts.saved, docs: counts.docs };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-5 h-14 flex items-center border-b shrink-0" style={{ borderColor: "#1f2937" }}>
        <span className="font-black text-lg tracking-tight" style={{ color: "#34d399" }}>OpportuLink</span>
      </div>

      {/* User */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b shrink-0" style={{ borderColor: "#1f2937" }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ background: "#065f46", color: "#34d399" }}>
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold truncate" style={{ color: "#f3f4f6" }}>{user?.full_name}</p>
          <p className="text-[10px] truncate" style={{ color: "#4b5563" }}>{user?.email}</p>
        </div>
      </div>

      {/* Nav scrollable */}
      <nav className="flex-1 overflow-y-auto p-2">
        <p className="text-[9px] font-bold uppercase tracking-widest px-2 pt-2 pb-1.5" style={{ color: "#374151" }}>Principal</p>
        {NAV.slice(0, 4).map(item => {
          const active = pathname === item.href;
          const count  = item.countKey ? countMap[item.countKey] : null;
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all mb-0.5"
              style={active ? { background: "#064e3b", color: "#34d399" } : { color: "#6b7280" }}>
              <span className="text-sm w-4 shrink-0">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {count !== null && count !== 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={active ? { background: "#065f46", color: "#34d399" } : { background: "#1f2937", color: "#4b5563" }}>
                  {count}
                </span>
              )}
            </Link>
          );
        })}

        <p className="text-[9px] font-bold uppercase tracking-widest px-2 pt-4 pb-1.5" style={{ color: "#374151" }}>Mon compte</p>
        {NAV.slice(4).map(item => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all mb-0.5"
              style={active ? { background: "#064e3b", color: "#34d399" } : { color: "#6b7280" }}>
              <span className="text-sm w-4 shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}


      </nav>

      {/* Profil progress + déconnexion */}
      <div className="shrink-0 p-3 border-t" style={{ borderColor: "#1f2937" }}>
        <div className="rounded-xl p-3" style={{ background: "#111827" }}>
          <div className="flex justify-between text-[10px] mb-1.5">
            <span style={{ color: "#4b5563" }}>Profil complété</span>
            <span className="font-bold" style={{ color: "#34d399" }}>{completeness}%</span>
          </div>
          <div className="rounded-full h-1 overflow-hidden mb-2" style={{ background: "#1f2937" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${completeness}%`, background: "#10b981" }} />
          </div>
          <button onClick={logout}
            className="text-[10px] transition-all hover:underline w-full text-left"
            style={{ color: "#374151" }}>
            Déconnexion →
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f9fafb" }}>

      {/* Sidebar desktop — hauteur fixe 100vh, ne scroll pas avec le contenu */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0"
        style={{ height: "100vh", background: "#0a0a0a", overflowY: "auto", overflowX: "hidden" }}>
        {sidebarContent}
      </aside>

      {/* Zone principale */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflow: "hidden" }}>

        {/* Top bar mobile */}
        <header className="lg:hidden shrink-0 bg-white border-b border-gray-100 h-14 flex items-center justify-between px-4">
          <span className="font-black text-emerald-600 text-lg">OpportuLink</span>
          <button onClick={logout} className="text-xs text-gray-400 font-medium">Déco</button>
        </header>

        {/* Contenu scrollable */}
        <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          {children}
        </main>

        {/* Bottom nav mobile */}
        <nav className="lg:hidden shrink-0 border-t border-gray-100 bg-white">
          <div className="flex">
            {NAV.slice(0, 5).map(item => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  className="flex-1 flex flex-col items-center py-2.5 gap-0.5 relative"
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
