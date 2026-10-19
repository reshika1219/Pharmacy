'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Boxes, Plus, Search, Calendar, Truck, AlertCircle } from 'lucide-react';

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
    <div className="flex-1 flex flex-col lg:flex-row min-h-screen">
      <Navigation />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Boxes className="w-5 h-5 text-indigo-400" />
              Stock Intake & Batches
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Track received shipments, batch expiry, supplier sources, and remaining stock lots.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Receive Stock Batch
          </button>
        </div>

        {/* Batches Table */}
        <div className="rounded-2xl bg-[#0f172a] border border-white/10 overflow-hidden shadow-xl">
          <div className="hidden md:block">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Batch Ref</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Received Date</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Cost / Sell</th>
                  <th className="py-3 px-4 text-right">Remaining Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white">{b.batchRef || 'N/A'}</td>
                    <td className="py-3 px-4 font-semibold text-white">{b.product?.name}</td>
                    <td className="py-3 px-4 text-slate-400">{b.dateAdded || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-300">{b.supplier || 'Direct'}</td>
                    <td className="py-3 px-4">
                      <span className="text-slate-400">${b.costPrice.toFixed(2)}</span> /{' '}
                      <span className="text-emerald-400 font-bold">${b.sellPrice.toFixed(2)}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-white">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10">
                        {b.qtyRemaining} / {b.qtyReceived} pcs
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden divide-y divide-white/5">
            {batches.map((b) => (
              <div key={b.id} className="p-3.5 space-y-1 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-white">{b.product?.name}</span>
                    <div className="text-[10px] font-mono text-indigo-400">Batch: {b.batchRef || 'N/A'}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-300 font-bold">
                    {b.qtyRemaining} pcs left
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 flex justify-between pt-1">
                  <span>Supplier: {b.supplier || 'Direct'}</span>
                  <span>Sell: ${b.sellPrice.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal: Receive Stock */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-white/15 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-bold text-white text-base">Receive New Stock Shipment</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleAddBatch} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Select Product *</label>
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
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white"
                  >
                    <option value="">Select item...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Qty Received *</label>
                    <input
                      type="number"
                      required
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Batch Reference #</label>
                    <input
                      type="text"
                      value={batchRef}
                      onChange={(e) => setBatchRef(e.target.value)}
                      placeholder="e.g. B-2026-09"
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Cost Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Sell Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={sellPrice}
                      onChange={(e) => setSellPrice(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white font-bold text-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Supplier</label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="e.g. Apex Medical Labs"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
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
