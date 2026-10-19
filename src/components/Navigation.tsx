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
    { label: 'Operations & KPI', href: '/', icon: LayoutDashboard },
    { label: 'POS Terminal', href: '/pos', icon: ShoppingCart, highlight: true },
    { label: 'Inventory Catalog', href: '/inventory', icon: Package, badge: lowStockCount > 0 ? lowStockCount : undefined },
    { label: 'Stock Intake & Batches', href: '/batches', icon: Boxes },
    { label: 'Orders & Receipts', href: '/orders', icon: Receipt },
    { label: 'Customers (CRM)', href: '/customers', icon: Users },
    { label: 'Expenses', href: '/expenses', icon: Wallet },
    { label: 'Store Settings', href: '/settings', icon: Settings, adminOnly: true },
  ];

  const filteredNav = navItems.filter((item) => {
    if (item.adminOnly && user?.role !== 'admin') return false;
    return true;
  });

  return (
    <>
      {/* ─── DESKTOP SIDEBAR (30% Structural Layer) ─── */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-screen sticky top-0 z-40 transition-colors">
        {/* Brand & Theme Toggle */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 dark:bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-tight leading-none">
                ExamplePOS
              </h1>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Store Operations</span>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
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
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800/60'
                    : item.highlight
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : item.highlight
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center gap-2 truncate">
              <div className="w-7 h-7 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs uppercase">
                {user?.username?.substring(0, 2) || 'ST'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {user?.fullName || user?.username || 'Staff'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  {user?.role || 'Staff'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── MOBILE TOP BAR ─── */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white">
            <Store className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-tight leading-none block">
              ExamplePOS
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Mobile Store</span>
          </div>
        </div>

        {/* Top-Right Controls: Theme Toggle, Quick POS, and Drawer */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Link
            href="/pos"
            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1 active:scale-95 transition-transform shadow-xs"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            POS
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ─── MOBILE DRAWER MENU ─── */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-2xl max-h-[85vh] overflow-y-auto p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {user?.fullName || user?.username || 'Staff'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">{user?.role} Account</p>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
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
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold">
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
              className="w-full py-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* ─── MOBILE BOTTOM BAR (Touch-Friendly) ─── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-t border-slate-200 dark:border-slate-800 px-3 py-1.5 flex items-center justify-around shadow-xs">
        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-medium ${
            pathname === '/' ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </Link>
        <Link
          href="/inventory"
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-medium relative ${
            pathname === '/inventory' ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-500 dark:text-slate-400'
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
            pathname === '/orders' ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Orders
        </Link>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-medium text-slate-500 dark:text-slate-400"
        >
          <Menu className="w-4 h-4" />
          More
        </button>
      </div>
    </>
  );
}
