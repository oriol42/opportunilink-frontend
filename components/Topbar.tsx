"use client";
import ThemeToggle from "@/components/ThemeToggle";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
  }, [searchParams]);

  function handleChange(val: string) {
    setQ(val);
    if (!pathname.startsWith("/dashboard")) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const trimmed = val.trim();
      const params = new URLSearchParams();
      if (trimmed) params.set("q", trimmed);
      router.replace(`/dashboard${trimmed ? `?${params}` : ""}`, { scroll: false });
    }, 300);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = q.trim();
    if (pathname.startsWith("/dashboard")) {
      const params = new URLSearchParams();
      if (trimmed) params.set("q", trimmed);
      router.replace(`/dashboard${trimmed ? `?${params}` : ""}`, { scroll: false });
    }
  }

  function handleClear() {
    setQ("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    router.replace("/dashboard", { scroll: false });
  }

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "var(--topbar-bg)", backdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--topbar-border)",
      padding: "10px 24px", display: "flex", alignItems: "center", gap: 12,
      minHeight: 58,
    }}>
      <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 560 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "var(--bg-input)", borderRadius: 11,
          border: "1px solid var(--border)", padding: "10px 16px",
        }}>
          <span style={{ fontSize: 16, color: "var(--text-muted)", flexShrink: 0 }}>🔍</span>
          <input
            value={q}
            onChange={e => handleChange(e.target.value)}
            placeholder="Rechercher une opportunité, pays, type..."
            style={{
              flex: 1, border: "none", background: "transparent", outline: "none",
              fontSize: 15, color: "var(--text-primary)", fontWeight: 500,
            }}
          />
          {q && (
            <button type="button" onClick={handleClear} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 16, color: "var(--text-muted)", padding: 0, lineHeight: 1,
            }}>✕</button>
          )}
        </div>
      </form>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
        <ThemeToggle />
      </div>
    </header>
  );
}
