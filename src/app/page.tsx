'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import {
  DollarSign,
  Package,
  AlertTriangle,
  TrendingUp,
  Boxes,
  Plus,
  Search,
  RefreshCw,
  Clock,
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

      if (dashRes.status === 401 || prodRes.status === 401) {
        window.location.href = '/login';
        return;
      }

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
    <div className="flex-1 flex flex-col lg:flex-row min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors">
      <Navigation />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-12">
        {/* Header with Top-Right Mode Toggle & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight">
                Dashboard Overview
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border)]">
                Live
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Real-time sales, inventory valuation, and stock alerts.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => loadData()}
              className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer active:scale-95 hover:bg-[var(--surface-hover)]"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowAddProduct(true)}
              className="px-3.5 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)] text-xs font-semibold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* ─── METRIC CARDS ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {/* Card 1: Today's Sales */}
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
            <div className="flex items-center justify-between text-[var(--text-secondary)] mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Today's Sales</span>
              <DollarSign className="w-4 h-4 text-[var(--accent)]" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight">
              ${(kpis?.salesToday || 0).toFixed(2)}
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-1 flex items-center gap-1.5">
              <span className="text-[var(--success-text)] font-semibold">{kpis?.ordersTodayCount || 0} orders</span>
              <span>•</span>
              <span>{kpis?.itemsSoldToday || 0} items</span>
            </div>
          </div>

          {/* Card 2: Net Profit Today */}
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
            <div className="flex items-center justify-between text-[var(--text-secondary)] mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Net Profit</span>
              <TrendingUp className="w-4 h-4 text-[var(--success-text)]" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[var(--success-text)] tracking-tight">
              ${(kpis?.netProfitToday || 0).toFixed(2)}
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-1">
              Expenses: <span className="text-[var(--error-text)] font-medium">${(kpis?.expensesToday || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Card 3: Inventory Value */}
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
            <div className="flex items-center justify-between text-[var(--text-secondary)] mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Inventory Value</span>
              <Boxes className="w-4 h-4 text-[var(--text-muted)]" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight">
              ${(kpis?.totalInventoryValue || 0).toFixed(2)}
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-1 flex items-center gap-1.5">
              <span>{kpis?.totalInventoryUnits || 0} units</span>
              <span>•</span>
              <span>{kpis?.totalProducts || 0} items</span>
            </div>
          </div>

          {/* Card 4: Low Stock Alerts */}
          <div
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`p-4 rounded-xl border shadow-sm cursor-pointer transition-colors ${
              filterLowStock
                ? 'bg-[var(--warning-bg)] border-[var(--border)]'
                : 'bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Stock Alerts
              </span>
              <AlertTriangle className="w-4 h-4 text-[var(--warning-text)]" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[var(--warning-text)] tracking-tight">
              {(kpis?.lowStockCount || 0) + (kpis?.outOfStockCount || 0)}
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-1 flex items-center justify-between">
              <span>{kpis?.outOfStockCount || 0} out of stock</span>
              <span className="text-[var(--accent)] text-[10px] font-semibold underline">
                {filterLowStock ? 'Show All' : 'Filter'}
              </span>
            </div>
          </div>
        </div>

        {/* ─── INVENTORY SECTION ─── */}
        <section id="inventory" className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <h2 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
              <Package className="w-4 h-4 text-[var(--accent)]" />
              Inventory Catalog ({products.length})
            </h2>

            {/* Search & Category Filter */}
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search title, SKU, barcode..."
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg py-1.5 pl-9 pr-3 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-lg py-1.5 px-2.5 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
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

          {/* Desktop Table View */}
          <div className="hidden md:block rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-hover)] border-b border-[var(--border)] text-[var(--text-secondary)] font-semibold">
                <tr>
                  <th className="py-3 px-4 font-semibold text-[var(--text)]">Item & SKU</th>
                  <th className="py-3 px-4 font-semibold text-[var(--text)]">Category</th>
                  <th className="py-3 px-4 font-semibold text-[var(--text)]">Stock Level</th>
                  <th className="py-3 px-4 font-semibold text-[var(--text)]">Sell Price</th>
                  <th className="py-3 px-4 font-semibold text-[var(--text)]">Cost Price</th>
                  <th className="py-3 px-4 text-right font-semibold text-[var(--text)]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text)]">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[var(--text-muted)]">
                      No matching items found.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                      <td className="py-2.5 px-4 font-medium text-[var(--text)]">
                        <div>{p.name}</div>
                        <div className="text-[10px] text-[var(--text-muted)] font-mono">
                          {p.sku} {p.barcode ? `• ${p.barcode}` : ''}
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border)]">
                          {p.category?.name || 'General'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border border-transparent ${
                              p.stockStatus === 'out_of_stock'
                                ? 'bg-[var(--error-bg)] text-[var(--error-text)]'
                                : p.stockStatus === 'low_stock'
                                ? 'bg-[var(--warning-bg)] text-[var(--warning-text)]'
                                : 'bg-[var(--success-bg)] text-[var(--success-text)]'
                            }`}
                          >
                            {p.totalStock} {p.unit}
                          </span>
                          {p.stockStatus !== 'in_stock' && (
                            <span className="text-[10px] text-[var(--text-muted)]">(min: {p.minStock})</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-[var(--text)]">
                        ${p.sellPrice.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-[var(--text-secondary)]">
                        ${p.costPrice.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedProductForIntake(p.id);
                            setIntakeSell(p.sellPrice.toString());
                            setIntakeCost(p.costPrice.toString());
                            setShowStockIntake(true);
                          }}
                          className="px-2.5 py-1 rounded-md bg-[var(--surface-hover)] hover:bg-[var(--border)] text-[var(--text)] text-[11px] font-semibold transition-colors cursor-pointer border border-[var(--border)]"
                        >
                          + Intake
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden space-y-2">
            {products.length === 0 ? (
              <div className="p-8 text-center text-[var(--text-muted)] bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                No matching items found.
              </div>
            ) : (
              products.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-[var(--text)] text-sm leading-snug">
                        {p.name}
                      </h3>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                        {p.sku} {p.barcode ? `• ${p.barcode}` : ''}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                        p.stockStatus === 'out_of_stock'
                          ? 'bg-[var(--error-bg)] text-[var(--error-text)]'
                          : p.stockStatus === 'low_stock'
                          ? 'bg-[var(--warning-bg)] text-[var(--warning-text)]'
                          : 'bg-[var(--success-bg)] text-[var(--success-text)]'
                      }`}
                    >
                      {p.totalStock} {p.unit}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-xs">
                    <div>
                      <span className="text-[11px] text-[var(--text-secondary)]">Price: </span>
                      <span className="font-bold text-[var(--text)]">${p.sellPrice.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedProductForIntake(p.id);
                        setIntakeSell(p.sellPrice.toString());
                        setIntakeCost(p.costPrice.toString());
                        setShowStockIntake(true);
                      }}
                      className="px-2.5 py-1 rounded-md bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] text-xs font-semibold active:scale-95 transition-transform cursor-pointer"
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
        <section className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--accent)]" />
              Recent Completed Sales
            </h2>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {recentOrders.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-3 text-center">No transactions recorded yet.</p>
            ) : (
              recentOrders.map((ord) => (
                <div key={ord.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-[var(--text)]">{ord.orderNumber}</span>
                    <span className="text-[var(--text-secondary)] ml-2">({ord.customerName})</span>
                    <div className="text-[10px] text-[var(--text-muted)]">
                      {ord.date} {ord.time} • Cashier: {ord.cashier} • {ord.paymentMethod}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[var(--success-text)] text-sm">
                      ${ord.total.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">{ord.itemsCount} item(s)</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ─── MODAL: ADD PRODUCT ─── */}
        {showAddProduct && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 w-full max-w-lg shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <h3 className="font-bold text-[var(--text)] text-sm">Add Item to Inventory</h3>
                <button onClick={() => setShowAddProduct(false)} className="text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">Item Title *</label>
                  <input
                    type="text"
                    required
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="e.g. Organic Coffee Beans 500g"
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-[var(--text-secondary)] mb-1">SKU / Code</label>
                    <input
                      type="text"
                      value={newProdSku}
                      onChange={(e) => setNewProdSku(e.target.value)}
                      placeholder="e.g. COF-500"
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--text-secondary)] mb-1">Category</label>
                    <select
                      value={newProdCategory}
                      onChange={(e) => setNewProdCategory(e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
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
                    <label className="block font-semibold text-[var(--text-secondary)] mb-1">Unit</label>
                    <input
                      type="text"
                      value={newProdUnit}
                      onChange={(e) => setNewProdUnit(e.target.value)}
                      placeholder="pcs, box, kg, liters..."
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--text-secondary)] mb-1">Low Stock Alert Level</label>
                    <input
                      type="number"
                      value={newProdMinStock}
                      onChange={(e) => setNewProdMinStock(e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold text-[var(--text-secondary)] mb-1">Initial Qty</label>
                    <input
                      type="number"
                      value={newProdInitialQty}
                      onChange={(e) => setNewProdInitialQty(e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] font-bold focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--text-secondary)] mb-1">Cost Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProdCostPrice}
                      onChange={(e) => setNewProdCostPrice(e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--text-secondary)] mb-1">Selling Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProdSellPrice}
                      onChange={(e) => setNewProdSellPrice(e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] font-bold focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddProduct(false)}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)] font-semibold text-xs shadow-xs cursor-pointer"
                  >
                    Save Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── MODAL: STOCK INTAKE ─── */}
        {showStockIntake && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 w-full max-w-md shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <h3 className="font-bold text-[var(--text)] text-sm">Intake Shipment Batch</h3>
                <button onClick={() => setShowStockIntake(false)} className="text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleStockIntake} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">Quantity Received *</label>
                  <input
                    type="number"
                    required
                    value={intakeQty}
                    onChange={(e) => setIntakeQty(e.target.value)}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] text-sm font-bold focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-[var(--text-secondary)] mb-1">Cost Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={intakeCost}
                      onChange={(e) => setIntakeCost(e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--text-secondary)] mb-1">Sell Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={intakeSell}
                      onChange={(e) => setIntakeSell(e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] font-bold focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">Supplier / Vendor</label>
                  <input
                    type="text"
                    value={intakeSupplier}
                    onChange={(e) => setIntakeSupplier(e.target.value)}
                    placeholder="e.g. Apex Wholesale Distributors"
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">Batch Reference #</label>
                  <input
                    type="text"
                    value={intakeBatchRef}
                    onChange={(e) => setIntakeBatchRef(e.target.value)}
                    placeholder="e.g. LOT-2026-X1"
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowStockIntake(false)}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)] font-semibold text-xs shadow-xs cursor-pointer"
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
