'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import {
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  TrendingUp,
  Boxes,
  Plus,
  Search,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ShieldAlert,
  ChevronRight,
  Clock,
  Sparkles,
} from 'lucide-react';

interface KPIState {
  salesToday: number;
  ordersTodayCount: number;
  itemsSoldToday: number;
  expensesToday: number;
  netProfitToday: number;
  totalRevenueAllTime: number;
  allOrdersCount: number;
  totalProducts: number;
  totalInventoryUnits: number;
  totalInventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalCustomers: number;
}

interface ProductItem {
  id: number;
  name: string;
  sku: string;
  barcode: string | null;
  unit: string;
  minStock: number;
  totalStock: number;
  sellPrice: number;
  costPrice: number;
  stockStatus: 'out_of_stock' | 'low_stock' | 'in_stock';
  category: { id: number; name: string; color: string } | null;
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPIState | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterLowStock, setFilterLowStock] = useState(false);

  // Modals
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showStockIntake, setShowStockIntake] = useState(false);
  const [selectedProductForIntake, setSelectedProductForIntake] = useState<number | null>(null);

  // Form states
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newProdUnit, setNewProdUnit] = useState('pcs');
  const [newProdMinStock, setNewProdMinStock] = useState('50');
  const [newProdSellPrice, setNewProdSellPrice] = useState('0.00');
  const [newProdCostPrice, setNewProdCostPrice] = useState('0.00');
  const [newProdInitialQty, setNewProdInitialQty] = useState('100');

  // Intake Form
  const [intakeQty, setIntakeQty] = useState('50');
  const [intakeCost, setIntakeCost] = useState('0.00');
  const [intakeSell, setIntakeSell] = useState('0.00');
  const [intakeSupplier, setIntakeSupplier] = useState('');
  const [intakeBatchRef, setIntakeBatchRef] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [dashRes, prodRes, catRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch(`/api/products?search=${encodeURIComponent(search)}&categoryId=${selectedCategory}${filterLowStock ? '&lowStock=true' : ''}`),
        fetch('/api/categories'),
      ]);

      if (dashRes.ok) {
        const d = await dashRes.json();
        setKpis(d.kpis);
        setRecentOrders(d.recentOrders || []);
      }

      if (prodRes.ok) {
        const p = await prodRes.json();
        setProducts(p);
      }

      if (catRes.ok) {
        const c = await catRes.json();
        setCategories(c);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, filterLowStock]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProdName,
          sku: newProdSku,
          categoryId: newProdCategory,
          unit: newProdUnit,
          minStock: newProdMinStock,
          sellPrice: newProdSellPrice,
          costPrice: newProdCostPrice,
          initialQty: newProdInitialQty,
        }),
      });
      if (res.ok) {
        setShowAddProduct(false);
        setNewProdName('');
        setNewProdSku('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStockIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForIntake) return;
    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductForIntake,
          qtyReceived: intakeQty,
          costPrice: intakeCost,
          sellPrice: intakeSell,
          supplier: intakeSupplier,
          batchRef: intakeBatchRef,
        }),
      });
      if (res.ok) {
        setShowStockIntake(false);
        setSelectedProductForIntake(null);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-screen">
      <Navigation />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-12">
        {/* Header with real-time operations overview */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Operations Overview</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                Remote Live Feed
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Monitor inventory stock, daily revenue, and store operations from any phone or computer.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData()}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-colors active:scale-95"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => setShowAddProduct(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* ─── LIVE KPI METRICS GRID ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {/* Card 1: Today's Sales */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-900/40 via-[#0f172a] to-[#0f172a] border border-indigo-500/20 shadow-xl relative overflow-hidden group">
            <div className="flex items-center justify-between text-indigo-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Today's Sales</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-indigo-400" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
              ${(kpis?.salesToday || 0).toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="text-emerald-400 font-semibold">{kpis?.ordersTodayCount || 0} orders</span>
              <span>•</span>
              <span>{kpis?.itemsSoldToday || 0} items</span>
            </div>
          </div>

          {/* Card 2: Net Profit Today */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-900/30 via-[#0f172a] to-[#0f172a] border border-emerald-500/20 shadow-xl group">
            <div className="flex items-center justify-between text-emerald-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Net Profit</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
              ${(kpis?.netProfitToday || 0).toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Expenses: <span className="text-rose-400 font-medium">${(kpis?.expensesToday || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Card 3: Inventory Valuation */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-900/30 via-[#0f172a] to-[#0f172a] border border-violet-500/20 shadow-xl group">
            <div className="flex items-center justify-between text-violet-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Inventory Value</span>
              <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Boxes className="w-4 h-4 text-violet-400" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
              ${(kpis?.totalInventoryValue || 0).toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
              <span>{kpis?.totalInventoryUnits || 0} units</span>
              <span>•</span>
              <span>{kpis?.totalProducts || 0} products</span>
            </div>
          </div>

          {/* Card 4: Low Stock Warnings */}
          <div
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`p-4 rounded-2xl border shadow-xl cursor-pointer transition-all ${
              filterLowStock
                ? 'bg-amber-500/20 border-amber-400 shadow-amber-500/20'
                : 'bg-gradient-to-br from-amber-900/30 via-[#0f172a] to-[#0f172a] border-amber-500/20 hover:border-amber-400/50'
            }`}
          >
            <div className="flex items-center justify-between text-amber-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Stock Alerts</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight">
              {(kpis?.lowStockCount || 0) + (kpis?.outOfStockCount || 0)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>{kpis?.outOfStockCount || 0} out of stock</span>
              <span className="text-amber-400 text-[10px] underline font-medium">
                {filterLowStock ? 'Show All' : 'Filter Alerts'}
              </span>
            </div>
          </div>
        </div>

        {/* ─── INVENTORY OPERATIONS & CATALOG SECTION ─── */}
        <section id="inventory" className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-400" />
                Live Inventory Catalog ({products.length})
              </h2>
            </div>

            {/* Search & Category Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, SKU, barcode..."
                  className="w-full bg-[#0f172a] border border-white/10 rounded-xl py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#0f172a] border border-white/10 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ─── DESKTOP INVENTORY TABLE ─── */}
          <div className="hidden md:block rounded-2xl bg-[#0f172a]/90 border border-white/10 overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Item & SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Stock Level</th>
                  <th className="py-3 px-4">Sell Price</th>
                  <th className="py-3 px-4">Cost Price</th>
                  <th className="py-3 px-4 text-right">Intake / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No matching products found.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-medium text-white">
                        <div>{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {p.sku} {p.barcode ? `• ${p.barcode}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-slate-300 border border-white/10">
                          {p.category?.name || 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.stockStatus === 'out_of_stock'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : p.stockStatus === 'low_stock'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                            }`}
                          >
                            {p.totalStock} {p.unit}
                          </span>
                          {p.stockStatus !== 'in_stock' && (
                            <span className="text-[10px] text-slate-400">(min: {p.minStock})</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-white">${p.sellPrice.toFixed(2)}</td>
                      <td className="py-3 px-4 text-slate-400">${p.costPrice.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedProductForIntake(p.id);
                            setIntakeSell(p.sellPrice.toString());
                            setIntakeCost(p.costPrice.toString());
                            setShowStockIntake(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-[11px] font-semibold transition-colors"
                        >
                          + Intake Stock
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ─── MOBILE TOUCH CARDS (Phone View) ─── */}
          <div className="md:hidden space-y-2.5">
            {products.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-[#0f172a] rounded-2xl border border-white/10">
                No matching products found.
              </div>
            ) : (
              products.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl bg-[#0f172a] border border-white/10 shadow-md space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-white text-sm leading-snug">{p.name}</h3>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {p.sku} {p.barcode ? `• ${p.barcode}` : ''}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.stockStatus === 'out_of_stock'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : p.stockStatus === 'low_stock'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                      }`}
                    >
                      {p.totalStock} {p.unit}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400">Sell Price: </span>
                      <span className="font-bold text-white">${p.sellPrice.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedProductForIntake(p.id);
                        setIntakeSell(p.sellPrice.toString());
                        setIntakeCost(p.costPrice.toString());
                        setShowStockIntake(true);
                      }}
                      className="px-3 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold active:scale-95 transition-transform"
                    >
                      + Intake Stock
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ─── RECENT TRANSACTIONS STREAM ─── */}
        <section className="rounded-2xl bg-[#0f172a]/90 border border-white/10 p-4 sm:p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Recent Completed Sales
            </h2>
          </div>

          <div className="divide-y divide-white/5">
            {recentOrders.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No transactions recorded yet.</p>
            ) : (
              recentOrders.map((ord) => (
                <div key={ord.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">{ord.orderNumber}</span>
                    <span className="text-slate-400 ml-2">({ord.customerName})</span>
                    <div className="text-[10px] text-slate-500">
                      {ord.date} {ord.time} • Cashier: {ord.cashier} • {ord.paymentMethod}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-emerald-400 text-sm">${ord.total.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-400">{ord.itemsCount} item(s)</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ─── MODAL: ADD PRODUCT ─── */}
        {showAddProduct && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#0f172a] border border-white/15 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-bold text-white text-base">Add New Inventory Product</h3>
                <button onClick={() => setShowAddProduct(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="e.g. Amoxicillin 500mg"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">SKU / Code</label>
                    <input
                      type="text"
                      value={newProdSku}
                      onChange={(e) => setNewProdSku(e.target.value)}
                      placeholder="e.g. AMX-500"
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Category</label>
                    <select
                      value={newProdCategory}
                      onChange={(e) => setNewProdCategory(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white"
                    >
                      <option value="">Select category...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Unit</label>
                    <input
                      type="text"
                      value={newProdUnit}
                      onChange={(e) => setNewProdUnit(e.target.value)}
                      placeholder="pcs, box, roll..."
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Low Stock Alert Level</label>
                    <input
                      type="number"
                      value={newProdMinStock}
                      onChange={(e) => setNewProdMinStock(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Initial Qty</label>
                    <input
                      type="number"
                      value={newProdInitialQty}
                      onChange={(e) => setNewProdInitialQty(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Cost Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProdCostPrice}
                      onChange={(e) => setNewProdCostPrice(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Selling Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProdSellPrice}
                      onChange={(e) => setNewProdSellPrice(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddProduct(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                  >
                    Save Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── MODAL: STOCK INTAKE ─── */}
        {showStockIntake && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-white/15 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-bold text-white text-base">Intake New Shipment / Batch</h3>
                <button onClick={() => setShowStockIntake(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleStockIntake} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Quantity Received *</label>
                  <input
                    type="number"
                    required
                    value={intakeQty}
                    onChange={(e) => setIntakeQty(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white text-base font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Cost Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={intakeCost}
                      onChange={(e) => setIntakeCost(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Sell Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={intakeSell}
                      onChange={(e) => setIntakeSell(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Supplier / Vendor</label>
                  <input
                    type="text"
                    value={intakeSupplier}
                    onChange={(e) => setIntakeSupplier(e.target.value)}
                    placeholder="e.g. Global Pharma Logistics"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Batch Reference #</label>
                  <input
                    type="text"
                    value={intakeBatchRef}
                    onChange={(e) => setIntakeBatchRef(e.target.value)}
                    placeholder="e.g. BAT-2026-X1"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowStockIntake(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                  >
                    Add to Stock
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
