'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
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
    <div className="flex-1 flex flex-col lg:flex-row min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors">
      <Navigation />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight flex items-center gap-2">
              <Package className="w-5 h-5 text-[var(--accent)]" />
              Inventory & Products
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Manage product catalog, SKU references, stock alert levels, and pricing.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)] font-semibold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Product
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, SKU, or barcode..."
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg py-1.5 pl-9 pr-3 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-lg py-1.5 px-3 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Product Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border)]">
                    {p.category?.name || 'General'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                      p.stockStatus === 'out_of_stock'
                        ? 'bg-[var(--error-bg)] text-[var(--error-text)] border border-[var(--border)]'
                        : p.stockStatus === 'low_stock'
                        ? 'bg-[var(--warning-bg)] text-[var(--warning-text)] border border-[var(--border)]'
                        : 'bg-[var(--success-bg)] text-[var(--success-text)] border border-[var(--border)]'
                    }`}
                  >
                    {p.totalStock} {p.unit}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-[var(--text)] mt-2 leading-snug">{p.name}</h3>
                <div className="text-[10px] font-mono text-[var(--text-muted)] mt-1">
                  SKU: {p.sku || 'N/A'} • Alert under: {p.minStock} {p.unit}
                </div>
              </div>

              <div className="pt-2.5 border-t border-[var(--border)] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-[var(--text-secondary)]">Price: </span>
                  <span className="font-bold text-[var(--text)]">${p.sellPrice.toFixed(2)}</span>
                </div>
                <div className="text-[11px] text-[var(--text-secondary)]">
                  Cost: ${p.costPrice.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal: Add Product */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 w-full max-w-md shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <h3 className="font-bold text-[var(--text)] text-sm">Add Product</h3>
                <button onClick={() => setShowAddModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleCreate} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Standard Item Name"
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-[var(--text-secondary)] mb-1">SKU</label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="SKU-100"
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--text-secondary)] mb-1">Category</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
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
                    <label className="block font-semibold text-[var(--text-secondary)] mb-1">Initial Qty</label>
                    <input
                      type="number"
                      value={initialQty}
                      onChange={(e) => setInitialQty(e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] font-bold focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--text-secondary)] mb-1">Cost Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--text-secondary)] mb-1">Sell Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={sellPrice}
                      onChange={(e) => setSellPrice(e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] font-bold focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
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
      </main>
    </div>
  );
}
