'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import ThemeToggle from '@/components/ThemeToggle';
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
    <div className="flex-1 flex flex-col lg:flex-row min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navigation />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Order & Sales History
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Review completed receipts, cashier shifts, and reprint invoices.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="hidden sm:block">
              <ThemeToggle showLabel />
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search receipt #, cashier..."
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-1.5 pl-9 pr-3 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xs">
          <div className="hidden md:block">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Receipt #</th>
                  <th className="py-2.5 px-4">Date & Time</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Cashier</th>
                  <th className="py-2.5 px-4">Payment</th>
                  <th className="py-2.5 px-4">Total</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-750 text-gray-700 dark:text-gray-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      No sales records found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-gray-900 dark:text-gray-100 font-mono">{ord.orderNumber}</td>
                      <td className="py-2.5 px-4 text-gray-500 dark:text-gray-400">{ord.date} {ord.time}</td>
                      <td className="py-2.5 px-4">{ord.customer?.name || 'Walk-in'}</td>
                      <td className="py-2.5 px-4 text-gray-700 dark:text-gray-300 font-medium">{ord.cashier}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {ord.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">${ord.total.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-[11px] font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5 ml-auto transition-colors"
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
          <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700/60">
            {filteredOrders.map((ord) => (
              <div
                key={ord.id}
                onClick={() => setSelectedOrder(ord)}
                className="p-3.5 flex items-center justify-between text-xs active:bg-gray-50 dark:active:bg-gray-700/50 cursor-pointer"
              >
                <div>
                  <div className="font-bold text-gray-900 dark:text-gray-100">{ord.orderNumber}</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {ord.date} • {ord.paymentMethod} • {ord.cashier}
                  </div>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">${ord.total.toFixed(2)}</div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Receipt Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 w-full max-w-sm shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                <span className="font-bold text-gray-900 dark:text-gray-100 text-xs">Receipt #{selectedOrder.orderNumber}</span>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
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
                  className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Receipt
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-medium"
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
