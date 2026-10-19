'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Receipt, Search, Printer, Calendar, User, CreditCard, ChevronRight } from 'lucide-react';

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
    <div className="flex-1 flex flex-col lg:flex-row min-h-screen">
      <Navigation />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-400" />
              Order & Sales History
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Review completed receipts, cashier shifts, and reprint invoices.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search receipt #, cashier..."
              className="w-full bg-[#0f172a] border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Orders Table & Mobile Cards */}
        <div className="bg-[#0f172a] rounded-2xl border border-white/10 overflow-hidden shadow-xl">
          <div className="hidden md:block">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Cashier</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No sales records found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-bold text-white font-mono">{ord.orderNumber}</td>
                      <td className="py-3 px-4 text-slate-400">{ord.date} {ord.time}</td>
                      <td className="py-3 px-4">{ord.customer?.name || 'Walk-in'}</td>
                      <td className="py-3 px-4 text-indigo-300 font-medium">{ord.cashier}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-slate-300">
                          {ord.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-black text-emerald-400">${ord.total.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-slate-300 flex items-center gap-1.5 ml-auto"
                        >
                          <Printer className="w-3 h-3" />
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile view */}
          <div className="md:hidden divide-y divide-white/5">
            {filteredOrders.map((ord) => (
              <div
                key={ord.id}
                onClick={() => setSelectedOrder(ord)}
                className="p-3.5 flex items-center justify-between text-xs active:bg-white/5 cursor-pointer"
              >
                <div>
                  <div className="font-bold text-white">{ord.orderNumber}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {ord.date} • {ord.paymentMethod} • Cashier: {ord.cashier}
                  </div>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div className="font-extrabold text-emerald-400 text-sm">${ord.total.toFixed(2)}</div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Receipt Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-white/15 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="font-bold text-white text-sm">Receipt #{selectedOrder.orderNumber}</span>
                <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <div id="thermal-receipt" className="bg-white text-black p-4 rounded-xl text-left font-mono text-[11px] leading-tight space-y-2">
                <div className="text-center border-b border-dashed border-gray-400 pb-2">
                  <div className="font-extrabold text-sm uppercase">PharmaCare Store</div>
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
                  <div className="font-extrabold text-sm pt-1 border-t border-gray-300">
                    TOTAL: ${(selectedOrder.total || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 text-white text-xs font-semibold"
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
