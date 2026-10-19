'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { Store, Lock, User, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.user.role === 'cashier') {
        router.push('/pos');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to sign in. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 transition-colors relative">
      {/* Top Right Corner Light/Dark Mode Switcher */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle showLabel />
      </div>

      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow-xs mb-3">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            ExamplePOS
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Store Operations & Remote Inventory Management
          </p>
        </div>

        {/* Clean Login Panel (30% Surface) */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
          {error && (
            <div className="mb-4 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin or cashier"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                />
              </div>
            </div>

            {/* 10% Accent Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Presets */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/60">
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center mb-2.5 flex items-center justify-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              Demo Accounts
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPreset('admin', 'admin123')}
                className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-700/50 border border-slate-200 dark:border-slate-700 text-left transition-colors"
              >
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Admin</div>
                <div className="text-[10px] text-slate-500">Store Manager</div>
              </button>
              <button
                type="button"
                onClick={() => setPreset('cashier', 'cashier123')}
                className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-700/50 border border-slate-200 dark:border-slate-700 text-left transition-colors"
              >
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Cashier</div>
                <div className="text-[10px] text-slate-500">POS Checkout</div>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-5">
          Access remotely from any mobile phone, tablet, or PC browser.
        </p>
      </div>
    </main>
  );
}
