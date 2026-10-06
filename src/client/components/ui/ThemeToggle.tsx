'use client';

import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '@/components/ui/Toast';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const handleToggle = () => {
    const nextTheme = theme === 'dark' ? 'Light' : 'Dark';
    toggleTheme();
    showToast(`Switched to ${nextTheme} Mode`, 'info');
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`inline-flex items-center justify-center p-2 rounded-xl text-xs font-bold transition-all border shadow-xs cursor-pointer ${
        theme === 'dark'
          ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
      } ${className}`}
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme mode"
    >
      {theme === 'dark' ? (
        <span className="flex items-center gap-1.5">
          <span className="text-sm">☀️</span>
          <span className="hidden sm:inline text-[11px] font-bold text-slate-200">Light</span>
        </span>
      ) : (
        <span className="flex items-center gap-1.5">
          <span className="text-sm">🌙</span>
          <span className="hidden sm:inline text-[11px] font-bold text-slate-700">Dark</span>
        </span>
      )}
    </button>
  );
};
