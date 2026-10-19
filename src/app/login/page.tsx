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
        window.location.href = '/pos';
      } else {
        window.location.href = '/';
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
    <main className="min-h-screen w-full flex items-center justify-center p-4 bg-[var(--bg)] text-[var(--text)] transition-colors relative">
      {/* Top Right Corner Theme Switcher */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle showLabel />
      </div>

      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--accent)] text-[var(--accent-text)] shadow-xs mb-3">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight">
            ExamplePOS
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Point of Sale & Inventory Management Platform
          </p>
        </div>

        {/* Clean Login Card */}
        <div className="bg-[var(--surface)] rounded-xl p-6 border border-[var(--border)] shadow-sm">
          {error && (
            <div className="mb-4 p-2.5 rounded-lg bg-[var(--error-bg)] border border-[var(--border)] text-[var(--error-text)] text-xs font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin or cashier"
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg py-2 pl-9 pr-3 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg py-2 pl-9 pr-3 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)] font-semibold text-xs shadow-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-[var(--accent-text)]/30 border-t-[var(--accent-text)] rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Presets */}
          <div className="mt-5 pt-4 border-t border-[var(--border)]">
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider text-center mb-2.5 flex items-center justify-center gap-1">
              <Zap className="w-3 h-3 text-[var(--accent)]" />
              Demo Accounts
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPreset('admin', 'admin123')}
                className="p-2 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--surface)] border border-[var(--border)] text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-[var(--text)]">Admin</div>
                <div className="text-[10px] text-[var(--text-secondary)]">Store Manager</div>
              </button>
              <button
                type="button"
                onClick={() => setPreset('cashier', 'cashier123')}
                className="p-2 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--surface)] border border-[var(--border)] text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-[var(--text)]">Cashier</div>
                <div className="text-[10px] text-[var(--text-secondary)]">POS Checkout</div>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-[var(--text-muted)] mt-5">
          Access remotely from any phone, tablet, or laptop browser.
        </p>
      </div>
    </main>
  );
}
