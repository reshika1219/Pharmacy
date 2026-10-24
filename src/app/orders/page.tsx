'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Receipt, Search, Printer, ChevronRight } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setOrders(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.cashier.toLowerCase().includes(q) ||
      (o.customer?.name && o.customer.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors">
      <Navigation />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[var(--accent)]" />
              Order & Sales History
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Review completed receipts, cashier shifts, and reprint invoices.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search receipt #, cashier..."
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg py-1.5 pl-9 pr-3 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden shadow-xs">
          <div className="hidden md:block">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-hover)] border-b border-[var(--border)] text-[var(--text-secondary)] font-semibold">
                <tr>
                  <th className="py-3 px-4 font-semibold text-[var(--text)]">Receipt #</th>
                  <th className="py-3 px-4 font-semibold text-[var(--text)]">Date & Time</th>
                  <th className="py-3 px-4 font-semibold text-[var(--text)]">Customer</th>
                  <th className="py-3 px-4 font-semibold text-[var(--text)]">Cashier</th>
                  <th className="py-3 px-4 font-semibold text-[var(--text)]">Payment</th>
                  <th className="py-3 px-4 font-semibold text-[var(--text)]">Total</th>
                  <th className="py-3 px-4 text-right font-semibold text-[var(--text)]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text)]">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[var(--text-muted)]">
                      No sales records found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                      <td className="py-2.5 px-4 font-bold text-[var(--text)] font-mono">{ord.orderNumber}</td>
                      <td className="py-2.5 px-4 text-[var(--text-secondary)]">{ord.date} {ord.time}</td>
                      <td className="py-2.5 px-4">{ord.customer?.name || 'Walk-in'}</td>
                      <td className="py-2.5 px-4 text-[var(--text-secondary)] font-medium">{ord.cashier}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-secondary)]">
                          {ord.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-[var(--success-text)]">${ord.total.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="px-2.5 py-1 rounded-md bg-[var(--surface-hover)] hover:bg-[var(--border)] border border-[var(--border)] text-[11px] font-semibold text-[var(--text)] flex items-center gap-1.5 ml-auto transition-colors cursor-pointer"
                        >
                          <Printer className="w-3 h-3" />
                          Receipt
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile view */}
          <div className="md:hidden divide-y divide-[var(--border)]">
            {filteredOrders.map((ord) => (
              <div
                key={ord.id}
                onClick={() => setSelectedOrder(ord)}
                className="p-3.5 flex items-center justify-between text-xs active:bg-[var(--surface-hover)] cursor-pointer"
              >
                <div>
                  <div className="font-bold text-[var(--text)]">{ord.orderNumber}</div>
                  <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                    {ord.date} • {ord.paymentMethod} • {ord.cashier}
                  </div>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div className="font-bold text-[var(--success-text)] text-sm">${ord.total.toFixed(2)}</div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Receipt Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 w-full max-w-sm shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <span className="font-bold text-[var(--text)] text-xs">Receipt #{selectedOrder.orderNumber}</span>
                <button onClick={() => setSelectedOrder(null)} className="text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer">✕</button>
              </div>

              <div id="thermal-receipt" className="bg-white text-black p-4 rounded-lg text-left font-mono text-[11px] leading-tight space-y-2 border border-gray-200">
                <div className="text-center border-b border-dashed border-gray-400 pb-2">
                  <div className="font-bold text-sm uppercase">ExamplePOS Store</div>
                  <div className="text-[10px] text-gray-500">Order #{selectedOrder.orderNumber}</div>
                  <div className="text-[10px] text-gray-500">{selectedOrder.date} {selectedOrder.time}</div>
                </div>

                <div className="divide-y divide-gray-200 py-1">
                  {selectedOrder.items?.map((it: any) => (
                    <div key={it.id} className="py-1 flex justify-between">
                      <div>
                        <div>{it.product?.name || 'Item'}</div>
                        <div className="text-[9px] text-gray-500">{it.qty} x ${it.unitPrice.toFixed(2)}</div>
                      </div>
                      <div className="font-bold">${it.lineTotal.toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed border-gray-400 pt-2 space-y-1 text-right text-xs">
                  <div>Subtotal: ${(selectedOrder.subtotal || 0).toFixed(2)}</div>
                  <div>Tax: ${(selectedOrder.taxAmount || 0).toFixed(2)}</div>
                  <div className="font-bold text-sm pt-1 border-t border-gray-300">
                    TOTAL: ${(selectedOrder.total || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)] font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Receipt
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] text-xs font-medium cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
