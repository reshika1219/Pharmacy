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
  // Large icons for alert cards
  banLg:    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>`,
  clockLg:  `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  xcircLg:  `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`,
  warnLg:   `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
  // Action buttons
  edit:     `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`,
  trash:    `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
  // Expiry warning icons for table cells
  expWarn:  `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
  expClock: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  // Activity feed icons
  arrowDn:  `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>`,
  arrowUp:  `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>`,
};

// ---- DATA STORE ---- (persisted in localStorage)
const DB_KEY = 'pharmacare_db';

function loadDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    return raw ? JSON.parse(raw) : initDB();
  } catch {
    return initDB();
  }
}

function initDB() {
  return {
    pharmacyName: 'PharmaCare',
    items: [],
    stockIn: [],
    stockOut: [],
    nextId: 1
  };
}

// Server Sync Flag & Functions
const isServerMode = window.location.protocol.startsWith('http');

async function saveToServer() {
  if (!isServerMode) return;
  try {
    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(db)
    });
  } catch (e) {
    console.error("Failed to save to local server database:", e);
    showToast('Failed to sync changes with server', 'error');
  }
}

async function syncWithServer() {
  if (!isServerMode) return;
  try {
    const res = await fetch('/api/db');
    const data = await res.json();
    if (data && data.items && data.items.length > 0) {
      db = data;
      localStorage.setItem(DB_KEY, JSON.stringify(db));
      // Re-render the active tab
      const activeTab = document.querySelector('.nav-item.active')?.dataset?.tab || 'dashboard';
      renderTab(activeTab);
    } else if (db && db.items && db.items.length > 0) {
      // Server doesn't have data, but local storage does. Sync local data to server!
      saveToServer();
    }
  } catch (e) {
    console.warn("Failed to sync from local server database:", e);
  }
}

function saveDB() {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  saveToServer();
}

function genId() {
  const id = db.nextId++;
  saveDB();
  return id;
}

let db = loadDB();

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
  const totalIn  = db.stockIn.filter(r => r.itemId === itemId).reduce((s, r) => s + r.qty, 0);
  const totalOut = db.stockOut.filter(r => r.itemId === itemId).reduce((s, r) => s + r.qty, 0);
  return totalIn - totalOut;
}

function getNearestExpiry(itemId) {
  const batches = db.stockIn.filter(r => r.itemId === itemId && r.expiry);
  if (!batches.length) return null;
  return batches.sort((a,b) => new Date(a.expiry) - new Date(b.expiry))[0].expiry;
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
  in: 'Stock In',
  out: 'Stock Out',
  stock: 'Current Stock',
  alerts: 'Alerts'
};

const EXPORTABLE_TABS = ['items', 'in', 'out', 'stock'];

const EXPORT_LABELS = {
  items: 'Export Items',
  in:    'Export Stock In',
  out:   'Export Stock Out',
  stock: 'Export Stock',
};

function switchTab(tabName) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.tab === tabName));
  document.querySelectorAll('.tab-content').forEach(s => s.classList.toggle('active', s.id === 'tab-' + tabName));
  document.getElementById('page-title').textContent = tabTitles[tabName] || tabName;

  // Export CSV: only on tabs with tabular data, with a label specific to that tab
  const exportBtn = document.getElementById('export-btn');
  if (EXPORTABLE_TABS.includes(tabName)) {
    exportBtn.style.display = '';
    exportBtn.querySelector('.export-label').textContent = EXPORT_LABELS[tabName];
  } else {
    exportBtn.style.display = 'none';
  }

  // Quick Add Stock: only on Dashboard (all other tabs have their own toolbar button)
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
  updateBadges();
}

// ---- DASHBOARD ----

function renderDashboard() {
  const allItems = db.items;
  const hasItems = allItems.length > 0;

  // Toggle between onboarding guide and live dashboard
  document.getElementById('onboarding-guide').style.display = hasItems ? 'none' : '';
  document.getElementById('dash-stats').style.display    = hasItems ? '' : 'none';
  document.getElementById('dash-panels').style.display   = hasItems ? '' : 'none';

  if (!hasItems) return; // Nothing else to render

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

function renderItems(filter = '') {
  const catFilter = document.getElementById('items-category-filter')?.value || '';
  const search = (document.getElementById('items-search')?.value || '').toLowerCase();
  let list = db.items;
  if (search) list = list.filter(i => i.name.toLowerCase().includes(search) || (i.generic||'').toLowerCase().includes(search));
  if (catFilter) list = list.filter(i => i.category === catFilter);

  const tbody = document.getElementById('items-tbody');
  const empty = document.getElementById('items-empty');

  // Populate category filter
  const cats = [...new Set(db.items.map(i => i.category).filter(Boolean))];
  const catSel = document.getElementById('items-category-filter');
  const curCat = catSel.value;
  catSel.innerHTML = '<option value="">All Categories</option>' +
    cats.map(c => `<option value="${c}" ${c===curCat?'selected':''}>${c}</option>`).join('');

  // Populate category datalist
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
      <td>
        <div class="action-btns">
          <button class="btn-action btn-delete" onclick="deleteStockIn(${r.id})">${IC.trash}</button>
        </div>
      </td>
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
      <td>
        <div class="action-btns">
          <button class="btn-action btn-delete" onclick="deleteStockOut(${r.id})">${IC.trash}</button>
        </div>
      </td>
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
    } else if (days !== null && days <= 30) {
      alerts.push({ type: 'expiry', iconSvg: IC.clockLg, msg: `${item.name} expires in ${days} days`, detail: `Expiry: ${formatDate(expiry)} | Stock: ${stock} ${item.unit}`, item, stock, days });
    } else if (days !== null && days <= 90) {
      alerts.push({ type: 'expiry', iconSvg: IC.clockLg, msg: `${item.name} expiring in ${days} days`, detail: `Expiry: ${formatDate(expiry)} | Stock: ${stock} ${item.unit}`, item, stock, days });
    }

    if (stock <= 0) {
      alerts.push({ type: 'out', iconSvg: IC.xcircLg, msg: `${item.name} is OUT OF STOCK`, detail: `Min required: ${item.minStock} ${item.unit}`, item, stock, days });
    } else if (stock <= item.minStock) {
      alerts.push({ type: 'low', iconSvg: IC.warnLg, msg: `${item.name} is LOW`, detail: `Current: ${stock} ${item.unit} | Min: ${item.minStock} ${item.unit}`, item, stock, days });
    }
  });
  // Sort: expired > out > low expiry
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

  badgeIn.setAttribute('data-count', inCount);
  badgeOut.setAttribute('data-count', outCount);
  badgeAlerts.setAttribute('data-count', alertCount);

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
  document.getElementById('item-purchase-price').value = '';
  document.getElementById('item-sell-price').value = '';
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
  document.getElementById('item-purchase-price').value = item.purchasePrice || '';
  document.getElementById('item-sell-price').value = item.sellPrice || '';
  document.getElementById('item-notes').value = item.notes || '';
  openModal('item-modal');
}

function saveItem() {
  const name = document.getElementById('item-name').value.trim();
  const generic = document.getElementById('item-generic').value.trim();
  const category = document.getElementById('item-category').value.trim();
  const unit = document.getElementById('item-unit').value;
  const minStock = parseInt(document.getElementById('item-min-stock').value) || 0;
  const purchasePrice = document.getElementById('item-purchase-price').value;
  const sellPrice = document.getElementById('item-sell-price').value;
  const notes = document.getElementById('item-notes').value.trim();

  if (!name) { showToast('Item name is required', 'error'); return; }

  if (editingItemId) {
    const idx = db.items.findIndex(i => i.id === editingItemId);
    if (idx >= 0) {
      db.items[idx] = { ...db.items[idx], name, generic, category, unit, minStock, purchasePrice, sellPrice, notes };
      showToast(`"${name}" updated successfully`, 'success');
    }
  } else {
    db.items.push({ id: genId(), name, generic, category, unit, minStock, purchasePrice, sellPrice, notes });
    showToast(`"${name}" added to inventory`, 'success');
  }

  saveDB();
  closeModal('item-modal');
  renderItems();
  updateBadges();
}

function deleteItem(id) {
  const item = db.items.find(i => i.id === id);
  if (!item) return;
  if (!confirm(`Delete "${item.name}"? This will also remove all stock records for this item.`)) return;
  db.items = db.items.filter(i => i.id !== id);
  db.stockIn  = db.stockIn.filter(r => r.itemId !== id);
  db.stockOut = db.stockOut.filter(r => r.itemId !== id);
  saveDB();
  renderItems();
  updateBadges();
  showToast(`"${item.name}" deleted`, 'warning');
}

// ---- STOCK IN CRUD ----

function openAddStockIn() {
  document.getElementById('in-date').value = today();
  document.getElementById('in-batch').value = '';
  document.getElementById('in-qty').value = '';
  document.getElementById('in-expiry').value = '';
  document.getElementById('in-supplier').value = '';
  document.getElementById('in-price').value = '';
  document.getElementById('in-total').value = '';
  document.getElementById('in-notes').value = '';
  populateItemSelect('in-item');
  openModal('in-modal');
}

function saveStockIn() {
  const date = document.getElementById('in-date').value;
  const itemId = parseInt(document.getElementById('in-item').value);
  const batch = document.getElementById('in-batch').value.trim();
  const qty = parseInt(document.getElementById('in-qty').value);
  const expiry = document.getElementById('in-expiry').value;
  const supplier = document.getElementById('in-supplier').value.trim();
  const price = document.getElementById('in-price').value;
  const notes = document.getElementById('in-notes').value.trim();

  if (!date || !itemId || !qty || qty < 1) {
    showToast('Please fill in required fields', 'error'); return;
  }
  if (!expiry) { showToast('Expiry date is required', 'error'); return; }

  const item = db.items.find(i => i.id === itemId);
  const total = price && qty ? (parseFloat(price) * qty).toFixed(2) : '';

  db.stockIn.push({ id: genId(), date, itemId, batch, qty, expiry, supplier, price: price || '', total, notes });
  saveDB();
  closeModal('in-modal');
  renderStockIn();
  updateBadges();
  showToast(`Stock In recorded: ${qty} ${item?.unit||''} of ${item?.name||''}`, 'success');
}

function deleteStockIn(id) {
  if (!confirm('Remove this stock-in record?')) return;
  db.stockIn = db.stockIn.filter(r => r.id !== id);
  saveDB();
  renderStockIn();
  updateBadges();
  showToast('Record removed', 'warning');
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

function saveStockOut() {
  const date = document.getElementById('out-date').value;
  const itemId = parseInt(document.getElementById('out-item').value);
  const qty = parseInt(document.getElementById('out-qty').value);
  const reason = document.getElementById('out-reason').value;
  const customer = document.getElementById('out-customer').value.trim();
  const price = document.getElementById('out-price').value;
  const notes = document.getElementById('out-notes').value.trim();

  if (!date || !itemId || !qty || qty < 1) {
    showToast('Please fill in required fields', 'error'); return;
  }

  const item = db.items.find(i => i.id === itemId);
  const currentStock = getStock(itemId);
  if (qty > currentStock) {
    showToast(`Not enough stock. Available: ${currentStock} ${item?.unit||''}`, 'error'); return;
  }

  const total = price && qty ? (parseFloat(price) * qty).toFixed(2) : '';
  db.stockOut.push({ id: genId(), date, itemId, qty, reason, customer, price: price || '', total, notes });
  saveDB();
  closeModal('out-modal');
  renderStockOut();
  updateBadges();
  showToast(`Stock Out recorded: ${qty} ${item?.unit||''} of ${item?.name||''}`, 'success');
}

function deleteStockOut(id) {
  if (!confirm('Remove this stock-out record?')) return;
  db.stockOut = db.stockOut.filter(r => r.id !== id);
  saveDB();
  renderStockOut();
  updateBadges();
  showToast('Record removed', 'warning');
}

// ---- HELPERS ----

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
    csv = 'Name,Generic,Category,Unit,Min Stock,Current Stock,Purchase Price,Sell Price\n';
    db.items.forEach(i => {
      csv += `"${i.name}","${i.generic||''}","${i.category||''}","${i.unit}",${i.minStock},${getStock(i.id)},${i.purchasePrice||''},${i.sellPrice||''}\n`;
    });
  } else if (tab === 'in') {
    filename = 'stock_in.csv';
    csv = 'Date,Item,Batch,Qty,Expiry,Supplier,Price,Total,Notes\n';
    db.stockIn.forEach(r => {
      const item = db.items.find(i => i.id === r.itemId);
      csv += `"${r.date}","${item?.name||''}","${r.batch||''}",${r.qty},"${r.expiry||''}","${r.supplier||''}",${r.price||''},${r.total||''},"${r.notes||''}"\n`;
    });
  } else if (tab === 'out') {
    filename = 'stock_out.csv';
    csv = 'Date,Item,Qty,Reason,Customer,Price,Total,Notes\n';
    db.stockOut.forEach(r => {
      const item = db.items.find(i => i.id === r.itemId);
      csv += `"${r.date}","${item?.name||''}",${r.qty},"${r.reason}","${r.customer||''}",${r.price||''},${r.total||''},"${r.notes||''}"\n`;
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

// ---- DOWNLOAD BACKUP (JSON) ----

function downloadBackup() {
  const jsonStr = JSON.stringify(db, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  const todayStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `pharmacare_backup_${todayStr}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
  showToast('Database backup downloaded successfully', 'success');
}

// ---- INIT ----

document.addEventListener('DOMContentLoaded', () => {

  // Set current date
  document.getElementById('current-date').textContent =
    new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  // Set pharmacy name
  document.getElementById('pharmacy-name-display').textContent = db.pharmacyName;

  // Nav buttons
  document.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Dashboard "View All" links
  document.querySelectorAll('[data-tab]').forEach(el => {
    if (el.tagName === 'BUTTON' && !el.classList.contains('nav-item')) {
      el.addEventListener('click', () => switchTab(el.dataset.tab));
    }
  });

  // Quick Add (Stock In)
  document.getElementById('quick-add-btn').addEventListener('click', openAddStockIn);

  // Backup & Export
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

  // Auto-calc total for stock in
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

  // Show available stock when item selected for out
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

  // Auto-calc total for stock out
  const calcOutTotal = () => {
    const p = parseFloat(document.getElementById('out-price').value) || 0;
    const q = parseInt(document.getElementById('out-qty').value) || 0;
    document.getElementById('out-total').value = p && q ? (p * q).toFixed(2) : '';
  };
  document.getElementById('out-price').addEventListener('input', calcOutTotal);
  document.getElementById('out-qty').addEventListener('input', calcOutTotal);

  // Pharmacy name modal
  document.getElementById('edit-pharmacy-btn').addEventListener('click', () => {
    document.getElementById('pharmacy-name-input').value = db.pharmacyName;
    openModal('pharmacy-modal');
  });
  document.getElementById('pharmacy-modal-close').addEventListener('click', () => closeModal('pharmacy-modal'));
  document.getElementById('pharmacy-modal-cancel').addEventListener('click', () => closeModal('pharmacy-modal'));
  document.getElementById('pharmacy-modal-save').addEventListener('click', () => {
    const name = document.getElementById('pharmacy-name-input').value.trim();
    if (name) {
      db.pharmacyName = name;
      saveDB();
      document.getElementById('pharmacy-name-display').textContent = name;
      showToast('Pharmacy name updated', 'success');
    }
    closeModal('pharmacy-modal');
  });

  // Search/filter events
  document.getElementById('items-search').addEventListener('input', renderItems);
  document.getElementById('items-category-filter').addEventListener('change', renderItems);
  document.getElementById('in-search').addEventListener('input', renderStockIn);
  document.getElementById('in-date-filter').addEventListener('change', renderStockIn);
  document.getElementById('out-search').addEventListener('input', renderStockOut);
  document.getElementById('out-date-filter').addEventListener('change', renderStockOut);
  document.getElementById('stock-search').addEventListener('input', renderStock);
  document.getElementById('stock-status-filter').addEventListener('change', renderStock);

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });

  // Open date picker on click/focus for date inputs to make selection easier
  document.querySelectorAll('input[type="date"]').forEach(input => {
    input.addEventListener('click', () => {
      try {
        input.showPicker();
      } catch (e) {}
    });
    input.addEventListener('focus', () => {
      try {
        input.showPicker();
      } catch (e) {}
    });
  });

  // Initial render
  switchTab('dashboard');
  
  // Sync with server if running in server mode
  syncWithServer();
});
