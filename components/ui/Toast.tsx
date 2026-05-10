"use client";
import { useEffect, useState, createContext, useContext, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error:   (message: string) => void;
  info:    (message: string) => void;
  warning: (message: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

// ─── Config par type ──────────────────────────────────────────────

const TOAST_STYLES: Record<ToastType, { bg: string; icon: string; bar: string }> = {
  success: { bg: "bg-emerald-900 border-emerald-700", icon: "✓", bar: "bg-emerald-400" },
  error:   { bg: "bg-red-900 border-red-700",         icon: "✕", bar: "bg-red-400" },
  info:    { bg: "bg-blue-900 border-blue-700",       icon: "ℹ", bar: "bg-blue-400" },
  warning: { bg: "bg-amber-900 border-amber-700",    icon: "⚠", bar: "bg-amber-400" },
};

const DURATION = 3500; // ms

// ─── Individual toast ─────────────────────────────────────────────

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const style = TOAST_STYLES[toast.type];

  useEffect(() => {
    // Trigger enter animation
    const t1 = setTimeout(() => setVisible(true), 10);
    // Auto-remove
    const t2 = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, DURATION);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [toast.id, onRemove]);

  return (
    <div
      onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 300); }}
      className={`
        relative overflow-hidden cursor-pointer select-none
        border rounded-xl px-4 py-3 min-w-[260px] max-w-[340px]
        shadow-lg transition-all duration-300
        ${style.bg}
        ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}
      `}
    >
      {/* Content */}
      <div className="flex items-start gap-2.5">
        <span className="shrink-0 font-bold text-sm mt-0.5 text-white opacity-80">
          {style.icon}
        </span>
        <p className="text-sm text-white font-medium leading-snug">{toast.message}</p>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10">
        <div
          className={`h-full ${style.bar} origin-left`}
          style={{ animation: `toast-shrink ${DURATION}ms linear forwards` }}
        />
      </div>

      <style jsx>{`
        @keyframes toast-shrink {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const add = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev.slice(-3), { id, message, type }]); // max 4 toasts
  }, []);

  const value: ToastContextValue = {
    toast:   add,
    success: (m) => add(m, "success"),
    error:   (m) => add(m, "error"),
    info:    (m) => add(m, "info"),
    warning: (m) => add(m, "warning"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container — fixed bottom-right, above bottom nav */}
      <div className="fixed bottom-24 sm:bottom-6 right-4 z-50 flex flex-col gap-2 items-end">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
