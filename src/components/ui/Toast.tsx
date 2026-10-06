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
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const typeStyles: Record<ToastType, { bg: string; text: string; border: string; icon: string }> = {
    success: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-950',
      border: 'border-emerald-300',
      icon: '✓',
    },
    error: {
      bg: 'bg-rose-50',
      text: 'text-rose-950',
      border: 'border-rose-300',
      icon: '⚠',
    },
    warning: {
      bg: 'bg-amber-50',
      text: 'text-amber-950',
      border: 'border-amber-300',
      icon: '▲',
    },
    info: {
      bg: 'bg-orange-50',
      text: 'text-orange-950',
      border: 'border-orange-300',
      icon: 'ℹ',
    },
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => {
          const style = typeStyles[toast.type];
          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-lg ${style.bg} ${style.text} ${style.border} animate-in slide-in-from-bottom-2 duration-150`}
            >
              <div className="flex items-center gap-2.5 text-xs font-bold">
                <span className="text-sm font-black">{style.icon}</span>
                <span>{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-3 text-slate-500 hover:text-slate-800 p-1"
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
