// components/MobileNav.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, FileText, Bookmark, MessageCircle, User } from "lucide-react";

const NAV = [
  { href: "/dashboard",              icon: LayoutGrid,    label: "Dashboard" },
  { href: "/dashboard/applications", icon: FileText,      label: "Suivi"    },
  { href: "/dashboard/saved",        icon: Bookmark,      label: "Favoris"  },
  { href: "/dashboard/coach",        icon: MessageCircle, label: "Link IA"  },
  { href: "/dashboard/profile",      icon: User,          label: "Profil"   },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="mobile-nav-bar"
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 60,
        background: "var(--topbar-bg)", backdropFilter: "blur(12px)",
        borderTop: "1px solid var(--topbar-border)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-around", padding: "6px 4px" }}>
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href} href={href}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                padding: "6px 10px", textDecoration: "none", minWidth: 56,
              }}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 2} color={active ? "var(--accent)" : "var(--text-muted)"} />
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 500, color: active ? "var(--accent)" : "var(--text-muted)" }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
