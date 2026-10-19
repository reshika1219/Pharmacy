'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Package, Search, Plus, Boxes, AlertTriangle, ShieldCheck, Tag } from 'lucide-react';

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
    <div className="flex-1 flex flex-col lg:flex-row min-h-screen">
      <Navigation />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-400" />
              Inventory & Products Catalog
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Manage product listings, SKU references, low-stock alert thresholds, and pricing.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 active:scale-95 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2.5 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, SKU, or barcode..."
              className="w-full bg-[#0f172a] border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="bg-[#0f172a] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Product Cards / Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-2xl bg-[#0f172a] border border-white/10 shadow-lg space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 border border-white/10 text-indigo-300">
                    {p.category?.name || 'General'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.stockStatus === 'out_of_stock'
                        ? 'bg-rose-500/20 text-rose-300'
                        : p.stockStatus === 'low_stock'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/15 text-emerald-300'
                    }`}
                  >
                    {p.totalStock} {p.unit}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mt-2 leading-snug">{p.name}</h3>
                <div className="text-[10px] font-mono text-slate-400 mt-1">
                  SKU: {p.sku || 'N/A'} • Alert under: {p.minStock} {p.unit}
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400">Sell Price: </span>
                  <span className="font-extrabold text-white">${p.sellPrice.toFixed(2)}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Cost: ${p.costPrice.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal: Add Product */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-white/15 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-bold text-white text-base">Add Product to Inventory</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleCreate} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ibuprofen 400mg"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">SKU</label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="IBU-400"
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Category</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white"
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
                    <label className="block font-semibold text-slate-300 mb-1">Initial Qty</label>
                    <input
                      type="number"
                      value={initialQty}
                      onChange={(e) => setInitialQty(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Cost Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Sell Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={sellPrice}
                      onChange={(e) => setSellPrice(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-white font-bold text-emerald-400"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
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
