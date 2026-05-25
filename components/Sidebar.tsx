"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";

const NAV = [
  { href: "/dashboard",              icon: "⊞",  label: "Feed"            },
  { href: "/dashboard/applications", icon: "📋", label: "Candidatures"    },
  { href: "/dashboard/saved",        icon: "🔖", label: "Favoris"         },
  { href: "/dashboard/documents",    icon: "📁", label: "Documents"       },
  { href: "/dashboard/profile",      icon: "👤", label: "Profil"          },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useStore();

  const initials = user?.full_name
    ?.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() ?? "?";

  function handleLogout() {
    localStorage.removeItem("access_token");
    setUser(null);
    router.push("/login");
  }

  return (
    <aside style={{
      width: 200, flexShrink: 0, background: "var(--bg-sidebar)",
      borderRight: "1px solid var(--border)", display: "flex",
      flexDirection: "column", height: "100vh", position: "sticky",
      top: 0, overflow: "hidden",
    }}>
      {/* Logo */}
      <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid var(--border-subtle)" }}>
        <Link href="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: "linear-gradient(135deg,#10b981,#059669)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 900, color: "#fff", flexShrink: 0,
          }}>O</div>
          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-.3px" }}>
            Opportu<span style={{ color: "#10b981" }}>Link</span>
          </span>
        </Link>
      </div>

      {/* User mini */}
      <div style={{ padding: "12px 12px 10px" }}>
        <Link href="/dashboard/profile" style={{
          display: "flex", alignItems: "center", gap: 9,
          background: "var(--bg-surface-2)", borderRadius: 11,
          padding: "9px 10px", textDecoration: "none",
          border: "1px solid var(--border-subtle)",
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "linear-gradient(135deg,#10b981,#059669)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 900, color: "#fff", flexShrink: 0,
          }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user?.full_name ?? "Mon compte"}
            </p>
            <p style={{ fontSize: 10, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user?.level ?? ""}{user?.field ? ` · ${user.field}` : ""}
            </p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "4px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: ".08em",
          textTransform: "uppercase", padding: "0 8px", marginBottom: 4, marginTop: 4 }}>Navigation</p>
        {NAV.map(({ href, icon, label }) => {
          const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "8px 10px", borderRadius: 9, textDecoration: "none",
              background: active ? "var(--sidebar-active-bg)" : "transparent",
              border: active ? `1px solid var(--sidebar-active-border)` : "1px solid transparent",
              transition: "all .15s",
            }}>
              <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
              <span style={{
                fontSize: 13, fontWeight: active ? 700 : 500,
                color: active ? "var(--sidebar-active-text)" : "var(--text-secondary)",
              }}>{label}</span>
              {active && <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%",
                background: "#10b981", flexShrink: 0 }} />}
            </Link>
          );
        })}
      </nav>

      {/* Déconnexion */}
      <div style={{ padding: "10px 10px 16px", borderTop: "1px solid var(--border-subtle)" }}>
        <button onClick={handleLogout} style={{
          display: "flex", alignItems: "center", gap: 9, width: "100%",
          padding: "8px 10px", borderRadius: 9, border: "none",
          background: "transparent", cursor: "pointer", transition: "all .15s",
          color: "var(--text-muted)", fontSize: 13, fontWeight: 500,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,.08)")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <span style={{ fontSize: 15 }}>→</span>
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
