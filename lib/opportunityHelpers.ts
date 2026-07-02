// lib/opportunityHelpers.ts
// Logique partagée entre toutes les pages qui affichent des opportunités
// (dashboard, détail, favoris). Avant : chaque page redéfinissait sa propre
// copie de TYPE, dl(), detectMethod(), whyRecommended() — 3 versions
// légèrement différentes à maintenir. Maintenant : une seule source de vérité.

import { Mail, Link2, Globe, FileText, ShieldCheck, ShieldAlert, ShieldX,
  Clock, BookOpen, Languages as LanguagesIcon, Check, Star, LucideIcon } from "lucide-react";

export interface OpportunityLite {
  id: string;
  title: string;
  type: string;
  description?: string | null;
  deadline: string | null;
  country: string | null;
  reliability_score: number;
  relevance_score: number;
  is_verified?: boolean;
  source_url?: string;
  required_fields?: string[];
  required_level?: string[];
  required_languages?: string[];
}

export interface UserLite {
  level?: string | null;
  field?: string | null;
  languages?: string[] | null;
}

// Couleurs par catégorie — volontairement fixes (identiques en clair/sombre),
// c'est un système de couleurs sémantique indépendant du thème.
export const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; gradient: string }> = {
  bourse:    { label: "Bourse",    color: "#7c3aed", bg: "rgba(124,58,237,.12)", gradient: "#7c3aed,#a855f7" },
  stage:     { label: "Stage",     color: "#2563eb", bg: "rgba(37,99,235,.12)",  gradient: "#2563eb,#3b82f6" },
  emploi:    { label: "Emploi",    color: "#059669", bg: "rgba(5,150,105,.12)",  gradient: "#059669,#10b981" },
  echange:   { label: "Échange",   color: "#d97706", bg: "rgba(217,119,6,.12)",  gradient: "#d97706,#f59e0b" },
  concours:  { label: "Concours",  color: "#dc2626", bg: "rgba(220,38,38,.12)",  gradient: "#dc2626,#ef4444" },
  formation: { label: "Formation", color: "#0891b2", bg: "rgba(8,145,178,.12)",  gradient: "#0891b2,#06b6d4" },
};

export function typeConfig(type: string) {
  return TYPE_CONFIG[type] ?? { label: type, color: "#6b7280", bg: "rgba(107,114,128,.12)", gradient: "#6b7280,#9ca3af" };
}

/** Jours restants avant la deadline. null si pas de deadline. */
export function daysLeft(deadline: string | null): number | null {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
}

/** Détecte la méthode de candidature à partir de l'URL / description. */
export function detectApplyMethod(sourceUrl: string, description: string): { icon: LucideIcon; label: string } {
  const url = (sourceUrl || "").toLowerCase();
  if (url.includes("forms.google") || url.includes("typeform")) return { icon: FileText, label: "Formulaire" };
  const hasEmail = (sourceUrl + " " + description).match(/[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (hasEmail || url.startsWith("mailto:")) return { icon: Mail, label: "Email" };
  if (url.includes("linkedin.com")) return { icon: Link2, label: "LinkedIn" };
  return { icon: Globe, label: "Lien" };
}

/** Badges "pourquoi cette opportunité t'est recommandée". */
export function matchReasons(opp: OpportunityLite, user: UserLite): { icon: LucideIcon; label: string }[] {
  const reasons: { icon: LucideIcon; label: string }[] = [];
  if (user.level && opp.required_level?.includes(user.level)) reasons.push({ icon: Check, label: "Ton niveau" });
  if (user.field && opp.required_fields?.includes(user.field)) reasons.push({ icon: BookOpen, label: "Ta filière" });
  if (user.languages?.some(l => opp.required_languages?.includes(l))) reasons.push({ icon: LanguagesIcon, label: "Langue OK" });
  if (opp.is_verified) reasons.push({ icon: ShieldCheck, label: "Vérifié" });
  const d = daysLeft(opp.deadline);
  if (d !== null && d >= 0 && d <= 14) reasons.push({ icon: Clock, label: `J-${d}` });
  if (reasons.length === 0) reasons.push({ icon: Star, label: "Recommandé" });
  return reasons.slice(0, 3);
}

/** Icône + couleur + libellé pour le niveau de fiabilité d'une opportunité. */
export function reliabilityMeta(score: number): { icon: LucideIcon; label: string; variant: "success" | "warning" | "danger" } {
  if (score >= 70) return { icon: ShieldCheck, label: "Fiable", variant: "success" };
  if (score >= 40) return { icon: ShieldAlert, label: "À vérifier", variant: "warning" };
  return { icon: ShieldX, label: "Risque élevé", variant: "danger" };
}
