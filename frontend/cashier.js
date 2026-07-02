// ============================================================
// PharmaCare — Cashier POS Logic
// cashier.js
// ============================================================

// ---- AUTH GUARD: Cashier or Owner ----
const session = JSON.parse(sessionStorage.getItem('pharmacare_session') || 'null');
if (!session || (session.role !== 'cashier' && session.role !== 'owner')) {
  window.location.replace('login.html');
}

// ---- STATE ----
let itemsList = [];
let cart = [];       // [{ itemId, name, unit, price, qty }]
let selectedPayment = 'Cash';
let dbName = 'PharmaCare';
let dbAddress = '';
let dbPhone = '';
let nextBillId = 1;

// ---- INIT ----
document.addEventListener('DOMContentLoaded', async () => {
  // Show cashier name
  document.getElementById('pos-cashier-name').textContent = session.username;

  // Live clock
  updateClock();
  setInterval(updateClock, 1000);

  // Search input
  const searchInput = document.getElementById('medicine-search');
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim();
    document.getElementById('clear-search').style.display = q ? 'flex' : 'none';
    renderMedicineList(q);
  });

  // Load DB from server
  await loadDB();
  updateBillNumber();
  renderCart();

  // Add discount event listener to recalculate total
  const discountInput = document.getElementById('discount-val');
  if (discountInput) {
    discountInput.addEventListener('input', renderCart);
  }
});

 Oskar = null;
function updateClock() {
  const now = new Date();
  document.getElementById('pos-datetime').textContent =
    now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    '  ' +
    now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ---- DB ----
async function loadDB() {
  try {
    const res = await fetch('/api/items');
    if (!res.ok) throw new Error();
    itemsList = await res.json();

    const configRes = await fetch('/api/config');
    const config = await configRes.json();
    dbName = config.pharmacyName || 'PharmaCare';
    dbAddress = config.pharmacyAddress || '';
    dbPhone = config.pharmacyPhone || '';
    nextBillId = parseInt(config.billNextId) || 1;

    document.getElementById('pos-pharmacy-name').textContent = dbName;
  } catch (e) {
    showToast('Cannot load medicines. Check server connection.', 'error');
  }
}

// ---- STOCK HELPER ----
function getStock(itemId) {
  const item = itemsList.find(i => i.id === itemId);
  if (!item) return 0;
  const inCart = cart.find(c => c.itemId === itemId);
  return item.currentStock - (inCart ? inCart.qty : 0);
}

function getStockRaw(itemId) {
  const item = itemsList.find(i => i.id === itemId);
  return item ? item.currentStock : 0;
}

// ---- MEDICINE SEARCH ----
function renderMedicineList(query = '') {
  const listEl = document.getElementById('medicine-list');

  if (itemsList.length === 0) {
    listEl.innerHTML = '<div class="search-prompt"><p>Loading medicines…</p></div>';
    return;
  }

  if (!query) {
    listEl.innerHTML = `
      <div class="search-prompt">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <p>Start typing to search for medicines</p>
      </div>`;
    return;
  }

  const q = query.toLowerCase();
  const results = itemsList.filter(i =>
    i.name.toLowerCase().includes(q) ||
    (i.generic || '').toLowerCase().includes(q) ||
    (i.category || '').toLowerCase().includes(q)
  );

  if (results.length === 0) {
    listEl.innerHTML = `<div class="search-prompt"><p>No medicines found for "<strong>${escHtml(query)}</strong>"</p></div>`;
    return;
  }

  listEl.innerHTML = results.map(item => {
    const availableStock = getStock(item.id);
    const isOut = availableStock <= 0;

    let stockBadgeClass = 'stock-ok';
    let stockLabel = `${availableStock} in stock`;
    if (isOut) { stockBadgeClass = 'stock-out'; stockLabel = 'Out of stock'; }
    else if (availableStock <= item.minStock) { stockBadgeClass = 'stock-low'; stockLabel = `Low: ${availableStock}`; }

    // Expire alert inside search card if expiring within 90 days
    let expiryAlertHtml = '';
    if (item.expiry) {
      const now = new Date(); now.setHours(0,0,0,0);
      const exp = new Date(item.expiry + 'T00:00:00');
      const days = Math.floor((exp - now) / 86400000);
      if (days < 0) {
        expiryAlertHtml = `<span class="med-stock-badge stock-out" style="margin-left: 5px">EXPIRED (${item.expiry})</span>`;
      } else if (days <= 90) {
        expiryAlertHtml = `<span class="med-stock-badge stock-low" style="margin-left: 5px">Expiring in ${days}d</span>`;
      }
    }

    const price = item.sellPrice ? parseFloat(item.sellPrice) : 0;

    return `
      <div class="med-card ${isOut ? 'out-of-stock' : ''}" onclick="addToCart(${item.id})">
        <div class="med-info">
          <div class="med-name">${escHtml(item.name)}</div>
          ${item.generic ? `<div class="med-generic">${escHtml(item.generic)}</div>` : ''}
          <div class="med-meta">
            <span class="med-price">Rs. ${price.toFixed(2)}</span>
            <span class="med-unit">/ ${escHtml(item.unit)}</span>
            <span class="med-stock-badge ${stockBadgeClass}">${stockLabel}</span>
            ${expiryAlertHtml}
          </div>
        </div>
        ${!isOut ? `<button class="med-add-btn" onclick="event.stopPropagation(); addToCart(${item.id})">+</button>` : ''}
      </div>`;
  }).join('');
}

function clearSearch() {
  document.getElementById('medicine-search').value = '';
  document.getElementById('clear-search').style.display = 'none';
  renderMedicineList('');
  document.getElementById('medicine-search').focus();
}

// ---- CART ----
function addToCart(itemId) {
  const item = itemsList.find(i => i.id === itemId);
  if (!item) return;

  const rawStock = getStockRaw(itemId);
  const existing = cart.find(c => c.itemId === itemId);
  const currentInCart = existing ? existing.qty : 0;

  if (currentInCart >= rawStock) {
    showToast(`Not enough stock! Only ${rawStock} available.`, 'error');
    return;
  }

  if (existing) {
    existing.qty++;
  } else {
    cart.push({
      itemId,
      name: item.name,
      unit: item.unit,
      price: parseFloat(item.sellPrice) || 0,
      qty: 1
    });
  }

  renderCart();
  const q = document.getElementById('medicine-search').value.trim();
  if (q) renderMedicineList(q);

  showToast(`Added ${item.name}`, 'success');
}

function changeQty(itemId, delta) {
  const entry = cart.find(c => c.itemId === itemId);
  if (!entry) return;

  const rawStock = getStockRaw(itemId);
  const newQty = entry.qty + delta;

  if (newQty <= 0) {
    removeFromCart(itemId);
    return;
  }
  if (newQty > rawStock) {
    showToast(`Maximum available: ${rawStock} ${entry.unit}`, 'error');
    return;
  }

  entry.qty = newQty;
  renderCart();
  const q = document.getElementById('medicine-search').value.trim();
  if (q) renderMedicineList(q);
}

function removeFromCart(itemId) {
  cart = cart.filter(c => c.itemId !== itemId);
  renderCart();
  const q = document.getElementById('medicine-search').value.trim();
  if (q) renderMedicineList(q);
}

function clearCart() {
  if (cart.length === 0) return;
  if (!confirm('Clear all items from the cart?')) return;
  cart = [];
  renderCart();
  const q = document.getElementById('medicine-search').value.trim();
  if (q) renderMedicineList(q);
}

function renderCart() {
  const cartEl = document.getElementById('cart-items');
  const emptyEl = document.getElementById('cart-empty');
  const countBar = document.getElementById('items-count-bar');

  if (cart.length === 0) {
    cartEl.innerHTML = '';
    cartEl.appendChild(emptyEl);
    emptyEl.style.display = 'flex';
  } else {
    emptyEl.style.display = 'none';
    cartEl.innerHTML = cart.map(entry => `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-name">${escHtml(entry.name)}</div>
          <div class="cart-item-price">Rs. ${entry.price.toFixed(2)} / ${escHtml(entry.unit)}</div>
        </div>
        <div class="cart-qty-controls">
          <button class="qty-btn" onclick="changeQty(${entry.itemId}, -1)">−</button>
          <span class="qty-val">${entry.qty}</span>
          <button class="qty-btn" onclick="changeQty(${entry.itemId}, +1)">+</button>
        </div>
        <div class="cart-item-total">Rs. ${(entry.price * entry.qty).toFixed(2)}</div>
        <button class="cart-item-remove" onclick="removeFromCart(${entry.itemId})" title="Remove">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
          </svg>
        </button>
      </div>
    `).join('');
    cartEl.appendChild(emptyEl);
  }

  // Totals
  const subtotal = cart.reduce((s, e) => s + e.price * e.qty, 0);
  document.getElementById('subtotal-val').textContent = `Rs. ${subtotal.toFixed(2)}`;

  // Discount
  const discountInput = document.getElementById('discount-val');
  const discount = discountInput ? (parseFloat(discountInput.value) || 0) : 0;
  const grandTotal = Math.max(0, subtotal - discount);
  document.getElementById('grand-total-val').textContent = `Rs. ${grandTotal.toFixed(2)}`;

  // Item count
  const totalItems = cart.reduce((s, e) => s + e.qty, 0);
  countBar.textContent = totalItems === 0
    ? '0 items in cart'
    : `${cart.length} medicine${cart.length > 1 ? 's' : ''}, ${totalItems} unit${totalItems > 1 ? 's' : ''} total`;
}

// ---- PAYMENT ----
function selectPayment(method) {
  selectedPayment = method;
  document.querySelectorAll('.pay-btn').forEach(b => b.classList.toggle('active', b.dataset.method === method));
}

// ---- BILL NUMBER ----
function updateBillNumber() {
  document.getElementById('bill-number-display').textContent = formatBillNumber(nextBillId);
}

function formatBillNumber(n) {
  return 'BILL-' + String(n).padStart(4, '0');
}

// ---- PRINT BILL ----
async function printBill() {
  if (cart.length === 0) {
    showToast('Add at least one item to the cart before printing.', 'error');
    return;
  }

  const discountInput = document.getElementById('discount-val');
  const discount = discountInput ? (parseFloat(discountInput.value) || 0) : 0;

  try {
    const res = await fetch('/api/sales/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.map(e => ({ itemId: e.itemId, qty: e.qty })),
        paymentMethod: selectedPayment,
        discount: discount
      })
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'Checkout failed', 'error');
      return;
    }

    const billNumber = data.billNumber;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const total = cart.reduce((s, e) => s + e.price * e.qty, 0) - discount;

    // Build print HTML
    const billHTML = buildBillHTML({
      billNumber, dateStr, timeStr, total: Math.max(0, total),
      pharmacyName: dbName,
      pharmacyAddress: dbAddress,
      pharmacyPhone: dbPhone,
      cashier: session.username,
      paymentMethod: selectedPayment,
      items: cart,
      discount: discount
    });

    // Open print window
    const printWin = window.open('', '_blank', 'width=420,height=650');
    printWin.document.write(billHTML);
    printWin.document.close();

    printWin.onload = () => {
      printWin.focus();
      printWin.print();
    };

    // Reset cart and load new stock
    cart = [];
    if (discountInput) discountInput.value = '';
    renderCart();
    await loadDB();
    updateBillNumber();
    const q = document.getElementById('medicine-search').value.trim();
    if (q) renderMedicineList(q);

    showToast(`✓ ${billNumber} printed & saved. Stock updated.`, 'success');

  } catch (e) {
    showToast('Failed to checkout. Check server connection.', 'error');
  }
}

// ---- BILL HTML TEMPLATE ----
function buildBillHTML({ billNumber, dateStr, timeStr, total, pharmacyName, pharmacyAddress, pharmacyPhone, cashier, paymentMethod, items, discount }) {
  const itemRows = items.map(e => `
    <tr>
      <td>${escHtml(e.name)}</td>
      <td style="text-align:center">${e.qty} ${escHtml(e.unit)}</td>
      <td style="text-align:right">Rs. ${e.price.toFixed(2)}</td>
      <td style="text-align:right">Rs. ${(e.price * e.qty).toFixed(2)}</td>
    </tr>
  `).join('');

  const discountRow = discount > 0 ? `
    <div class="total-row" style="font-size:11px;color:#555">
      <span>DISCOUNT</span>
      <span>- Rs. ${discount.toFixed(2)}</span>
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>${billNumber} — ${pharmacyName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      color: #111;
      background: #fff;
      width: 380px;
      margin: 0 auto;
      padding: 16px;
    }
    .header { text-align: center; border-bottom: 2px dashed #aaa; padding-bottom: 10px; margin-bottom: 10px; }
    .pharmacy-name { font-size: 18px; font-weight: bold; letter-spacing: 1px; margin-bottom: 4px; }
    .pharmacy-sub { font-size: 11px; color: #555; line-height: 1.6; }
    .bill-meta { margin: 8px 0; font-size: 11px; line-height: 1.7; }
    .bill-meta-row { display: flex; justify-content: space-between; }
    .bill-meta strong { color: #000; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    thead th {
      font-size: 11px;
      text-transform: uppercase;
      border-top: 1px dashed #aaa;
      border-bottom: 1px dashed #aaa;
      padding: 5px 2px;
      text-align: left;
    }
    thead th:nth-child(2) { text-align: center; }
    thead th:nth-child(3),
    thead th:nth-child(4) { text-align: right; }
    td { padding: 5px 2px; font-size: 12px; vertical-align: top; }
    .total-section { border-top: 2px dashed #aaa; padding-top: 8px; margin-top: 4px; }
    .total-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 3px; }
    .grand-total { font-size: 16px; font-weight: bold; margin-top: 4px; }
    .footer { border-top: 1px dashed #aaa; margin-top: 10px; padding-top: 8px; text-align: center; font-size: 10px; color: #777; line-height: 1.7; }
    @media print {
      body { width: 100%; }
      @page { margin: 0.5cm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="pharmacy-name">${escHtml(pharmacyName)}</div>
    <div class="pharmacy-sub">
      ${pharmacyAddress ? escHtml(pharmacyAddress) + '<br>' : ''}
      ${pharmacyPhone ? 'Tel: ' + escHtml(pharmacyPhone) : ''}
    </div>
  </div>

  <div class="bill-meta">
    <div class="bill-meta-row"><span>Bill No:</span><strong>${escHtml(billNumber)}</strong></div>
    <div class="bill-meta-row"><span>Date:</span><strong>${escHtml(dateStr)}</strong></div>
    <div class="bill-meta-row"><span>Time:</span><strong>${escHtml(timeStr)}</strong></div>
    <div class="bill-meta-row"><span>Cashier:</span><strong>${escHtml(cashier)}</strong></div>
    <div class="bill-meta-row"><span>Payment:</span><strong>${escHtml(paymentMethod)}</strong></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Qty</th>
        <th>Price</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="total-section">
    ${discountRow}
    <div class="total-row grand-total">
      <span>TOTAL</span>
      <span>Rs. ${total.toFixed(2)}</span>
    </div>
  </div>

  <div class="footer">
    Thank you for your purchase!<br>
    Please keep this receipt for future reference.<br>
    — ${escHtml(pharmacyName)} —
  </div>
</body>
</html>`;
}

// ---- LOGOUT ----
async function logout() {
  if (cart.length > 0) {
    if (!confirm('You have items in the cart. Are you sure you want to log out?')) return;
  }
  try {
    await fetch('/api/logout', { method: 'POST' });
  } catch (e) {}
  sessionStorage.removeItem('pharmacare_session');
  window.location.replace('login.html');
}

// ---- UTILS ----
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('pos-toast');
  t.textContent = msg;
  t.className = 'pos-toast ' + type;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}
