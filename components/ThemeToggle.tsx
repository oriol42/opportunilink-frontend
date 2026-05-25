"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("ol-theme");
    // Par défaut : clair (pas de préférence système)
    const isDark = saved === "dark";
    setDark(isDark);
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("ol-theme", next ? "dark" : "light");
  }

  return (
    <button onClick={toggle} aria-label={dark ? "Mode clair" : "Mode sombre"} style={{
      width: 38, height: 38, borderRadius: 10,
      background: "var(--bg-input)", border: "1px solid var(--border)",
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", fontSize: 17, flexShrink: 0,
    }}>
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
