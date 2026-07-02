import os
import sys
import sqlite3
import hashlib
import secrets
import shutil
import glob
from datetime import datetime
from flask import Flask, request, jsonify, redirect, send_from_directory, session

PORT = 8088

app = Flask(__name__, static_url_path='', static_folder='.')
app.secret_key = secrets.token_hex(32)

# ============================================================
# PASSWORD HASHING
# ============================================================
def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    rounds = 100000
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), rounds)
    return f"pbkdf2:sha256:{rounds}${salt}${key.hex()}"

def verify_password(password: str, hashed: str) -> bool:
    try:
        parts = hashed.split('$')
        if len(parts) != 3:
            return False
        algo_rounds, salt, key_hex = parts
        rounds = int(algo_rounds.split(':')[-1])
        key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), rounds)
        return secrets.compare_digest(key.hex(), key_hex)
    except Exception:
        return False

# ============================================================
# SQLITE SCHEMA & INITIALIZATION
# ============================================================
def get_db_connection():
    conn = sqlite3.connect('pharmacy.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Config table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS config (
            key TEXT PRIMARY KEY,
            val TEXT
        )
    ''')

    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password_hash TEXT,
            role TEXT
        )
    ''')

    # Items catalog
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            generic TEXT,
            category TEXT,
            unit TEXT,
            minStock INTEGER DEFAULT 0,
            notes TEXT
        )
    ''')

    # Batches table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS batches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            itemId INTEGER,
            batch_number TEXT,
            expiry TEXT,
            qty_received INTEGER,
            qty_remaining INTEGER,
            purchase_price REAL,
            sell_price REAL,
            supplier TEXT,
            date_added TEXT,
            FOREIGN KEY(itemId) REFERENCES items(id)
        )
    ''')

    # Bills table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            billNumber TEXT UNIQUE,
            date TEXT,
            time TEXT,
            cashier TEXT,
            paymentMethod TEXT,
            discount REAL DEFAULT 0,
            total REAL,
            status TEXT DEFAULT 'active'
        )
    ''')

    # Sales Items junction table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sales_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            billId INTEGER,
            itemId INTEGER,
            batchId INTEGER,
            qty INTEGER,
            price REAL,
            total REAL,
            FOREIGN KEY(billId) REFERENCES bills(id),
            FOREIGN KEY(itemId) REFERENCES items(id),
            FOREIGN KEY(batchId) REFERENCES batches(id)
        )
    ''')

    # Expenses table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            category TEXT,
            amount REAL,
            notes TEXT
        )
    ''')

    # Default settings and users
    cursor.execute("SELECT * FROM config WHERE key = 'pharmacyName'")
    if not cursor.fetchone():
        cursor.execute("INSERT INTO config (key, val) VALUES ('pharmacyName', 'PharmaCare')")
        cursor.execute("INSERT INTO config (key, val) VALUES ('pharmacyAddress', '123 Health Ave, City')")
        cursor.execute("INSERT INTO config (key, val) VALUES ('pharmacyPhone', '011-2345678')")

    cursor.execute("SELECT * FROM users WHERE username = 'owner'")
    if not cursor.fetchone():
        cursor.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
                       ('owner', hash_password('owner123'), 'owner'))
    cursor.execute("SELECT * FROM users WHERE username = 'cashier'")
    if not cursor.fetchone():
        cursor.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
                       ('cashier', hash_password('cashier123'), 'cashier'))

    conn.commit()
    conn.close()

# ============================================================
# SCHEMA MIGRATION
# ============================================================
def run_migrations():
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    # Ensure discount column exists in bills table
    try:
        cursor.execute("PRAGMA table_info(bills)")
        bills_cols = [col['name'] for col in cursor.fetchall()]
        if 'discount' not in bills_cols:
            cursor.execute("ALTER TABLE bills ADD COLUMN discount REAL DEFAULT 0")
            conn.commit()
    except Exception as e:
        print(f"⚠️ Warning adding discount column: {e}")

    # Check if we need to migrate from version 1
    cursor.execute("SELECT val FROM config WHERE key = 'schema_version'")
    version_row = cursor.fetchone()
    if version_row and version_row['val'] == '2':
        conn.close()
        return

    # Check if old tables exist to migrate
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='stock_in'")
    has_old_stock_in = cursor.fetchone()

    if has_old_stock_in:
        print("📦 Upgrading database schema and migrating data to REST v2 format...")
        try:
            # 1. Migrate items from old table
            cursor.execute("SELECT * FROM items")
            old_items = cursor.fetchall()
            
            # 2. Migrate stock_in to batches
            cursor.execute("SELECT * FROM stock_in")
            old_stock_in = cursor.fetchall()
            for r in old_stock_in:
                # Insert into batches
                # Date, itemId, batch, qty, expiry, supplier, price, total
                qty = int(r['qty'])
                purchase_price = float(r['price']) if r['price'] else 0.0
                # Let's see if we have sellPrice from item catalog
                cursor.execute("SELECT sellPrice FROM items WHERE id = ?", (r['itemId'],))
                item_row = cursor.fetchone()
                sell_price = float(item_row['sellPrice']) if (item_row and item_row['sellPrice']) else purchase_price * 1.2
                
                cursor.execute('''
                    INSERT INTO batches (id, itemId, batch_number, expiry, qty_received, qty_remaining, purchase_price, sell_price, supplier, date_added)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    r['id'], r['itemId'], r['batch'], r['expiry'], qty, qty, purchase_price, sell_price, r['supplier'], r['date']
                ))

            # 3. Migrate old stock_out records
            cursor.execute("SELECT * FROM stock_out")
            old_stock_outs = cursor.fetchall()
            for r in old_stock_outs:
                # Deduct qty from batches using FEFO and write to sales_items
                qty_to_deduct = int(r['qty'])
                item_id = int(r['itemId'])
                
                # Fetch active batches sorted by expiry
                cursor.execute('''
                    SELECT * FROM batches 
                    WHERE itemId = ? AND qty_remaining > 0 
                    ORDER BY expiry ASC
                ''', (item_id,))
                active_batches = cursor.fetchall()
                
                for batch in active_batches:
                    if qty_to_deduct <= 0:
                        break
                    b_id = batch['id']
                    b_rem = batch['qty_remaining']
                    deducted = min(qty_to_deduct, b_rem)
                    
                    cursor.execute('''
                        UPDATE batches SET qty_remaining = qty_remaining - ? WHERE id = ?
                    ''', (deducted, b_id))
                    
                    # Log sales item relation
                    if r['billId']:
                        cursor.execute('''
                            INSERT INTO sales_items (billId, itemId, batchId, qty, price, total)
                            VALUES (?, ?, ?, ?, ?, ?)
                        ''', (r['billId'], item_id, b_id, deducted, r['price'], r['total']))
                    
                    qty_to_deduct -= deducted

            # 4. Migrate users password hashing if needed
            cursor.execute("PRAGMA table_info(users)")
            cols = [col['name'] for col in cursor.fetchall()]
            if 'password' in cols:
                cursor.execute("ALTER TABLE users RENAME TO users_old")
                cursor.execute('''
                    CREATE TABLE users (
                        username TEXT PRIMARY KEY,
                        password_hash TEXT,
                        role TEXT
                    )
                ''')
                cursor.execute("SELECT * FROM users_old")
                users_old = cursor.fetchall()
                for u in users_old:
                    pw = u['password']
                    hashed = hash_password(pw) if not pw.startswith("pbkdf2:") else pw
                    cursor.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
                                   (u['username'], hashed, u['role']))
                cursor.execute("DROP TABLE users_old")
            else:
                cursor.execute("SELECT * FROM users")
                users = cursor.fetchall()
                for u in users:
                    pw = u['password_hash']
                    if not pw.startswith("pbkdf2:"):
                        cursor.execute("UPDATE users SET password_hash = ? WHERE username = ?", (hash_password(pw), u['username']))

            # 5. Ensure discount column exists in bills table
            cursor.execute("PRAGMA table_info(bills)")
            bills_cols = [col['name'] for col in cursor.fetchall()]
            if 'discount' not in bills_cols:
                cursor.execute("ALTER TABLE bills ADD COLUMN discount REAL DEFAULT 0")

            cursor.execute("INSERT OR REPLACE INTO config (key, val) VALUES ('schema_version', '2')")
            conn.commit()
            print("✅ Database migration complete!")
        except Exception as e:
            conn.rollback()
            print(f"❌ Migration failed: {e}")
            raise e

    conn.close()

# ============================================================
# ROTATING BACKUPS
# ============================================================
def create_backup():
    if not os.path.exists('pharmacy.db'):
        return
    backup_dir = 'backups'
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = os.path.join(backup_dir, f'pharmacy_backup_{timestamp}.db')
    try:
        shutil.copy2('pharmacy.db', backup_path)
        # Keep last 10
        backups = sorted(glob.glob(os.path.join(backup_dir, 'pharmacy_backup_*.db')))
        while len(backups) > 10:
            os.remove(backups.pop(0))
    except Exception as e:
        print(f"⚠️ Backup rotation error: {e}")

# ============================================================
# AUTHENTICATION DECORATOR
# ============================================================
def require_role(roles):
    def decorator(f):
        def wrapper(*args, **kwargs):
            user = session.get('user')
            if not user or user.get('role') not in roles:
                return jsonify({'error': 'Unauthorized access'}), 403
            return f(*args, **kwargs)
        wrapper.__name__ = f.__name__
        return wrapper
    return decorator

# ============================================================
# FLASK ROUTING & REST APIS
# ============================================================

@app.route('/')
def root():
    if 'user' in session:
        if session['user']['role'] == 'owner':
            return redirect('/index.html')
        return redirect('/cashier.html')
    return redirect('/login.html')

@app.route('/api/login', methods=['POST'])
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

@app.route('/api/logout', methods=['POST'])
def api_logout():
    session.pop('user', None)
    return jsonify({'success': True})

@app.route('/api/session', methods=['GET'])
def api_session():
    if 'user' in session:
        return jsonify({'logged_in': True, 'user': session['user']})
    return jsonify({'logged_in': False}), 401

# --- CONFIG & SETTINGS ---
@app.route('/api/config', methods=['GET'])
def get_config():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM config")
    config = {r['key']: r['val'] for r in cursor.fetchall()}
    conn.close()
    return jsonify(config)

@app.route('/api/config', methods=['POST'])
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
        
        # Passwords update if requested
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
@app.route('/api/items', methods=['GET'])
def get_items():
    user = session.get('user')
    if not user:
        return jsonify({'error': 'Unauthorized'}), 403

    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Query items along with aggregated batch stocks and nearest expiry date
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
        # Secure cost prices: do not expose cost price to CASHIER role
        if user['role'] == 'owner':
            item['purchasePrice'] = r['purchasePrice'] or 0.0
        items.append(item)

    return jsonify(items)

@app.route('/api/items', methods=['POST'])
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

@app.route('/api/items/<int:item_id>', methods=['PUT'])
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

@app.route('/api/items/<int:item_id>', methods=['DELETE'])
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
@app.route('/api/batches', methods=['GET'])
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

@app.route('/api/stock-in', methods=['POST'])
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

        cursor.execute('''
            INSERT INTO batches (itemId, batch_number, expiry, qty_received, qty_remaining, purchase_price, sell_price, supplier, date_added)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (itemId, data.get('batchNumber'), expiry, qty, qty, purchase_price, sell_price, data.get('supplier'), date))
        
        conn.commit()
        create_backup()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# --- SALES & BILLING (FEFO INTEGRATED CHECKOUT) ---
@app.route('/api/sales/checkout', methods=['POST'])
@require_role(['cashier', 'owner'])
def sales_checkout():
    data = request.json or {}
    items = data.get('items', [])  # [{'itemId': X, 'qty': Y}]
    payment_method = data.get('paymentMethod', 'Cash')
    discount = float(data.get('discount', 0.0))
    cashier = session['user']['username']

    if not items:
        return jsonify({'error': 'Cart is empty'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("BEGIN TRANSACTION")

        # 1. Verify availability of stock across all requested items
        for order_item in items:
            item_id = int(order_item['itemId'])
            req_qty = int(order_item['qty'])

            cursor.execute("SELECT COALESCE(SUM(qty_remaining), 0) as total_stock FROM batches WHERE itemId = ? AND qty_remaining > 0", (item_id,))
            stock_row = cursor.fetchone()
            if stock_row['total_stock'] < req_qty:
                cursor.execute("SELECT name FROM items WHERE id = ?", (item_id,))
                name_row = cursor.fetchone()
                item_name = name_row['name'] if name_row else 'Unknown item'
                return jsonify({'error': f'Not enough stock for {item_name}. Available: {stock_row["total_stock"]}'}), 400

        # 2. Get next invoice number
        cursor.execute("SELECT val FROM config WHERE key = 'billNextId'")
        next_id_row = cursor.fetchone()
        bill_id = int(next_id_row['val']) if next_id_row else 1
        bill_number = f"BILL-{bill_id:04d}"

        # 3. Create the Bill record (temporarily set total to 0, calculate and update it later)
        now = datetime.now()
        date_str = now.strftime('%Y-%m-%d')
        time_str = now.strftime('%H:%M:%S')
        
        cursor.execute('''
            INSERT INTO bills (id, billNumber, date, time, cashier, paymentMethod, discount, total)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (bill_id, bill_number, date_str, time_str, cashier, payment_method, discount, 0.0))

        grand_total = 0.0

        # 4. Allocate batch deductions using FEFO
        for order_item in items:
            item_id = int(order_item['itemId'])
            qty_needed = int(order_item['qty'])

            # Select active batches ordered by expiry date
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

                # Deduct from batch
                cursor.execute("UPDATE batches SET qty_remaining = qty_remaining - ? WHERE id = ?", (deduct, b_id))

                # Track sold items cost and pricing
                sell_price = batch['sell_price'] or 0.0
                total_item_cost = deduct * sell_price
                grand_total += total_item_cost

                cursor.execute('''
                    INSERT INTO sales_items (billId, itemId, batchId, qty, price, total)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (bill_id, item_id, b_id, deduct, sell_price, total_item_cost))

                qty_needed -= deduct

        # Apply invoice discount
        grand_total = max(0.0, grand_total - discount)
        cursor.execute("UPDATE bills SET total = ? WHERE id = ?", (grand_total, bill_id))

        # Update next bill ID counter
        cursor.execute("INSERT OR REPLACE INTO config (key, val) VALUES ('billNextId', ?)", (str(bill_id + 1),))

        conn.commit()
        create_backup()
        return jsonify({'success': True, 'billNumber': bill_number, 'billId': bill_id})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/sales', methods=['GET'])
@require_role(['owner', 'cashier'])
def get_sales():
    conn = get_db_connection()
    cursor = conn.cursor()
    # Fetch bills
    cursor.execute("SELECT * FROM bills ORDER BY id DESC")
    bills_rows = cursor.fetchall()

    sales = []
    for r in bills_rows:
        bill_id = r['id']
        # Load sold items for this bill
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

@app.route('/api/sales/void/<int:bill_id>', methods=['POST'])
@require_role(['owner'])
def void_bill(bill_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("BEGIN TRANSACTION")

        # Get bill status
        cursor.execute("SELECT status FROM bills WHERE id = ?", (bill_id,))
        bill = cursor.fetchone()
        if not bill or bill['status'] == 'void':
            return jsonify({'error': 'Bill already voided or not found'}), 400

        # Mark bill as void
        cursor.execute("UPDATE bills SET status = 'void' WHERE id = ?", (bill_id,))

        # Restore quantities back to batches
        cursor.execute("SELECT * FROM sales_items WHERE billId = ?", (bill_id,))
        sales_items = cursor.fetchall()
        for si in sales_items:
            cursor.execute('''
                UPDATE batches SET qty_remaining = qty_remaining + ? WHERE id = ?
            ''', (si['qty'], si['batchId']))

        conn.commit()
        create_backup()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# --- STOCK OUT ADJUSTMENTS ---
@app.route('/api/stock-out', methods=['GET'])
@require_role(['owner'])
def get_stock_outs():
    conn = get_db_connection()
    cursor = conn.cursor()
    # Query all sales_items joined with bills and items
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

@app.route('/api/stock-out', methods=['POST'])
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

        # Get active batches sorted by expiry
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
        # Insert a dummy bill of status = 'adjustment' or similar
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
@app.route('/api/expenses', methods=['GET'])
@require_role(['owner'])
def get_expenses():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM expenses ORDER BY date DESC")
    rows = cursor.fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/expenses', methods=['POST'])
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

@app.route('/api/expenses/<int:exp_id>', methods=['DELETE'])
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

# --- REPORTS ---
@app.route('/api/reports/dashboard', methods=['GET'])
@require_role(['owner'])
def get_dashboard_reports():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Active bills calculations
    cursor.execute("SELECT id, total FROM bills WHERE status = 'active'")
    active_bills = cursor.fetchall()
    total_sales = sum(float(b['total']) for b in active_bills)

    # Cost of Goods Sold (COGS) based on actual batch costs of sold units
    cursor.execute('''
        SELECT SUM(si.qty * b.purchase_price) as total_cogs
        FROM sales_items si
        JOIN batches b ON si.batchId = b.id
        JOIN bills bl ON si.billId = bl.id
        WHERE bl.status = 'active'
    ''')
    cogs_row = cursor.fetchone()
    total_cogs = float(cogs_row['total_cogs']) if cogs_row['total_cogs'] else 0.0

    # Total Expenses
    cursor.execute("SELECT SUM(amount) as total_expenses FROM expenses")
    exp_row = cursor.fetchone()
    total_expenses = float(exp_row['total_expenses']) if exp_row['total_expenses'] else 0.0

    gross_profit = total_sales - total_cogs
    net_profit = gross_profit - total_expenses

    # Top selling items
    cursor.execute('''
        SELECT i.name, SUM(si.qty) as total_qty, SUM(si.total) as total_revenue
        FROM sales_items si
        JOIN items i ON si.itemId = i.id
        JOIN bills bl ON si.billId = bl.id
        WHERE bl.status = 'active'
        GROUP BY si.itemId
        ORDER BY total_qty DESC
        LIMIT 5
    ''')
    top_selling = [dict(r) for r in cursor.fetchall()]

    # Stock valuation (total purchase price of remaining stock)
    cursor.execute("SELECT SUM(qty_remaining * purchase_price) as valuation FROM batches WHERE qty_remaining > 0")
    val_row = cursor.fetchone()
    stock_valuation = float(val_row['valuation']) if val_row['valuation'] else 0.0

    conn.close()

    return jsonify({
        'totalSales': total_sales,
        'totalCOGS': total_cogs,
        'grossProfit': gross_profit,
        'totalExpenses': total_expenses,
        'netProfit': net_profit,
        'stockValuation': stock_valuation,
        'topSelling': top_selling
    })

# ============================================================
# START SERVER
# ============================================================
if __name__ == '__main__':
    # Ensure working directory is folder containing this file
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    # Initialize DB & Migrations
    run_migrations()
    create_backup()

    import socket
    def get_local_ip():
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(('8.8.8.8', 80))
            local_ip = s.getsockname()[0]
            s.close()
            return local_ip
        except Exception:
            return '127.0.0.1'

    local_ip = get_local_ip()
    print("==================================================================")
    print("  ✅ PharmaCare Production Server is running successfully!")
    print(f"     • Host Computer:  http://localhost:{PORT}")
    print(f"     • Other Devices:  http://{local_ip}:{PORT}/login.html")
    print("==================================================================")

    # Automatically open local browser page
    import webbrowser
    webbrowser.open(f'http://localhost:{PORT}/login.html')

    app.run(host='0.0.0.0', port=PORT, debug=False)
