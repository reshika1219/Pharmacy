'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { Package, Search, Plus } from 'lucide-react';

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Add product form
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [minStock, setMinStock] = useState('50');
  const [costPrice, setCostPrice] = useState('0.00');
  const [sellPrice, setSellPrice] = useState('0.00');
  const [initialQty, setInitialQty] = useState('100');

  const loadProducts = () => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setProducts(d));
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setCategories(d));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        sku,
        categoryId,
        unit,
        minStock,
        costPrice,
        sellPrice,
        initialQty,
      }),
    });
    if (res.ok) {
      setShowAddModal(false);
      setName('');
      setSku('');
      loadProducts();
    }
  };

  const filtered = products.filter((p) => {
    const matchesCat = selectedCat === 'all' || p.category?.id?.toString() === selectedCat;
    const q = search.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Navigation />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Inventory & Products
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Manage product catalog, SKU references, stock alert levels, and pricing.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="hidden sm:block">
              <ThemeToggle showLabel />
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Product
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, SKU, or barcode..."
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Product Cards (30% Surface Layer) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {p.category?.name || 'General'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                      p.stockStatus === 'out_of_stock'
                        ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900'
                        : p.stockStatus === 'low_stock'
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                    }`}
                  >
                    {p.totalStock} {p.unit}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-2 leading-snug">{p.name}</h3>
                <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-1">
                  SKU: {p.sku || 'N/A'} • Alert under: {p.minStock} {p.unit}
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Price: </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">${p.sellPrice.toFixed(2)}</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Cost: ${p.costPrice.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal: Add Product */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 w-full max-w-md shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Add Product</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
              </div>

              <form onSubmit={handleCreate} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ibuprofen 400mg"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">SKU</label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="IBU-400"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                    >
                      <option value="">Select category...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Initial Qty</label>
                    <input
                      type="number"
                      value={initialQty}
                      onChange={(e) => setInitialQty(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Cost Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Sell Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={sellPrice}
                      onChange={(e) => setSellPrice(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
                  >
                    Save Item
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
