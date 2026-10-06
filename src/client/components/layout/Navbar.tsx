'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { ThemeToggle } from '../ui/ThemeToggle';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const roleLabels: Record<string, { title: string; badgeColor: string }> = {
    cutting_supervisor: { title: 'Cutting Supervisor', badgeColor: 'bg-orange-100 dark:bg-orange-950/70 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800' },
    cutting_verifier: { title: 'Cutting Verifier', badgeColor: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
    sewing_supervisor: { title: 'Sewing Supervisor', badgeColor: 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  };

  const currentRole = roleLabels[user.role] || { title: user.role, badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700' };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-orange-100/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand Logo & Station Title */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-black text-lg shadow-md shadow-orange-600/20 ring-2 ring-orange-100 dark:ring-orange-900/50">
                AF
              </div>
              <div>
                <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white block leading-tight">
                  ApparelFlow <span className="text-orange-600 dark:text-orange-500">ERP</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400 block">
                  Cutting Gatekeeper Terminal
                </span>
              </div>
            </Link>

            {/* Navigation tabs */}
            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-200 dark:border-slate-800">
              {user.role === 'cutting_supervisor' && (
                <Link
                  href="/cutting"
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    pathname === '/cutting'
                      ? 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Cutting Workspace
                </Link>
              )}

              {user.role === 'cutting_verifier' && (
                <Link
                  href="/verifier"
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    pathname === '/verifier' || pathname === '/verification'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Gatekeeper Terminal
                </Link>
              )}

              {user.role === 'sewing_supervisor' && (
                <Link
                  href="/sewing"
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    pathname === '/sewing'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Sewing Intake Floor
                </Link>
              )}
            </nav>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{user.name}</div>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <span
                  className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full border uppercase tracking-wider ${currentRole.badgeColor}`}
                >
                  {currentRole.title}
                </span>
              </div>
            </div>

            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 transition shadow-xs"
              title="Sign Out"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
