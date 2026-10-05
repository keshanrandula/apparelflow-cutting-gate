'use client';

import React, { useState } from 'react';
import { useAuth } from '@/client/hooks/useAuth';
import { Input } from '@/client/components/ui/Input';
import { Button } from '@/client/components/ui/Button';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email.trim(), password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setLoading(true);

    try {
      await login(demoEmail, demoPass);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-100">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-xl shadow-md">
            AF
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            ApparelFlow ERP
          </h1>
          <p className="text-xs uppercase tracking-widest font-bold text-slate-500">
            Cutting Floor & Gatekeeper Terminal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-800">
                ⚠️ {error}
              </div>
            )}

            <Input
              label="Staff Email Address"
              type="email"
              placeholder="e.g. supervisor@apparelflow.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              label="Terminal Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <div className="pt-2">
              <Button type="submit" variant="primary" className="w-full" loading={loading}>
                Sign In to Terminal
              </Button>
            </div>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-3 text-center">
              ⚡ Instant Evaluator Demo Logins
            </span>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() =>
                  handleQuickLogin('supervisor@apparelflow.com', 'Supervisor@123')
                }
                className="flex items-center justify-between p-2.5 rounded-lg border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-left transition"
              >
                <div>
                  <span className="text-xs font-bold text-indigo-900 block">
                    Cutting Supervisor (Nimal Perera)
                  </span>
                  <span className="text-[10px] text-indigo-600 block">
                    supervisor@apparelflow.com
                  </span>
                </div>
                <span className="text-[10px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-sm border border-indigo-200">
                  Log in →
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickLogin('verifier@apparelflow.com', 'Verifier@123')
                }
                className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-left transition"
              >
                <div>
                  <span className="text-xs font-bold text-emerald-900 block">
                    Cutting Verifier (Kamala Silva)
                  </span>
                  <span className="text-[10px] text-emerald-600 block">
                    verifier@apparelflow.com
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-sm border border-emerald-200">
                  Log in →
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickLogin('sewing@apparelflow.com', 'Sewing@123')
                }
                className="flex items-center justify-between p-2.5 rounded-lg border border-purple-200 bg-purple-50/60 hover:bg-purple-100 text-left transition"
              >
                <div>
                  <span className="text-xs font-bold text-purple-900 block">
                    Sewing Supervisor (Sunil Fernando)
                  </span>
                  <span className="text-[10px] text-purple-600 block">
                    sewing@apparelflow.com
                  </span>
                </div>
                <span className="text-[10px] font-bold text-purple-700 bg-white px-2 py-0.5 rounded-sm border border-purple-200">
                  Log in →
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
