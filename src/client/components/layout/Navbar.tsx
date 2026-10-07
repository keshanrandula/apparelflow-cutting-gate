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

  const roleConfigs: Record<
    string,
    { title: string; shortTitle: string; badgeColor: string; stationTitle: string; icon: string; link: string }
  > = {
    cutting_supervisor: {
      title: 'Cutting Supervisor',
      shortTitle: 'Supervisor',
      badgeColor: 'bg-orange-50 dark:bg-orange-950/70 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-800',
      stationTitle: 'Cutting Floor Station',
      icon: '✂️',
      link: '/cutting',
    },
    cutting_verifier: {
      title: 'QC Gatekeeper',
      shortTitle: 'Gatekeeper',
      badgeColor: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800',
      stationTitle: 'Gatekeeper Verification Terminal',
      icon: '🛡️',
      link: '/verifier',
    },
    sewing_supervisor: {
      title: 'Sewing Supervisor',
      shortTitle: 'Sewing Lead',
      badgeColor: 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800',
      stationTitle: 'Sewing Floor Station',
      icon: '🧵',
      link: '/sewing',
    },
  };

  const currentRole = roleConfigs[user.role] || {
    title: 'Operator',
    shortTitle: 'Operator',
    badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700',
    stationTitle: 'ApparelFlow Workspace',
    icon: '⚡',
    link: '/',
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-orange-100/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex h-15 sm:h-16 items-center justify-between gap-2">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
              <img
                src="/logo.png"
                alt="ApparelFlow Logo"
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl object-cover ring-2 ring-orange-200 dark:ring-orange-900/50 shadow-sm"
              />
              <div className="min-w-0">
                <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white block leading-tight">
                  ApparelFlow <span className="text-orange-600 dark:text-orange-500">ERP</span>
                </span>
                <span className="hidden sm:block text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                  {currentRole.stationTitle}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-200 dark:border-slate-800">
              <Link
                href={currentRole.link}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 shadow-2xs"
              >
                <span>{currentRole.icon}</span> {currentRole.title}
              </Link>
            </nav>
          </div>

          {/* Right Controls: Role Badge + ThemeToggle + Logout */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Role Badge (Smart Responsive: shows icon + short title on mobile, full on desktop) */}
            <div className="flex items-center">
              <span
                className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold rounded-full border shadow-2xs ${currentRole.badgeColor}`}
                title={`Logged in as ${currentRole.title} (${user.email})`}
              >
                <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-current opacity-80 shrink-0" />
                <span className="sm:hidden">{currentRole.shortTitle}</span>
                <span className="hidden sm:inline">{currentRole.title}</span>
              </span>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle className="p-1.5 sm:p-2" />

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 transition shadow-2xs cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
