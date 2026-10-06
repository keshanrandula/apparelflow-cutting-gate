'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const typeConfig: Record<
    ToastType,
    { bg: string; text: string; border: string; icon: string; iconBg: string }
  > = {
    success: {
      bg: 'bg-white/95 dark:bg-slate-900/95',
      text: 'text-emerald-950 dark:text-emerald-100',
      border: 'border-emerald-500/40 dark:border-emerald-500/30',
      icon: '✓',
      iconBg: 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30',
    },
    error: {
      bg: 'bg-white/95 dark:bg-slate-900/95',
      text: 'text-rose-950 dark:text-rose-100',
      border: 'border-rose-500/40 dark:border-rose-500/30',
      icon: '✕',
      iconBg: 'bg-rose-500 text-white shadow-sm shadow-rose-500/30',
    },
    warning: {
      bg: 'bg-white/95 dark:bg-slate-900/95',
      text: 'text-amber-950 dark:text-amber-100',
      border: 'border-amber-500/40 dark:border-amber-500/30',
      icon: '!',
      iconBg: 'bg-amber-500 text-white shadow-sm shadow-amber-500/30',
    },
    info: {
      bg: 'bg-white/95 dark:bg-slate-900/95',
      text: 'text-orange-950 dark:text-orange-100',
      border: 'border-orange-500/40 dark:border-orange-500/30',
      icon: 'ℹ',
      iconBg: 'bg-orange-500 text-white shadow-sm shadow-orange-500/30',
    },
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => {
          const cfg = typeConfig[toast.type];
          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl border backdrop-blur-md shadow-xl ${cfg.bg} ${cfg.text} ${cfg.border} transition-all duration-300 animate-in slide-in-from-bottom-3 fade-in`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-black shrink-0 ${cfg.iconBg}`}
                >
                  {cfg.icon}
                </span>
                <span className="text-xs font-semibold leading-snug">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="Dismiss toast"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
