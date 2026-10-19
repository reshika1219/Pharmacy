import secrets
from flask import request, jsonify, session, Blueprint
from datetime import datetime, timedelta
from config import PORT
from auth import hash_password, verify_password, require_role
from database import get_db_connection, create_backup

api = Blueprint('api', __name__)

# ─────────────────────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────────────────────

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
        session['user'] = {'username': username, 'role': user['role'], 'full_name': user['full_name']}
        return jsonify({'success': True, 'role': user['role'], 'username': username, 'full_name': user['full_name']})

    return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

@api.route('/logout', methods=['POST'])
def api_logout():
    session.pop('user', None)
    return jsonify({'success': True})

@api.route('/session', methods=['GET'])
def api_session():
    if 'user' in session:
        return jsonify({'logged_in': True, 'user': session['user']})
    return jsonify({'logged_in': False}), 401

# ─────────────────────────────────────────────────────────
# CONFIG / SETTINGS
# ─────────────────────────────────────────────────────────

@api.route('/config', methods=['GET'])
def get_config():
    user = session.get('user')
    if not user:
        return jsonify({'error': 'Unauthorized'}), 403
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM config")
    cfg = {r['key']: r['val'] for r in cursor.fetchall()}
    conn.close()
    return jsonify(cfg)

@api.route('/config', methods=['POST'])
@require_role(['admin'])
def update_config():
    data = request.json or {}
    fields = ['businessName', 'businessAddress', 'businessPhone', 'currency',
              'currencyCode', 'taxRate', 'receiptFooter', 'loyaltyEnabled', 'loyaltyRate']
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        for field in fields:
            if field in data:
                cursor.execute("INSERT OR REPLACE INTO config (key, val) VALUES (?, ?)", (field, str(data[field])))
        if data.get('newAdminPassword'):
            cursor.execute("UPDATE users SET password_hash = ? WHERE role = 'admin'",
                           (hash_password(data['newAdminPassword']),))
        if data.get('newCashierPassword'):
            cursor.execute("UPDATE users SET password_hash = ? WHERE role = 'cashier'",
                           (hash_password(data['newCashierPassword']),))
        conn.commit()
        create_backup()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# ─────────────────────────────────────────────────────────
# USERS
# ─────────────────────────────────────────────────────────

@api.route('/users', methods=['GET'])
@require_role(['admin'])
def get_users():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, role, full_name, created_at FROM users ORDER BY id")
    users = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify(users)

@api.route('/users', methods=['POST'])
@require_role(['admin'])
def create_user():
    data = request.json or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    role = data.get('role', 'cashier')
    full_name = data.get('full_name', '').strip()
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (username, password_hash, role, full_name, created_at) VALUES (?, ?, ?, ?, ?)",
            (username, hash_password(password), role, full_name, datetime.now().isoformat())
        )
        conn.commit()
        return jsonify({'success': True, 'id': cursor.lastrowid})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@api.route('/users/<int:user_id>', methods=['DELETE'])
@require_role(['admin'])
def delete_user(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# ─────────────────────────────────────────────────────────
# CATEGORIES
# ─────────────────────────────────────────────────────────

@api.route('/categories', methods=['GET'])
def get_categories():
    user = session.get('user')
    if not user:
        return jsonify({'error': 'Unauthorized'}), 403
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM categories ORDER BY name")
    cats = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify(cats)

@api.route('/categories', methods=['POST'])
@require_role(['admin'])
def add_category():
    data = request.json or {}
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'error': 'Name required'}), 400
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)",
                       (name, data.get('color', '#6366f1'), data.get('icon', 'box')))
        conn.commit()
        return jsonify({'success': True, 'id': cursor.lastrowid})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@api.route('/categories/<int:cat_id>', methods=['PUT'])
@require_role(['admin'])
def update_category(cat_id):
    data = request.json or {}
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE categories SET name=?, color=?, icon=? WHERE id=?",
                       (data.get('name'), data.get('color'), data.get('icon'), cat_id))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@api.route('/categories/<int:cat_id>', methods=['DELETE'])
@require_role(['admin'])
def delete_category(cat_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM categories WHERE id=?", (cat_id,))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# ─────────────────────────────────────────────────────────
# PRODUCTS
# ─────────────────────────────────────────────────────────

@api.route('/products', methods=['GET'])
def get_products():
    user = session.get('user')
    if not user:
        return jsonify({'error': 'Unauthorized'}), 403
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT p.*, c.name as category_name, c.color as category_color,
               COALESCE(SUM(b.qty_remaining), 0) as current_stock,
               MIN(CASE WHEN b.qty_remaining > 0 THEN b.sell_price ELSE NULL END) as sell_price,
               MIN(CASE WHEN b.qty_remaining > 0 THEN b.cost_price ELSE NULL END) as cost_price
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN batches b ON p.id = b.product_id
        GROUP BY p.id
        ORDER BY p.name
    ''')
    rows = cursor.fetchall()
    conn.close()
    result = []
    for r in rows:
        item = dict(r)
        if user['role'] != 'admin':
            item.pop('cost_price', None)
        result.append(item)
    return jsonify(result)

@api.route('/products', methods=['POST'])
@require_role(['admin'])
def add_product():
    data = request.json or {}
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'error': 'Name required'}), 400
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        sku = data.get('sku') or f"SKU-{secrets.token_hex(4).upper()}"
        cursor.execute('''
            INSERT INTO products (name, sku, category_id, unit, barcode, description, min_stock, track_inventory, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (name, sku, data.get('category_id'), data.get('unit', 'pcs'),
              data.get('barcode'), data.get('description'), data.get('min_stock', 0),
              1 if data.get('track_inventory', True) else 0, datetime.now().isoformat()))
        conn.commit()
        create_backup()
        return jsonify({'success': True, 'id': cursor.lastrowid})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@api.route('/products/<int:product_id>', methods=['PUT'])
@require_role(['admin'])
def update_product(product_id):
    data = request.json or {}
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            UPDATE products SET name=?, sku=?, category_id=?, unit=?, barcode=?, description=?, min_stock=?, track_inventory=?
            WHERE id=?
        ''', (data.get('name'), data.get('sku'), data.get('category_id'), data.get('unit', 'pcs'),
              data.get('barcode'), data.get('description'), data.get('min_stock', 0),
              1 if data.get('track_inventory', True) else 0, product_id))
        conn.commit()
        create_backup()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@api.route('/products/<int:product_id>', methods=['DELETE'])
@require_role(['admin'])
def delete_product(product_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM order_items WHERE product_id=?", (product_id,))
        cursor.execute("DELETE FROM batches WHERE product_id=?", (product_id,))
        cursor.execute("DELETE FROM products WHERE id=?", (product_id,))
        conn.commit()
        create_backup()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# ─────────────────────────────────────────────────────────
# STOCK / BATCHES
# ─────────────────────────────────────────────────────────

@api.route('/batches', methods=['GET'])
@require_role(['admin'])
def get_batches():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT b.*, p.name as product_name, p.unit as product_unit
        FROM batches b
        JOIN products p ON b.product_id = p.id
        ORDER BY b.date_added DESC
    ''')
    rows = cursor.fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@api.route('/stock-in', methods=['POST'])
@require_role(['admin'])
def stock_in():
    data = request.json or {}
    product_id = data.get('product_id')
    qty = int(data.get('qty') or data.get('qty_received') or 0)

    if not product_id or qty <= 0:
        return jsonify({'error': 'Product and quantity required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO batches (product_id, batch_ref, qty_received, qty_remaining, cost_price, sell_price, supplier, date_added, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (product_id, data.get('batch_ref', ''), qty, qty,
              float(data.get('cost_price', 0.0)), float(data.get('sell_price', 0.0)),
              data.get('supplier', ''), data.get('date', datetime.now().strftime('%Y-%m-%d')),
              data.get('notes', '')))
        conn.commit()
        create_backup()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@api.route('/stock-adjust', methods=['POST'])
@require_role(['admin'])
def stock_adjust():
    """Manual stock adjustment (damage, loss, correction)."""
    data = request.json or {}
    product_id = data.get('product_id')
    qty_change = int(data.get('qty_change', 0))  # negative = reduce
    reason = data.get('reason', 'Adjustment')

    if not product_id:
        return jsonify({'error': 'Product required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("BEGIN TRANSACTION")
        if qty_change > 0:
            # Add as a new adjustment batch
            cursor.execute('''
                INSERT INTO batches (product_id, batch_ref, qty_received, qty_remaining, cost_price, sell_price, date_added, notes)
                VALUES (?, ?, ?, ?, 0, 0, ?, ?)
            ''', (product_id, f'ADJ-{secrets.token_hex(3).upper()}', qty_change, qty_change,
                  datetime.now().strftime('%Y-%m-%d'), reason))
        else:
            # Deduct from existing batches FIFO
            to_deduct = abs(qty_change)
            cursor.execute("SELECT * FROM batches WHERE product_id=? AND qty_remaining > 0 ORDER BY date_added ASC", (product_id,))
            for batch in cursor.fetchall():
                if to_deduct <= 0:
                    break
                deduct = min(to_deduct, batch['qty_remaining'])
                cursor.execute("UPDATE batches SET qty_remaining = qty_remaining - ? WHERE id = ?", (deduct, batch['id']))
                to_deduct -= deduct
        conn.commit()
        create_backup()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# ─────────────────────────────────────────────────────────
# CUSTOMERS
# ─────────────────────────────────────────────────────────

@api.route('/customers', methods=['GET'])
def get_customers():
    user = session.get('user')
    if not user:
        return jsonify({'error': 'Unauthorized'}), 403
    conn = get_db_connection()
    cursor = conn.cursor()
    q = request.args.get('q', '')
    if q:
        cursor.execute("SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY name", (f'%{q}%', f'%{q}%'))
    else:
        cursor.execute("SELECT * FROM customers ORDER BY name")
    rows = cursor.fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@api.route('/customers', methods=['POST'])
def add_customer():
    user = session.get('user')
    if not user:
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.json or {}
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'error': 'Name required'}), 400
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO customers (name, phone, email, address, created_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (name, data.get('phone', ''), data.get('email', ''), data.get('address', ''), datetime.now().isoformat()))
        conn.commit()
        return jsonify({'success': True, 'id': cursor.lastrowid})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@api.route('/customers/<int:cust_id>', methods=['PUT'])
@require_role(['admin'])
def update_customer(cust_id):
    data = request.json or {}
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE customers SET name=?, phone=?, email=?, address=? WHERE id=?",
                       (data.get('name'), data.get('phone'), data.get('email'), data.get('address'), cust_id))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@api.route('/customers/<int:cust_id>', methods=['DELETE'])
@require_role(['admin'])
def delete_customer(cust_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM customers WHERE id=?", (cust_id,))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# ─────────────────────────────────────────────────────────
# SUPPLIERS
# ─────────────────────────────────────────────────────────

@api.route('/suppliers', methods=['GET'])
@require_role(['admin'])
def get_suppliers():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM suppliers ORDER BY name")
    rows = cursor.fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@api.route('/suppliers', methods=['POST'])
@require_role(['admin'])
def add_supplier():
    data = request.json or {}
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'error': 'Name required'}), 400
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO suppliers (name, contact_person, phone, email, address, notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (name, data.get('contact_person', ''), data.get('phone', ''), data.get('email', ''),
              data.get('address', ''), data.get('notes', ''), datetime.now().isoformat()))
        conn.commit()
        return jsonify({'success': True, 'id': cursor.lastrowid})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@api.route('/suppliers/<int:sup_id>', methods=['PUT'])
@require_role(['admin'])
def update_supplier(sup_id):
    data = request.json or {}
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            UPDATE suppliers SET name=?, contact_person=?, phone=?, email=?, address=?, notes=? WHERE id=?
        ''', (data.get('name'), data.get('contact_person'), data.get('phone'),
              data.get('email'), data.get('address'), data.get('notes'), sup_id))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@api.route('/suppliers/<int:sup_id>', methods=['DELETE'])
@require_role(['admin'])
def delete_supplier(sup_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM suppliers WHERE id=?", (sup_id,))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# ─────────────────────────────────────────────────────────
# POS / ORDERS / CHECKOUT
# ─────────────────────────────────────────────────────────

@api.route('/orders/checkout', methods=['POST'])
def checkout():
    user = session.get('user')
    if not user:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.json or {}
    items = data.get('items', [])
    if not items:
        return jsonify({'error': 'Cart is empty'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("BEGIN TRANSACTION")

        # Check stock availability
        for cart_item in items:
            pid = int(cart_item['product_id'])
            qty = int(cart_item['qty'])
            cursor.execute("SELECT track_inventory FROM products WHERE id=?", (pid,))
            prod = cursor.fetchone()
            if prod and prod['track_inventory']:
                cursor.execute("SELECT COALESCE(SUM(qty_remaining), 0) as total FROM batches WHERE product_id=? AND qty_remaining > 0", (pid,))
                avail = cursor.fetchone()['total']
                if avail < qty:
                    cursor.execute("SELECT name FROM products WHERE id=?", (pid,))
                    pname = cursor.fetchone()['name']
                    return jsonify({'error': f'Insufficient stock for "{pname}". Available: {avail}'}), 400

        # Get next order number
        cursor.execute("SELECT val FROM config WHERE key = 'orderNextId'")
        next_id_row = cursor.fetchone()
        order_seq = int(next_id_row['val']) if next_id_row else 1
        order_number = f"ORD-{order_seq:05d}"

        # Tax rate
        cursor.execute("SELECT val FROM config WHERE key = 'taxRate'")
        tax_row = cursor.fetchone()
        tax_rate = float(tax_row['val']) if tax_row else 0.0

        now = datetime.now()
        payment_method = data.get('payment_method', 'Cash')
        customer_id = data.get('customer_id') or None
        discount_amount = float(data.get('discount_amount', 0.0))
        notes = data.get('notes', '')
        amount_tendered = float(data.get('amount_tendered', 0.0))

        # Insert order skeleton
        cursor.execute('''
            INSERT INTO orders (order_number, date, time, cashier, customer_id, payment_method,
                                discount_amount, notes, subtotal, tax_amount, total, amount_tendered, change_due, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, 0, 'completed')
        ''', (order_number, now.strftime('%Y-%m-%d'), now.strftime('%H:%M:%S'),
              user['username'], customer_id, payment_method, discount_amount, notes, amount_tendered))
        order_id = cursor.lastrowid

        subtotal = 0.0

        for cart_item in items:
            pid = int(cart_item['product_id'])
            qty_needed = int(cart_item['qty'])
            unit_price = float(cart_item.get('unit_price', 0.0))
            item_discount_pct = float(cart_item.get('discount_pct', 0.0))

            # Deduct stock FIFO
            cursor.execute("SELECT track_inventory FROM products WHERE id=?", (pid,))
            prod = cursor.fetchone()
            if prod and prod['track_inventory']:
                cursor.execute("SELECT * FROM batches WHERE product_id=? AND qty_remaining > 0 ORDER BY date_added ASC", (pid,))
                qty_left = qty_needed
                batch_used = None
                for batch in cursor.fetchall():
                    if qty_left <= 0:
                        break
                    deduct = min(qty_left, batch['qty_remaining'])
                    cursor.execute("UPDATE batches SET qty_remaining = qty_remaining - ? WHERE id = ?", (deduct, batch['id']))
                    batch_used = batch['id']
                    qty_left -= deduct
            else:
                batch_used = None

            line_total = qty_needed * unit_price * (1 - item_discount_pct / 100)
            subtotal += line_total

            cursor.execute('''
                INSERT INTO order_items (order_id, product_id, batch_id, qty, unit_price, discount_pct, line_total)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (order_id, pid, batch_used, qty_needed, unit_price, item_discount_pct, line_total))

        subtotal_after_discount = max(0.0, subtotal - discount_amount)
        tax_amount = subtotal_after_discount * (tax_rate / 100)
        total = subtotal_after_discount + tax_amount
        change_due = max(0.0, amount_tendered - total)

        cursor.execute('''
            UPDATE orders SET subtotal=?, tax_amount=?, total=?, change_due=? WHERE id=?
        ''', (subtotal, tax_amount, total, change_due, order_id))

        # Update order sequence
        cursor.execute("INSERT OR REPLACE INTO config (key, val) VALUES ('orderNextId', ?)", (str(order_seq + 1),))

        # Update customer stats if applicable
        if customer_id:
            cursor.execute("SELECT val FROM config WHERE key='loyaltyEnabled'")
            loyalty_row = cursor.fetchone()
            loyalty_enabled = loyalty_row and loyalty_row['val'].lower() == 'true'
            if loyalty_enabled:
                cursor.execute("SELECT val FROM config WHERE key='loyaltyRate'")
                rate_row = cursor.fetchone()
                rate = int(rate_row['val']) if rate_row else 1
                points_earned = int(total * rate)
                cursor.execute(
                    "UPDATE customers SET total_spent = total_spent + ?, loyalty_points = loyalty_points + ? WHERE id=?",
                    (total, points_earned, customer_id)
                )
            else:
                cursor.execute("UPDATE customers SET total_spent = total_spent + ? WHERE id=?", (total, customer_id))

        conn.commit()
        create_backup()
        return jsonify({
            'success': True,
            'order_number': order_number,
            'order_id': order_id,
            'total': total,
            'change_due': change_due
        })
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@api.route('/orders', methods=['GET'])
def get_orders():
    user = session.get('user')
    if not user:
        return jsonify({'error': 'Unauthorized'}), 403
    conn = get_db_connection()
    cursor = conn.cursor()
    limit = int(request.args.get('limit', 100))
    offset = int(request.args.get('offset', 0))
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')

    base_query = "FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE o.status != 'void'"
    params = []
    if date_from:
        base_query += " AND o.date >= ?"
        params.append(date_from)
    if date_to:
        base_query += " AND o.date <= ?"
        params.append(date_to)

    cursor.execute(f"SELECT o.*, c.name as customer_name {base_query} ORDER BY o.id DESC LIMIT ? OFFSET ?",
                   params + [limit, offset])
    orders = [dict(r) for r in cursor.fetchall()]

    for order in orders:
        cursor.execute('''
            SELECT oi.*, p.name as product_name, p.unit as product_unit
            FROM order_items oi JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        ''', (order['id'],))
        order['items'] = [dict(i) for i in cursor.fetchall()]

    conn.close()
    return jsonify(orders)

@api.route('/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    user = session.get('user')
    if not user:
        return jsonify({'error': 'Unauthorized'}), 403
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT o.*, c.name as customer_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE o.id=?", (order_id,))
    order = cursor.fetchone()
    if not order:
        conn.close()
        return jsonify({'error': 'Not found'}), 404
    order = dict(order)
    cursor.execute('''
        SELECT oi.*, p.name as product_name, p.unit as product_unit
        FROM order_items oi JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
    ''', (order_id,))
    order['items'] = [dict(i) for i in cursor.fetchall()]
    conn.close()
    return jsonify(order)

@api.route('/orders/<int:order_id>/void', methods=['POST'])
@require_role(['admin'])
def void_order(order_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("BEGIN TRANSACTION")
        cursor.execute("SELECT status FROM orders WHERE id=?", (order_id,))
        order = cursor.fetchone()
        if not order or order['status'] == 'void':
            return jsonify({'error': 'Order not found or already voided'}), 400

        cursor.execute("UPDATE orders SET status='void' WHERE id=?", (order_id,))

        # Restore stock
        cursor.execute("SELECT * FROM order_items WHERE order_id=?", (order_id,))
        for item in cursor.fetchall():
            if item['batch_id']:
                cursor.execute("UPDATE batches SET qty_remaining = qty_remaining + ? WHERE id=?",
                               (item['qty'], item['batch_id']))

        conn.commit()
        create_backup()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# ─────────────────────────────────────────────────────────
# EXPENSES
# ─────────────────────────────────────────────────────────

@api.route('/expenses', methods=['GET'])
@require_role(['admin'])
def get_expenses():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM expenses ORDER BY date DESC, id DESC")
    rows = cursor.fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@api.route('/expenses', methods=['POST'])
@require_role(['admin'])
def add_expense():
    user = session.get('user')
    data = request.json or {}
    category = data.get('category', '').strip()
    amount = float(data.get('amount', 0.0))
    if not category or amount <= 0:
        return jsonify({'error': 'Category and amount required'}), 400
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO expenses (date, category, description, amount, created_by) VALUES (?, ?, ?, ?, ?)",
                       (data.get('date', datetime.now().strftime('%Y-%m-%d')),
                        category, data.get('description', ''), amount, user['username']))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@api.route('/expenses/<int:exp_id>', methods=['DELETE'])
@require_role(['admin'])
def delete_expense(exp_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM expenses WHERE id=?", (exp_id,))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# ─────────────────────────────────────────────────────────
# DASHBOARD / REPORTS
# ─────────────────────────────────────────────────────────

@api.route('/reports/dashboard', methods=['GET'])
@require_role(['admin'])
def dashboard():
    conn = get_db_connection()
    cursor = conn.cursor()
    today = datetime.now().strftime('%Y-%m-%d')

    # Today's sales
    cursor.execute("SELECT COALESCE(SUM(total), 0) as ts, COUNT(*) as tc FROM orders WHERE date=? AND status='completed'", (today,))
    r = cursor.fetchone()
    today_sales = float(r['ts'])
    today_orders = int(r['tc'])

    # Today's COGS
    cursor.execute('''
        SELECT COALESCE(SUM(oi.qty * b.cost_price), 0) as cogs
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        LEFT JOIN batches b ON oi.batch_id = b.id
        WHERE o.date=? AND o.status='completed'
    ''', (today,))
    today_cogs = float(cursor.fetchone()['cogs'])

    # Today's expenses
    cursor.execute("SELECT COALESCE(SUM(amount), 0) as te FROM expenses WHERE date=?", (today,))
    today_expenses = float(cursor.fetchone()['te'])

    # Payment breakdown today
    cursor.execute("SELECT payment_method, SUM(total) as m FROM orders WHERE date=? AND status='completed' GROUP BY payment_method", (today,))
    pay_breakdown = {r['payment_method']: float(r['m']) for r in cursor.fetchall()}

    # Weekly chart (last 7 days)
    weekly_labels, weekly_sales, weekly_profits = [], [], []
    for i in range(6, -1, -1):
        day = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
        weekly_labels.append(day)
        cursor.execute("SELECT COALESCE(SUM(total), 0) as s FROM orders WHERE date=? AND status='completed'", (day,))
        ds = float(cursor.fetchone()['s'])
        weekly_sales.append(ds)
        cursor.execute('''
            SELECT COALESCE(SUM(oi.qty * b.cost_price), 0) as c
            FROM order_items oi JOIN orders o ON oi.order_id=o.id
            LEFT JOIN batches b ON oi.batch_id=b.id
            WHERE o.date=? AND o.status='completed'
        ''', (day,))
        dc = float(cursor.fetchone()['c'])
        cursor.execute("SELECT COALESCE(SUM(amount), 0) as e FROM expenses WHERE date=?", (day,))
        de = float(cursor.fetchone()['e'])
        weekly_profits.append(ds - dc - de)

    # All-time stats
    cursor.execute("SELECT COALESCE(SUM(total), 0) as t FROM orders WHERE status='completed'")
    all_time_sales = float(cursor.fetchone()['t'])

    cursor.execute("SELECT COALESCE(SUM(amount), 0) as t FROM expenses")
    all_time_expenses = float(cursor.fetchone()['t'])

    cursor.execute('''
        SELECT COALESCE(SUM(oi.qty * b.cost_price), 0) as c
        FROM order_items oi JOIN orders o ON oi.order_id=o.id
        LEFT JOIN batches b ON oi.batch_id=b.id
        WHERE o.status='completed'
    ''')
    all_time_cogs = float(cursor.fetchone()['c'])
    all_time_profit = all_time_sales - all_time_cogs - all_time_expenses

    # Inventory stats
    cursor.execute("SELECT SUM(qty_remaining * cost_price) as val FROM batches WHERE qty_remaining > 0")
    stock_val = float(cursor.fetchone()['val'] or 0.0)

    cursor.execute('''
        SELECT p.id, p.name, p.min_stock, COALESCE(SUM(b.qty_remaining), 0) as stock
        FROM products p LEFT JOIN batches b ON p.id=b.product_id
        WHERE p.track_inventory=1
        GROUP BY p.id HAVING stock <= p.min_stock
        ORDER BY stock ASC
    ''')
    low_stock = [dict(r) for r in cursor.fetchall()]

    # Top selling products (this month)
    month_start = datetime.now().strftime('%Y-%m-01')
    cursor.execute('''
        SELECT p.name, SUM(oi.qty) as units_sold, SUM(oi.line_total) as revenue
        FROM order_items oi
        JOIN products p ON oi.product_id=p.id
        JOIN orders o ON oi.order_id=o.id
        WHERE o.date >= ? AND o.status='completed'
        GROUP BY p.id ORDER BY units_sold DESC LIMIT 5
    ''', (month_start,))
    top_products = [dict(r) for r in cursor.fetchall()]

    # Total customers
    cursor.execute("SELECT COUNT(*) as cnt FROM customers")
    total_customers = int(cursor.fetchone()['cnt'])

    conn.close()
    return jsonify({
        'todaySales': today_sales,
        'todayOrders': today_orders,
        'todayCogs': today_cogs,
        'todayExpenses': today_expenses,
        'todayGrossProfit': today_sales - today_cogs,
        'todayNetProfit': today_sales - today_cogs - today_expenses,
        'paymentBreakdown': pay_breakdown,
        'weeklyLabels': weekly_labels,
        'weeklySales': weekly_sales,
        'weeklyProfits': weekly_profits,
        'allTimeSales': all_time_sales,
        'allTimeProfit': all_time_profit,
        'stockValuation': stock_val,
        'lowStockItems': low_stock,
        'topProducts': top_products,
        'totalCustomers': total_customers
    })
