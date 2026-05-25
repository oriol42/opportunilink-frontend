// Ping le backend toutes les 10 min pour éviter le cold start de Render Free
const BACKEND = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ?? "";

export function startKeepAlive() {
  if (typeof window === "undefined" || !BACKEND) return;
  
  // Ping immédiat au chargement
  fetch(`${BACKEND}/health`, { method: "GET" }).catch(() => {});
  
  // Puis toutes les 10 minutes
  setInterval(() => {
    fetch(`${BACKEND}/health`, { method: "GET" }).catch(() => {});
  }, 10 * 60 * 1000);
}
