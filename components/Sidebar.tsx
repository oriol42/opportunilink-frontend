"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { clearStaleLocalCaches } from "@/lib/auth";
import { LayoutGrid, FileText, Bookmark, FolderOpen, MessageCircle, User, LogOut } from "lucide-react";
import AnimatedNumber from "@/components/ui/AnimatedNumber";

const NAV = [
  { href: "/dashboard",              icon: LayoutGrid,   label: "Dashboard"    },
  { href: "/dashboard/applications", icon: FileText,     label: "Candidatures" },
  { href: "/dashboard/saved",        icon: Bookmark,     label: "Favoris"      },
  { href: "/dashboard/coach",        icon: MessageCircle, label: "Link IA"     },
  { href: "/dashboard/documents",    icon: FolderOpen,   label: "Documents"    },
  { href: "/dashboard/profile",      icon: User,         label: "Profil"       },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, setUser } = useStore();

  const initials = user?.full_name
    ?.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() ?? "?";

  function handleLogout() {
    clearStaleLocalCaches();
    queryClient.clear(); // évite qu'un prochain compte hérite du cache d'un autre utilisateur
    localStorage.removeItem("access_token");
    setUser(null);
    router.push("/login");
  }

  return (
    <aside className="sidebar-desktop" style={{
      width: 216, flexShrink: 0, background: "var(--bg-sidebar)",
      borderRight: "1px solid var(--border)", display: "flex",
      flexDirection: "column", height: "100vh", position: "sticky",
      top: 0, overflow: "hidden",
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
        <Link href="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: "linear-gradient(135deg,var(--accent),var(--accent-dark))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-voice)", fontSize: 15, fontWeight: 600, color: "#fff", flexShrink: 0,
          }}>O</div>
          <span style={{ fontFamily: "var(--font-voice)", fontSize: 15, fontWeight: 500, color: "var(--text-primary)", letterSpacing: "-.2px" }}>
            Opportu<span style={{ color: "var(--accent)" }}>Link</span>
          </span>
        </Link>
      </div>

      {/* User mini — avec OpportuScore visible */}
      <div style={{ padding: "14px 12px 10px" }}>
        <Link href="/dashboard/profile" style={{
          display: "flex", alignItems: "center", gap: 9,
          background: "var(--bg-surface-2)", borderRadius: 12,
          padding: "10px 11px", textDecoration: "none",
          border: "1px solid var(--border-subtle)",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg,var(--accent),var(--accent-dark))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
          }}>{initials}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user?.full_name ?? "Mon compte"}
            </p>
            <p style={{ fontSize: 10, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user?.level ?? ""}{user?.field ? ` · ${user.field}` : ""}
            </p>
          </div>
          {typeof user?.opportuni_score === "number" && (
            <span style={{
              fontFamily: "var(--font-voice)", fontSize: 12, fontWeight: 600,
              color: "var(--accent-dark)", flexShrink: 0,
            }}>
              <AnimatedNumber value={user.opportuni_score} />
            </span>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "4px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: ".08em",
          textTransform: "uppercase", padding: "0 8px", marginBottom: 4, marginTop: 4 }}>Navigation</p>
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className="sidebar-item" style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 10px", borderRadius: 10, textDecoration: "none",
              background: active ? "var(--sidebar-active-bg)" : "transparent",
              border: active ? `1px solid var(--sidebar-active-border)` : "1px solid transparent",
              transition: "all .15s",
            }}>
              <Icon size={16} strokeWidth={2} color={active ? "var(--sidebar-active-text)" : "var(--text-muted)"} style={{ flexShrink: 0 }} />
              <span style={{
                fontSize: 13, fontWeight: active ? 600 : 500,
                color: active ? "var(--sidebar-active-text)" : "var(--text-secondary)",
              }}>{label}</span>
              {active && <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%",
                background: "var(--accent)", flexShrink: 0 }} />}
            </Link>
          );
        })}
      </nav>

      {/* Déconnexion */}
      <div style={{ padding: "10px 10px 16px", borderTop: "1px solid var(--border-subtle)" }}>
        <button onClick={handleLogout} style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%",
          padding: "9px 10px", borderRadius: 10, border: "none",
          background: "transparent", cursor: "pointer", transition: "all .15s",
          color: "var(--text-muted)", fontSize: 13, fontWeight: 500,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-danger)")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <LogOut size={16} strokeWidth={2} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
