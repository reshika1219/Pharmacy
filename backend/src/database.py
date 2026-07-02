import sqlite3
import os
import shutil
import glob
from datetime import datetime
from config import DATABASE_PATH, BACKUPS_DIR
from auth import hash_password

def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    # Ensure database folder exists
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
    
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

    # Batches table (with supplier payable columns)
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
            payment_status TEXT DEFAULT 'Pending',
            amount_paid REAL DEFAULT 0.0,
            qty_billed INTEGER,
            qty_bonus INTEGER DEFAULT 0,
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

def run_migrations():
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Ensure discount column exists in bills table
    try:
        cursor.execute("PRAGMA table_info(bills)")
        bills_cols = [col['name'] for col in cursor.fetchall()]
        if 'discount' not in bills_cols:
            cursor.execute("ALTER TABLE bills ADD COLUMN discount REAL DEFAULT 0")
            conn.commit()
    except Exception as e:
        print(f"⚠️ Warning adding discount column: {e}")

    # 2. Ensure supplier payment status columns exist in batches table
    try:
        cursor.execute("PRAGMA table_info(batches)")
        batches_cols = [col['name'] for col in cursor.fetchall()]
        if 'payment_status' not in batches_cols:
            cursor.execute("ALTER TABLE batches ADD COLUMN payment_status TEXT DEFAULT 'Pending'")
        if 'amount_paid' not in batches_cols:
            cursor.execute("ALTER TABLE batches ADD COLUMN amount_paid REAL DEFAULT 0.0")
        if 'qty_billed' not in batches_cols:
            cursor.execute("ALTER TABLE batches ADD COLUMN qty_billed INTEGER")
        if 'qty_bonus' not in batches_cols:
            cursor.execute("ALTER TABLE batches ADD COLUMN qty_bonus INTEGER DEFAULT 0")
        conn.commit()
    except Exception as e:
        print(f"⚠️ Warning adding batch payment columns: {e}")

    # Check if we need to migrate schema version 1 data from original root DB location
    cursor.execute("SELECT val FROM config WHERE key = 'schema_version'")
    version_row = cursor.fetchone()
    if version_row and version_row['val'] == '2':
        conn.close()
        return

    # Check if old stock_in exists (signaling old schema migration needed)
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='stock_in'")
    has_old_stock_in = cursor.fetchone()

    if has_old_stock_in:
        print("📦 Migrating old data schema...")
        try:
            # Migrate stock_in to batches
            cursor.execute("SELECT * FROM stock_in")
            old_stock_in = cursor.fetchall()
            for r in old_stock_in:
                qty = int(r['qty'])
                purchase_price = float(r['price']) if r['price'] else 0.0
                cursor.execute("SELECT sellPrice FROM items WHERE id = ?", (r['itemId'],))
                item_row = cursor.fetchone()
                sell_price = float(item_row['sellPrice']) if (item_row and item_row['sellPrice']) else purchase_price * 1.25
                
                cursor.execute('''
                    INSERT INTO batches (id, itemId, batch_number, expiry, qty_received, qty_remaining, purchase_price, sell_price, supplier, date_added, payment_status, amount_paid)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 0.0)
                ''', (
                    r['id'], r['itemId'], r['batch'], r['expiry'], qty, qty, purchase_price, sell_price, r['supplier'], r['date']
                ))

            # Migrate stock_out logs
            cursor.execute("SELECT * FROM stock_out")
            old_stock_outs = cursor.fetchall()
            for r in old_stock_outs:
                qty_to_deduct = int(r['qty'])
                item_id = int(r['itemId'])
                
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
                    
                    cursor.execute('UPDATE batches SET qty_remaining = qty_remaining - ? WHERE id = ?', (deducted, b_id))
                    
                    if r['billId']:
                        cursor.execute('''
                            INSERT INTO sales_items (billId, itemId, batchId, qty, price, total)
                            VALUES (?, ?, ?, ?, ?, ?)
                        ''', (r['billId'], item_id, b_id, deducted, r['price'], r['total']))
                    
                    qty_to_deduct -= deducted

            # Migrate passwords
            cursor.execute("PRAGMA table_info(users)")
            cols = [col['name'] for col in cursor.fetchall()]
            if 'password' in cols:
                cursor.execute("ALTER TABLE users RENAME TO users_old")
                cursor.execute('CREATE TABLE users (username TEXT PRIMARY KEY, password_hash TEXT, role TEXT)')
                cursor.execute("SELECT * FROM users_old")
                for u in cursor.fetchall():
                    pw = u['password']
                    hashed = hash_password(pw) if not pw.startswith("pbkdf2:") else pw
                    cursor.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
                                   (u['username'], hashed, u['role']))
                cursor.execute("DROP TABLE users_old")

            cursor.execute("INSERT OR REPLACE INTO config (key, val) VALUES ('schema_version', '2')")
            conn.commit()
            print("✅ Database migration complete!")
        except Exception as e:
            conn.rollback()
            print(f"❌ Database migration failed: {e}")
            raise e

    conn.close()

def create_backup():
    if not os.path.exists(DATABASE_PATH):
        return
    if not os.path.exists(BACKUPS_DIR):
        os.makedirs(BACKUPS_DIR)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = os.path.join(BACKUPS_DIR, f'pharmacy_backup_{timestamp}.db')
    try:
        shutil.copy2(DATABASE_PATH, backup_path)
        backups = sorted(glob.glob(os.path.join(BACKUPS_DIR, 'pharmacy_backup_*.db')))
        while len(backups) > 10:
            os.remove(backups.pop(0))
    except Exception as e:
        print(f"⚠️ Backup rotation error: {e}")
