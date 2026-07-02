import secrets
from flask import request, jsonify, redirect, session, Blueprint
from datetime import datetime, timedelta
from config import PORT
from auth import hash_password, verify_password, require_role
from database import get_db_connection, create_backup

api = Blueprint('api', __name__)

@api.route('/login', methods=['POST'])
def api_login():
    data = request.json or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()

    if user and verify_password(password, user['password_hash']):
        session['user'] = {'username': username, 'role': user['role']}
        return jsonify({'success': True, 'role': user['role'], 'username': username})
    
    return jsonify({'success': False, 'error': 'Invalid username or password'}), 401

@api.route('/logout', methods=['POST'])
def api_logout():
    session.pop('user', None)
    return jsonify({'success': True})

@api.route('/session', methods=['GET'])
def api_session():
    if 'user' in session:
        return jsonify({'logged_in': True, 'user': session['user']})
    return jsonify({'logged_in': False}), 401

# --- CONFIG & SETTINGS ---
@api.route('/config', methods=['GET'])
def get_config():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM config")
    config = {r['key']: r['val'] for r in cursor.fetchall()}
    conn.close()
    return jsonify(config)

@api.route('/config', methods=['POST'])
@require_role(['owner'])
def update_config():
    data = request.json or {}
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if 'pharmacyName' in data:
            cursor.execute("INSERT OR REPLACE INTO config (key, val) VALUES ('pharmacyName', ?)", (data['pharmacyName'],))
        if 'pharmacyAddress' in data:
            cursor.execute("INSERT OR REPLACE INTO config (key, val) VALUES ('pharmacyAddress', ?)", (data['pharmacyAddress'],))
        if 'pharmacyPhone' in data:
            cursor.execute("INSERT OR REPLACE INTO config (key, val) VALUES ('pharmacyPhone', ?)", (data['pharmacyPhone'],))
        
        if data.get('newOwnerPassword'):
            cursor.execute("UPDATE users SET password_hash = ? WHERE username = 'owner'", (hash_password(data['newOwnerPassword']),))
        if data.get('newCashierPassword'):
            cursor.execute("UPDATE users SET password_hash = ? WHERE username = 'cashier'", (hash_password(data['newCashierPassword']),))
            
        conn.commit()
        create_backup()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# --- ITEMS CATALOG ---
@api.route('/items', methods=['GET'])
def get_items():
    user = session.get('user')
    if not user:
        return jsonify({'error': 'Unauthorized'}), 403

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT i.id, i.name, i.generic, i.category, i.unit, i.minStock, i.notes,
               COALESCE(SUM(b.qty_remaining), 0) as currentStock,
               MIN(CASE WHEN b.qty_remaining > 0 THEN b.expiry ELSE NULL END) as nearestExpiry,
               MIN(CASE WHEN b.qty_remaining > 0 THEN b.sell_price ELSE NULL END) as sellPrice,
               MIN(CASE WHEN b.qty_remaining > 0 THEN b.purchase_price ELSE NULL END) as purchasePrice
        FROM items i
        LEFT JOIN batches b ON i.id = b.itemId
        GROUP BY i.id
    ''')
    rows = cursor.fetchall()
    conn.close()

    items = []
    for r in rows:
        item = {
            'id': r['id'],
            'name': r['name'],
            'generic': r['generic'],
            'category': r['category'],
            'unit': r['unit'],
            'minStock': r['minStock'],
            'notes': r['notes'],
            'currentStock': r['currentStock'],
            'expiry': r['nearestExpiry'] or '',
            'sellPrice': r['sellPrice'] or 0.0
        }
        if user['role'] == 'owner':
            item['purchasePrice'] = r['purchasePrice'] or 0.0
        items.append(item)

    return jsonify(items)

@api.route('/items', methods=['POST'])
@require_role(['owner'])
def add_item():
    data = request.json or {}
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'error': 'Name is required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO items (name, generic, category, unit, minStock, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (name, data.get('generic'), data.get('category'), data.get('unit'), data.get('minStock', 0), data.get('notes')))
        conn.commit()
        create_backup()
        return jsonify({'success': True, 'id': cursor.lastrowid})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@api.route('/items/<int:item_id>', methods=['PUT'])
@require_role(['owner'])
def edit_item(item_id):
    data = request.json or {}
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            UPDATE items 
            SET name = ?, generic = ?, category = ?, unit = ?, minStock = ?, notes = ?
            WHERE id = ?
        ''', (data.get('name'), data.get('generic'), data.get('category'), data.get('unit'), data.get('minStock', 0), data.get('notes'), item_id))
        conn.commit()
        create_backup()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@api.route('/items/<int:item_id>', methods=['DELETE'])
@require_role(['owner'])
def delete_item(item_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM items WHERE id = ?", (item_id,))
        cursor.execute("DELETE FROM batches WHERE itemId = ?", (item_id,))
        conn.commit()
        create_backup()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# --- BATCHES & STOCK-IN ---
@api.route('/batches', methods=['GET'])
@require_role(['owner'])
def get_batches():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT b.*, i.name as itemName, i.unit as itemUnit
        FROM batches b
        JOIN items i ON b.itemId = i.id
        ORDER BY b.expiry ASC
    ''')
    rows = cursor.fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@api.route('/stock-in', methods=['POST'])
@require_role(['owner'])
def stock_in():
    data = request.json or {}
    itemId = data.get('itemId')
    qty = int(data.get('qty', 0))
    expiry = data.get('expiry', '').strip()

    if not itemId or qty <= 0 or not expiry:
        return jsonify({'error': 'Item, Quantity, and Expiry are required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        purchase_price = float(data.get('purchasePrice', 0.0))
        sell_price = float(data.get('sellPrice', 0.0))
        date = data.get('date', datetime.now().strftime('%Y-%m-%d'))
        
        # New supplier payments tracking attributes
        payment_status = data.get('paymentStatus', 'Pending')
        amount_paid = float(data.get('amountPaid', 0.0))

        cursor.execute('''
            INSERT INTO batches (itemId, batch_number, expiry, qty_received, qty_remaining, purchase_price, sell_price, supplier, date_added, payment_status, amount_paid)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (itemId, data.get('batchNumber'), expiry, qty, qty, purchase_price, sell_price, data.get('supplier'), date, payment_status, amount_paid))
        
        conn.commit()
        create_backup()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@api.route('/batches/<int:batch_id>/pay', methods=['POST'])
@require_role(['owner'])
def pay_supplier_batch(batch_id):
    data = request.json or {}
    amount = float(data.get('amount', 0.0))

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT qty_received, purchase_price, amount_paid FROM batches WHERE id = ?", (batch_id,))
        batch = cursor.fetchone()
        if not batch:
            return jsonify({'error': 'Batch not found'}), 404
        
        total_cost = batch['qty_received'] * batch['purchase_price']
        new_amount_paid = min(total_cost, batch['amount_paid'] + amount)
        payment_status = 'Paid' if new_amount_paid >= total_cost else 'Pending'

        cursor.execute('''
            UPDATE batches 
            SET amount_paid = ?, payment_status = ? 
            WHERE id = ?
        ''', (new_amount_paid, payment_status, batch_id))
        
        conn.commit()
        create_backup()
        return jsonify({'success': True, 'payment_status': payment_status, 'amount_paid': new_amount_paid})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# --- SALES & BILLING ---
@api.route('/sales/checkout', methods=['POST'])
@require_role(['cashier', 'owner'])
def sales_checkout():
    data = request.json or {}
    items = data.get('items', [])
    payment_method = data.get('paymentMethod', 'Cash')
    discount = float(data.get('discount', 0.0))
    cashier = session['user']['username']

    if not items:
        return jsonify({'error': 'Cart is empty'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("BEGIN TRANSACTION")

        for order_item in items:
            item_id = int(order_item['itemId'])
            req_qty = int(order_item['qty'])

            cursor.execute("SELECT COALESCE(SUM(qty_remaining), 0) as total_stock FROM batches WHERE itemId = ? AND qty_remaining > 0", (item_id,))
            stock_row = cursor.fetchone()
            if stock_row['total_stock'] < req_qty:
                cursor.execute("SELECT name FROM items WHERE id = ?", (item_id,))
                item_name = cursor.fetchone()['name']
                return jsonify({'error': f'Not enough stock for {item_name}'}), 400

        cursor.execute("SELECT val FROM config WHERE key = 'billNextId'")
        next_id_row = cursor.fetchone()
        bill_id = int(next_id_row['val']) if next_id_row else 1
        bill_number = f"BILL-{bill_id:04d}"

        now = datetime.now()
        date_str = now.strftime('%Y-%m-%d')
        time_str = now.strftime('%H:%M:%S')
        
        cursor.execute('''
            INSERT INTO bills (id, billNumber, date, time, cashier, paymentMethod, discount, total)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (bill_id, bill_number, date_str, time_str, cashier, payment_method, discount, 0.0))

        grand_total = 0.0

        for order_item in items:
            item_id = int(order_item['itemId'])
            qty_needed = int(order_item['qty'])

            cursor.execute('''
                SELECT * FROM batches 
                WHERE itemId = ? AND qty_remaining > 0 
                ORDER BY expiry ASC
            ''', (item_id,))
            active_batches = cursor.fetchall()

            for batch in active_batches:
                if qty_needed <= 0:
                    break
                b_id = batch['id']
                b_rem = batch['qty_remaining']
                deduct = min(qty_needed, b_rem)

                cursor.execute("UPDATE batches SET qty_remaining = qty_remaining - ? WHERE id = ?", (deduct, b_id))

                sell_price = batch['sell_price'] or 0.0
                total_item_cost = deduct * sell_price
                grand_total += total_item_cost

                cursor.execute('''
                    INSERT INTO sales_items (billId, itemId, batchId, qty, price, total)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (bill_id, item_id, b_id, deduct, sell_price, total_item_cost))

                qty_needed -= deduct

        grand_total = max(0.0, grand_total - discount)
        cursor.execute("UPDATE bills SET total = ? WHERE id = ?", (grand_total, bill_id))
        cursor.execute("INSERT OR REPLACE INTO config (key, val) VALUES ('billNextId', ?)", (str(bill_id + 1),))

        conn.commit()
        create_backup()
        return jsonify({'success': True, 'billNumber': bill_number, 'billId': bill_id})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@api.route('/sales', methods=['GET'])
@require_role(['owner', 'cashier'])
def get_sales():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM bills ORDER BY id DESC")
    bills_rows = cursor.fetchall()

    sales = []
    for r in bills_rows:
        bill_id = r['id']
        cursor.execute('''
            SELECT si.qty, si.price, i.name, i.unit
            FROM sales_items si
            JOIN items i ON si.itemId = i.id
            WHERE si.billId = ?
        ''', (bill_id,))
        items_rows = cursor.fetchall()
        items_list = [{
            'name': it['name'],
            'qty': it['qty'],
            'price': it['price'],
            'unit': it['unit']
        } for it in items_rows]

        sales.append({
            'id': r['id'],
            'billNumber': r['billNumber'],
            'date': r['date'],
            'time': r['time'],
            'cashier': r['cashier'],
            'paymentMethod': r['paymentMethod'],
            'discount': r['discount'],
            'total': r['total'],
            'status': r['status'],
            'items': items_list
        })
    conn.close()
    return jsonify(sales)

@api.route('/sales/void/<int:bill_id>', methods=['POST'])
@require_role(['owner'])
def void_bill(bill_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("BEGIN TRANSACTION")

        cursor.execute("SELECT status FROM bills WHERE id = ?", (bill_id,))
        bill = cursor.fetchone()
        if not bill or bill['status'] == 'void':
            return jsonify({'error': 'Bill already voided or not found'}), 400

        cursor.execute("UPDATE bills SET status = 'void' WHERE id = ?", (bill_id,))

        cursor.execute("SELECT * FROM sales_items WHERE billId = ?", (bill_id,))
        sales_items = cursor.fetchall()
        for si in sales_items:
            cursor.execute('UPDATE batches SET qty_remaining = qty_remaining + ? WHERE id = ?', (si['qty'], si['batchId']))

        conn.commit()
        create_backup()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# --- STOCK OUT ADJUSTMENTS ---
@api.route('/stock-out', methods=['GET'])
@require_role(['owner'])
def get_stock_outs():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT si.id, bl.date, bl.time, bl.billNumber, bl.cashier, 
               bl.paymentMethod as reason, bl.status as billStatus,
               si.qty, si.price, si.total, i.name as itemName, i.unit as itemUnit
        FROM sales_items si
        JOIN bills bl ON si.billId = bl.id
        JOIN items i ON si.itemId = i.id
        ORDER BY si.id DESC
    ''')
    rows = cursor.fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@api.route('/stock-out', methods=['POST'])
@require_role(['owner'])
def record_stock_out():
    data = request.json or {}
    itemId = data.get('itemId')
    qty = int(data.get('qty', 0))
    reason = data.get('reason', 'Sale')
    customer = data.get('customer', '')
    price = float(data.get('price', 0.0))
    notes = data.get('notes', '')
    date = data.get('date', datetime.now().strftime('%Y-%m-%d'))
    cashier = session['user']['username']

    if not itemId or qty <= 0:
        return jsonify({'error': 'Item and Quantity are required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("BEGIN TRANSACTION")

        cursor.execute('''
            SELECT * FROM batches 
            WHERE itemId = ? AND qty_remaining > 0 
            ORDER BY expiry ASC
        ''', (itemId,))
        active_batches = cursor.fetchall()

        total_avail = sum(b['qty_remaining'] for b in active_batches)
        if qty > total_avail:
            return jsonify({'error': f'Not enough stock. Available: {total_avail}'}), 400

        qty_left = qty
        bill_number = f"ADJ-{secrets.token_hex(4).upper()}"
        now_time = datetime.now().strftime('%H:%M:%S')
        
        cursor.execute('''
            INSERT INTO bills (billNumber, date, time, cashier, paymentMethod, total, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (bill_number, date, now_time, cashier, reason, qty * price, 'adjustment'))
        bill_id = cursor.lastrowid

        for batch in active_batches:
            if qty_left <= 0:
                break
            b_id = batch['id']
            b_rem = batch['qty_remaining']
            deduct = min(qty_left, b_rem)

            cursor.execute("UPDATE batches SET qty_remaining = qty_remaining - ? WHERE id = ?", (deduct, b_id))

            cursor.execute('''
                INSERT INTO sales_items (billId, itemId, batchId, qty, price, total)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (bill_id, itemId, b_id, deduct, price, deduct * price))

            qty_left -= deduct

        conn.commit()
        create_backup()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# --- EXPENSES ---
@api.route('/expenses', methods=['GET'])
@require_role(['owner'])
def get_expenses():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM expenses ORDER BY date DESC")
    rows = cursor.fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@api.route('/expenses', methods=['POST'])
@require_role(['owner'])
def add_expense():
    data = request.json or {}
    date = data.get('date', datetime.now().strftime('%Y-%m-%d'))
    category = data.get('category', '').strip()
    amount = float(data.get('amount', 0.0))

    if not category or amount <= 0:
        return jsonify({'error': 'Category and Amount are required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO expenses (date, category, amount, notes) VALUES (?, ?, ?, ?)",
                       (date, category, amount, data.get('notes', '')))
        conn.commit()
        create_backup()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@api.route('/expenses/<int:exp_id>', methods=['DELETE'])
@require_role(['owner'])
def delete_expense(exp_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM expenses WHERE id = ?", (exp_id,))
        conn.commit()
        create_backup()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# --- REMOTE OWNER DASHBOARD & REPORTS ---
@api.route('/reports/dashboard', methods=['GET'])
@require_role(['owner'])
def get_dashboard_reports():
    conn = get_db_connection()
    cursor = conn.cursor()

    today_str = datetime.now().strftime('%Y-%m-%d')

    # 1. Today's stats
    cursor.execute("SELECT COALESCE(SUM(total), 0) as total_sales, COUNT(*) as invoices_count FROM bills WHERE date = ? AND status = 'active'", (today_str,))
    sales_row = cursor.fetchone()
    today_sales = float(sales_row['total_sales'])
    today_invoices = int(sales_row['invoices_count'])

    cursor.execute('''
        SELECT COALESCE(SUM(si.qty * b.purchase_price), 0) as total_cogs
        FROM sales_items si
        JOIN batches b ON si.batchId = b.id
        JOIN bills bl ON si.billId = bl.id
        WHERE bl.date = ? AND bl.status = 'active'
    ''', (today_str,))
    today_cogs = float(cursor.fetchone()['total_cogs'])

    cursor.execute("SELECT COALESCE(SUM(amount), 0) as total_expenses FROM expenses WHERE date = ?", (today_str,))
    today_expenses = float(cursor.fetchone()['total_expenses'])

    today_gross_profit = today_sales - today_cogs
    today_net_profit = today_gross_profit - today_expenses

    # 2. Payment methods breakdown (Today)
    cursor.execute("SELECT paymentMethod, SUM(total) as method_total FROM bills WHERE date = ? AND status = 'active' GROUP BY paymentMethod", (today_str,))
    payments = {r['paymentMethod']: float(r['method_total']) for r in cursor.fetchall()}
    payment_breakdown = {
        'Cash': payments.get('Cash', 0.0),
        'Card': payments.get('Card', 0.0),
        'Online': payments.get('Online', 0.0),
        'Credit': payments.get('Credit', 0.0)
    }

    # 3. Returns today (Voided count and value)
    cursor.execute("SELECT COUNT(*) as void_count, COALESCE(SUM(total), 0) as void_total FROM bills WHERE date = ? AND status = 'void'", (today_str,))
    void_row = cursor.fetchone()
    today_voids_count = int(void_row['void_count'])
    today_voids_value = float(void_row['void_total'])

    # 4. Cashier performance today
    cursor.execute("SELECT cashier, COUNT(*) as sales_count, COALESCE(SUM(total), 0) as sales_total FROM bills WHERE date = ? AND status = 'active' GROUP BY cashier", (today_str,))
    cashier_activity = [dict(r) for r in cursor.fetchall()]

    # 5. Supplier payable summary (remaining unpaid batches value)
    cursor.execute("SELECT SUM((qty_received * purchase_price) - amount_paid) as total_payable FROM batches WHERE payment_status = 'Pending'")
    payable_row = cursor.fetchone()
    supplier_payable_total = float(payable_row['total_payable']) if payable_row['total_payable'] else 0.0

    # 6. Weekly/Monthly Sales & Profit
    # Last 7 days
    weekly_labels = []
    weekly_sales = []
    weekly_profits = []
    for i in range(6, -1, -1):
        day = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
        weekly_labels.append(day)
        
        cursor.execute("SELECT COALESCE(SUM(total), 0) as total FROM bills WHERE date = ? AND status = 'active'", (day,))
        day_sales = float(cursor.fetchone()['total'])
        weekly_sales.append(day_sales)

        cursor.execute('''
            SELECT COALESCE(SUM(si.qty * b.purchase_price), 0) as total_cogs
            FROM sales_items si
            JOIN batches b ON si.batchId = b.id
            JOIN bills bl ON si.billId = bl.id
            WHERE bl.date = ? AND bl.status = 'active'
        ''', (day,))
        day_cogs = float(cursor.fetchone()['total_cogs'])
        
        cursor.execute("SELECT COALESCE(SUM(amount), 0) as total_expenses FROM expenses WHERE date = ?", (day,))
        day_exp = float(cursor.fetchone()['total_expenses'])
        weekly_profits.append(day_sales - day_cogs - day_exp)

    # 7. Global inventory values
    cursor.execute("SELECT SUM(qty_remaining * purchase_price) as valuation FROM batches WHERE qty_remaining > 0")
    stock_valuation = float(cursor.fetchone()['valuation'] or 0.0)

    conn.close()

    return jsonify({
        'todaySales': today_sales,
        'todayInvoices': today_invoices,
        'todayGrossProfit': today_gross_profit,
        'todayExpenses': today_expenses,
        'todayNetProfit': today_net_profit,
        'paymentBreakdown': payment_breakdown,
        'returnsToday': {
            'count': today_voids_count,
            'value': today_voids_value
        },
        'cashierActivity': cashier_activity,
        'supplierPayable': supplier_payable_total,
        'stockValuation': stock_valuation,
        'weeklyLabels': weekly_labels,
        'weeklySales': weekly_sales,
        'weeklyProfits': weekly_profits
    })
