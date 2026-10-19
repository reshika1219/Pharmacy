/* ═══════════════════════════════════════════════════════
   NexusPOS — Cashier POS Terminal Controller
   ═══════════════════════════════════════════════════════ */

'use strict';

const session = JSON.parse(sessionStorage.getItem('pos_session') || 'null');
let config = {};
let products = [];
let categories = [];
let customers = [];
let cart = [];
let selectedPayMethod = 'Cash';
let lastOrderData = null;

// ─── Helpers ──────────────────────────────────────────────
const $ = id => document.getElementById(id);
const curr = v => `${config.currency || '$'}${Number(v || 0).toFixed(2)}`;

async function api(path, method = 'GET', body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`/api${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function toast(msg, type = 'success') {
  const c = $('toast-container');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => { el.classList.add('hide'); el.addEventListener('animationend', () => el.remove()); }, 3000);
}

// ─── Clock ────────────────────────────────────────────────
function updateClock() {
  $('pos-clock').textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

// ─── User Info ────────────────────────────────────────────
if (session) {
  const name = session.full_name || session.username || 'User';
  $('pos-user-name').textContent = name;
  $('pos-user-role').textContent = session.role === 'admin' ? 'Administrator' : 'Cashier';
  $('pos-user-avatar').textContent = name.charAt(0).toUpperCase();
  if (session.role === 'admin') $('btn-admin').style.display = '';
}

// ─── Load Data ────────────────────────────────────────────
async function loadAll() {
  try {
    [config, products, categories, customers] = await Promise.all([
      api('/config'),
      api('/products'),
      api('/categories'),
      api('/customers')
    ]);
    $('discount-symbol').textContent = config.currency || '$';
    renderCategoryTabs();
    renderProducts();
    populateCustomers();
  } catch (e) {
    toast('Failed to load. Is the server running?', 'error');
  }
}

// ─── Category Tabs ────────────────────────────────────────
let activeCat = '';

function renderCategoryTabs() {
  const container = $('pos-cats');
  container.innerHTML = `<button class="pos-cat-btn active" data-cat="" onclick="setCat('')">All</button>`;
  categories.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'pos-cat-btn';
    btn.dataset.cat = c.id;
    btn.textContent = c.name;
    btn.onclick = () => setCat(String(c.id));
    container.appendChild(btn);
  });
}

function setCat(catId) {
  activeCat = catId;
  document.querySelectorAll('.pos-cat-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.cat === catId);
  });
  renderProducts();
}

// ─── Product Grid ─────────────────────────────────────────
let searchQuery = '';

$('pos-search').addEventListener('input', e => {
  searchQuery = e.target.value.toLowerCase().trim();
  renderProducts();
});

function renderProducts() {
  const grid = $('pos-grid');
  let filtered = products.filter(p => {
    const matchCat = !activeCat || String(p.category_id) === activeCat;
    const matchQ = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery) ||
      (p.sku || '').toLowerCase().includes(searchQuery) ||
      (p.barcode || '').includes(searchQuery);
    return matchCat && matchQ;
  });

  if (!filtered.length) {
    grid.innerHTML = `<div class="pos-loading">No products found</div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const isOut = p.track_inventory && p.current_stock <= 0;
    const isLow = p.track_inventory && p.current_stock > 0 && p.current_stock <= p.min_stock;
    const catColor = p.category_color || '#6366f1';
    return `
      <div class="pos-product-card${isOut ? ' out-of-stock' : ''}"
           onclick="${isOut ? '' : `addToCart(${p.id})`}"
           title="${p.name}">
        <div class="product-cat-dot" style="background:${catColor}22;">
          <svg viewBox="0 0 24 24" fill="none" stroke="${catColor}" stroke-width="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
        </div>
        <div class="product-name">${p.name}</div>
        <div class="product-price">${curr(p.sell_price)}</div>
        ${p.track_inventory ? `<div class="product-stock ${isOut ? 'out' : isLow ? 'low' : ''}">${isOut ? 'Out of stock' : `${p.current_stock} ${p.unit}`}</div>` : ''}
      </div>
    `;
  }).join('');
}

// ─── Cart ─────────────────────────────────────────────────
window.addToCart = (productId) => {
  const p = products.find(x => x.id === productId);
  if (!p) return;
  if (p.track_inventory && p.current_stock <= 0) { toast('Out of stock', 'error'); return; }

  const existing = cart.find(i => i.product_id === productId);
  if (existing) {
    if (p.track_inventory && existing.qty >= p.current_stock) {
      toast(`Max available: ${p.current_stock} ${p.unit}`, 'error'); return;
    }
    existing.qty++;
    existing.line_total = existing.qty * existing.unit_price;
  } else {
    cart.push({
      product_id: productId,
      name: p.name,
      unit: p.unit,
      qty: 1,
      unit_price: p.sell_price || 0,
      discount_pct: 0,
      line_total: p.sell_price || 0
    });
  }
  renderCart();
};

window.changeQty = (idx, delta) => {
  const item = cart[idx];
  if (!item) return;
  const p = products.find(x => x.id === item.product_id);
  const newQty = item.qty + delta;
  if (newQty <= 0) {
    cart.splice(idx, 1);
  } else {
    if (p && p.track_inventory && newQty > p.current_stock) {
      toast(`Only ${p.current_stock} in stock`, 'error'); return;
    }
    item.qty = newQty;
    item.line_total = item.qty * item.unit_price;
  }
  renderCart();
};

window.removeItem = (idx) => { cart.splice(idx, 1); renderCart(); };
window.clearCart = () => { cart = []; $('cart-customer').value = ''; $('cart-discount').value = '0'; renderCart(); };

function renderCart() {
  const el = $('cart-items');
  if (!cart.length) {
    el.innerHTML = `<div class="cart-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="40" height="40"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
      <p>Cart is empty</p><span>Tap a product to add</span>
    </div>`;
    updateTotals();
    return;
  }
  el.innerHTML = cart.map((item, idx) => `
    <div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${curr(item.unit_price)} / ${item.unit}</div>
      </div>
      <div class="cart-qty-controls">
        <button class="qty-btn" onclick="changeQty(${idx}, -1)">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${idx}, 1)">+</button>
      </div>
      <span class="cart-item-total">${curr(item.line_total)}</span>
      <button class="cart-remove" onclick="removeItem(${idx})">✕</button>
    </div>
  `).join('');
  updateTotals();
}

$('cart-discount').addEventListener('input', updateTotals);

function updateTotals() {
  const subtotal = cart.reduce((s, i) => s + i.line_total, 0);
  const discount = Math.max(0, Number($('cart-discount').value) || 0);
  const taxRate = Number(config.taxRate || 0);
  const afterDiscount = Math.max(0, subtotal - discount);
  const tax = afterDiscount * (taxRate / 100);
  const total = afterDiscount + tax;

  let lines = '';
  lines += `<div class="total-line"><span>Subtotal</span><span>${curr(subtotal)}</span></div>`;
  if (discount > 0) lines += `<div class="total-line discount"><span>Discount</span><span>−${curr(discount)}</span></div>`;
  if (taxRate > 0) lines += `<div class="total-line tax"><span>Tax (${taxRate}%)</span><span>${curr(tax)}</span></div>`;
  $('totals-lines').innerHTML = lines;
  $('cart-total').textContent = curr(total);
  $('charge-amount').textContent = curr(total);

  // Enable/disable charge button
  $('charge-btn').disabled = cart.length === 0;
}

// ─── Payment method selection ─────────────────────────────
document.querySelectorAll('.pay-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedPayMethod = btn.textContent.trim();
    document.querySelectorAll('.pay-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    checkout(selectedPayMethod);
  });
});

// ─── Checkout ─────────────────────────────────────────────
window.checkout = async (paymentMethod) => {
  if (!cart.length) { toast('Cart is empty', 'error'); return; }

  const subtotal = cart.reduce((s, i) => s + i.line_total, 0);
  const discount = Math.max(0, Number($('cart-discount').value) || 0);
  const taxRate = Number(config.taxRate || 0);
  const afterDiscount = Math.max(0, subtotal - discount);
  const tax = afterDiscount * (taxRate / 100);
  const total = afterDiscount + tax;

  let amountTendered = total;
  if (paymentMethod === 'Cash') {
    const tendered = prompt(`Total: ${curr(total)}\nCash tendered:`, total.toFixed(2));
    if (tendered === null) return;
    amountTendered = parseFloat(tendered) || total;
    if (amountTendered < total) { toast('Insufficient cash amount', 'error'); return; }
  }

  const customerId = $('cart-customer').value ? Number($('cart-customer').value) : null;

  try {
    $('charge-btn').disabled = true;
    const result = await api('/orders/checkout', 'POST', {
      items: cart.map(i => ({ product_id: i.product_id, qty: i.qty, unit_price: i.unit_price, discount_pct: 0 })),
      payment_method: paymentMethod,
      customer_id: customerId,
      discount_amount: discount,
      amount_tendered: amountTendered
    });

    lastOrderData = {
      orderNumber: result.order_number,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      cashier: session?.username || 'cashier',
      customer: customers.find(c => c.id === customerId)?.name || 'Walk-in',
      items: [...cart],
      subtotal,
      discount,
      tax,
      total,
      paymentMethod,
      amountTendered,
      changeDue: result.change_due
    };

    showReceipt(lastOrderData);

    // Reset cart
    cart = [];
    $('cart-customer').value = '';
    $('cart-discount').value = '0';
    renderCart();
    loadAll(); // refresh stock
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    $('charge-btn').disabled = false;
  }
};

// ─── Receipt ──────────────────────────────────────────────
function showReceipt(data) {
  const paper = $('receipt-paper');
  paper.innerHTML = `
    <div class="receipt-header">
      <div class="receipt-biz-name">${config.businessName || 'My Store'}</div>
      ${config.businessAddress ? `<div class="receipt-biz-sub">${config.businessAddress}</div>` : ''}
      ${config.businessPhone ? `<div class="receipt-biz-sub">${config.businessPhone}</div>` : ''}
      <div class="receipt-order-num">Order: ${data.orderNumber} · ${data.date} ${data.time}</div>
    </div>
    <div class="receipt-success">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      Payment Successful
    </div>
    <div style="margin-bottom:4px;font-size:0.75rem;color:var(--text-2)">Cashier: ${data.cashier} · Customer: ${data.customer}</div>
    <div class="receipt-divider"></div>
    <div class="receipt-items-header">Items</div>
    ${data.items.map(i => `
      <div class="receipt-line">
        <span>${i.name} × ${i.qty}</span>
        <span>${curr(i.line_total)}</span>
      </div>
    `).join('')}
    <div class="receipt-divider"></div>
    <div class="receipt-line"><span>Subtotal</span><span>${curr(data.subtotal)}</span></div>
    ${data.discount > 0 ? `<div class="receipt-line" style="color:var(--rose)"><span>Discount</span><span>−${curr(data.discount)}</span></div>` : ''}
    ${data.tax > 0 ? `<div class="receipt-line"><span>Tax</span><span>${curr(data.tax)}</span></div>` : ''}
    <div class="receipt-line large"><span>Total</span><span>${curr(data.total)}</span></div>
    ${data.paymentMethod === 'Cash' ? `
      <div class="receipt-line"><span>Cash Tendered</span><span>${curr(data.amountTendered)}</span></div>
      <div class="receipt-line bold"><span>Change Due</span><span>${curr(data.changeDue)}</span></div>
    ` : `<div class="receipt-line"><span>Payment</span><span>${data.paymentMethod}</span></div>`}
    <div class="receipt-footer-text">${config.receiptFooter || 'Thank you for your purchase!'}</div>
  `;
  $('receipt-overlay').classList.add('open');
}

window.closeReceipt = () => {
  $('receipt-overlay').classList.remove('open');
};

window.printReceipt = () => {
  const content = $('receipt-paper').innerHTML;
  const win = window.open('', '_blank', 'width=400,height=600');
  win.document.write(`
    <html><head><title>Receipt</title>
    <style>
      body { font-family: 'Courier New', monospace; font-size: 13px; padding: 20px; color: #000; background: #fff; }
      .receipt-biz-name { font-size: 16px; font-weight: bold; text-align: center; }
      .receipt-biz-sub, .receipt-order-num { text-align: center; color: #555; font-size: 11px; }
      .receipt-success { text-align: center; font-weight: bold; margin: 8px 0; }
      .receipt-divider { border-top: 1px dashed #999; margin: 8px 0; }
      .receipt-items-header { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.05em; }
      .receipt-line { display: flex; justify-content: space-between; padding: 2px 0; }
      .receipt-line.large { font-size: 15px; font-weight: bold; }
      .receipt-line.bold { font-weight: bold; }
      .receipt-footer-text { text-align: center; font-size: 11px; color: #888; border-top: 1px dashed #999; margin-top: 12px; padding-top: 10px; }
      svg { display: none; }
      [style*="color:var"] { color: #000; }
    </style>
    </head><body>${content}</body></html>
  `);
  win.document.close();
  win.print();
};

// ─── Customers ────────────────────────────────────────────
function populateCustomers() {
  const sel = $('cart-customer');
  const current = sel.value;
  sel.innerHTML = '<option value="">Walk-in Customer</option>' +
    customers.map(c => `<option value="${c.id}">${c.name}${c.phone ? ' · ' + c.phone : ''}</option>`).join('');
  if (current) sel.value = current;
}

// ─── Logout / Admin ───────────────────────────────────────
$('btn-logout').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  sessionStorage.removeItem('pos_session');
  window.location.href = 'login.html';
});

$('btn-admin').addEventListener('click', () => {
  window.location.href = 'index.html';
});

// ─── Keyboard Shortcuts ───────────────────────────────────
document.addEventListener('keydown', e => {
  // F1 = focus search
  if (e.key === 'F1') { e.preventDefault(); $('pos-search').focus(); }
  // F2 = focus customer select
  if (e.key === 'F2') { e.preventDefault(); $('cart-customer').focus(); }
  // Escape = clear search
  if (e.key === 'Escape') { $('pos-search').value = ''; searchQuery = ''; renderProducts(); }
  // Ctrl+Enter or F9 = checkout cash
  if ((e.ctrlKey && e.key === 'Enter') || e.key === 'F9') { e.preventDefault(); checkout('Cash'); }
  // Delete = clear cart
  if (e.key === 'F3') { e.preventDefault(); clearCart(); }
});

// ─── Init ─────────────────────────────────────────────────
loadAll();
renderCart();
updateTotals();
