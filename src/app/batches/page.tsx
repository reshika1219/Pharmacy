'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { Boxes, Plus } from 'lucide-react';

export default function BatchesPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [productId, setProductId] = useState('');
  const [batchRef, setBatchRef] = useState('');
  const [qty, setQty] = useState('100');
  const [costPrice, setCostPrice] = useState('0.00');
  const [sellPrice, setSellPrice] = useState('0.00');
  const [supplier, setSupplier] = useState('');

  const loadData = () => {
    fetch('/api/batches')
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setBatches(d));
    fetch('/api/products')
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setProducts(d));
    fetch('/api/suppliers')
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setSuppliers(d));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        batchRef,
        qtyReceived: qty,
        costPrice,
        sellPrice,
        supplier,
      }),
    });
    if (res.ok) {
      setShowModal(false);
      loadData();
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navigation />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-2">
              <Boxes className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Stock Intake & Batches
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Track incoming shipments, batch references, supplier sources, and cost vs. sell prices.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="hidden sm:block">
              <ThemeToggle showLabel />
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Receive Batch
            </button>
          </div>
        </div>

        {/* Batches Table */}
        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xs">
          <div className="hidden md:block">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Batch Ref</th>
                  <th className="py-2.5 px-4">Product</th>
                  <th className="py-2.5 px-4">Date Added</th>
                  <th className="py-2.5 px-4">Supplier</th>
                  <th className="py-2.5 px-4">Cost / Sell</th>
                  <th className="py-2.5 px-4 text-right">Remaining Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-750 text-gray-700 dark:text-gray-200">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-semibold text-gray-900 dark:text-gray-100">{b.batchRef || 'N/A'}</td>
                    <td className="py-2.5 px-4 font-medium text-gray-900 dark:text-gray-100">{b.product?.name}</td>
                    <td className="py-2.5 px-4 text-gray-500 dark:text-gray-400">{b.dateAdded || 'N/A'}</td>
                    <td className="py-2.5 px-4 text-gray-600 dark:text-gray-300">{b.supplier || 'Direct'}</td>
                    <td className="py-2.5 px-4">
                      <span className="text-gray-500">${b.costPrice.toFixed(2)}</span> /{' '}
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">${b.sellPrice.toFixed(2)}</span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-gray-900 dark:text-gray-100">
                      <span className="px-2 py-0.5 rounded-md text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {b.qtyRemaining} / {b.qtyReceived} pcs
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700/60">
            {batches.map((b) => (
              <div key={b.id} className="p-3.5 space-y-1 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{b.product?.name}</span>
                    <div className="text-[10px] font-mono text-blue-600 dark:text-blue-400">Batch: {b.batchRef || 'N/A'}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold">
                    {b.qtyRemaining} pcs left
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 flex justify-between pt-1">
                  <span>Supplier: {b.supplier || 'Direct'}</span>
                  <span>Sell: ${b.sellPrice.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal: Receive Stock */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 w-full max-w-md shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Receive Shipment Batch</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
              </div>

              <form onSubmit={handleAddBatch} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Select Product *</label>
                  <select
                    required
                    value={productId}
                    onChange={(e) => {
                      setProductId(e.target.value);
                      const prod = products.find((p) => p.id.toString() === e.target.value);
                      if (prod) {
                        setCostPrice(prod.costPrice.toString());
                        setSellPrice(prod.sellPrice.toString());
                      }
                    }}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-600"
                  >
                    <option value="">Select item...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Qty Received *</label>
                    <input
                      type="number"
                      required
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-gray-900 dark:text-gray-100 font-bold focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Batch Reference #</label>
                    <input
                      type="text"
                      value={batchRef}
                      onChange={(e) => setBatchRef(e.target.value)}
                      placeholder="e.g. B-2026-09"
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Cost Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Sell Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={sellPrice}
                      onChange={(e) => setSellPrice(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-gray-900 dark:text-gray-100 font-bold focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Supplier</label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="e.g. Acme Wholesale Ltd"
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
                  >
                    Confirm Stock
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
