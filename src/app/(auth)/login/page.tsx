'use client';

import React, { useState } from 'react';
import { useAuth } from '@/client/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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
      setError(err instanceof Error ? err.message : 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setLoading(true);

    try {
      await login(demoEmail, demoPass);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed.');
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
          <p className="text-xs uppercase tracking-widest font-bold text-slate-600">
            Cutting Floor & Gatekeeper Terminal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-300">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="rounded-lg bg-rose-50 border border-[#b91c1c] p-3 text-xs font-bold text-[#b91c1c] flex items-center gap-2"
              >
                <span>⚠</span>
                <span>{error}</span>
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

          {/* Demo Credentials Panel */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                ⚡ Demo Credentials Panel
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">1-Click Test</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Supervisor */}
              <div className="p-3 rounded-lg border border-indigo-200 bg-indigo-50/50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-extrabold text-indigo-950 block">
                    Cutting Supervisor (Nimal Perera)
                  </span>
                  <span className="text-[11px] text-indigo-700 font-medium block">
                    supervisor@apparelflow.com / Supervisor@123
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      handleFillCredentials('supervisor@apparelflow.com', 'Supervisor@123')
                    }
                    className="text-[10px] font-bold text-slate-700 bg-white hover:bg-slate-50 px-2 py-1 rounded-md border border-slate-300 transition"
                  >
                    Fill
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickLogin('supervisor@apparelflow.com', 'Supervisor@123')
                    }
                    className="text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1 rounded-md transition"
                  >
                    Login →
                  </button>
                </div>
              </div>

              {/* Verifier */}
              <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-extrabold text-emerald-950 block">
                    Cutting Verifier (Kamala Silva)
                  </span>
                  <span className="text-[11px] text-emerald-700 font-medium block">
                    verifier@apparelflow.com / Verifier@123
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      handleFillCredentials('verifier@apparelflow.com', 'Verifier@123')
                    }
                    className="text-[10px] font-bold text-slate-700 bg-white hover:bg-slate-50 px-2 py-1 rounded-md border border-slate-300 transition"
                  >
                    Fill
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickLogin('verifier@apparelflow.com', 'Verifier@123')
                    }
                    className="text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 rounded-md transition"
                  >
                    Login →
                  </button>
                </div>
              </div>

              {/* Sewing Supervisor */}
              <div className="p-3 rounded-lg border border-purple-200 bg-purple-50/50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-extrabold text-purple-950 block">
                    Sewing Supervisor (Sunil Fernando)
                  </span>
                  <span className="text-[11px] text-purple-700 font-medium block">
                    sewing@apparelflow.com / Sewing@123
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      handleFillCredentials('sewing@apparelflow.com', 'Sewing@123')
                    }
                    className="text-[10px] font-bold text-slate-700 bg-white hover:bg-slate-50 px-2 py-1 rounded-md border border-slate-300 transition"
                  >
                    Fill
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickLogin('sewing@apparelflow.com', 'Sewing@123')
                    }
                    className="text-[10px] font-bold text-white bg-purple-600 hover:bg-purple-700 px-2.5 py-1 rounded-md transition"
                  >
                    Login →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
