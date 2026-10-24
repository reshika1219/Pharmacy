'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
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
    <div className="flex-1 flex flex-col lg:flex-row min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors">
      <Navigation />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight flex items-center gap-2">
              <Boxes className="w-5 h-5 text-[var(--accent)]" />
              Stock Intake & Batches
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Track incoming shipments, batch references, supplier sources, and cost vs. sell prices.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setShowModal(true)}
              className="px-3.5 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)] font-semibold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Receive Batch
            </button>
          </div>
        </div>

        {/* Batches Table */}
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden shadow-xs">
          <div className="hidden md:block">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-hover)] border-b border-[var(--border)] text-[var(--text-secondary)] font-semibold">
                <tr>
                  <th className="py-3 px-4 font-semibold text-[var(--text)]">Batch Ref</th>
                  <th className="py-3 px-4 font-semibold text-[var(--text)]">Product</th>
                  <th className="py-3 px-4 font-semibold text-[var(--text)]">Date Added</th>
                  <th className="py-3 px-4 font-semibold text-[var(--text)]">Supplier</th>
                  <th className="py-3 px-4 font-semibold text-[var(--text)]">Cost / Sell</th>
                  <th className="py-3 px-4 text-right font-semibold text-[var(--text)]">Remaining Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text)]">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                    <td className="py-2.5 px-4 font-mono font-semibold text-[var(--text)]">{b.batchRef || 'N/A'}</td>
                    <td className="py-2.5 px-4 font-medium text-[var(--text)]">{b.product?.name}</td>
                    <td className="py-2.5 px-4 text-[var(--text-secondary)]">{b.dateAdded || 'N/A'}</td>
                    <td className="py-2.5 px-4 text-[var(--text-secondary)]">{b.supplier || 'Direct'}</td>
                    <td className="py-2.5 px-4">
                      <span className="text-[var(--text-muted)]">${b.costPrice.toFixed(2)}</span> /{' '}
                      <span className="text-[var(--success-text)] font-bold">${b.sellPrice.toFixed(2)}</span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-[var(--text)]">
                      <span className="px-2 py-0.5 rounded-md text-[10px] bg-[var(--surface-hover)] text-[var(--text)] border border-[var(--border)]">
                        {b.qtyRemaining} / {b.qtyReceived} pcs
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden divide-y divide-[var(--border)]">
            {batches.map((b) => (
              <div key={b.id} className="p-3.5 space-y-1 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold text-[var(--text)]">{b.product?.name}</span>
                    <div className="text-[10px] font-mono text-[var(--accent)]">Batch: {b.batchRef || 'N/A'}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] bg-[var(--success-bg)] text-[var(--success-text)] border border-[var(--border)] font-bold">
                    {b.qtyRemaining} pcs left
                  </span>
                </div>
                <div className="text-[10px] text-[var(--text-secondary)] flex justify-between pt-1">
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
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 w-full max-w-md shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <h3 className="font-bold text-[var(--text)] text-sm">Receive Shipment Batch</h3>
                <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleAddBatch} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">Select Product *</label>
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
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="">Select item...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-[var(--text-secondary)] mb-1">Qty Received *</label>
                    <input
                      type="number"
                      required
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] font-bold focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--text-secondary)] mb-1">Batch Reference #</label>
                    <input
                      type="text"
                      value={batchRef}
                      onChange={(e) => setBatchRef(e.target.value)}
                      placeholder="e.g. B-2026-09"
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
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

                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">Supplier</label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="e.g. Acme Wholesale Ltd"
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)] font-semibold text-xs shadow-xs cursor-pointer"
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
