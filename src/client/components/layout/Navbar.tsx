'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useToast } from '../ui/Toast';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    showToast('Signed out successfully.', 'success');
  };

  if (!user) return null;

  const roleLabels: Record<string, { title: string; badgeColor: string; stationTitle: string }> = {
    cutting_supervisor: {
      title: 'Cutting Supervisor',
      badgeColor: 'bg-orange-50 dark:bg-orange-950/70 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-800',
      stationTitle: 'Cutting Floor Station',
    },
    cutting_verifier: {
      title: 'QC Gatekeeper',
      badgeColor: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800',
      stationTitle: 'Gatekeeper Verification Terminal',
    },
    sewing_supervisor: {
      title: 'Sewing Supervisor',
      badgeColor: 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800',
      stationTitle: 'Sewing Floor Station',
    },
  };

  const currentRole = roleLabels[user.role] || {
    title: 'Operator',
    badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700',
    stationTitle: 'ApparelFlow Workspace',
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-orange-100/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand Logo & Dynamic Station Title */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <img
                src="/logo.png"
                alt="ApparelFlow Logo"
                className="h-9 w-9 rounded-xl object-cover ring-2 ring-orange-200 dark:ring-orange-900/50 shadow-md shadow-orange-600/15"
              />
              <div>
                <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white block leading-tight">
                  ApparelFlow <span className="text-orange-600 dark:text-orange-500">ERP</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400 block">
                  {currentRole.stationTitle}
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
                  Sewing Floor
                </Link>
              )}
            </nav>
          </div>

          {/* User Profile Single Clean Role Pill & Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            <div className="flex items-center">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-bold rounded-full border shadow-2xs ${currentRole.badgeColor}`}
              >
                <span className="h-2 w-2 rounded-full bg-current opacity-80" />
                <span className="truncate max-w-[110px] sm:max-w-none">{currentRole.title}</span>
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 transition shadow-xs cursor-pointer"
              title="Sign Out"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Secondary Bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-100 dark:border-slate-800/80">
          {user.role === 'cutting_supervisor' && (
            <Link
              href="/cutting"
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                pathname === '/cutting'
                  ? 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <span>✂️</span> Cutting Workspace
            </Link>
          )}

          {user.role === 'cutting_verifier' && (
            <Link
              href="/verifier"
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                pathname === '/verifier' || pathname === '/verification'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <span>🛡️</span> Gatekeeper Terminal
            </Link>
          )}

          {user.role === 'sewing_supervisor' && (
            <Link
              href="/sewing"
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                pathname === '/sewing'
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <span>🧵</span> Sewing Floor
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
