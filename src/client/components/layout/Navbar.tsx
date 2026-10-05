'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const roleLabels: Record<string, { title: string; badgeColor: string }> = {
    cutting_supervisor: { title: 'Cutting Supervisor', badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    cutting_verifier: { title: 'Cutting Verifier', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    sewing_supervisor: { title: 'Sewing Supervisor', badgeColor: 'bg-purple-100 text-purple-800 border-purple-200' },
  };

  const currentRole = roleLabels[user.role] || { title: user.role, badgeColor: 'bg-slate-100 text-slate-800 border-slate-200' };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand Logo & Station Title */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-black text-lg shadow-sm">
                AF
              </div>
              <div>
                <span className="text-base font-extrabold tracking-tight text-slate-900 block leading-tight">
                  ApparelFlow <span className="text-indigo-600">ERP</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">
                  Cutting Gatekeeper Terminal
                </span>
              </div>
            </Link>

            {/* Navigation tabs */}
            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-200">
              {user.role === 'cutting_supervisor' && (
                <Link
                  href="/cutting"
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    pathname === '/cutting'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Cutting Workspace
                </Link>
              )}

              {user.role === 'cutting_verifier' && (
                <Link
                  href="/verification"
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    pathname === '/verification'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Gatekeeper Terminal
                </Link>
              )}

              {user.role === 'sewing_supervisor' && (
                <Link
                  href="/sewing"
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    pathname === '/sewing'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Sewing Intake Floor
                </Link>
              )}
            </nav>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900">{user.name}</div>
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-200 transition shadow-xs"
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
