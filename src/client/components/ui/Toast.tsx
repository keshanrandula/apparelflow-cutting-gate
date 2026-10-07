'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => {
      // If adding a success or error, dismiss previous info notices to prevent clutter
      const filtered = (type === 'success' || type === 'error') 
        ? prev.filter(t => t.type !== 'info') 
        : prev.slice(-2); // keep at most 2 active toasts
      return [...filtered, { id, type, message, title }];
    });

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const typeConfig: Record<
    ToastType,
    { bg: string; text: string; border: string; iconBg: string; badge: string }
  > = {
    success: {
      bg: 'bg-white/95 dark:bg-slate-900/95 shadow-emerald-500/10',
      text: 'text-slate-800 dark:text-slate-100',
      border: 'border-emerald-500/30 dark:border-emerald-500/40',
      iconBg: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-500/20',
      badge: 'Success',
    },
    error: {
      bg: 'bg-white/95 dark:bg-slate-900/95 shadow-rose-500/10',
      text: 'text-slate-800 dark:text-slate-100',
      border: 'border-rose-500/30 dark:border-rose-500/40',
      iconBg: 'bg-rose-500 text-white shadow-md shadow-rose-500/30 ring-2 ring-rose-500/20',
      badge: 'Error',
    },
    warning: {
      bg: 'bg-white/95 dark:bg-slate-900/95 shadow-amber-500/10',
      text: 'text-slate-800 dark:text-slate-100',
      border: 'border-amber-500/30 dark:border-amber-500/40',
      iconBg: 'bg-amber-500 text-white shadow-md shadow-amber-500/30 ring-2 ring-amber-500/20',
      badge: 'Warning',
    },
    info: {
      bg: 'bg-white/95 dark:bg-slate-900/95 shadow-blue-500/10',
      text: 'text-slate-800 dark:text-slate-100',
      border: 'border-blue-500/30 dark:border-blue-500/40',
      iconBg: 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-500/20',
      badge: 'Notice',
    },
  };

  return (
    <ToastContext.Provider value={{ showToast, clearToasts }}>
      {children}
      <div
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => {
          const cfg = typeConfig[toast.type];
          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto flex items-center justify-between gap-3.5 p-3.5 rounded-2xl border backdrop-blur-xl shadow-2xl ${cfg.bg} ${cfg.text} ${cfg.border} transition-all duration-300 animate-in slide-in-from-bottom-3 fade-in`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`flex items-center justify-center h-7 w-7 rounded-xl shrink-0 ${cfg.iconBg} transition-transform transform active:scale-95`}
                >
                  {getToastIcon(toast.type)}
                </span>
                <div className="flex flex-col min-w-0">
                  {toast.title && (
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {toast.title}
                    </span>
                  )}
                  <span className="text-xs font-semibold leading-snug break-words">
                    {toast.message}
                  </span>
                </div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="Dismiss toast"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
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
