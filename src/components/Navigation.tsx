'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Boxes,
  Receipt,
  Users,
  Wallet,
  Settings,
  LogOut,
  Menu,
  X,
  Store,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface UserSession {
  username: string;
  role: string;
  fullName: string | null;
}

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);
  const [lowStockCount, setLowStockCount] = useState<number>(0);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.replace('/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => router.replace('/login'));

    fetch('/api/dashboard')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.kpis?.lowStockCount !== undefined) {
          setLowStockCount(data.kpis.lowStockCount + data.kpis.outOfStockCount);
        }
      })
      .catch(() => {});
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  };

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Point of Sale', href: '/pos', icon: ShoppingCart, highlight: true },
    { label: 'Inventory', href: '/inventory', icon: Package, badge: lowStockCount > 0 ? lowStockCount : undefined },
    { label: 'Stock Intake', href: '/batches', icon: Boxes },
    { label: 'Sales & Receipts', href: '/orders', icon: Receipt },
    { label: 'Customers', href: '/customers', icon: Users },
    { label: 'Expenses', href: '/expenses', icon: Wallet },
    { label: 'Settings', href: '/settings', icon: Settings, adminOnly: true },
  ];

  const filteredNav = navItems.filter((item) => {
    if (item.adminOnly && user?.role !== 'admin') return false;
    return true;
  });

  return (
    <>
      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] h-screen sticky top-0 z-40 transition-colors">
        {/* Brand & Theme Toggle */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center shadow-xs">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-[var(--text)] text-sm tracking-tight leading-none">
                ExamplePOS
              </h1>
              <span className="text-[11px] text-[var(--text-secondary)] font-normal">POS & Inventory</span>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Menu
          </div>
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--surface-hover)] text-[var(--accent)] font-semibold border-l-2 border-[var(--accent)]'
                    : item.highlight
                    ? 'bg-[var(--surface-hover)] text-[var(--text)] hover:text-[var(--accent)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? 'text-[var(--accent)]'
                        : 'text-[var(--text-muted)]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--warning-bg)] text-[var(--warning-text)] flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-[var(--border)] bg-[var(--bg)]">
          <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
            <div className="flex items-center gap-2 truncate">
              <div className="w-7 h-7 rounded-md bg-[var(--surface-hover)] text-[var(--text)] flex items-center justify-center font-bold text-xs uppercase">
                {user?.username?.substring(0, 2) || 'ST'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-[var(--text)] truncate">
                  {user?.fullName || user?.username || 'Staff'}
                </p>
                <p className="text-[10px] text-[var(--text-secondary)] capitalize flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[var(--accent)]" />
                  {user?.role || 'Staff'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--error-text)] hover:bg-[var(--error-bg)] rounded-md transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── MOBILE TOP BAR ─── */}
      <header className="lg:hidden sticky top-0 z-40 bg-[var(--surface)] border-b border-[var(--border)] px-4 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center">
            <Store className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-[var(--text)] text-sm tracking-tight leading-none block">
              ExamplePOS
            </span>
            <span className="text-[10px] text-[var(--text-secondary)] font-normal">POS & Inventory</span>
          </div>
        </div>

        {/* Top-Right Controls */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Link
            href="/pos"
            className="px-2.5 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)] text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            POS
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-[var(--text-secondary)] rounded-lg border border-[var(--border)] bg-[var(--surface)]"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ─── MOBILE DRAWER MENU ─── */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-[var(--surface)] border-t border-[var(--border)] rounded-t-2xl max-h-[85vh] overflow-y-auto p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div>
                <p className="font-bold text-[var(--text)] text-sm">
                  {user?.fullName || user?.username || 'Staff'}
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] capitalize">{user?.role} Account</p>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              {filteredNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[var(--accent)] text-[var(--accent-text)] font-semibold'
                        : 'text-[var(--text)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--warning-bg)] text-[var(--warning-text)] font-bold">
                        {item.badge}
                      </span>
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                    )}
                  </Link>
                );
              })}
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-2.5 rounded-lg bg-[var(--error-bg)] text-[var(--error-text)] border border-[var(--border)] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* ─── MOBILE BOTTOM BAR ─── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-3 py-1.5 flex items-center justify-around shadow-xs">
        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-medium ${
            pathname === '/' ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </Link>
        <Link
          href="/inventory"
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-medium relative ${
            pathname === '/inventory' ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <Package className="w-4 h-4" />
          Inventory
          {lowStockCount > 0 && (
            <span className="absolute top-0 right-2 w-1.5 h-1.5 rounded-full bg-amber-500" />
          )}
        </Link>
        <Link
          href="/pos"
          className="flex flex-col items-center gap-0.5 -mt-3 bg-emerald-600 text-white p-2 rounded-xl shadow-md active:scale-95 transition-transform"
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="text-[9px] font-bold">POS</span>
        </Link>
        <Link
          href="/orders"
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-medium ${
            pathname === '/orders' ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Sales
        </Link>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-medium text-gray-500 dark:text-gray-400"
        >
          <Menu className="w-4 h-4" />
          More
        </button>
      </div>
    </>
  );
}
