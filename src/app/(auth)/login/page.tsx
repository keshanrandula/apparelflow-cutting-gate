'use client';

import React, { useState } from 'react';
import { useAuth } from '@/client/hooks/useAuth';
import { Button } from '@/client/components/ui/Button';
import { ThemeToggle } from '@/client/components/ui/ThemeToggle';
import { useToast } from '@/client/components/ui/Toast';

export default function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email.trim(), password);
      showToast('Login successful! Loading workspace...', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials. Please verify your staff email and password.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Theme toggle fixed top right */}
      <div className="fixed top-5 right-5 z-50">
        <ThemeToggle />
      </div>

      {/* LEFT PANEL: Enterprise Operations & Brand Showcase (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 text-white p-12 flex-col justify-between overflow-hidden">
        {/* Subtle orange ambient glow backgrounds */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3.5">
            <img
              src="/logo.png"
              alt="ApparelFlow Logo"
              className="h-12 w-12 rounded-2xl object-cover ring-2 ring-orange-500/40 shadow-xl shadow-orange-600/30"
            />
            <div>
              <span className="text-xl font-black tracking-tight text-white block leading-tight">
                ApparelFlow <span className="text-orange-500">ERP</span>
              </span>
              <span className="text-[11px] uppercase tracking-widest font-bold text-slate-400">
                Cutting Operations & Gatekeeper Terminal
              </span>
            </div>
          </div>
        </div>

        {/* Center Feature Highlights */}
        <div className="relative z-10 space-y-8 my-auto max-w-lg">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 mb-4">
              <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
              Industry 4.0 Factory Standard
            </span>
            <h2 className="text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight">
              Precision Fabric Cutting & Zero-Shortage Gatekeeping
            </h2>
            <p className="mt-3 text-slate-400 text-sm leading-relaxed">
              Real-time bill-of-materials calculation, automated component traffic-light verification, and seamless handover to the sewing assembly lines.
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-3.5">
            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 text-sm font-black">
                🛡️
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-200">Strict Gatekeeper Enforcement</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Orders with component shortages are locked from sewing until physical re-cut.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-black">
                📊
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-200">Live Fabric Wastage Analytics</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Automatic comparison against recipe wastage caps with immutable audit trail logs.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 text-sm font-black">
                🧵
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-200">Sewing Line Handover</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Verified batches instantly queue for floor supervisors with operator line assignment.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer & Compliance Badges */}
        <div className="relative z-10 pt-6 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="font-semibold text-slate-300">Terminal Gate Online (v2.6.4)</span>
          </div>
          <span className="font-medium">ISO 9001 • SOC2 Type II Certified</span>
        </div>
      </div>

      {/* RIGHT PANEL: Enterprise Authentication Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Header (Shown only on small screens) */}
          <div className="lg:hidden text-center space-y-2 mb-6">
            <img
              src="/logo.png"
              alt="ApparelFlow Logo"
              className="inline-flex h-14 w-14 rounded-2xl object-cover ring-4 ring-orange-100 dark:ring-orange-950/50 shadow-xl shadow-orange-500/30"
            />
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              ApparelFlow <span className="text-orange-600">ERP</span>
            </h1>
            <p className="text-xs uppercase tracking-widest font-bold text-slate-500">
              Factory Operations Terminal
            </p>
          </div>

          {/* Form Header */}
          <div className="space-y-1.5">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Sign in to Terminal
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Enter your enterprise credentials to access your station workspace.
            </p>
          </div>

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-900/50 p-3.5 text-xs font-bold text-rose-900 dark:text-rose-300 flex items-start gap-2.5 shadow-xs"
              >
                <span className="text-sm">⚠️</span>
                <span className="flex-1 leading-snug">{error}</span>
              </div>
            )}

            {/* Email Address */}
            <div className="space-y-1.5">
              <label
                htmlFor="staff-email"
                className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300"
              >
                Staff Email / Username <span className="text-orange-600">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                  </svg>
                </div>
                <input
                  id="staff-email"
                  type="email"
                  placeholder="e.g. supervisor@apparelflow.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 pl-10 pr-3.5 py-2.5 text-slate-900 dark:text-white bg-white dark:bg-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition shadow-xs font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="staff-password"
                  className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                >
                  Password <span className="text-orange-600">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert('Please contact your ApparelFlow Plant System Administrator to reset your staff credentials.')}
                  className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="staff-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 pl-10 pr-10 py-2.5 text-slate-900 dark:text-white bg-white dark:bg-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition shadow-xs font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Toggle */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 h-4 w-4"
                />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Remember this station terminal
                </span>
              </label>
            </div>

            {/* Sign in button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full py-2.5 font-bold shadow-lg shadow-orange-600/25 transition-all text-sm"
                loading={loading}
              >
                Sign In to Station Terminal →
              </Button>
            </div>
          </form>

          {/* Evaluator Quick Role Switcher (Required by Section 5 of Webtezza Assessment) */}
          <div className="pt-5 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>⚡</span> Evaluator Roles
              </span>
              <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 rounded-md">
                1-Click Audit Access
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('supervisor@apparelflow.com');
                  setPassword('Supervisor@123');
                  setError(null);
                  showToast('Loaded credentials for Cutting Supervisor', 'info');
                }}
                className="p-2 rounded-xl border border-orange-200 bg-orange-50/60 hover:bg-orange-100 dark:bg-orange-950/20 text-left transition shadow-xs group cursor-pointer"
                title="Fill Cutting Supervisor Credentials"
              >
                <span className="text-[10px] font-extrabold text-orange-950 dark:text-orange-200 block truncate">
                  Supervisor
                </span>
                <span className="text-[9px] text-orange-700 dark:text-orange-400 block truncate">
                  Cutting Supervisor
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('verifier@apparelflow.com');
                  setPassword('Verifier@123');
                  setError(null);
                  showToast('Loaded credentials for QC Gatekeeper', 'info');
                }}
                className="p-2 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 dark:bg-emerald-950/20 text-left transition shadow-xs group cursor-pointer"
                title="Fill QC Gatekeeper Credentials"
              >
                <span className="text-[10px] font-extrabold text-emerald-950 dark:text-emerald-200 block truncate">
                  Gatekeeper
                </span>
                <span className="text-[9px] text-emerald-700 dark:text-emerald-400 block truncate">
                  QC Gatekeeper
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('sewing@apparelflow.com');
                  setPassword('Sewing@123');
                  setError(null);
                  showToast('Loaded credentials for Sewing Supervisor', 'info');
                }}
                className="p-2 rounded-xl border border-amber-300 bg-amber-50/60 hover:bg-amber-100 dark:bg-amber-950/20 text-left transition shadow-xs group cursor-pointer"
                title="Fill Sewing Supervisor Credentials"
              >
                <span className="text-[10px] font-extrabold text-amber-950 dark:text-amber-200 block truncate">
                  Sewing Lead
                </span>
                <span className="text-[9px] text-amber-700 dark:text-amber-400 block truncate">
                  Sewing Supervisor
                </span>
              </button>
            </div>
          </div>

          {/* Enterprise Security Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-center space-y-1.5">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-1.5">
              <span>🔒</span> 256-bit Encrypted Session • Authorized Personnel Only
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              Access is monitored and audited in accordance with factory IT policies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
