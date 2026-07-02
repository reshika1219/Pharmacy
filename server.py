import http.server
import json
import os
import sys
import webbrowser
import sqlite3
import shutil
import glob
import socket
from datetime import datetime

PORT = 8088

# ============================================================
# SQLITE BACKEND LOGIC
# ============================================================

def init_db():
    conn = sqlite3.connect('pharmacy.db')
    cursor = conn.cursor()

    # 1. Config
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS config (
            key TEXT PRIMARY KEY,
            val TEXT
        )
    ''')

    # 2. Users
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password TEXT,
            role TEXT
        )
    ''')

    # 3. Items
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY,
            name TEXT,
            generic TEXT,
            category TEXT,
            unit TEXT,
            minStock INTEGER,
            purchasePrice TEXT,
            sellPrice TEXT,
            notes TEXT
        )
    ''')

    # 4. Stock In
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS stock_in (
            id INTEGER PRIMARY KEY,
            date TEXT,
            itemId INTEGER,
            batch TEXT,
            qty INTEGER,
            expiry TEXT,
            supplier TEXT,
            price TEXT,
            total TEXT
        )
    ''')

    # 5. Stock Out
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS stock_out (
            id INTEGER PRIMARY KEY,
            date TEXT,
            itemId INTEGER,
            qty INTEGER,
            reason TEXT,
            customer TEXT,
            price TEXT,
            total TEXT,
            notes TEXT,
            billId INTEGER
        )
    ''')

    # 6. Bills
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bills (
            id INTEGER PRIMARY KEY,
            billNumber TEXT,
            date TEXT,
            time TEXT,
            cashier TEXT,
            paymentMethod TEXT,
            items_json TEXT,
            total TEXT,
            status TEXT
        )
    ''')

    conn.commit()
    conn.close()

def migrate_json_to_sqlite():
    if not os.path.exists('db.json'):
        return

    print("📦 Found db.json. Migrating data to SQLite (pharmacy.db)...")
    try:
        with open('db.json', 'r', encoding='utf-8') as f:
            data = json.load(f)

        conn = sqlite3.connect('pharmacy.db')
        cursor = conn.cursor()

        # Migrate config keys
        config_keys = ['pharmacyName', 'pharmacyAddress', 'pharmacyPhone', 'billNextId', 'nextId']
        for k in config_keys:
            if k in data:
                cursor.execute("INSERT OR REPLACE INTO config (key, val) VALUES (?, ?)", (k, str(data[k])))

        # Migrate users
        users = data.get('users', {})
        for username, uinfo in users.items():
            cursor.execute("INSERT OR REPLACE INTO users (username, password, role) VALUES (?, ?, ?)",
                           (username, uinfo.get('password'), uinfo.get('role')))

        # Migrate items
        for item in data.get('items', []):
            cursor.execute('''
                INSERT OR REPLACE INTO items (id, name, generic, category, unit, minStock, purchasePrice, sellPrice, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                item.get('id'), item.get('name'), item.get('generic'), item.get('category'),
                item.get('unit'), item.get('minStock'), item.get('purchasePrice'),
                item.get('sellPrice'), item.get('notes')
            ))

        # Migrate stockIn
        for row in data.get('stockIn', []):
            cursor.execute('''
                INSERT OR REPLACE INTO stock_in (id, date, itemId, batch, qty, expiry, supplier, price, total)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                row.get('id'), row.get('date'), row.get('itemId'), row.get('batch'),
                row.get('qty'), row.get('expiry'), row.get('supplier'), row.get('price'), row.get('total')
            ))

        # Migrate stockOut
        for row in data.get('stockOut', []):
            cursor.execute('''
                INSERT OR REPLACE INTO stock_out (id, date, itemId, qty, reason, customer, price, total, notes, billId)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                row.get('id'), row.get('date'), row.get('itemId'), row.get('qty'),
                row.get('reason'), row.get('customer'), row.get('price'), row.get('total'),
                row.get('notes'), row.get('billId')
            ))

        # Migrate bills
        for row in data.get('bills', []):
            items_json = json.dumps(row.get('items', []))
            cursor.execute('''
                INSERT OR REPLACE INTO bills (id, billNumber, date, time, cashier, paymentMethod, items_json, total, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                row.get('id'), row.get('billNumber'), row.get('date'), row.get('time'),
                row.get('cashier'), row.get('paymentMethod'), items_json, row.get('total'), row.get('status')
            ))

        conn.commit()
        conn.close()

        # Rename db.json so migration doesn't run again
        os.rename('db.json', 'db.json.bak')
        print("✅ Migration complete. db.json backed up to db.json.bak.")
    except Exception as e:
        print(f"❌ Migration error: {e}")

def get_db_from_sqlite():
    conn = sqlite3.connect('pharmacy.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    db = {}

    # 1. Config
    cursor.execute("SELECT * FROM config")
    for r in cursor.fetchall():
        key = r['key']
        val = r['val']
        if val.isdigit():
            db[key] = int(val)
        else:
            db[key] = val

    # Default config keys if not present
    if 'pharmacyName' not in db: db['pharmacyName'] = 'PharmaCare'
    if 'pharmacyAddress' not in db: db['pharmacyAddress'] = ''
    if 'pharmacyPhone' not in db: db['pharmacyPhone'] = ''
    if 'billNextId' not in db: db['billNextId'] = 1
    if 'nextId' not in db: db['nextId'] = 1

    # 2. Users
    db['users'] = {}
    cursor.execute("SELECT * FROM users")
    for r in cursor.fetchall():
        db['users'][r['username']] = {
            'password': r['password'],
            'role': r['role']
        }
    # Ensure default users if empty
    if not db['users']:
        db['users']['owner'] = { 'password': 'owner123', 'role': 'owner' }
        db['users']['cashier'] = { 'password': 'cashier123', 'role': 'cashier' }

    # 3. Items
    db['items'] = []
    cursor.execute("SELECT * FROM items")
    for r in cursor.fetchall():
        db['items'].append({
            'id': r['id'],
            'name': r['name'],
            'generic': r['generic'],
            'category': r['category'],
            'unit': r['unit'],
            'minStock': int(r['minStock']) if r['minStock'] is not None else 0,
            'purchasePrice': r['purchasePrice'],
            'sellPrice': r['sellPrice'],
            'notes': r['notes']
        })

    # 4. Stock In
    db['stockIn'] = []
    cursor.execute("SELECT * FROM stock_in")
    for r in cursor.fetchall():
        db['stockIn'].append({
            'id': r['id'],
            'date': r['date'],
            'itemId': int(r['itemId']),
            'batch': r['batch'],
            'qty': int(r['qty']),
            'expiry': r['expiry'],
            'supplier': r['supplier'],
            'price': r['price'],
            'total': r['total']
        })

    # 5. Stock Out
    db['stockOut'] = []
    cursor.execute("SELECT * FROM stock_out")
    for r in cursor.fetchall():
        db['stockOut'].append({
            'id': r['id'],
            'date': r['date'],
            'itemId': int(r['itemId']),
            'qty': int(r['qty']),
            'reason': r['reason'],
            'customer': r['customer'],
            'price': r['price'],
            'total': r['total'],
            'notes': r['notes'],
            'billId': int(r['billId']) if r['billId'] is not None else None
        })

    # 6. Bills
    db['bills'] = []
    cursor.execute("SELECT * FROM bills")
    for r in cursor.fetchall():
        try:
            items_list = json.loads(r['items_json'])
        except:
            items_list = []
        db['bills'].append({
            'id': r['id'],
            'billNumber': r['billNumber'],
            'date': r['date'],
            'time': r['time'],
            'cashier': r['cashier'],
            'paymentMethod': r['paymentMethod'],
            'items': items_list,
            'total': r['total'],
            'status': r['status']
        })

    conn.close()
    return db

def save_db_to_sqlite(data):
    conn = sqlite3.connect('pharmacy.db')
    cursor = conn.cursor()

    try:
        cursor.execute("BEGIN TRANSACTION")

        cursor.execute("DELETE FROM config")
        cursor.execute("DELETE FROM users")
        cursor.execute("DELETE FROM items")
        cursor.execute("DELETE FROM stock_in")
        cursor.execute("DELETE FROM stock_out")
        cursor.execute("DELETE FROM bills")

        # Insert config
        config_keys = ['pharmacyName', 'pharmacyAddress', 'pharmacyPhone', 'billNextId', 'nextId']
        for k in config_keys:
            if k in data:
                cursor.execute("INSERT INTO config (key, val) VALUES (?, ?)", (k, str(data[k])))

        # Insert users
        users = data.get('users', {})
        for username, uinfo in users.items():
            cursor.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
                           (username, uinfo.get('password'), uinfo.get('role')))

        # Insert items
        for item in data.get('items', []):
            cursor.execute('''
                INSERT INTO items (id, name, generic, category, unit, minStock, purchasePrice, sellPrice, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                item.get('id'), item.get('name'), item.get('generic'), item.get('category'),
                item.get('unit'), item.get('minStock'), item.get('purchasePrice'),
                item.get('sellPrice'), item.get('notes')
            ))

        # Insert stockIn
        for row in data.get('stockIn', []):
            cursor.execute('''
                INSERT INTO stock_in (id, date, itemId, batch, qty, expiry, supplier, price, total)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                row.get('id'), row.get('date'), row.get('itemId'), row.get('batch'),
                row.get('qty'), row.get('expiry'), row.get('supplier'), row.get('price'), row.get('total')
            ))

        # Insert stockOut
        for row in data.get('stockOut', []):
            cursor.execute('''
                INSERT INTO stock_out (id, date, itemId, qty, reason, customer, price, total, notes, billId)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                row.get('id'), row.get('date'), row.get('itemId'), row.get('qty'),
                row.get('reason'), row.get('customer'), row.get('price'), row.get('total'),
                row.get('notes'), row.get('billId')
            ))

        # Insert bills
        for row in data.get('bills', []):
            items_json = json.dumps(row.get('items', []))
            cursor.execute('''
                INSERT INTO bills (id, billNumber, date, time, cashier, paymentMethod, items_json, total, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                row.get('id'), row.get('billNumber'), row.get('date'), row.get('time'),
                row.get('cashier'), row.get('paymentMethod'), items_json, row.get('total'), row.get('status')
            ))

        conn.commit()
        conn.close()

        # Trigger rotating backup
        create_backup()
        return True
    except Exception as e:
        conn.rollback()
        conn.close()
        raise e

# ============================================================
# ROTATING BACKUP ROTATION
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
        # Clean up old backups if count > 10
        backups = sorted(glob.glob(os.path.join(backup_dir, 'pharmacy_backup_*.db')))
        while len(backups) > 10:
            oldest = backups.pop(0)
            os.remove(oldest)
    except Exception as e:
        print(f"⚠️ Backup rotation error: {e}")

# ============================================================
# NETWORK UTILS
# ============================================================

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return '127.0.0.1'

# ============================================================
# HTTP HANDLER
# ============================================================

class PharmacyHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/db':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
            self.end_headers()

            try:
                db_data = get_db_from_sqlite()
                self.wfile.write(json.dumps(db_data, indent=2, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.wfile.write(f'{{"error": "{str(e)}"}}'.encode('utf-8'))
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/db':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)

            try:
                data = json.loads(post_data.decode('utf-8'))
                save_db_to_sqlite(data)

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"status": "success"}')
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(f'{{"error": "{str(e)}"}}'.encode('utf-8'))

        elif self.path == '/api/login':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)

            try:
                creds = json.loads(post_data.decode('utf-8'))
                username = creds.get('username', '').strip()
                password = creds.get('password', '').strip()

                db_data = get_db_from_sqlite()
                users = db_data.get('users', {})
                user = users.get(username)

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()

                if user and user.get('password') == password:
                    result = json.dumps({ 'success': True, 'role': user['role'], 'username': username })
                else:
                    result = json.dumps({ 'success': False, 'error': 'Invalid username or password' })

                self.wfile.write(result.encode('utf-8'))

            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(f'{{"error": "{str(e)}"}}'.encode('utf-8'))

        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        # Suppress request logs to keep terminal display clean
        pass

if __name__ == '__main__':
    # Ensure working directory is folder containing this file
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    # Initialize SQLite Database & Migrate existing JSON data
    init_db()
    migrate_json_to_sqlite()

    # Save a startup backup just in case
    create_backup()

    local_ip = get_local_ip()

    server_address = ('', PORT)
    httpd = http.server.HTTPServer(server_address, PharmacyHandler)

    print("==================================================================")
    print("  ✅ PharmaCare Local Server is running successfully!")
    print(f"     • Host Computer:  http://localhost:{PORT}")
    print(f"     • Other Devices:  http://{local_ip}:{PORT}/login.html")
    print("==================================================================")
    print("  Keep this window open. Press Ctrl+C here to stop the server.")
    print("==================================================================")

    # Automatically open local browser page
    webbrowser.open(f'http://localhost:{PORT}/login.html')

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        sys.exit(0)
