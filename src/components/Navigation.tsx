'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
    // Fetch session
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

    // Fetch dashboard low stock badge
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
      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-white/10 bg-[#0d1322]/90 backdrop-blur-xl h-screen sticky top-0 z-40">
        {/* Brand */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white tracking-tight leading-tight text-base">PharmaCare</h1>
              <p className="text-xs text-indigo-400 font-medium">NexusPOS Cloud</p>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="System Online" />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Store Management
          </div>
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                    : item.highlight
                    ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-indigo-400' : item.highlight ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-white/10 bg-black/20">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs uppercase">
                {user?.username?.substring(0, 2) || 'US'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{user?.fullName || user?.username || 'Staff'}</p>
                <p className="text-[10px] text-indigo-400 capitalize flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {user?.role || 'User'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── MOBILE TOP BAR ─── */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#0d1322]/95 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md">
            <Store className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-sm tracking-tight">PharmaCare</span>
            <span className="text-[10px] block text-indigo-400 font-medium">NexusPOS Mobile</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/pos"
            className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            POS
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white rounded-lg bg-white/5 border border-white/10"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ─── MOBILE DRAWER MENU ─── */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-fade-in flex flex-col justify-end">
          <div className="bg-[#0f172a] border-t border-white/15 rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <p className="font-bold text-white text-base">{user?.fullName || user?.username || 'Staff'}</p>
                <p className="text-xs text-indigo-400 capitalize">{user?.role} Account</p>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-full bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              {filteredNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'bg-white/5 text-slate-200 active:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                        {item.badge}
                      </span>
                    ) : (
                      <ChevronRight className="w-4 h-4 opacity-40" />
                    )}
                  </Link>
                );
              })}
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 font-semibold text-sm flex items-center justify-center gap-2 active:bg-rose-500/25 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* ─── MOBILE BOTTOM BAR (Touch-Friendly Thumb Access) ─── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d1322]/95 backdrop-blur-lg border-t border-white/10 px-3 py-2 flex items-center justify-around">
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium ${
            pathname === '/' ? 'text-indigo-400' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </Link>
        <Link
          href="/inventory"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium relative ${
            pathname === '/inventory' ? 'text-indigo-400' : 'text-slate-400'
          }`}
        >
          <Package className="w-5 h-5" />
          Inventory
          {lowStockCount > 0 && (
            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-amber-400" />
          )}
        </Link>
        <Link
          href="/pos"
          className="flex flex-col items-center gap-1 -mt-5 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white p-2.5 rounded-2xl shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-[10px] font-bold">POS</span>
        </Link>
        <Link
          href="/orders"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium ${
            pathname === '/orders' ? 'text-indigo-400' : 'text-slate-400'
          }`}
        >
          <Receipt className="w-5 h-5" />
          Orders
        </Link>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium text-slate-400"
        >
          <Menu className="w-5 h-5" />
          More
        </button>
      </div>
    </>
  );
}
