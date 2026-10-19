'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  Printer,
  X,
  CreditCard,
  Banknote,
  QrCode,
  FileText,
  User,
  Percent,
} from 'lucide-react';

interface POSItem {
  id: number;
  name: string;
  sku: string;
  barcode: string | null;
  unit: string;
  sellPrice: number;
  totalStock: number;
  category: { id: number; name: string } | null;
}

interface CartItem extends POSItem {
  qty: number;
  discountPct: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<POSItem[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [customers, setCustomers] = useState<{ id: number; name: string; phone: string | null }[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // Checkout modal
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'QR' | 'Credit'>('Cash');
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [discountOrder, setDiscountOrder] = useState<string>('0');
  const [processing, setProcessing] = useState(false);

  // Completed Receipt Modal
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/customers').then((r) => r.json()),
    ]).then(([prods, cats, custs]) => {
      if (Array.isArray(prods)) setProducts(prods);
      if (Array.isArray(cats)) setCategories(cats);
      if (Array.isArray(custs)) setCustomers(custs);
    });
  }, []);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = selectedCategory === 'all' || p.category?.id?.toString() === selectedCategory;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q));
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, search]);

  const addToCart = (product: POSItem) => {
    if (product.totalStock <= 0) return;
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.id === product.id);
      if (idx >= 0) {
        if (prev[idx].qty >= product.totalStock) return prev;
        const copy = [...prev];
        copy[idx].qty += 1;
        return copy;
      }
      return [...prev, { ...product, qty: 1, discountPct: 0 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            if (newQty <= 0) return null;
            if (newQty > item.totalStock) return item;
            return { ...item, qty: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const price = item.sellPrice * (1 - item.discountPct / 100);
      return sum + price * item.qty;
    }, 0);
  }, [cart]);

  const discountVal = parseFloat(discountOrder) || 0;
  const taxRate = 0.05; // 5% default
  const taxAmount = (subtotal - discountVal) * taxRate;
  const total = Math.max(0, subtotal - discountVal + taxAmount);
  const changeDue = Math.max(0, (parseFloat(amountTendered) || total) - total);

  const handleCheckoutSubmit = async () => {
    if (cart.length === 0) return;
    setProcessing(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer || null,
          paymentMethod,
          items: cart.map((c) => ({
            productId: c.id,
            qty: c.qty,
            unitPrice: c.sellPrice,
            discountPct: c.discountPct,
          })),
          discountAmount: discountVal,
          taxAmount,
          amountTendered: parseFloat(amountTendered) || total,
        }),
      });

      const data = await res.json();
      if (res.ok && data.order) {
        setCompletedOrder(data.order);
        setCart([]);
        setShowCheckout(false);
        setMobileCartOpen(false);

        // Update local product stocks
        setProducts((prev) =>
          prev.map((p) => {
            const purchased = cart.find((c) => c.id === p.id);
            if (purchased) {
              return { ...p, totalStock: Math.max(0, p.totalStock - purchased.qty) };
            }
            return p;
          })
        );
      } else {
        alert(data.error || 'Failed to complete order');
      }
    } catch (e: any) {
      alert(e.message || 'Network error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-screen">
      <Navigation />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Search & Filter Bar */}
        <header className="p-3 sm:p-4 bg-[#0d1322] border-b border-white/10 shrink-0 flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Scan barcode or type item name..."
              className="w-full bg-[#090d16] border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              All Items
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id.toString())}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === c.id.toString()
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </header>

        {/* POS Body (Catalog Grid + Cart Sidebar) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Catalog Grid */}
          <section className="flex-1 overflow-y-auto p-3 sm:p-5 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5 content-start pb-24 lg:pb-6">
            {filteredProducts.map((p) => {
              const inCart = cart.find((i) => i.id === p.id);
              const isOut = p.totalStock <= 0;
              return (
                <div
                  key={p.id}
                  onClick={() => !isOut && addToCart(p)}
                  className={`p-3 sm:p-4 rounded-2xl border text-left flex flex-col justify-between transition-all select-none relative group ${
                    isOut
                      ? 'bg-white/[0.02] border-white/5 opacity-50 cursor-not-allowed'
                      : inCart
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/10 cursor-pointer active:scale-95'
                      : 'bg-[#0f172a] hover:bg-white/5 border-white/10 cursor-pointer active:scale-95'
                  }`}
                >
                  {inCart && (
                    <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-md">
                      {inCart.qty}
                    </span>
                  )}

                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block truncate">
                      {p.category?.name || 'Item'}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 mt-0.5 leading-snug">
                      {p.name}
                    </h3>
                  </div>

                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="font-extrabold text-emerald-400 text-sm">
                      ${p.sellPrice.toFixed(2)}
                    </span>
                    <span
                      className={`text-[10px] font-medium ${
                        isOut ? 'text-rose-400 font-bold' : p.totalStock < 20 ? 'text-amber-400' : 'text-slate-400'
                      }`}
                    >
                      {isOut ? 'Sold Out' : `${p.totalStock} ${p.unit}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </section>

          {/* ─── DESKTOP CART SIDEBAR ─── */}
          <aside className="hidden lg:flex flex-col w-96 bg-[#0d1322] border-l border-white/10 h-full">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-400" />
                <h2 className="font-bold text-white text-base">Cart ({cart.reduce((s, i) => s + i.qty, 0)})</h2>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-slate-400 hover:text-rose-400"
                >
                  Clear Cart
                </button>
              )}
            </div>

            {/* Customer selector */}
            <div className="p-3 border-b border-white/10 bg-black/20">
              <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-1.5 border border-white/10">
                <User className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="bg-transparent text-xs text-white focus:outline-none w-full"
                >
                  <option value="" className="bg-slate-900">Walk-in Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900">
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <ShoppingCart className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm font-medium">Cart is empty</p>
                  <p className="text-xs text-slate-500 mt-1">Tap products to begin ringing up sales.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="truncate pr-2">
                      <div className="font-semibold text-white truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-400">
                        ${item.sellPrice.toFixed(2)} each
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center bg-slate-900 border border-white/10 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="p-1 hover:bg-white/10 text-slate-300"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center font-bold text-white text-xs">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="p-1 hover:bg-white/10 text-slate-300"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="w-14 text-right font-bold text-emerald-400">
                        ${(item.sellPrice * item.qty).toFixed(2)}
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Summary & Checkout Footer */}
            <div className="p-4 border-t border-white/10 bg-[#090d16] space-y-2.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Tax (5%)</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-white pt-2 border-t border-white/10">
                <span>Total Due</span>
                <span className="text-emerald-400 text-xl">${total.toFixed(2)}</span>
              </div>

              <button
                disabled={cart.length === 0}
                onClick={() => {
                  setAmountTendered(total.toFixed(2));
                  setShowCheckout(true);
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition-all disabled:opacity-40"
              >
                Charge ${total.toFixed(2)}
              </button>
            </div>
          </aside>
        </div>

        {/* ─── MOBILE FLOATING CART DRAWER TRIGGER (Phone Screen) ─── */}
        <div className="lg:hidden fixed bottom-16 left-3 right-3 z-30">
          <button
            onClick={() => setMobileCartOpen(true)}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-between active:scale-98 transition-all"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              <span>View Cart ({cart.reduce((s, i) => s + i.qty, 0)} items)</span>
            </div>
            <span className="text-base font-extrabold">${total.toFixed(2)}</span>
          </button>
        </div>

        {/* ─── MOBILE CART DRAWER ─── */}
        {mobileCartOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col justify-end">
            <div className="bg-[#0f172a] border-t border-white/15 rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-bold text-white text-base">Shopping Cart</h3>
                <button onClick={() => setMobileCartOpen(false)} className="text-slate-400 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {cart.length === 0 ? (
                  <p className="text-center text-slate-400 py-8 text-xs">Cart is empty.</p>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="truncate pr-2">
                        <div className="font-semibold text-white truncate">{item.name}</div>
                        <div className="text-[10px] text-slate-400">${item.sellPrice.toFixed(2)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-slate-900 rounded-lg border border-white/10">
                          <button onClick={() => updateQty(item.id, -1)} className="p-1.5 text-white">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-bold text-white">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="p-1.5 text-white">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="w-14 text-right font-bold text-emerald-400">
                          ${(item.sellPrice * item.qty).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-white/10 bg-[#090d16] space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Subtotal + Tax</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <button
                  disabled={cart.length === 0}
                  onClick={() => {
                    setAmountTendered(total.toFixed(2));
                    setShowCheckout(true);
                  }}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
                >
                  Proceed to Checkout (${total.toFixed(2)})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── CHECKOUT MODAL ─── */}
        {showCheckout && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-white/15 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-extrabold text-white text-lg">Complete Checkout</h3>
                <button onClick={() => setShowCheckout(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              {/* Total Due Banner */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">Amount Due</span>
                <div className="text-3xl font-black text-white mt-0.5">${total.toFixed(2)}</div>
              </div>

              {/* Payment Mode Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'Cash', label: 'Cash', icon: Banknote },
                    { id: 'Card', label: 'Card', icon: CreditCard },
                    { id: 'QR', label: 'QR / Digital', icon: QrCode },
                    { id: 'Credit', label: 'Credit', icon: FileText },
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                          paymentMethod === m.id
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[10px] font-bold">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash Denominations and Tendered Calculation */}
              {paymentMethod === 'Cash' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-slate-300">Amount Tendered ($)</label>
                    {changeDue > 0 && (
                      <span className="text-emerald-400 font-bold">Change Due: ${changeDue.toFixed(2)}</span>
                    )}
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white text-lg font-black text-center"
                  />
                  <div className="flex gap-1.5 justify-center pt-1">
                    {[10, 20, 50, 100].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmountTendered(amt.toString())}
                        className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300"
                      >
                        ${amt}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setAmountTendered(total.toFixed(2))}
                      className="px-3 py-1 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-xs font-bold text-indigo-300"
                    >
                      Exact
                    </button>
                  </div>
                </div>
              )}

              <button
                disabled={processing}
                onClick={handleCheckoutSubmit}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/30 active:scale-95 transition-all disabled:opacity-50"
              >
                {processing ? 'Processing...' : `Confirm & Print Receipt`}
              </button>
            </div>
          </div>
        )}

        {/* ─── THERMAL RECEIPT MODAL ─── */}
        {completedOrder && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-white/15 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle className="w-5 h-5" />
                  Sale Completed!
                </div>
                <button onClick={() => setCompletedOrder(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              {/* Printable Thermal Receipt Box */}
              <div
                id="thermal-receipt"
                className="bg-white text-black p-4 rounded-xl text-left font-mono text-[11px] leading-tight space-y-2 shadow-inner"
              >
                <div className="text-center border-b border-dashed border-gray-400 pb-2">
                  <div className="font-extrabold text-sm uppercase">ExamplePOS Store</div>
                  <div className="text-[10px] text-gray-600">Point of Sale & Inventory</div>
                  <div className="text-[10px] text-gray-500 mt-1">Order #{completedOrder.orderNumber}</div>
                  <div className="text-[10px] text-gray-500">{completedOrder.date} {completedOrder.time}</div>
                </div>

                <div className="divide-y divide-gray-200 py-1">
                  {completedOrder.items?.map((it: any) => (
                    <div key={it.id} className="py-1 flex justify-between">
                      <div className="truncate pr-1">
                        <div>{it.product?.name || 'Item'}</div>
                        <div className="text-[9px] text-gray-500">
                          {it.qty} x ${it.unitPrice.toFixed(2)}
                        </div>
                      </div>
                      <div className="font-bold">${it.lineTotal.toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed border-gray-400 pt-2 space-y-1 text-right text-xs">
                  <div>Subtotal: ${(completedOrder.subtotal || 0).toFixed(2)}</div>
                  <div>Tax: ${(completedOrder.taxAmount || 0).toFixed(2)}</div>
                  <div className="font-extrabold text-sm pt-1 border-t border-gray-300">
                    TOTAL: ${(completedOrder.total || 0).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-gray-600">
                    Paid via {completedOrder.paymentMethod} • Change: ${(completedOrder.changeDue || 0).toFixed(2)}
                  </div>
                </div>

                <div className="text-center text-[9px] text-gray-500 pt-2 border-t border-dashed border-gray-400">
                  Thank you for your purchase!
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </button>
                <button
                  onClick={() => setCompletedOrder(null)}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
                >
                  Next Sale
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
