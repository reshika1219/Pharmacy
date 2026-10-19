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
    <div className="flex-1 flex flex-col lg:flex-row min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors">
      <Navigation />

      <main className="flex-1 flex flex-col min-h-0 lg:h-screen lg:overflow-hidden">
        {/* Top Header & Search Bar */}
        <div className="p-3 sm:p-4 bg-[var(--surface)] border-b border-[var(--border)] shrink-0 flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Scan barcode or type name..."
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg py-1.5 pl-9 pr-3 text-xs sm:text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-[var(--accent)] text-[var(--accent-text)]'
                  : 'bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'
              }`}
            >
              All Items
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id.toString())}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                  selectedCategory === c.id.toString()
                    ? 'bg-[var(--accent)] text-[var(--accent-text)]'
                    : 'bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* POS Body (Catalog Grid + Cart Sidebar) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Catalog Grid */}
          <section className="flex-1 overflow-y-auto p-3 sm:p-5 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5 content-start pb-36 lg:pb-6">
            {filteredProducts.map((p) => {
              const inCart = cart.find((i) => i.id === p.id);
              const isOut = p.totalStock <= 0;
              return (
                <div
                  key={p.id}
                  onClick={() => !isOut && addToCart(p)}
                  className={`p-3 sm:p-4 rounded-xl border text-left flex flex-col justify-between transition-all select-none relative ${
                    isOut
                      ? 'bg-[var(--surface-hover)] border-[var(--border)] opacity-60 cursor-not-allowed'
                      : inCart
                      ? 'bg-[var(--surface-hover)] border-[var(--accent)] shadow-xs cursor-pointer active:scale-98'
                      : 'bg-[var(--surface)] hover:bg-[var(--surface-hover)] border-[var(--border)] shadow-xs cursor-pointer active:scale-98'
                  }`}
                >
                  {inCart && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--accent)] text-[var(--accent-text)] text-[10px] font-bold flex items-center justify-center">
                      {inCart.qty}
                    </span>
                  )}

                  <div>
                    <span className="text-[10px] font-semibold text-[var(--text-muted)] block truncate">
                      {p.category?.name || 'General'}
                    </span>
                    <h3 className="text-xs sm:text-sm font-semibold text-[var(--text)] line-clamp-2 mt-0.5 leading-snug">
                      {p.name}
                    </h3>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[var(--border)] flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--text)] text-sm">
                      ${p.sellPrice.toFixed(2)}
                    </span>
                    <span
                      className={`text-[10px] font-medium ${
                        isOut ? 'text-[var(--error-text)] font-bold' : p.totalStock < 20 ? 'text-[var(--warning-text)]' : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {isOut ? 'Out of Stock' : `${p.totalStock} ${p.unit}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </section>

          {/* DESKTOP CART SIDEBAR */}
          <aside className="hidden lg:flex flex-col w-96 bg-[var(--surface)] border-l border-[var(--border)] h-full">
            <div className="p-3.5 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[var(--accent)]" />
                <h2 className="font-bold text-[var(--text)] text-sm">
                  Cart ({cart.reduce((s, i) => s + i.qty, 0)})
                </h2>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-[11px] text-gray-400 hover:text-red-600 transition-colors"
                >
                  Clear Cart
                </button>
              )}
            </div>

            {/* Customer selector */}
            <div className="p-3 border-b border-[var(--border)] bg-[var(--surface-hover)]">
              <div className="flex items-center gap-2 bg-[var(--surface)] rounded-lg px-2.5 py-1.5 border border-[var(--border)]">
                <User className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="bg-transparent text-xs text-[var(--text)] focus:outline-none w-full"
                >
                  <option value="" className="bg-[var(--surface)] text-[var(--text)]">Walk-in Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[var(--surface)] text-[var(--text)]">
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)]">
                  <ShoppingCart className="w-8 h-8 mb-2 opacity-30 text-[var(--accent)]" />
                  <p className="text-xs font-medium">Cart is empty</p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Click products to add them to current ticket.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-between text-xs"
                  >
                    <div className="truncate pr-2">
                      <div className="font-semibold text-[var(--text)] truncate">{item.name}</div>
                      <div className="text-[10px] text-[var(--text-secondary)]">
                        ${item.sellPrice.toFixed(2)} each
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center bg-[var(--surface)] border border-[var(--border)] rounded-md overflow-hidden">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="p-1 hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text)] cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-bold text-[var(--text)] text-xs">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="p-1 hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text)] cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="w-14 text-right font-bold text-[var(--text)]">
                        ${(item.sellPrice * item.qty).toFixed(2)}
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-[var(--text-muted)] hover:text-[var(--error-text)] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Summary & Checkout Footer */}
            <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-hover)] space-y-2">
              <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                <span>Tax (5%)</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[var(--text)] pt-2 border-t border-[var(--border)]">
                <span>Total Due</span>
                <span className="text-[var(--success-text)] text-lg">${total.toFixed(2)}</span>
              </div>

              <button
                disabled={cart.length === 0}
                onClick={() => {
                  setAmountTendered(total.toFixed(2));
                  setShowCheckout(true);
                }}
                className="w-full py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)] font-bold text-xs shadow-xs active:scale-98 transition-all disabled:opacity-40 cursor-pointer"
              >
                Charge ${total.toFixed(2)}
              </button>
            </div>
          </aside>
        </div>

        {/* MOBILE FLOATING CART DRAWER TRIGGER (only visible when cart has items) */}
        {cart.length > 0 && (
          <div className="lg:hidden fixed bottom-18 left-3 right-3 z-30 animate-in slide-in-from-bottom duration-200">
            <button
              onClick={() => setMobileCartOpen(true)}
              className="w-full py-3 px-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)] font-bold text-xs shadow-lg flex items-center justify-between active:scale-98 transition-all cursor-pointer border border-[var(--border)]"
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                <span>View Cart ({cart.reduce((s, i) => s + i.qty, 0)} items)</span>
              </div>
              <span className="text-sm font-extrabold">${total.toFixed(2)}</span>
            </button>
          </div>
        )}

        {/* MOBILE CART DRAWER */}
        {mobileCartOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50 flex flex-col justify-end">
            <div className="bg-[var(--surface)] border-t border-[var(--border)] rounded-t-2xl max-h-[90vh] flex flex-col shadow-xl">
              <div className="p-3 border-b border-[var(--border)] flex items-center justify-between">
                <h3 className="font-bold text-[var(--text)] text-sm">Shopping Cart</h3>
                <button onClick={() => setMobileCartOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text)] p-1 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {cart.length === 0 ? (
                  <p className="text-center text-[var(--text-muted)] py-6 text-xs">Cart is empty.</p>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-between text-xs"
                    >
                      <div className="truncate pr-2">
                        <div className="font-semibold text-[var(--text)] truncate">{item.name}</div>
                        <div className="text-[10px] text-[var(--text-secondary)]">${item.sellPrice.toFixed(2)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-[var(--surface)] rounded-md border border-[var(--border)]">
                          <button onClick={() => updateQty(item.id, -1)} className="p-1 text-[var(--text-secondary)] hover:text-[var(--text)] cursor-pointer">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center font-bold text-[var(--text)] text-xs">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="p-1 text-[var(--text-secondary)] hover:text-[var(--text)] cursor-pointer">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="w-12 text-right font-bold text-[var(--text)]">
                          ${(item.sellPrice * item.qty).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 border-t border-[var(--border)] bg-[var(--surface-hover)] space-y-2">
                <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                  <span>Total</span>
                  <span className="font-bold text-[var(--text)]">${total.toFixed(2)}</span>
                </div>
                <button
                  disabled={cart.length === 0}
                  onClick={() => {
                    setAmountTendered(total.toFixed(2));
                    setShowCheckout(true);
                  }}
                  className="w-full py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)] font-bold text-xs shadow-xs active:scale-98 transition-all cursor-pointer"
                >
                  Proceed to Checkout (${total.toFixed(2)})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CHECKOUT MODAL */}
        {showCheckout && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 w-full max-w-sm shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <h3 className="font-bold text-[var(--text)] text-sm">Complete Checkout</h3>
                <button onClick={() => setShowCheckout(false)} className="text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer">✕</button>
              </div>

              {/* Total Due Banner */}
              <div className="p-3 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-center">
                <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">Amount Due</span>
                <div className="text-2xl font-bold text-[var(--success-text)] mt-0.5">${total.toFixed(2)}</div>
              </div>

              {/* Payment Mode Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'Cash', label: 'Cash', icon: Banknote },
                    { id: 'Card', label: 'Card', icon: CreditCard },
                    { id: 'QR', label: 'QR', icon: QrCode },
                    { id: 'Credit', label: 'Credit', icon: FileText },
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`p-2 rounded-lg border text-center flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                          paymentMethod === m.id
                            ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-text)] font-semibold'
                            : 'bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-medium">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash Denominations and Tendered Calculation */}
              {paymentMethod === 'Cash' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-[var(--text-secondary)]">Amount Tendered</label>
                    {changeDue > 0 && (
                      <span className="text-[var(--success-text)] font-bold">Change: ${changeDue.toFixed(2)}</span>
                    )}
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] text-base font-bold text-center focus:outline-none focus:border-[var(--accent)]"
                  />
                  <div className="flex gap-1 justify-center pt-0.5">
                    {[10, 20, 50, 100].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmountTendered(amt.toString())}
                        className="px-2.5 py-0.5 rounded-md bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text)] hover:bg-[var(--surface)] cursor-pointer"
                      >
                        ${amt}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setAmountTendered(total.toFixed(2))}
                      className="px-2.5 py-0.5 rounded-md bg-[var(--accent)] text-[var(--accent-text)] border border-[var(--accent)] text-xs font-semibold cursor-pointer"
                    >
                      Exact
                    </button>
                  </div>
                </div>
              )}

              <button
                disabled={processing}
                onClick={handleCheckoutSubmit}
                className="w-full py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)] font-bold text-xs shadow-xs active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                {processing ? 'Processing...' : `Confirm & Print Receipt`}
              </button>
            </div>
          </div>
        )}

        {/* THERMAL RECEIPT MODAL */}
        {completedOrder && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 w-full max-w-sm shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  <CheckCircle className="w-4 h-4" />
                  Sale Completed!
                </div>
                <button onClick={() => setCompletedOrder(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
              </div>

              {/* Printable Thermal Receipt Box */}
              <div
                id="thermal-receipt"
                className="bg-white text-black p-4 rounded-lg text-left font-mono text-[11px] leading-tight space-y-2 border border-gray-200"
              >
                <div className="text-center border-b border-dashed border-gray-400 pb-2">
                  <div className="font-bold text-sm uppercase">ExamplePOS Store</div>
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
                  <div className="font-bold text-sm pt-1 border-t border-gray-300">
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

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Receipt
                </button>
                <button
                  onClick={() => setCompletedOrder(null)}
                  className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
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
