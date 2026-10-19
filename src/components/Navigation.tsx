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
  LogIn,
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
          window.location.href = '/login';
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        } else {
          window.location.href = '/login';
        }
      })
      .catch(() => {
        window.location.href = '/login';
      });

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
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/login';
    }
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
      <header className="lg:hidden sticky top-0 z-40 bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--border)] px-4 h-14 flex items-center justify-between shadow-xs transition-colors">
        <Link href="/" className="flex items-center gap-2.5 active:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center shadow-xs shrink-0">
            <Store className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[var(--text)] text-sm tracking-tight leading-tight">
              ExamplePOS
            </span>
            <span className="text-[10px] text-[var(--text-secondary)] font-medium leading-none">
              {pathname === '/'
                ? 'Dashboard'
                : pathname === '/pos'
                ? 'Point of Sale'
                : pathname === '/inventory'
                ? 'Inventory Catalog'
                : pathname === '/batches'
                ? 'Stock Batches'
                : pathname === '/orders'
                ? 'Sales & Receipts'
                : pathname === '/customers'
                ? 'Customers'
                : pathname === '/expenses'
                ? 'Expenses'
                : pathname === '/settings'
                ? 'Store Settings'
                : 'POS & Inventory'}
            </span>
          </div>
        </Link>

        {/* Top-Right Controls: Theme Toggle & User Avatar Menu Button */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex items-center gap-1.5 py-1 px-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] active:scale-95 transition-all cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <span className="w-5 h-5 rounded-full bg-[var(--accent)] text-[var(--accent-text)] text-[10px] font-bold flex items-center justify-center uppercase">
              {user?.username?.substring(0, 1) || 'U'}
            </span>
            <Menu className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
          </button>
        </div>
      </header>

      {/* ─── MOBILE SLIDE-UP DRAWER MENU ─── */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end transition-opacity">
          <div className="bg-[var(--surface)] border-t border-[var(--border)] rounded-t-2xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Drawer Pull Handle */}
            <div className="w-10 h-1 rounded-full bg-[var(--border)] mx-auto mt-2.5 mb-1 shrink-0" />

            {/* User Profile Header */}
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                  {user?.username?.substring(0, 2) || 'ST'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-[var(--text)] text-sm leading-tight">
                      {user?.fullName || user?.username || 'Staff'}
                    </p>
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border)] uppercase">
                      {user?.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] font-mono mt-0.5">
                    @{user?.username || 'user'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] flex items-center justify-center cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Links Scroll Area */}
            <div className="overflow-y-auto p-3.5 space-y-3 flex-1">
              {/* Group: Core Operations */}
              <div>
                <p className="px-2 pb-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Store Operations
                </p>
                <div className="space-y-1">
                  {filteredNav.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-[var(--accent)] text-[var(--accent-text)] font-semibold shadow-xs'
                            : 'text-[var(--text)] hover:bg-[var(--surface-hover)]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--accent-text)]' : 'text-[var(--text-muted)]'}`} />
                          <span className="text-sm">{item.label}</span>
                        </div>
                        {item.badge !== undefined && item.badge > 0 ? (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                              isActive
                                ? 'bg-[var(--surface)] text-[var(--text)]'
                                : 'bg-[var(--warning-bg)] text-[var(--warning-text)]'
                            }`}
                          >
                            <AlertTriangle className="w-3 h-3" />
                            {item.badge}
                          </span>
                        ) : (
                          <ChevronRight className="w-4 h-4 opacity-40" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-3.5 border-t border-[var(--border)] bg-[var(--surface-hover)] flex items-center gap-2 shrink-0">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[var(--surface)] hover:bg-[var(--error-bg)] border border-[var(--border)] text-[var(--error-text)] font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer active:scale-98"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              ) : (
                <a
                  href="/login"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)] font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer active:scale-98"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In to ExamplePOS
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MOBILE NATIVE BOTTOM TAB BAR ─── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)]/95 backdrop-blur-md border-t border-[var(--border)] px-3 pt-1.5 pb-2 flex items-center justify-around shadow-sm transition-colors"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0.5rem))' }}
      >
        {/* Tab 1: Dashboard */}
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
            pathname === '/'
              ? 'text-[var(--accent)] font-bold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
          }`}
        >
          <LayoutDashboard className={`w-4 h-4 ${pathname === '/' ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
          <span>Home</span>
        </Link>

        {/* Tab 2: Inventory */}
        <Link
          href="/inventory"
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-medium relative transition-colors ${
            pathname === '/inventory'
              ? 'text-[var(--accent)] font-bold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
          }`}
        >
          <Package className={`w-4 h-4 ${pathname === '/inventory' ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
          <span>Stock</span>
          {lowStockCount > 0 && (
            <span className="absolute top-0.5 right-2 w-2 h-2 rounded-full bg-[var(--accent)]" />
          )}
        </Link>

        {/* Tab 3: Center Highlighted POS Button */}
        <Link
          href="/pos"
          className={`px-4 py-1.5 rounded-xl flex items-center gap-1.5 font-bold text-xs shadow-xs active:scale-95 transition-all ${
            pathname === '/pos'
              ? 'bg-[var(--accent)] text-[var(--accent-text)] ring-2 ring-[var(--accent)]/30'
              : 'bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)]'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>POS</span>
        </Link>

        {/* Tab 4: Orders / Sales */}
        <Link
          href="/orders"
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
            pathname === '/orders'
              ? 'text-[var(--accent)] font-bold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
          }`}
        >
          <Receipt className={`w-4 h-4 ${pathname === '/orders' ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
          <span>Sales</span>
        </Link>

        {/* Tab 5: Menu / More */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
            mobileMenuOpen
              ? 'text-[var(--accent)] font-bold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
          }`}
        >
          <Menu className="w-4 h-4 text-[var(--text-muted)]" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
