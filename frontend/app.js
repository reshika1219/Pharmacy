// ============================================================
// PharmaCare Inventory Management System
// app.js — Complete Application Logic
// ============================================================

// ---- SVG ICON STRINGS (Lucide-style) ----
const IC = {
  check:    `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
  warn:     `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
  ban:      `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>`,
  xcirc:    `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`,
  clock:    `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  banLg:    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>`,
  clockLg:  `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  xcircLg:  `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`,
  warnLg:   `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
  edit:     `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`,
  trash:    `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
  expWarn:  `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
  expClock: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  arrowDn:  `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>`,
  arrowUp:  `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>`,
};

// ---- DATA STORE ----
let db = {
  pharmacyName: 'PharmaCare',
  pharmacyAddress: '',
  pharmacyPhone: '',
  items: [],
  stockIn: [],
  stockOut: [],
  bills: [],
  expenses: []
};

let reportData = {
  totalSales: 0,
  totalCOGS: 0,
  grossProfit: 0,
  totalExpenses: 0,
  netProfit: 0,
  stockValuation: 0,
  topSelling: []
};

// ---- SYSTEM SYNC ----
async function syncWithServer() {
  try {
    const itemsRes = await fetch('/api/items');
    const items = await itemsRes.json();
    
    const configRes = await fetch('/api/config');
    const config = await configRes.json();
    
    const batchesRes = await fetch('/api/batches');
    const batches = await batchesRes.json();

    const salesRes = await fetch('/api/sales');
    const sales = await salesRes.json();

    const stockOutRes = await fetch('/api/stock-out');
    const stockOut = await stockOutRes.json();

    const expensesRes = await fetch('/api/expenses');
    const expenses = await expensesRes.json();

    const reportRes = await fetch('/api/reports/dashboard');
    if (reportRes.ok) {
      reportData = await reportRes.json();
    }

    db.items = items;
    db.pharmacyName = config.pharmacyName || 'PharmaCare';
    db.pharmacyAddress = config.pharmacyAddress || '';
    db.pharmacyPhone = config.pharmacyPhone || '';
    
    // Map batches to stockIn
    db.stockIn = batches.map(b => ({
      id: b.id,
      date: b.date_added,
      itemId: b.itemId,
      batch: b.batch_number,
      qty: b.qty_received,
      expiry: b.expiry,
      supplier: b.supplier,
      price: b.purchase_price,
      total: (b.qty_received * b.purchase_price).toFixed(2),
      notes: '',
      payment_status: b.payment_status || 'Pending',
      amount_paid: parseFloat(b.amount_paid || 0.0)
    }));

    // Map stockOut adjustments & sales to stockOut
    db.stockOut = stockOut.map(s => ({
      id: s.id,
      date: s.date,
      itemId: s.itemId,
      qty: s.qty,
      reason: s.reason,
      customer: s.billNumber || '',
      price: s.price,
      total: s.total,
      notes: s.cashier ? `By ${s.cashier}` : '',
      billId: s.billNumber
    }));

    db.bills = sales;
    db.expenses = expenses;

    document.getElementById('pharmacy-name-display').textContent = db.pharmacyName;

    // Re-render the active tab
    const activeTab = document.querySelector('.nav-item.active')?.dataset?.tab || 'dashboard';
    renderTab(activeTab);
  } catch (e) {
    console.error("Failed to sync database:", e);
  }
}

// ---- UTILITY FUNCTIONS ----
function today() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(val) {
  if (val === undefined || val === null || val === '') return '—';
  return 'Rs. ' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const now = new Date(); now.setHours(0,0,0,0);
  const exp = new Date(dateStr + 'T00:00:00');
  return Math.floor((exp - now) / 86400000);
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// ---- STOCK CALCULATIONS ----
function getStock(itemId) {
  const item = db.items.find(i => i.id === itemId);
  return item ? item.currentStock : 0;
}

function getNearestExpiry(itemId) {
  const item = db.items.find(i => i.id === itemId);
  return item ? item.expiry : null;
}

function getStockStatus(item) {
  const stock = getStock(item.id);
  const expiry = getNearestExpiry(item.id);
  const days = daysUntil(expiry);

  if (days !== null && days < 0) return 'expired';
  if (days !== null && days <= 90) return 'expiring';
  if (stock <= 0) return 'out';
  if (stock <= item.minStock) return 'low';
  return 'ok';
}

function statusLabel(s) {
  const icons = { ok: IC.check, low: IC.warn, out: IC.xcirc, expiring: IC.clock, expired: IC.ban };
  const text  = { ok: 'OK', low: 'Low Stock', out: 'Out of Stock', expiring: 'Expiring Soon', expired: 'Expired' };
  const cls   = { ok: 'badge-ok', low: 'badge-low', out: 'badge-out', expiring: 'badge-expiring', expired: 'badge-expired' };
  return `<span class="badge ${cls[s]}">${icons[s]} ${text[s]}</span>`;
}

// ---- NAV / TAB SWITCHING ----
const tabTitles = {
  dashboard: 'Dashboard',
  items: 'Items Catalog',
  in: 'Stock In (Batches)',
  out: 'Stock Out History',
  stock: 'Current Stock',
  alerts: 'Alerts',
  sales: 'Sales History',
  expenses: 'Expense Management',
  suppliers: 'Supplier Ledger & Payables'
};

const EXPORTABLE_TABS = ['items', 'in', 'out', 'stock', 'expenses', 'suppliers'];

const EXPORT_LABELS = {
  items: 'Export Items',
  in:    'Export Batches',
  out:   'Export Stock Out',
  stock: 'Export Stock',
  expenses: 'Export Expenses',
  suppliers: 'Export Supplier Ledger'
};

const ownerSession = JSON.parse(sessionStorage.getItem('pharmacare_session') || 'null');

function logout() {
  fetch('/api/logout', { method: 'POST' }).finally(() => {
    sessionStorage.removeItem('pharmacare_session');
    window.location.replace('login.html');
  });
}

function switchTab(tabName) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.tab === tabName));
  document.querySelectorAll('.tab-content').forEach(s => s.classList.toggle('active', s.id === 'tab-' + tabName));
  document.getElementById('page-title').textContent = tabTitles[tabName] || tabName;

  const exportBtn = document.getElementById('export-btn');
  if (EXPORTABLE_TABS.includes(tabName)) {
    exportBtn.style.display = '';
    exportBtn.querySelector('.export-label').textContent = EXPORT_LABELS[tabName];
  } else {
    exportBtn.style.display = 'none';
  }

  const quickAddBtn = document.getElementById('quick-add-btn');
  quickAddBtn.style.display = (tabName === 'dashboard') ? '' : 'none';

  renderTab(tabName);
}

function renderTab(tab) {
  if (tab === 'dashboard') renderDashboard();
  if (tab === 'items') renderItems();
  if (tab === 'in') renderStockIn();
  if (tab === 'out') renderStockOut();
  if (tab === 'stock') renderStock();
  if (tab === 'alerts') renderAlerts();
  if (tab === 'sales') renderSales();
  if (tab === 'expenses') renderExpenses();
  if (tab === 'suppliers') renderSuppliers();
  updateBadges();
}

// ---- DASHBOARD ----
function renderDashboard() {
  const allItems = db.items;
  const hasItems = allItems.length > 0;

  document.getElementById('onboarding-guide').style.display = hasItems ? 'none' : '';
  document.getElementById('dash-stats').style.display    = hasItems ? '' : 'none';
  document.getElementById('dash-panels').style.display   = hasItems ? '' : 'none';

  if (!hasItems) return;

  const totalItems = allItems.length;
  const inStock = allItems.filter(i => getStock(i.id) > 0).length;
  const lowStock = allItems.filter(i => { const s = getStockStatus(i); return s === 'low'; }).length;
  const expired = allItems.filter(i => { const s = getStockStatus(i); return s === 'expired' || s === 'expiring'; }).length;

  const todayStr = today();
  const todayIn  = db.stockIn.filter(r => r.date === todayStr).reduce((s,r) => s + r.qty, 0);
  const todayOut = db.stockOut.filter(r => r.date === todayStr).reduce((s,r) => s + r.qty, 0);

  document.getElementById('stat-total-items').textContent = totalItems;
  document.getElementById('stat-in-stock').textContent = inStock;
  document.getElementById('stat-low-stock').textContent = lowStock;
  document.getElementById('stat-expired').textContent = expired;
  document.getElementById('stat-today-in').textContent = todayIn;
  document.getElementById('stat-today-out').textContent = todayOut;

  // Render accounting stats
  const revenueCard = document.getElementById('stat-revenue-val');
  const profitCard = document.getElementById('stat-profit-val');
  if (revenueCard) revenueCard.textContent = formatCurrency(reportData.totalSales);
  if (profitCard) profitCard.textContent = formatCurrency(reportData.netProfit);

  // Render owner remote portal elements
  const todaySalesEl = document.getElementById('owner-today-sales');
  const todayGrossProfitEl = document.getElementById('owner-today-gross-profit');
  const todayExpensesEl = document.getElementById('owner-today-expenses');
  const todayNetProfitEl = document.getElementById('owner-today-net-profit');

  if (todaySalesEl) todaySalesEl.textContent = formatCurrency(reportData.todaySales || 0);
  if (todayGrossProfitEl) todayGrossProfitEl.textContent = formatCurrency(reportData.todayGrossProfit || 0);
  if (todayExpensesEl) todayExpensesEl.textContent = formatCurrency(reportData.todayExpenses || 0);
  if (todayNetProfitEl) todayNetProfitEl.textContent = formatCurrency(reportData.todayNetProfit || 0);

  const payCashEl = document.getElementById('owner-pay-cash');
  const payCardEl = document.getElementById('owner-pay-card');
  const payOnlineEl = document.getElementById('owner-pay-online');
  const payCreditEl = document.getElementById('owner-pay-credit');

  if (reportData.paymentBreakdown) {
    if (payCashEl) payCashEl.textContent = formatCurrency(reportData.paymentBreakdown.Cash || 0);
    if (payCardEl) payCardEl.textContent = formatCurrency(reportData.paymentBreakdown.Card || 0);
    if (payOnlineEl) payOnlineEl.textContent = formatCurrency(reportData.paymentBreakdown.Online || 0);
    if (payCreditEl) payCreditEl.textContent = formatCurrency(reportData.paymentBreakdown.Credit || 0);
  }

  const cashierActivityList = document.getElementById('owner-cashier-activity-list');
  if (cashierActivityList) {
    if (!reportData.cashierActivity || reportData.cashierActivity.length === 0) {
      cashierActivityList.innerHTML = '<div class="empty-state" style="padding:10px">No cashier activity logged today</div>';
    } else {
      cashierActivityList.innerHTML = reportData.cashierActivity.map(c => `
        <div style="display: flex; justify-content: space-between;">
          <span><strong>${c.cashier}</strong> (${c.sales_count} bills):</span>
          <span>${formatCurrency(c.sales_total)}</span>
        </div>
      `).join('');
    }
  }

  // Alerts summary
  const alertItems = getAlertItems();
  const dashAlerts = document.getElementById('dash-alerts');
  if (alertItems.length === 0) {
    dashAlerts.innerHTML = '<div class="empty-state">No alerts — all good!</div>';
  } else {
    dashAlerts.innerHTML = alertItems.slice(0,5).map(a =>
      `<div class="alert-item alert-${a.type}">
         <span class="alert-icon-svg">${a.iconSvg}</span>
         <div>
           <div class="alert-msg">${a.msg}</div>
           <div class="alert-detail">${a.detail}</div>
         </div>
       </div>`
    ).join('');
  }

  // Recent activity
  const all = [
    ...db.stockIn.map(r => ({ ...r, type: 'in', ts: r.date })),
    ...db.stockOut.map(r => ({ ...r, type: 'out', ts: r.date }))
  ].sort((a,b) => b.id - a.id).slice(0,10);

  const actEl = document.getElementById('dash-activity');
  if (all.length === 0) {
    actEl.innerHTML = '<div class="empty-state">No recent activity</div>';
  } else {
    actEl.innerHTML = all.map(r => {
      const item = db.items.find(i => i.id === r.itemId);
      const itemName = item ? item.name : 'Unknown';
      if (r.type === 'in') {
        return `<div class="activity-item">
          <div class="activity-icon act-in">${IC.arrowDn}</div>
          <div class="activity-text">Stock In: <strong>${r.qty} ${item?.unit||''}</strong> of <strong>${itemName}</strong>${r.supplier ? ` from ${r.supplier}` : ''}</div>
          <div class="activity-time">${formatDate(r.date)}</div>
        </div>`;
      } else {
        return `<div class="activity-item">
          <div class="activity-icon act-out">${IC.arrowUp}</div>
          <div class="activity-text">Stock Out: <strong>${r.qty} ${item?.unit||''}</strong> of <strong>${itemName}</strong> (${r.reason})</div>
          <div class="activity-time">${formatDate(r.date)}</div>
        </div>`;
      }
    }).join('');
  }
}

// ---- ITEMS ----
function renderItems() {
  const catFilter = document.getElementById('items-category-filter')?.value || '';
  const search = (document.getElementById('items-search')?.value || '').toLowerCase();
  let list = db.items;
  if (search) list = list.filter(i => i.name.toLowerCase().includes(search) || (i.generic||'').toLowerCase().includes(search));
  if (catFilter) list = list.filter(i => i.category === catFilter);

  const tbody = document.getElementById('items-tbody');
  const empty = document.getElementById('items-empty');

  const cats = [...new Set(db.items.map(i => i.category).filter(Boolean))];
  const catSel = document.getElementById('items-category-filter');
  const curCat = catSel.value;
  catSel.innerHTML = '<option value="">All Categories</option>' +
    cats.map(c => `<option value="${c}" ${c===curCat?'selected':''}>${c}</option>`).join('');

  const catList = document.getElementById('category-list');
  catList.innerHTML = cats.map(c => `<option value="${c}"></option>`).join('');

  if (list.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = list.map(item => {
    const stock = getStock(item.id);
    const expiry = getNearestExpiry(item.id);
    const days = daysUntil(expiry);
    let expiryStr = expiry ? formatDate(expiry) : '—';
    if (days !== null && days < 0) expiryStr = `<span style="color:var(--red-light)">${IC.expWarn} ${expiryStr}</span>`;
    else if (days !== null && days <= 90) expiryStr = `<span style="color:var(--orange-light)">${IC.expClock} ${expiryStr}</span>`;

    const stockColor = stock <= 0 ? 'color:var(--red-light)' : stock <= item.minStock ? 'color:var(--orange-light)' : 'color:var(--green-light)';

    return `<tr>
      <td><strong>${item.name}</strong></td>
      <td>${item.generic || '—'}</td>
      <td><span class="badge" style="background:rgba(139,92,246,0.15);color:var(--purple-light);border:1px solid rgba(139,92,246,0.3)">${item.category||'—'}</span></td>
      <td>${item.unit}</td>
      <td>${item.minStock}</td>
      <td style="${stockColor}"><strong>${stock}</strong></td>
      <td>${expiryStr}</td>
      <td>${formatCurrency(item.purchasePrice)}</td>
      <td>${formatCurrency(item.sellPrice)}</td>
      <td>
        <div class="action-btns">
          <button class="btn-action btn-edit" onclick="editItem(${item.id})">${IC.edit} Edit</button>
          <button class="btn-action btn-delete" onclick="deleteItem(${item.id})">${IC.trash} Delete</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ---- STOCK IN ----
function renderStockIn() {
  const search = (document.getElementById('in-search')?.value || '').toLowerCase();
  const dateF  = document.getElementById('in-date-filter')?.value || '';
  let list = [...db.stockIn].sort((a,b) => b.id - a.id);
  if (search) {
    list = list.filter(r => {
      const item = db.items.find(i => i.id === r.itemId);
      return (item?.name||'').toLowerCase().includes(search) || (r.supplier||'').toLowerCase().includes(search) || (r.batch||'').toLowerCase().includes(search);
    });
  }
  if (dateF) list = list.filter(r => r.date === dateF);

  const tbody = document.getElementById('in-tbody');
  const empty = document.getElementById('in-empty');
  if (list.length === 0) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  tbody.innerHTML = list.map(r => {
    const item = db.items.find(i => i.id === r.itemId);
    const days = daysUntil(r.expiry);
    let expiryStr = r.expiry ? formatDate(r.expiry) : '—';
    if (days !== null && days < 0) expiryStr = `<span style="color:var(--red-light)">${IC.expWarn} ${expiryStr}</span>`;

    return `<tr>
      <td>${formatDate(r.date)}</td>
      <td><strong>${item?.name||'Unknown'}</strong></td>
      <td>${r.batch||'—'}</td>
      <td><strong>${r.qty}</strong></td>
      <td>${item?.unit||''}</td>
      <td>${expiryStr}</td>
      <td>${r.supplier||'—'}</td>
      <td>${r.price ? formatCurrency(r.price) : '—'}</td>
      <td>${r.total ? formatCurrency(r.total) : '—'}</td>
      <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${r.notes||''}">${r.notes||'—'}</td>
      <td>—</td>
    </tr>`;
  }).join('');
}

// ---- STOCK OUT ----
function renderStockOut() {
  const search = (document.getElementById('out-search')?.value || '').toLowerCase();
  const dateF  = document.getElementById('out-date-filter')?.value || '';
  let list = [...db.stockOut].sort((a,b) => b.id - a.id);
  if (search) {
    list = list.filter(r => {
      const item = db.items.find(i => i.id === r.itemId);
      return (item?.name||'').toLowerCase().includes(search) || (r.customer||'').toLowerCase().includes(search);
    });
  }
  if (dateF) list = list.filter(r => r.date === dateF);

  const tbody = document.getElementById('out-tbody');
  const empty = document.getElementById('out-empty');
  if (list.length === 0) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  tbody.innerHTML = list.map(r => {
    const item = db.items.find(i => i.id === r.itemId);
    return `<tr>
      <td>${formatDate(r.date)}</td>
      <td><strong>${item?.name||'Unknown'}</strong></td>
      <td><strong>${r.qty}</strong></td>
      <td>${item?.unit||''}</td>
      <td><span class="badge badge-ok">${r.reason}</span></td>
      <td>${r.customer||'—'}</td>
      <td>${r.price ? formatCurrency(r.price) : '—'}</td>
      <td>${r.total ? formatCurrency(r.total) : '—'}</td>
      <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${r.notes||''}">${r.notes||'—'}</td>
      <td>—</td>
    </tr>`;
  }).join('');
}

// ---- CURRENT STOCK ----
function renderStock() {
  const search = (document.getElementById('stock-search')?.value || '').toLowerCase();
  const statusF = document.getElementById('stock-status-filter')?.value || '';
  let list = db.items;
  if (search) list = list.filter(i => i.name.toLowerCase().includes(search) || (i.category||'').toLowerCase().includes(search));
  if (statusF) list = list.filter(i => getStockStatus(i) === statusF);

  const tbody = document.getElementById('stock-tbody');
  const empty = document.getElementById('stock-empty');
  if (list.length === 0) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  tbody.innerHTML = list.map(item => {
    const stock = getStock(item.id);
    const expiry = getNearestExpiry(item.id);
    const status = getStockStatus(item);
    const value = item.sellPrice ? (stock * parseFloat(item.sellPrice)).toFixed(2) : '—';
    const days = daysUntil(expiry);
    let expiryStr = expiry ? formatDate(expiry) : '—';
    if (days !== null && days < 0) expiryStr = `<span style="color:var(--red-light)">${IC.expWarn} ${expiryStr}</span>`;
    else if (days !== null && days <= 90) expiryStr = `<span style="color:var(--orange-light)">${IC.expClock} ${expiryStr} (${days}d)</span>`;

    return `<tr>
      <td><strong>${item.name}</strong>${item.generic ? `<br><small style="color:var(--text-muted)">${item.generic}</small>` : ''}</td>
      <td>${item.category||'—'}</td>
      <td style="font-size:1.1rem;font-weight:700">${stock}</td>
      <td>${item.minStock}</td>
      <td>${item.unit}</td>
      <td>${expiryStr}</td>
      <td>${formatCurrency(item.sellPrice)}</td>
      <td>${formatCurrency(value)}</td>
      <td>${statusLabel(status)}</td>
    </tr>`;
  }).join('');
}

// ---- ALERTS ----
function getAlertItems() {
  const alerts = [];
  db.items.forEach(item => {
    const stock = getStock(item.id);
    const expiry = getNearestExpiry(item.id);
    const days = daysUntil(expiry);

    if (days !== null && days < 0) {
      alerts.push({ type: 'expired', iconSvg: IC.banLg, msg: `${item.name} has EXPIRED`, detail: `Expired on ${formatDate(expiry)}`, item, stock, days });
    } else if (days !== null && days <= 90) {
      alerts.push({ type: 'expiry', iconSvg: IC.clockLg, msg: `${item.name} expiring in ${days} days`, detail: `Expiry: ${formatDate(expiry)} | Stock: ${stock} ${item.unit}`, item, stock, days });
    }

    if (stock <= 0) {
      alerts.push({ type: 'out', iconSvg: IC.xcircLg, msg: `${item.name} is OUT OF STOCK`, detail: `Min required: ${item.minStock} ${item.unit}`, item, stock, days });
    } else if (stock <= item.minStock) {
      alerts.push({ type: 'low', iconSvg: IC.warnLg, msg: `${item.name} is LOW`, detail: `Current: ${stock} ${item.unit} | Min: ${item.minStock} ${item.unit}`, item, stock, days });
    }
  });
  const order = { expired: 0, out: 1, expiry: 2, low: 3 };
  return alerts.sort((a,b) => (order[a.type]||9) - (order[b.type]||9));
}

function renderAlerts() {
  const alerts = getAlertItems();
  const container = document.getElementById('alerts-container');
  const summary = document.getElementById('alerts-summary');

  const counts = { expired:0, out:0, expiry:0, low:0 };
  alerts.forEach(a => counts[a.type] = (counts[a.type]||0)+1);

  summary.innerHTML = [
    counts.expired ? `<span class="badge badge-expired">${IC.ban} ${counts.expired} Expired</span>` : '',
    counts.out ? `<span class="badge badge-out">${IC.xcirc} ${counts.out} Out of Stock</span>` : '',
    counts.expiry ? `<span class="badge badge-expiring">${IC.clock} ${counts.expiry} Expiring Soon</span>` : '',
    counts.low ? `<span class="badge badge-low">${IC.warn} ${counts.low} Low Stock</span>` : '',
  ].join('');

  if (alerts.length === 0) {
    container.innerHTML = '<div class="empty-state">All clear — your inventory is in great shape!</div>';
    return;
  }

  container.innerHTML = alerts.map(a => `
    <div class="alert-card card-${a.type}">
      <div class="alert-card-icon-svg">${a.iconSvg}</div>
      <div class="alert-card-body">
        <div class="alert-card-title">${a.msg}</div>
        <div class="alert-card-sub">${a.detail}</div>
      </div>
      <button class="btn btn-sm btn-outline" onclick="switchTab('stock')">View Stock</button>
    </div>
  `).join('');
}

// ---- SALES HISTORY ----
let voidingBillId = null;

function renderSales() {
  const bills = db.bills || [];
  const search = (document.getElementById('sales-search')?.value || '').toLowerCase();
  const dateF  = document.getElementById('sales-date-filter')?.value || '';
  const statusF = document.getElementById('sales-status-filter')?.value || '';

  let list = [...bills].sort((a, b) => b.id - a.id);
  if (search) list = list.filter(b =>
    (b.billNumber || '').toLowerCase().includes(search) ||
    (b.cashier || '').toLowerCase().includes(search) ||
    (b.paymentMethod || '').toLowerCase().includes(search)
  );
  if (dateF) list = list.filter(b => b.date === dateF);
  if (statusF) list = list.filter(b => b.status === statusF);

  const tbody = document.getElementById('sales-tbody');
  const empty = document.getElementById('sales-empty');
  const summaryBar = document.getElementById('sales-summary-bar');

  // Summary bar
  const activeBills = bills.filter(b => b.status === 'active');
  const totalRevenue = activeBills.reduce((s, b) => s + parseFloat(b.total || 0), 0);
  const todayBills = activeBills.filter(b => b.date === today());
  const todayRevenue = todayBills.reduce((s, b) => s + parseFloat(b.total || 0), 0);
  summaryBar.innerHTML = bills.length === 0 ? '' : `
    <div class="sales-summary-item">
      <span class="ss-label">Total Bills</span>
      <span class="ss-value">${activeBills.length}</span>
    </div>
    <div class="sales-summary-item">
      <span class="ss-label">Total Revenue</span>
      <span class="ss-value" style="color:var(--green-light)">Rs. ${totalRevenue.toLocaleString('en-US', {minimumFractionDigits:2})}</span>
    </div>
    <div class="sales-summary-item">
      <span class="ss-label">Today's Bills</span>
      <span class="ss-value">${todayBills.length}</span>
    </div>
    <div class="sales-summary-item">
      <span class="ss-label">Today's Revenue</span>
      <span class="ss-value" style="color:var(--teal-light)">Rs. ${todayRevenue.toLocaleString('en-US', {minimumFractionDigits:2})}</span>
    </div>
  `;

  if (list.length === 0) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  tbody.innerHTML = list.map(bill => {
    const isVoid = bill.status === 'void';
    const isAdj = bill.status === 'adjustment';
    const itemSummary = (bill.items || []).map(i => `${i.qty}× ${i.name}`).join(', ');
    
    let statusBadge = '<span class="badge badge-ok">Active</span>';
    if (isVoid) statusBadge = '<span class="badge badge-expired">VOID</span>';
    else if (isAdj) statusBadge = '<span class="badge badge-low">Adjustment</span>';

    return `<tr style="${isVoid ? 'opacity:0.55' : ''}">
      <td><strong>${bill.billNumber || '—'}</strong></td>
      <td>${formatDate(bill.date)}</td>
      <td>${bill.time || '—'}</td>
      <td>${bill.cashier || '—'}</td>
      <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${itemSummary}">${itemSummary || '—'}</td>
      <td>${bill.paymentMethod || '—'}</td>
      <td><strong>${bill.total ? formatCurrency(bill.total) : '—'}</strong></td>
      <td>${statusBadge}</td>
      <td>
        ${(!isVoid && !isAdj) ? `<button class="btn-action btn-delete" onclick="confirmVoidBill(${bill.id})">Void</button>` : '—'}
      </td>
    </tr>`;
  }).join('');
}

function confirmVoidBill(billId) {
  const bill = (db.bills || []).find(b => b.id === billId);
  if (!bill) return;
  voidingBillId = billId;
  document.getElementById('void-bill-number').textContent = bill.billNumber;
  openModal('void-modal');
}

async function executeVoidBill() {
  if (!voidingBillId) return;
  try {
    const res = await fetch(`/api/sales/void/${voidingBillId}`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'Failed to void bill', 'error');
      return;
    }
    showToast('Bill voided. Stock restored.', 'warning');
    closeModal('void-modal');
    await syncWithServer();
  } catch (e) {
    showToast('Connection error', 'error');
  }
  voidingBillId = null;
}

// ---- EXPENSES ----
function renderExpenses() {
  const tbody = document.getElementById('expenses-tbody');
  const empty = document.getElementById('expenses-empty');
  if (!tbody) return;

  const list = db.expenses || [];
  if (list.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = list.map(e => `
    <tr>
      <td>${formatDate(e.date)}</td>
      <td><strong>${e.category}</strong></td>
      <td><strong>${formatCurrency(e.amount)}</strong></td>
      <td>${e.notes || '—'}</td>
      <td>
        <button class="btn-action btn-delete" onclick="deleteExpense(${e.id})">${IC.trash} Delete</button>
      </td>
    </tr>
  `).join('');
}

async function deleteExpense(id) {
  if (!confirm('Are you sure you want to delete this expense?')) return;
  try {
    const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Expense deleted', 'warning');
      await syncWithServer();
    } else {
      showToast('Failed to delete expense', 'error');
    }
  } catch (e) {
    showToast('Connection error', 'error');
  }
}

// ---- SUPPLIER LEDGER ----
let payingBatchId = null;

function renderSuppliers() {
  const tbody = document.getElementById('suppliers-tbody');
  const empty = document.getElementById('suppliers-empty');
  if (!tbody) return;

  const list = db.stockIn || [];
  if (list.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = list.map(b => {
    const totalCost = parseFloat(b.total || 0.0);
    const amountPaid = parseFloat(b.amount_paid || 0.0);
    const outstanding = Math.max(0.0, totalCost - amountPaid);
    const status = b.payment_status || 'Pending';

    let badgeClass = 'badge-low';
    if (status === 'Paid') badgeClass = 'badge-ok';

    return `
      <tr>
        <td>${formatDate(b.date)}</td>
        <td><strong>${b.supplier || '—'}</strong></td>
        <td>${b.batch || '—'}</td>
        <td>${formatCurrency(totalCost)}</td>
        <td>${formatCurrency(amountPaid)}</td>
        <td style="${outstanding > 0 ? 'color:var(--red-light);font-weight:700' : ''}">${formatCurrency(outstanding)}</td>
        <td><span class="badge ${badgeClass}">${status}</span></td>
        <td>
          ${outstanding > 0 ? `<button class="btn-action btn-edit" onclick="openPaySupplierModal(${b.id}, '${b.supplier}', '${b.batch}', ${outstanding})">Record Payment</button>` : '—'}
        </td>
      </tr>
    `;
  }).join('');
}

function openPaySupplierModal(batchId, supplierName, batchNumber, outstanding) {
  payingBatchId = batchId;
  document.getElementById('pay-supplier-name').textContent = supplierName;
  document.getElementById('pay-batch-number').textContent = batchNumber;
  document.getElementById('pay-amount-val').value = outstanding.toFixed(2);
  document.getElementById('pay-amount-val').max = outstanding;
  openModal('pay-supplier-modal');
}

async function executePaySupplier() {
  if (!payingBatchId) return;
  const amount = parseFloat(document.getElementById('pay-amount-val').value) || 0;
  if (amount <= 0) {
    showToast('Please enter a valid payment amount', 'error');
    return;
  }

  try {
    const res = await fetch(`/api/batches/${payingBatchId}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
    if (res.ok) {
      showToast('Supplier payment saved successfully', 'success');
      closeModal('pay-supplier-modal');
      await syncWithServer();
    } else {
      const data = await res.json();
      showToast(data.error || 'Failed to save payment', 'error');
    }
  } catch (e) {
    showToast('Connection error', 'error');
  }
  payingBatchId = null;
}

async function saveExpense() {
  const date = document.getElementById('exp-date').value;
  const category = document.getElementById('exp-category').value.trim();
  const amount = parseFloat(document.getElementById('exp-amount').value) || 0;
  const notes = document.getElementById('exp-notes').value.trim();

  if (!category || amount <= 0) {
    showToast('Please fill in required fields', 'error');
    return;
  }

  try {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, category, amount, notes })
    });
    if (res.ok) {
      showToast('Expense recorded successfully', 'success');
      closeModal('expense-modal');
      await syncWithServer();
    } else {
      const data = await res.json();
      showToast(data.error || 'Failed to save expense', 'error');
    }
  } catch (e) {
    showToast('Connection error', 'error');
  }
}

// ---- BADGES ----
function updateBadges() {
  const todayStr = today();
  const inCount  = db.stockIn.filter(r => r.date === todayStr).length;
  const outCount = db.stockOut.filter(r => r.date === todayStr).length;
  const alertCount = getAlertItems().length;

  const badgeIn = document.getElementById('badge-in');
  const badgeOut = document.getElementById('badge-out');
  const badgeAlerts = document.getElementById('badge-alerts');

  badgeIn.textContent = inCount;
  badgeOut.textContent = outCount;
  badgeAlerts.textContent = alertCount;

  badgeIn.style.display = inCount ? 'flex' : 'none';
  badgeOut.style.display = outCount ? 'flex' : 'none';
  badgeAlerts.style.display = alertCount ? 'flex' : 'none';
}

// ---- ITEM CRUD ----
let editingItemId = null;

function openAddItem() {
  editingItemId = null;
  document.getElementById('item-modal-title').textContent = 'Add New Item';
  document.getElementById('item-name').value = '';
  document.getElementById('item-generic').value = '';
  document.getElementById('item-category').value = '';
  document.getElementById('item-unit').value = 'Tablet(s)';
  document.getElementById('item-min-stock').value = '';
  document.getElementById('item-purchase-price-group')?.style.setProperty('display', 'none');
  document.getElementById('item-sell-price-group')?.style.setProperty('display', 'none');
  document.getElementById('item-notes').value = '';
  openModal('item-modal');
}

function editItem(id) {
  const item = db.items.find(i => i.id === id);
  if (!item) return;
  editingItemId = id;
  document.getElementById('item-modal-title').textContent = 'Edit Item';
  document.getElementById('item-name').value = item.name;
  document.getElementById('item-generic').value = item.generic || '';
  document.getElementById('item-category').value = item.category || '';
  document.getElementById('item-unit').value = item.unit;
  document.getElementById('item-min-stock').value = item.minStock;
  document.getElementById('item-notes').value = item.notes || '';
  openModal('item-modal');
}

async function saveItem() {
  const name = document.getElementById('item-name').value.trim();
  const generic = document.getElementById('item-generic').value.trim();
  const category = document.getElementById('item-category').value.trim();
  const unit = document.getElementById('item-unit').value;
  const minStock = parseInt(document.getElementById('item-min-stock').value) || 0;
  const notes = document.getElementById('item-notes').value.trim();

  if (!name) { showToast('Item name is required', 'error'); return; }

  const payload = { name, generic, category, unit, minStock, notes };

  try {
    let res;
    if (editingItemId) {
      res = await fetch(`/api/items/${editingItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'Failed to save item', 'error');
      return;
    }

    showToast(editingItemId ? `"${name}" updated successfully` : `"${name}" added to inventory`, 'success');
    closeModal('item-modal');
    await syncWithServer();
  } catch (e) {
    showToast('Connection error', 'error');
  }
}

async function deleteItem(id) {
  const item = db.items.find(i => i.id === id);
  if (!item) return;
  if (!confirm(`Delete "${item.name}"? This will also remove all stock records for this item.`)) return;
  try {
    const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    showToast(`"${item.name}" deleted`, 'warning');
    await syncWithServer();
  } catch (e) {
    showToast('Failed to delete item', 'error');
  }
}

// ---- STOCK IN CRUD ----
function openAddStockIn() {
  document.getElementById('in-date').value = today();
  document.getElementById('in-batch').value = '';
  document.getElementById('in-qty').value = '';
  document.getElementById('in-bonus').value = '0';
  document.getElementById('in-expiry').value = '';
  document.getElementById('in-supplier').value = '';
  document.getElementById('in-price').value = '';
  document.getElementById('in-total').value = '';
  document.getElementById('in-notes').value = '';
  populateItemSelect('in-item');
  openModal('in-modal');
}

async function saveStockIn() {
  const date = document.getElementById('in-date').value;
  const itemId = parseInt(document.getElementById('in-item').value);
  const batchNumber = document.getElementById('in-batch').value.trim();
  const qty = parseInt(document.getElementById('in-qty').value);
  const bonusQty = parseInt(document.getElementById('in-bonus').value) || 0;
  const expiry = document.getElementById('in-expiry').value;
  const supplier = document.getElementById('in-supplier').value.trim();
  const purchasePrice = parseFloat(document.getElementById('in-price').value) || 0;
  const sellPrice = parseFloat(document.getElementById('in-sell-price')?.value) || purchasePrice * 1.25;

  if (!date || !itemId || !qty || qty < 1) {
    showToast('Please fill in required fields', 'error'); return;
  }
  if (!expiry) { showToast('Expiry date is required', 'error'); return; }

  const payload = { date, itemId, batchNumber, qty, bonusQty, expiry, supplier, purchasePrice, sellPrice };

  try {
    const res = await fetch('/api/stock-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'Failed to save stock-in', 'error');
      return;
    }
    showToast('Stock In recorded successfully', 'success');
    closeModal('in-modal');
    await syncWithServer();
  } catch (e) {
    showToast('Connection error', 'error');
  }
}

// ---- STOCK OUT CRUD ----
function openAddStockOut() {
  document.getElementById('out-date').value = today();
  document.getElementById('out-qty').value = '';
  document.getElementById('out-customer').value = '';
  document.getElementById('out-price').value = '';
  document.getElementById('out-total').value = '';
  document.getElementById('out-notes').value = '';
  document.getElementById('out-available').value = '';
  document.getElementById('out-reason').value = 'Sale';
  populateItemSelect('out-item');
  openModal('out-modal');
}

async function saveStockOut() {
  const date = document.getElementById('out-date').value;
  const itemId = parseInt(document.getElementById('out-item').value);
  const qty = parseInt(document.getElementById('out-qty').value);
  const reason = document.getElementById('out-reason').value;
  const customer = document.getElementById('out-customer').value.trim();
  const price = parseFloat(document.getElementById('out-price').value) || 0;
  const notes = document.getElementById('out-notes').value.trim();

  if (!date || !itemId || !qty || qty < 1) {
    showToast('Please fill in required fields', 'error'); return;
  }

  const payload = { date, itemId, qty, reason, customer, price, notes };

  try {
    const res = await fetch('/api/stock-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'Failed to save stock-out', 'error');
      return;
    }
    showToast('Stock Out recorded successfully', 'success');
    closeModal('out-modal');
    await syncWithServer();
  } catch (e) {
    showToast('Connection error', 'error');
  }
}

function populateItemSelect(selectId) {
  const sel = document.getElementById(selectId);
  sel.innerHTML = '<option value="">Select an item...</option>' +
    db.items.map(i => `<option value="${i.id}">${i.name}</option>`).join('');
}

// ---- EXPORT CSV ----
function exportCSV() {
  const tab = document.querySelector('.tab-content.active')?.id?.replace('tab-', '') || 'stock';
  let csv = '';
  let filename = '';

  if (tab === 'items') {
    filename = 'items.csv';
    csv = 'Name,Generic,Category,Unit,Min Stock,Current Stock,Sell Price\n';
    db.items.forEach(i => {
      csv += `"${i.name}","${i.generic||''}","${i.category||''}","${i.unit}",${i.minStock},${getStock(i.id)},${i.sellPrice||''}\n`;
    });
  } else if (tab === 'in') {
    filename = 'batches.csv';
    csv = 'Date,Item,Batch,Qty,Expiry,Supplier,Purchase Price,Total\n';
    db.stockIn.forEach(r => {
      const item = db.items.find(i => i.id === r.itemId);
      csv += `"${r.date}","${item?.name||''}","${r.batch||''}",${r.qty},"${r.expiry||''}","${r.supplier||''}",${r.price||''},${r.total||''}\n`;
    });
  } else if (tab === 'out') {
    filename = 'stock_out.csv';
    csv = 'Date,Item,Qty,Reason,Customer,Price,Total\n';
    db.stockOut.forEach(r => {
      const item = db.items.find(i => i.id === r.itemId);
      csv += `"${r.date}","${item?.name||''}",${r.qty},"${r.reason}","${r.customer||''}",${r.price||''},${r.total||''}\n`;
    });
  } else if (tab === 'expenses') {
    filename = 'expenses.csv';
    csv = 'Date,Category,Amount,Notes\n';
    db.expenses.forEach(e => {
      csv += `"${e.date}","${e.category}",${e.amount},"${e.notes||''}"\n`;
    });
  } else {
    filename = 'current_stock.csv';
    csv = 'Name,Category,Current Stock,Min Stock,Unit,Nearest Expiry,Sell Price,Stock Value,Status\n';
    db.items.forEach(i => {
      const stock = getStock(i.id);
      const expiry = getNearestExpiry(i.id);
      const value = i.sellPrice ? (stock * parseFloat(i.sellPrice)).toFixed(2) : '';
      csv += `"${i.name}","${i.category||''}",${stock},${i.minStock},"${i.unit}","${expiry||''}",${i.sellPrice||''},${value},"${getStockStatus(i)}"\n`;
    });
  }

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`Exported ${filename}`, 'success');
}

// ---- BACKUP DOWNLOAD ----
function downloadBackup() {
  const a = document.createElement('a');
  a.href = '/pharmacy.db';
  a.download = 'pharmacy.db';
  a.click();
  showToast('Database file downloaded', 'success');
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('current-date').textContent =
    new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  document.getElementById('pharmacy-name-display').textContent = db.pharmacyName;

  if (ownerSession) {
    const usernameEl = document.getElementById('owner-username-display');
    if (usernameEl) usernameEl.textContent = ownerSession.username;
  }

  document.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.querySelectorAll('[data-tab]').forEach(el => {
    if (el.tagName === 'BUTTON' && !el.classList.contains('nav-item')) {
      el.addEventListener('click', () => switchTab(el.dataset.tab));
    }
  });

  document.getElementById('quick-add-btn').addEventListener('click', openAddStockIn);
  document.getElementById('backup-btn').addEventListener('click', downloadBackup);
  document.getElementById('export-btn').addEventListener('click', exportCSV);

  // Item modal
  document.getElementById('add-item-btn').addEventListener('click', openAddItem);
  document.getElementById('item-modal-close').addEventListener('click', () => closeModal('item-modal'));
  document.getElementById('item-modal-cancel').addEventListener('click', () => closeModal('item-modal'));
  document.getElementById('item-modal-save').addEventListener('click', saveItem);

  // Stock In modal
  document.getElementById('add-in-btn').addEventListener('click', openAddStockIn);
  document.getElementById('in-modal-close').addEventListener('click', () => closeModal('in-modal'));
  document.getElementById('in-modal-cancel').addEventListener('click', () => closeModal('in-modal'));
  document.getElementById('in-modal-save').addEventListener('click', saveStockIn);

  const calcInTotal = () => {
    const p = parseFloat(document.getElementById('in-price').value) || 0;
    const q = parseInt(document.getElementById('in-qty').value) || 0;
    document.getElementById('in-total').value = p && q ? (p * q).toFixed(2) : '';
  };
  document.getElementById('in-price').addEventListener('input', calcInTotal);
  document.getElementById('in-qty').addEventListener('input', calcInTotal);

  // Stock Out modal
  document.getElementById('add-out-btn').addEventListener('click', openAddStockOut);
  document.getElementById('out-modal-close').addEventListener('click', () => closeModal('out-modal'));
  document.getElementById('out-modal-cancel').addEventListener('click', () => closeModal('out-modal'));
  document.getElementById('out-modal-save').addEventListener('click', saveStockOut);

  document.getElementById('out-item').addEventListener('change', () => {
    const id = parseInt(document.getElementById('out-item').value);
    if (id) {
      const item = db.items.find(i => i.id === id);
      const stock = getStock(id);
      document.getElementById('out-available').value = `${stock} ${item?.unit||''}`;
      if (item?.sellPrice) document.getElementById('out-price').value = item.sellPrice;
    } else {
      document.getElementById('out-available').value = '';
    }
  });

  const calcOutTotal = () => {
    const p = parseFloat(document.getElementById('out-price').value) || 0;
    const q = parseInt(document.getElementById('out-qty').value) || 0;
    document.getElementById('out-total').value = p && q ? (p * q).toFixed(2) : '';
  };
  document.getElementById('out-price').addEventListener('input', calcOutTotal);
  document.getElementById('out-qty').addEventListener('input', calcOutTotal);

  // Expense modal setup
  const addExpBtn = document.getElementById('add-expense-btn');
  if (addExpBtn) addExpBtn.addEventListener('click', () => {
    document.getElementById('exp-date').value = today();
    document.getElementById('exp-category').value = '';
    document.getElementById('exp-amount').value = '';
    document.getElementById('exp-notes').value = '';
    openModal('expense-modal');
  });

  const closeExpBtn = document.getElementById('expense-modal-close');
  if (closeExpBtn) closeExpBtn.addEventListener('click', () => closeModal('expense-modal'));
  const cancelExpBtn = document.getElementById('expense-modal-cancel');
  if (cancelExpBtn) cancelExpBtn.addEventListener('click', () => closeModal('expense-modal'));
  const saveExpBtn = document.getElementById('expense-modal-save');
  if (saveExpBtn) saveExpBtn.addEventListener('click', saveExpense);

  // Settings
  document.getElementById('edit-pharmacy-btn').addEventListener('click', () => {
    document.getElementById('pharmacy-name-input').value = db.pharmacyName || '';
    document.getElementById('pharmacy-address-input').value = db.pharmacyAddress || '';
    document.getElementById('pharmacy-phone-input').value = db.pharmacyPhone || '';
    document.getElementById('new-owner-password').value = '';
    document.getElementById('new-cashier-password').value = '';
    openModal('pharmacy-modal');
  });
  document.getElementById('pharmacy-modal-close').addEventListener('click', () => closeModal('pharmacy-modal'));
  document.getElementById('pharmacy-modal-cancel').addEventListener('click', () => closeModal('pharmacy-modal'));
  document.getElementById('pharmacy-modal-save').addEventListener('click', async () => {
    const name = document.getElementById('pharmacy-name-input').value.trim();
    const address = document.getElementById('pharmacy-address-input').value.trim();
    const phone = document.getElementById('pharmacy-phone-input').value.trim();
    const newOwnerPw = document.getElementById('new-owner-password').value;
    const newCashierPw = document.getElementById('new-cashier-password').value;

    if (!name) { showToast('Pharmacy name cannot be empty', 'error'); return; }

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pharmacyName: name,
          pharmacyAddress: address,
          pharmacyPhone: phone,
          newOwnerPassword: newOwnerPw || undefined,
          newCashierPassword: newCashierPw || undefined
        })
      });
      if (!res.ok) throw new Error();
      showToast('Settings saved successfully', 'success');
      closeModal('pharmacy-modal');
      await syncWithServer();
    } catch (e) {
      showToast('Failed to save settings', 'error');
    }
  });

  document.getElementById('logout-btn').addEventListener('click', logout);
  document.getElementById('void-modal-close').addEventListener('click', () => closeModal('void-modal'));
  document.getElementById('void-modal-cancel').addEventListener('click', () => closeModal('void-modal'));
  document.getElementById('void-modal-confirm').addEventListener('click', executeVoidBill);

  // Pay Supplier modal listeners
  const closePaySup = document.getElementById('pay-supplier-modal-close');
  if (closePaySup) closePaySup.addEventListener('click', () => closeModal('pay-supplier-modal'));
  const cancelPaySup = document.getElementById('pay-supplier-modal-cancel');
  if (cancelPaySup) cancelPaySup.addEventListener('click', () => closeModal('pay-supplier-modal'));
  const confirmPaySup = document.getElementById('pay-supplier-modal-confirm');
  if (confirmPaySup) confirmPaySup.addEventListener('click', executePaySupplier);

  // Search filters
  document.getElementById('sales-search').addEventListener('input', renderSales);
  document.getElementById('sales-date-filter').addEventListener('change', renderSales);
  document.getElementById('sales-status-filter').addEventListener('change', renderSales);
  document.getElementById('items-search').addEventListener('input', renderItems);
  document.getElementById('items-category-filter').addEventListener('change', renderItems);
  document.getElementById('in-search').addEventListener('input', renderStockIn);
  document.getElementById('in-date-filter').addEventListener('change', renderStockIn);
  document.getElementById('out-search').addEventListener('input', renderStockOut);
  document.getElementById('out-date-filter').addEventListener('change', renderStockOut);
  document.getElementById('stock-search').addEventListener('input', renderStock);
  document.getElementById('stock-status-filter').addEventListener('change', renderStock);

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });

  document.querySelectorAll('input[type="date"]').forEach(input => {
    input.addEventListener('click', () => { try { input.showPicker(); } catch (e) {} });
    input.addEventListener('focus', () => { try { input.showPicker(); } catch (e) {} });
  });

  // Initial load
  switchTab('dashboard');
  syncWithServer();
});
