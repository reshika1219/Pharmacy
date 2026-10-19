/* ═══════════════════════════════════════════════════════
   NexusPOS — Admin Dashboard Controller
   ═══════════════════════════════════════════════════════ */

'use strict';

// ─── State ────────────────────────────────────────────────
const state = {
  session: JSON.parse(sessionStorage.getItem('pos_session') || 'null'),
  config: {},
  products: [],
  categories: [],
  customers: [],
  suppliers: [],
  currentTab: 'dashboard',
  editingProduct: null,
  editingCategory: null,
  editingCustomer: null,
  editingSupplier: null,
  viewingOrderId: null,
  charts: {}
};

// ─── Helpers ──────────────────────────────────────────────
const $ = id => document.getElementById(id);
const curr = v => `${state.config.currency || '$'}${Number(v || 0).toFixed(2)}`;
const fmtDate = d => d ? new Date(d).toLocaleDateString() : '—';

function toast(msg, type = 'success') {
  const c = $('toast-container');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  el.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  c.appendChild(el);
  setTimeout(() => { el.classList.add('hide'); el.addEventListener('animationend', () => el.remove()); }, 3000);
}

async function api(path, method = 'GET', body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`/api${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function openModal(id) { $(id).classList.add('open'); }
function closeModal(id) { $(id).classList.remove('open'); }

function stockBadge(stock, minStock) {
  if (stock <= 0) return `<span class="badge badge-rose">Out of Stock</span>`;
  if (stock <= minStock) return `<span class="badge badge-amber">Low Stock</span>`;
  return `<span class="badge badge-emerald">In Stock</span>`;
}

function formatDateLocal() {
  return new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

// ─── Navigation ───────────────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  $(`tab-${tab}`).classList.add('active');
  $(`nav-${tab}`)?.classList.add('active');
  $('page-title').textContent = {
    dashboard: 'Dashboard', pos: 'Point of Sale', products: 'Products',
    stock: 'Stock In', categories: 'Categories', orders: 'Orders',
    customers: 'Customers', suppliers: 'Suppliers', expenses: 'Expenses',
    users: 'Users', settings: 'Settings'
  }[tab] || tab;
  state.currentTab = tab;

  if (tab === 'dashboard') loadDashboard();
  else if (tab === 'products') loadProducts();
  else if (tab === 'stock') loadBatches();
  else if (tab === 'categories') loadCategories();
  else if (tab === 'orders') loadOrders();
  else if (tab === 'customers') loadCustomers();
  else if (tab === 'suppliers') loadSuppliers();
  else if (tab === 'expenses') loadExpenses();
  else if (tab === 'users') loadUsers();
  else if (tab === 'settings') loadSettings();
  else if (tab === 'pos') renderPOS();
}

document.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// Modal close buttons
document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => closeModal(btn.dataset.close));
});
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });
});

// ─── Dashboard ────────────────────────────────────────────
async function loadDashboard() {
  try {
    const d = await api('/reports/dashboard');

    $('ds-today-sales').textContent = curr(d.todaySales);
    $('ds-today-orders').textContent = `${d.todayOrders} orders today`;
    $('ds-gross-profit').textContent = curr(d.todayGrossProfit);
    $('ds-net-profit').textContent = `Net: ${curr(d.todayNetProfit)}`;
    $('ds-all-sales').textContent = curr(d.allTimeSales);
    $('ds-all-profit').textContent = `Profit: ${curr(d.allTimeProfit)}`;
    $('ds-customers').textContent = d.totalCustomers;
    $('ds-stock-val').textContent = curr(d.stockValuation);
    $('ds-low-stock').textContent = `${d.lowStockItems.length} low stock items`;
    $('ds-expenses').textContent = curr(d.todayExpenses);

    drawSalesChart(d);
    drawProfitChart(d);
    renderTopProducts(d.topProducts);
    renderLowStock(d.lowStockItems);
  } catch (e) {
    toast('Failed to load dashboard', 'error');
  }
}

function drawSalesChart(d) {
  const ctx = $('chart-sales').getContext('2d');
  if (state.charts.sales) state.charts.sales.destroy();
  state.charts.sales = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: d.weeklyLabels.map(l => {
        const dt = new Date(l);
        return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      }),
      datasets: [{
        label: 'Revenue',
        data: d.weeklySales,
        backgroundColor: 'rgba(99,102,241,0.25)',
        borderColor: '#6366f1',
        borderWidth: 2,
        borderRadius: 6,
        fill: true
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 11 } } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 11 }, callback: v => `${state.config.currency || '$'}${v}` } }
      }
    }
  });
}

function drawProfitChart(d) {
  const ctx = $('chart-profit').getContext('2d');
  if (state.charts.profit) state.charts.profit.destroy();
  state.charts.profit = new Chart(ctx, {
    type: 'line',
    data: {
      labels: d.weeklyLabels.map(l => new Date(l).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })),
      datasets: [{
        label: 'Net Profit',
        data: d.weeklyProfits,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.08)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#10b981',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 11 } } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 11 }, callback: v => `${state.config.currency || '$'}${v}` } }
      }
    }
  });
}

function renderTopProducts(products) {
  const el = $('top-products-list');
  if (!products.length) { el.innerHTML = '<div class="empty-state"><p>No sales data this month</p></div>'; return; }
  const max = Math.max(...products.map(p => p.units_sold), 1);
  el.innerHTML = products.map(p => `
    <div style="margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <span style="font-size:0.85rem;font-weight:500;">${p.name}</span>
        <span style="font-size:0.78rem;color:var(--text-2);">${p.units_sold} sold · ${curr(p.revenue)}</span>
      </div>
      <div style="height:4px;background:var(--surface-2);border-radius:4px;overflow:hidden;">
        <div style="width:${(p.units_sold/max)*100}%;height:100%;background:var(--indigo);border-radius:4px;transition:width 0.6s ease;"></div>
      </div>
    </div>
  `).join('');
}

function renderLowStock(items) {
  const badge = $('low-stock-badge');
  const el = $('low-stock-list');
  badge.textContent = items.length;
  if (!items.length) { el.innerHTML = '<div class="empty-state"><p>All stocked up! 🎉</p></div>'; return; }
  el.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Product</th><th>Stock</th><th>Min</th></tr></thead>
    <tbody>
      ${items.map(i => `
        <tr>
          <td style="font-weight:500">${i.name}</td>
          <td>${i.stock <= 0 ? `<span class="badge badge-rose">${i.stock}</span>` : `<span class="badge badge-amber">${i.stock}</span>`}</td>
          <td style="color:var(--text-2)">${i.min_stock}</td>
        </tr>
      `).join('')}
    </tbody>
  </table></div>`;
}

// ─── Products ─────────────────────────────────────────────
async function loadProducts() {
  try {
    const [products, categories] = await Promise.all([api('/products'), api('/categories')]);
    state.products = products;
    state.categories = categories;
    renderProductsTable(products);
    populateCategoryFilter(categories);
    populateCategorySelect('prod-category', categories);
  } catch (e) { toast('Failed to load products', 'error'); }
}

function renderProductsTable(products) {
  const tbody = $('products-tbody');
  if (!products.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><p>No products yet. Add your first product.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = products.map(p => `
    <tr>
      <td><div style="font-weight:600">${p.name}</div><div style="font-size:0.72rem;color:var(--text-2)">${p.unit}</div></td>
      <td><code style="font-size:0.78rem;color:var(--text-2)">${p.sku || '—'}</code></td>
      <td>${p.category_name ? `<span class="badge" style="background:${p.category_color}22;color:${p.category_color}">${p.category_name}</span>` : '<span class="badge badge-gray">—</span>'}</td>
      <td>${p.track_inventory ? `<span class="${p.current_stock <= 0 ? 'stock-out' : p.current_stock <= p.min_stock ? 'stock-low' : 'stock-ok'}" style="font-weight:600">${p.current_stock}</span> ${p.unit}` : '<span class="badge badge-gray">Not tracked</span>'}</td>
      <td style="font-weight:600">${curr(p.sell_price)}</td>
      <td>${stockBadge(p.current_stock, p.min_stock)}</td>
      <td class="td-actions">
        <button class="btn btn-ghost btn-sm" onclick="editProduct(${p.id})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id}, '${p.name.replace(/'/g,"\\'")}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

function populateCategoryFilter(categories) {
  const el = $('products-cat-filter');
  el.innerHTML = '<option value="">All Categories</option>' + categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

function populateCategorySelect(elId, categories) {
  const el = $(elId);
  const current = el ? el.value : '';
  if (el) el.innerHTML = '<option value="">No Category</option>' + categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  if (current && el) el.value = current;
}

$('products-search').addEventListener('input', () => {
  const q = $('products-search').value.toLowerCase();
  const cat = $('products-cat-filter').value;
  const filtered = state.products.filter(p =>
    (p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q)) &&
    (!cat || String(p.category_id) === cat)
  );
  renderProductsTable(filtered);
});

$('products-cat-filter').addEventListener('change', () => {
  const q = $('products-search').value.toLowerCase();
  const cat = $('products-cat-filter').value;
  const filtered = state.products.filter(p =>
    (p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q)) &&
    (!cat || String(p.category_id) === cat)
  );
  renderProductsTable(filtered);
});

$('btn-add-product').addEventListener('click', () => {
  state.editingProduct = null;
  $('modal-product-title').textContent = 'Add Product';
  $('prod-name').value = '';
  $('prod-sku').value = '';
  $('prod-barcode').value = '';
  $('prod-desc').value = '';
  $('prod-min-stock').value = '0';
  $('prod-track').checked = true;
  $('prod-unit').value = 'pcs';
  if (state.categories.length) populateCategorySelect('prod-category', state.categories);
  openModal('modal-product');
  $('prod-name').focus();
});

window.editProduct = (id) => {
  const p = state.products.find(x => x.id === id);
  if (!p) return;
  state.editingProduct = id;
  $('modal-product-title').textContent = 'Edit Product';
  $('prod-name').value = p.name || '';
  $('prod-sku').value = p.sku || '';
  $('prod-barcode').value = p.barcode || '';
  $('prod-desc').value = p.description || '';
  $('prod-min-stock').value = p.min_stock || 0;
  $('prod-track').checked = !!p.track_inventory;
  $('prod-unit').value = p.unit || 'pcs';
  populateCategorySelect('prod-category', state.categories);
  if (p.category_id) $('prod-category').value = String(p.category_id);
  openModal('modal-product');
};

$('btn-save-product').addEventListener('click', async () => {
  const name = $('prod-name').value.trim();
  if (!name) { toast('Product name is required', 'error'); return; }
  const body = {
    name,
    sku: $('prod-sku').value.trim() || undefined,
    barcode: $('prod-barcode').value.trim(),
    category_id: $('prod-category').value ? Number($('prod-category').value) : null,
    unit: $('prod-unit').value,
    description: $('prod-desc').value.trim(),
    min_stock: Number($('prod-min-stock').value) || 0,
    track_inventory: $('prod-track').checked
  };
  try {
    if (state.editingProduct) await api(`/products/${state.editingProduct}`, 'PUT', body);
    else await api('/products', 'POST', body);
    closeModal('modal-product');
    toast(state.editingProduct ? 'Product updated' : 'Product added');
    await loadProducts();
  } catch (e) { toast(e.message, 'error'); }
});

window.deleteProduct = async (id, name) => {
  if (!confirm(`Delete "${name}"? This will also remove all stock batches.`)) return;
  try {
    await api(`/products/${id}`, 'DELETE');
    toast('Product deleted');
    await loadProducts();
  } catch (e) { toast(e.message, 'error'); }
};

// ─── Stock / Batches ──────────────────────────────────────
async function loadBatches() {
  try {
    const [batches, products] = await Promise.all([api('/batches'), api('/products')]);
    state.products = products;
    const tbody = $('batches-tbody');
    if (!batches.length) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><p>No stock received yet.</p></div></td></tr>`;
    } else {
      tbody.innerHTML = batches.map(b => `
        <tr>
          <td style="font-weight:600">${b.product_name}</td>
          <td><code style="font-size:0.78rem;color:var(--text-2)">${b.batch_ref || '—'}</code></td>
          <td>${b.qty_received}</td>
          <td><span class="${b.qty_remaining <= 0 ? 'stock-out' : 'stock-ok'}" style="font-weight:600">${b.qty_remaining}</span></td>
          <td>${curr(b.cost_price)}</td>
          <td style="font-weight:600">${curr(b.sell_price)}</td>
          <td>${b.supplier || '—'}</td>
          <td>${fmtDate(b.date_added)}</td>
        </tr>
      `).join('');
    }

    // Populate stock-in product select
    const sel = $('stock-product-id');
    sel.innerHTML = '<option value="">Select product…</option>' + products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    // Populate adjust product select
    const sel2 = $('adj-product-id');
    sel2.innerHTML = '<option value="">Select product…</option>' + products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  } catch (e) { toast('Failed to load stock', 'error'); }
}

$('btn-add-stock').addEventListener('click', () => {
  $('stock-qty').value = '';
  $('stock-batch-ref').value = '';
  $('stock-cost').value = '';
  $('stock-sell').value = '';
  $('stock-supplier').value = '';
  $('stock-date').value = new Date().toISOString().split('T')[0];
  $('stock-notes').value = '';
  openModal('modal-stock');
});

$('btn-adjust-stock').addEventListener('click', () => {
  $('adj-qty').value = '';
  $('adj-reason').value = '';
  openModal('modal-adjust');
});

$('btn-save-stock').addEventListener('click', async () => {
  const product_id = $('stock-product-id').value;
  const qty = Number($('stock-qty').value);
  if (!product_id) { toast('Select a product', 'error'); return; }
  if (!qty || qty < 1) { toast('Quantity must be at least 1', 'error'); return; }
  try {
    await api('/stock-in', 'POST', {
      product_id: Number(product_id),
      qty,
      batch_ref: $('stock-batch-ref').value.trim(),
      cost_price: Number($('stock-cost').value) || 0,
      sell_price: Number($('stock-sell').value) || 0,
      supplier: $('stock-supplier').value.trim(),
      date: $('stock-date').value,
      notes: $('stock-notes').value.trim()
    });
    closeModal('modal-stock');
    toast('Stock received');
    await loadBatches();
  } catch (e) { toast(e.message, 'error'); }
});

$('btn-save-adjust').addEventListener('click', async () => {
  const product_id = $('adj-product-id').value;
  const qty_change = Number($('adj-qty').value);
  if (!product_id) { toast('Select a product', 'error'); return; }
  if (!qty_change) { toast('Enter a non-zero quantity change', 'error'); return; }
  try {
    await api('/stock-adjust', 'POST', {
      product_id: Number(product_id),
      qty_change,
      reason: $('adj-reason').value.trim() || 'Manual Adjustment'
    });
    closeModal('modal-adjust');
    toast('Stock adjusted');
    await loadBatches();
  } catch (e) { toast(e.message, 'error'); }
});

// ─── Categories ───────────────────────────────────────────
async function loadCategories() {
  try {
    const cats = await api('/categories');
    state.categories = cats;
    const tbody = $('categories-tbody');
    tbody.innerHTML = cats.map(c => `
      <tr>
        <td style="font-weight:600">${c.name}</td>
        <td><span style="display:inline-block;width:24px;height:24px;border-radius:6px;background:${c.color};vertical-align:middle;"></span> <code style="color:var(--text-2);font-size:0.78rem;">${c.color}</code></td>
        <td class="td-actions">
          <button class="btn btn-ghost btn-sm" onclick="editCategory(${c.id})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteCategory(${c.id}, '${c.name.replace(/'/g,"\\'")}')">Delete</button>
        </td>
      </tr>
    `).join('') || `<tr><td colspan="3"><div class="empty-state"><p>No categories yet.</p></div></td></tr>`;
  } catch (e) { toast('Failed to load categories', 'error'); }
}

$('btn-add-category').addEventListener('click', () => {
  state.editingCategory = null;
  $('modal-cat-title').textContent = 'Add Category';
  $('cat-name').value = '';
  $('cat-color').value = '#6366f1';
  openModal('modal-category');
});

window.editCategory = (id) => {
  const c = state.categories.find(x => x.id === id);
  if (!c) return;
  state.editingCategory = id;
  $('modal-cat-title').textContent = 'Edit Category';
  $('cat-name').value = c.name;
  $('cat-color').value = c.color || '#6366f1';
  openModal('modal-category');
};

$('btn-save-category').addEventListener('click', async () => {
  const name = $('cat-name').value.trim();
  if (!name) { toast('Name required', 'error'); return; }
  const body = { name, color: $('cat-color').value };
  try {
    if (state.editingCategory) await api(`/categories/${state.editingCategory}`, 'PUT', body);
    else await api('/categories', 'POST', body);
    closeModal('modal-category');
    toast(state.editingCategory ? 'Category updated' : 'Category added');
    await loadCategories();
  } catch (e) { toast(e.message, 'error'); }
});

window.deleteCategory = async (id, name) => {
  if (!confirm(`Delete category "${name}"?`)) return;
  try {
    await api(`/categories/${id}`, 'DELETE');
    toast('Category deleted');
    await loadCategories();
  } catch (e) { toast(e.message, 'error'); }
};

// ─── Orders ───────────────────────────────────────────────
async function loadOrders() {
  const dateFrom = $('orders-date-from').value;
  const dateTo = $('orders-date-to').value;
  let url = '/orders?limit=200';
  if (dateFrom) url += `&date_from=${dateFrom}`;
  if (dateTo) url += `&date_to=${dateTo}`;
  try {
    const orders = await api(url);
    const tbody = $('orders-tbody');
    if (!orders.length) {
      tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><p>No orders found.</p></div></td></tr>`;
      return;
    }
    tbody.innerHTML = orders.map(o => `
      <tr>
        <td><code style="font-weight:600;color:var(--indigo)">${o.order_number}</code></td>
        <td>${o.date} <span style="color:var(--text-2);font-size:0.75rem">${o.time}</span></td>
        <td>${o.cashier}</td>
        <td>${o.customer_name || '<span style="color:var(--text-2)">Walk-in</span>'}</td>
        <td>${o.items ? o.items.length : '—'}</td>
        <td style="font-weight:700">${curr(o.total)}</td>
        <td><span class="badge badge-sky">${o.payment_method}</span></td>
        <td>${o.status === 'void' ? '<span class="badge badge-rose">Voided</span>' : '<span class="badge badge-emerald">Completed</span>'}</td>
        <td class="td-actions">
          <button class="btn btn-ghost btn-sm" onclick="viewOrder(${o.id})">View</button>
          ${o.status !== 'void' ? `<button class="btn btn-danger btn-sm" onclick="voidOrder(${o.id})">Void</button>` : ''}
        </td>
      </tr>
    `).join('');
  } catch (e) { toast('Failed to load orders', 'error'); }
}

$('btn-orders-filter').addEventListener('click', loadOrders);

window.viewOrder = async (id) => {
  try {
    const o = await api(`/orders/${id}`);
    state.viewingOrderId = id;
    $('modal-order-title').textContent = `Order ${o.order_number}`;
    $('modal-order-body').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
        <div><div style="font-size:0.72rem;color:var(--text-2);margin-bottom:2px;">DATE & TIME</div><div style="font-weight:600">${o.date} ${o.time}</div></div>
        <div><div style="font-size:0.72rem;color:var(--text-2);margin-bottom:2px;">CASHIER</div><div style="font-weight:600">${o.cashier}</div></div>
        <div><div style="font-size:0.72rem;color:var(--text-2);margin-bottom:2px;">CUSTOMER</div><div style="font-weight:600">${o.customer_name || 'Walk-in'}</div></div>
        <div><div style="font-size:0.72rem;color:var(--text-2);margin-bottom:2px;">PAYMENT</div><div>${o.payment_method}</div></div>
      </div>
      <div class="table-wrap" style="margin-bottom:16px;">
        <table>
          <thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Disc%</th><th>Total</th></tr></thead>
          <tbody>
            ${o.items.map(i => `<tr>
              <td>${i.product_name}</td>
              <td>${i.qty} ${i.product_unit}</td>
              <td>${curr(i.unit_price)}</td>
              <td>${i.discount_pct ? i.discount_pct + '%' : '—'}</td>
              <td style="font-weight:600">${curr(i.line_total)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div style="border-top:1px solid var(--border);padding-top:12px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:var(--text-2)">Subtotal</span><span>${curr(o.subtotal)}</span></div>
        ${o.discount_amount ? `<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:var(--text-2)">Discount</span><span style="color:var(--rose)">-${curr(o.discount_amount)}</span></div>` : ''}
        ${o.tax_amount ? `<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:var(--text-2)">Tax</span><span>${curr(o.tax_amount)}</span></div>` : ''}
        <div style="display:flex;justify-content:space-between;font-size:1.1rem;font-weight:800;"><span>Total</span><span style="color:var(--indigo)">${curr(o.total)}</span></div>
        ${o.amount_tendered > 0 ? `<div style="display:flex;justify-content:space-between;margin-top:8px;"><span style="color:var(--text-2)">Tendered</span><span>${curr(o.amount_tendered)}</span></div><div style="display:flex;justify-content:space-between;"><span style="color:var(--text-2)">Change</span><span>${curr(o.change_due)}</span></div>` : ''}
      </div>
      ${o.notes ? `<div style="margin-top:12px;padding:10px;background:var(--surface);border-radius:8px;font-size:0.82rem;color:var(--text-2)">📝 ${o.notes}</div>` : ''}
    `;
    const voidBtn = $('btn-void-order');
    voidBtn.style.display = o.status === 'void' ? 'none' : '';
    voidBtn.onclick = () => voidOrder(id);
    openModal('modal-order-detail');
  } catch (e) { toast('Failed to load order', 'error'); }
};

window.voidOrder = async (id) => {
  if (!confirm('Void this order? This will restore stock.')) return;
  try {
    await api(`/orders/${id}/void`, 'POST');
    closeModal('modal-order-detail');
    toast('Order voided and stock restored');
    await loadOrders();
  } catch (e) { toast(e.message, 'error'); }
};

// ─── Customers ────────────────────────────────────────────
async function loadCustomers() {
  const q = $('customers-search')?.value || '';
  try {
    const customers = await api(`/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`);
    state.customers = customers;
    const tbody = $('customers-tbody');
    tbody.innerHTML = customers.map(c => `
      <tr>
        <td style="font-weight:600">${c.name}</td>
        <td>${c.phone || '—'}</td>
        <td>${c.email || '—'}</td>
        <td style="font-weight:600">${curr(c.total_spent)}</td>
        <td><span class="badge badge-indigo">${c.loyalty_points || 0} pts</span></td>
        <td class="td-actions">
          <button class="btn btn-ghost btn-sm" onclick="editCustomer(${c.id})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteCustomer(${c.id}, '${c.name.replace(/'/g,"\\'")}')">Delete</button>
        </td>
      </tr>
    `).join('') || `<tr><td colspan="6"><div class="empty-state"><p>No customers yet.</p></div></td></tr>`;
  } catch (e) { toast('Failed to load customers', 'error'); }
}

$('customers-search').addEventListener('input', loadCustomers);

$('btn-add-customer').addEventListener('click', () => {
  state.editingCustomer = null;
  $('modal-cust-title').textContent = 'Add Customer';
  $('cust-name').value = '';
  $('cust-phone').value = '';
  $('cust-email').value = '';
  $('cust-address').value = '';
  openModal('modal-customer');
});

window.editCustomer = (id) => {
  const c = state.customers.find(x => x.id === id);
  if (!c) return;
  state.editingCustomer = id;
  $('modal-cust-title').textContent = 'Edit Customer';
  $('cust-name').value = c.name;
  $('cust-phone').value = c.phone || '';
  $('cust-email').value = c.email || '';
  $('cust-address').value = c.address || '';
  openModal('modal-customer');
};

$('btn-save-customer').addEventListener('click', async () => {
  const name = $('cust-name').value.trim();
  if (!name) { toast('Name required', 'error'); return; }
  const body = { name, phone: $('cust-phone').value.trim(), email: $('cust-email').value.trim(), address: $('cust-address').value.trim() };
  try {
    if (state.editingCustomer) await api(`/customers/${state.editingCustomer}`, 'PUT', body);
    else await api('/customers', 'POST', body);
    closeModal('modal-customer');
    toast(state.editingCustomer ? 'Customer updated' : 'Customer added');
    await loadCustomers();
  } catch (e) { toast(e.message, 'error'); }
});

window.deleteCustomer = async (id, name) => {
  if (!confirm(`Delete customer "${name}"?`)) return;
  try {
    await api(`/customers/${id}`, 'DELETE');
    toast('Customer deleted');
    await loadCustomers();
  } catch (e) { toast(e.message, 'error'); }
};

// ─── Suppliers ────────────────────────────────────────────
async function loadSuppliers() {
  try {
    const sups = await api('/suppliers');
    state.suppliers = sups;
    const tbody = $('suppliers-tbody');
    tbody.innerHTML = sups.map(s => `
      <tr>
        <td style="font-weight:600">${s.name}</td>
        <td>${s.contact_person || '—'}</td>
        <td>${s.phone || '—'}</td>
        <td>${s.email || '—'}</td>
        <td class="td-actions">
          <button class="btn btn-ghost btn-sm" onclick="editSupplier(${s.id})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteSupplier(${s.id}, '${s.name.replace(/'/g,"\\'")}')">Delete</button>
        </td>
      </tr>
    `).join('') || `<tr><td colspan="5"><div class="empty-state"><p>No suppliers yet.</p></div></td></tr>`;
  } catch (e) { toast('Failed to load suppliers', 'error'); }
}

$('btn-add-supplier').addEventListener('click', () => {
  state.editingSupplier = null;
  $('modal-sup-title').textContent = 'Add Supplier';
  ['sup-name','sup-contact','sup-phone','sup-email','sup-address','sup-notes'].forEach(id => $(id).value = '');
  openModal('modal-supplier');
});

window.editSupplier = (id) => {
  const s = state.suppliers.find(x => x.id === id);
  if (!s) return;
  state.editingSupplier = id;
  $('modal-sup-title').textContent = 'Edit Supplier';
  $('sup-name').value = s.name || '';
  $('sup-contact').value = s.contact_person || '';
  $('sup-phone').value = s.phone || '';
  $('sup-email').value = s.email || '';
  $('sup-address').value = s.address || '';
  $('sup-notes').value = s.notes || '';
  openModal('modal-supplier');
};

$('btn-save-supplier').addEventListener('click', async () => {
  const name = $('sup-name').value.trim();
  if (!name) { toast('Name required', 'error'); return; }
  const body = { name, contact_person: $('sup-contact').value.trim(), phone: $('sup-phone').value.trim(), email: $('sup-email').value.trim(), address: $('sup-address').value.trim(), notes: $('sup-notes').value.trim() };
  try {
    if (state.editingSupplier) await api(`/suppliers/${state.editingSupplier}`, 'PUT', body);
    else await api('/suppliers', 'POST', body);
    closeModal('modal-supplier');
    toast(state.editingSupplier ? 'Supplier updated' : 'Supplier added');
    await loadSuppliers();
  } catch (e) { toast(e.message, 'error'); }
});

window.deleteSupplier = async (id, name) => {
  if (!confirm(`Delete supplier "${name}"?`)) return;
  try {
    await api(`/suppliers/${id}`, 'DELETE');
    toast('Supplier deleted');
    await loadSuppliers();
  } catch (e) { toast(e.message, 'error'); }
};

// ─── Expenses ─────────────────────────────────────────────
async function loadExpenses() {
  try {
    const expenses = await api('/expenses');
    const tbody = $('expenses-tbody');
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    tbody.innerHTML = expenses.map(e => `
      <tr>
        <td>${e.date}</td>
        <td style="font-weight:600">${e.category}</td>
        <td style="color:var(--text-2)">${e.description || '—'}</td>
        <td style="font-weight:700;color:var(--rose)">${curr(e.amount)}</td>
        <td style="color:var(--text-2)">${e.created_by || '—'}</td>
        <td><button class="btn btn-danger btn-sm" onclick="deleteExpense(${e.id})">Delete</button></td>
      </tr>
    `).join('') || `<tr><td colspan="6"><div class="empty-state"><p>No expenses recorded.</p></div></td></tr>`;

    // Show total if there are expenses
    if (expenses.length) {
      const footRow = document.createElement('tr');
      footRow.innerHTML = `<td colspan="3" style="font-weight:700;text-align:right;border-top:1px solid var(--border);">Total</td><td style="font-weight:800;color:var(--rose);border-top:1px solid var(--border);">${curr(total)}</td><td colspan="2" style="border-top:1px solid var(--border);"></td>`;
      tbody.appendChild(footRow);
    }
  } catch (e) { toast('Failed to load expenses', 'error'); }
}

$('btn-add-expense').addEventListener('click', () => {
  $('exp-category').value = '';
  $('exp-amount').value = '';
  $('exp-date').value = new Date().toISOString().split('T')[0];
  $('exp-desc').value = '';
  openModal('modal-expense');
});

$('btn-save-expense').addEventListener('click', async () => {
  const category = $('exp-category').value.trim();
  const amount = Number($('exp-amount').value);
  if (!category) { toast('Category required', 'error'); return; }
  if (!amount || amount <= 0) { toast('Enter a valid amount', 'error'); return; }
  try {
    await api('/expenses', 'POST', { category, amount, date: $('exp-date').value, description: $('exp-desc').value.trim() });
    closeModal('modal-expense');
    toast('Expense recorded');
    await loadExpenses();
  } catch (e) { toast(e.message, 'error'); }
});

window.deleteExpense = async (id) => {
  if (!confirm('Delete this expense?')) return;
  try {
    await api(`/expenses/${id}`, 'DELETE');
    toast('Expense deleted');
    await loadExpenses();
  } catch (e) { toast(e.message, 'error'); }
};

// ─── Users ────────────────────────────────────────────────
async function loadUsers() {
  try {
    const users = await api('/users');
    const tbody = $('users-tbody');
    tbody.innerHTML = users.map(u => `
      <tr>
        <td style="font-weight:600">${u.username}</td>
        <td>${u.full_name || '—'}</td>
        <td><span class="badge ${u.role === 'admin' ? 'badge-indigo' : 'badge-emerald'}">${u.role}</span></td>
        <td style="color:var(--text-2)">${u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
        <td><button class="btn btn-danger btn-sm" onclick="deleteUser(${u.id}, '${u.username}')">Delete</button></td>
      </tr>
    `).join('');
  } catch (e) { toast('Failed to load users', 'error'); }
}

$('btn-add-user').addEventListener('click', () => {
  $('user-fullname').value = '';
  $('user-username').value = '';
  $('user-pw').value = '';
  openModal('modal-user');
});

$('btn-save-user').addEventListener('click', async () => {
  const username = $('user-username').value.trim();
  const password = $('user-pw').value.trim();
  if (!username || !password) { toast('Username and password required', 'error'); return; }
  try {
    await api('/users', 'POST', { username, password, role: $('user-role').value, full_name: $('user-fullname').value.trim() });
    closeModal('modal-user');
    toast('User created');
    await loadUsers();
  } catch (e) { toast(e.message, 'error'); }
});

window.deleteUser = async (id, username) => {
  if (!confirm(`Delete user "${username}"?`)) return;
  try {
    await api(`/users/${id}`, 'DELETE');
    toast('User deleted');
    await loadUsers();
  } catch (e) { toast(e.message, 'error'); }
};

// ─── Settings ─────────────────────────────────────────────
async function loadSettings() {
  try {
    const cfg = await api('/config');
    state.config = cfg;
    $('cfg-business-name').value = cfg.businessName || '';
    $('cfg-business-address').value = cfg.businessAddress || '';
    $('cfg-business-phone').value = cfg.businessPhone || '';
    $('cfg-currency').value = cfg.currency || '$';
    $('cfg-tax-rate').value = cfg.taxRate || '0';
    $('cfg-receipt-footer').value = cfg.receiptFooter || '';
    $('cfg-loyalty-enabled').checked = cfg.loyaltyEnabled === 'true';
    $('cfg-loyalty-rate').value = cfg.loyaltyRate || '1';
  } catch (e) { toast('Failed to load settings', 'error'); }
}

$('btn-save-settings').addEventListener('click', async () => {
  const body = {
    businessName: $('cfg-business-name').value.trim(),
    businessAddress: $('cfg-business-address').value.trim(),
    businessPhone: $('cfg-business-phone').value.trim(),
    currency: $('cfg-currency').value.trim() || '$',
    taxRate: $('cfg-tax-rate').value || '0',
    receiptFooter: $('cfg-receipt-footer').value.trim(),
    loyaltyEnabled: String($('cfg-loyalty-enabled').checked),
    loyaltyRate: $('cfg-loyalty-rate').value || '1'
  };
  const adminPw = $('cfg-admin-pw').value;
  const cashierPw = $('cfg-cashier-pw').value;
  if (adminPw) body.newAdminPassword = adminPw;
  if (cashierPw) body.newCashierPassword = cashierPw;
  try {
    await api('/config', 'POST', body);
    state.config = { ...state.config, ...body };
    toast('Settings saved');
    $('cfg-admin-pw').value = '';
    $('cfg-cashier-pw').value = '';
  } catch (e) { toast(e.message, 'error'); }
});

// ─── Logout ───────────────────────────────────────────────
$('btn-logout').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  sessionStorage.removeItem('pos_session');
  window.location.href = 'login.html';
});

// ─── Open POS ─────────────────────────────────────────────
$('btn-open-pos').addEventListener('click', () => switchTab('pos'));

// ─── POS Renderer ─────────────────────────────────────────
let posCart = [];
let posCustomerId = null;

function renderPOS() {
  const root = $('pos-root');
  root.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 380px;gap:20px;height:calc(100vh - 130px);">
      <!-- LEFT: Product Grid -->
      <div style="display:flex;flex-direction:column;gap:16px;overflow:hidden;">
        <div style="display:flex;gap:10px;align-items:center;">
          <div class="search-wrap" style="flex:1;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input class="search-input" id="pos-search" placeholder="Search products or scan barcode…" style="width:100%;" autocomplete="off" />
          </div>
          <select class="select" id="pos-cat-filter" style="width:auto;">
            <option value="">All Categories</option>
            ${state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select>
        </div>
        <div id="pos-product-grid" style="overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;align-content:start;flex:1;padding-right:4px;"></div>
      </div>
      <!-- RIGHT: Cart -->
      <div style="display:flex;flex-direction:column;gap:0;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;">
        <!-- Cart Header -->
        <div style="padding:16px;border-bottom:1px solid var(--border);">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
            <span style="font-weight:700;font-size:0.95rem;">Cart</span>
            <button class="btn btn-ghost btn-sm" onclick="clearCart()" id="pos-clear-btn">Clear</button>
          </div>
          <select class="select" id="pos-customer" style="font-size:0.82rem;">
            <option value="">Walk-in Customer</option>
            ${state.customers.map(c => `<option value="${c.id}">${c.name}${c.phone ? ' · ' + c.phone : ''}</option>`).join('')}
          </select>
        </div>
        <!-- Cart Items -->
        <div id="pos-cart-items" style="flex:1;overflow-y:auto;padding:0 8px;"></div>
        <!-- Cart Totals -->
        <div style="border-top:1px solid var(--border);padding:16px;">
          <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <label style="font-size:0.8rem;color:var(--text-2);white-space:nowrap;">Discount (${state.config.currency || '$'})</label>
              <input class="input" type="number" id="pos-discount" value="0" min="0" step="0.01" style="width:80px;padding:6px 8px;font-size:0.85rem;" />
            </div>
            <div id="pos-totals-display" style="font-size:0.85rem;display:flex;flex-direction:column;gap:4px;"></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
            <button class="btn btn-ghost" id="pos-pay-cash" onclick="posCheckout('Cash')" style="flex-direction:column;height:56px;font-size:0.78rem;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              Cash
            </button>
            <button class="btn btn-ghost" id="pos-pay-card" onclick="posCheckout('Card')" style="flex-direction:column;height:56px;font-size:0.78rem;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              Card
            </button>
          </div>
          <button class="btn btn-primary" style="width:100%;height:48px;font-size:0.95rem;justify-content:center;" onclick="posCheckout('Cash')" id="pos-charge-btn">
            Charge — <span id="pos-charge-total">${state.config.currency || '$'}0.00</span>
          </button>
        </div>
      </div>
    </div>
  `;

  loadPOSProducts();

  $('pos-search').addEventListener('input', filterPOSProducts);
  $('pos-cat-filter').addEventListener('change', filterPOSProducts);
  $('pos-discount').addEventListener('input', updatePOSTotals);
  $('pos-customer').addEventListener('change', e => { posCustomerId = e.target.value || null; });
}

let posProducts = [];

async function loadPOSProducts() {
  try {
    posProducts = await api('/products');
    filterPOSProducts();
  } catch(e) {}
}

function filterPOSProducts() {
  const q = ($('pos-search')?.value || '').toLowerCase();
  const cat = $('pos-cat-filter')?.value;
  const filtered = posProducts.filter(p =>
    p.track_inventory === 0 || p.current_stock > 0
  ).filter(p =>
    (!q || p.name.toLowerCase().includes(q) || (p.sku||'').toLowerCase().includes(q) || (p.barcode||'').includes(q)) &&
    (!cat || String(p.category_id) === cat)
  );
  renderPOSGrid(filtered);
}

function renderPOSGrid(products) {
  const grid = $('pos-product-grid');
  if (!grid) return;
  if (!products.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-2)">No products found</div>`;
    return;
  }
  grid.innerHTML = products.map(p => `
    <button onclick="addToCart(${p.id})"
      style="background:var(--bg-3);border:1px solid var(--border);border-radius:var(--radius);padding:14px 10px;text-align:left;transition:all var(--transition);cursor:pointer;"
      onmouseenter="this.style.borderColor='var(--indigo)';this.style.background='rgba(99,102,241,0.08)'"
      onmouseleave="this.style.borderColor='var(--border)';this.style.background='var(--bg-3)'"
    >
      <div style="width:32px;height:32px;border-radius:8px;background:${p.category_color || '#6366f1'}22;display:flex;align-items:center;justify-content:center;margin-bottom:10px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="${p.category_color || '#6366f1'}" stroke-width="2" width="16" height="16"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
      </div>
      <div style="font-size:0.82rem;font-weight:600;margin-bottom:4px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${p.name}</div>
      <div style="font-size:0.95rem;font-weight:800;color:var(--indigo)">${curr(p.sell_price)}</div>
      ${p.track_inventory ? `<div style="font-size:0.68rem;color:${p.current_stock <= p.min_stock ? 'var(--amber)' : 'var(--text-2)'}">Stock: ${p.current_stock}</div>` : ''}
    </button>
  `).join('');
}

function addToCart(productId) {
  const p = posProducts.find(x => x.id === productId);
  if (!p) return;
  const existing = posCart.find(i => i.product_id === productId);
  if (existing) {
    if (p.track_inventory && existing.qty >= p.current_stock) {
      toast(`Only ${p.current_stock} ${p.unit} in stock`, 'error'); return;
    }
    existing.qty++;
    existing.line_total = existing.qty * existing.unit_price;
  } else {
    posCart.push({ product_id: productId, name: p.name, unit: p.unit, qty: 1, unit_price: p.sell_price, discount_pct: 0, line_total: p.sell_price });
  }
  renderPOSCart();
}

function renderPOSCart() {
  const el = $('pos-cart-items');
  if (!el) return;
  if (!posCart.length) {
    el.innerHTML = `<div style="padding:40px 16px;text-align:center;color:var(--text-3);font-size:0.85rem;">Cart is empty<br>Tap a product to add</div>`;
    updatePOSTotals();
    return;
  }
  el.innerHTML = posCart.map((item, idx) => `
    <div style="padding:10px 8px;border-bottom:1px solid var(--border);display:flex;gap:10px;align-items:center;">
      <div style="flex:1;min-width:0;">
        <div style="font-size:0.82rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${item.name}</div>
        <div style="font-size:0.75rem;color:var(--text-2)">${curr(item.unit_price)} × ${item.qty} = <span style="color:var(--text);font-weight:700">${curr(item.line_total)}</span></div>
      </div>
      <div style="display:flex;align-items:center;gap:4px;">
        <button onclick="changeCartQty(${idx},-1)" style="width:26px;height:26px;border:1px solid var(--border);border-radius:6px;background:var(--bg-3);color:var(--text);font-size:1rem;display:flex;align-items:center;justify-content:center;cursor:pointer;">−</button>
        <span style="width:28px;text-align:center;font-weight:600;font-size:0.85rem">${item.qty}</span>
        <button onclick="changeCartQty(${idx},1)" style="width:26px;height:26px;border:1px solid var(--border);border-radius:6px;background:var(--bg-3);color:var(--text);font-size:1rem;display:flex;align-items:center;justify-content:center;cursor:pointer;">+</button>
      </div>
      <button onclick="removeFromCart(${idx})" style="background:none;border:none;color:var(--rose);cursor:pointer;padding:4px;font-size:1rem;line-height:1;">✕</button>
    </div>
  `).join('');
  updatePOSTotals();
}

window.changeCartQty = (idx, delta) => {
  const item = posCart[idx];
  if (!item) return;
  const p = posProducts.find(x => x.id === item.product_id);
  const newQty = item.qty + delta;
  if (newQty <= 0) { posCart.splice(idx, 1); }
  else {
    if (p && p.track_inventory && newQty > p.current_stock) { toast(`Only ${p.current_stock} in stock`, 'error'); return; }
    item.qty = newQty;
    item.line_total = item.qty * item.unit_price;
  }
  renderPOSCart();
};

window.removeFromCart = (idx) => { posCart.splice(idx, 1); renderPOSCart(); };
window.clearCart = () => { posCart = []; posCustomerId = null; renderPOSCart(); };

function updatePOSTotals() {
  const subtotal = posCart.reduce((s, i) => s + i.line_total, 0);
  const discount = Number($('pos-discount')?.value || 0);
  const taxRate = Number(state.config.taxRate || 0);
  const afterDiscount = Math.max(0, subtotal - discount);
  const tax = afterDiscount * (taxRate / 100);
  const total = afterDiscount + tax;

  const totalsEl = $('pos-totals-display');
  if (totalsEl) {
    totalsEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;color:var(--text-2)"><span>Subtotal</span><span>${curr(subtotal)}</span></div>
      ${discount > 0 ? `<div style="display:flex;justify-content:space-between;color:var(--rose)"><span>Discount</span><span>-${curr(discount)}</span></div>` : ''}
      ${taxRate > 0 ? `<div style="display:flex;justify-content:space-between;color:var(--text-2)"><span>Tax (${taxRate}%)</span><span>${curr(tax)}</span></div>` : ''}
      <div style="display:flex;justify-content:space-between;font-weight:800;font-size:1rem;border-top:1px solid var(--border);padding-top:6px;margin-top:4px;"><span>Total</span><span style="color:var(--indigo)">${curr(total)}</span></div>
    `;
  }
  const chargeEl = $('pos-charge-total');
  if (chargeEl) chargeEl.textContent = curr(total);
}

window.posCheckout = async (paymentMethod) => {
  if (!posCart.length) { toast('Cart is empty', 'error'); return; }

  const subtotal = posCart.reduce((s, i) => s + i.line_total, 0);
  const discount = Number($('pos-discount')?.value || 0);
  const taxRate = Number(state.config.taxRate || 0);
  const afterDiscount = Math.max(0, subtotal - discount);
  const tax = afterDiscount * (taxRate / 100);
  const total = afterDiscount + tax;

  let amountTendered = total;
  if (paymentMethod === 'Cash') {
    const tendered = prompt(`Total: ${curr(total)}\nEnter cash tendered:`, total.toFixed(2));
    if (tendered === null) return;
    amountTendered = parseFloat(tendered) || total;
  }

  try {
    const result = await api('/orders/checkout', 'POST', {
      items: posCart.map(i => ({
        product_id: i.product_id,
        qty: i.qty,
        unit_price: i.unit_price,
        discount_pct: i.discount_pct || 0
      })),
      payment_method: paymentMethod,
      customer_id: posCustomerId ? Number(posCustomerId) : null,
      discount_amount: discount,
      amount_tendered: amountTendered
    });

    const changeDue = result.change_due;
    toast(`✓ Order ${result.order_number} — ${changeDue > 0 ? `Change: ${curr(changeDue)}` : 'Payment complete'}`, 'success');
    posCart = [];
    posCustomerId = null;
    if ($('pos-discount')) $('pos-discount').value = '0';
    if ($('pos-customer')) $('pos-customer').value = '';
    renderPOSCart();
    loadPOSProducts(); // refresh stock
  } catch (e) { toast(e.message, 'error'); }
};

// ─── Init ─────────────────────────────────────────────────
async function init() {
  // Set topbar date
  $('topbar-date').textContent = formatDateLocal();

  // Set user info
  if (state.session) {
    const name = state.session.full_name || state.session.username;
    $('user-name').textContent = name;
    $('user-avatar').textContent = name.charAt(0).toUpperCase();
  }

  // Load config
  try {
    state.config = await api('/config');
  } catch(e) {}

  // Load categories (needed for POS)
  try {
    state.categories = await api('/categories');
  } catch(e) {}

  // Load customers (needed for POS)
  try {
    state.customers = await api('/customers');
  } catch(e) {}

  // Load dashboard
  loadDashboard();
}

init();
