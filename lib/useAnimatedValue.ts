// lib/useAnimatedValue.ts
// Anime la transition entre une ancienne et une nouvelle valeur numerique
// (compteur qui "compte" au lieu de sauter). Reutilise partout ou un score
// ou un chiffre change (OpportuScore, anneaux de score, stats...).
"use client";
import { useEffect, useRef, useState } from "react";

// easeOutCubic : demarre vite puis ralentit en douceur vers la valeur finale
function ease(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function useAnimatedValue(target: number, duration = 700) {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>();
  const [increased, setIncreased] = useState(false);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;

    setIncreased(target > from);
    startRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    function tick(ts: number) {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = ease(t);
      setDisplay(from + (target - from) * eased);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
        setTimeout(() => setIncreased(false), 900);
      }
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return { display, increased };
}
