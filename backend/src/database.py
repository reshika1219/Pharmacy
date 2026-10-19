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
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)

    conn = get_db_connection()
    cursor = conn.cursor()

    # Config table — store business settings
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS config (
            key TEXT PRIMARY KEY,
            val TEXT
        )
    ''')

    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            full_name TEXT,
            created_at TEXT
        )
    ''')

    # Categories table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            color TEXT DEFAULT '#6366f1',
            icon TEXT DEFAULT 'box'
        )
    ''')

    # Products / Items catalog
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            sku TEXT UNIQUE,
            category_id INTEGER,
            unit TEXT DEFAULT 'pcs',
            barcode TEXT,
            description TEXT,
            image_url TEXT,
            min_stock INTEGER DEFAULT 0,
            track_inventory INTEGER DEFAULT 1,
            created_at TEXT,
            FOREIGN KEY(category_id) REFERENCES categories(id)
        )
    ''')

    # Stock batches (inventory in)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS batches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            batch_ref TEXT,
            qty_received INTEGER DEFAULT 0,
            qty_remaining INTEGER DEFAULT 0,
            cost_price REAL DEFAULT 0.0,
            sell_price REAL DEFAULT 0.0,
            supplier TEXT,
            date_added TEXT,
            notes TEXT,
            FOREIGN KEY(product_id) REFERENCES products(id)
        )
    ''')

    # Customers table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            address TEXT,
            loyalty_points INTEGER DEFAULT 0,
            total_spent REAL DEFAULT 0.0,
            created_at TEXT
        )
    ''')

    # Orders / Bills table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_number TEXT UNIQUE NOT NULL,
            date TEXT,
            time TEXT,
            cashier TEXT,
            customer_id INTEGER,
            payment_method TEXT DEFAULT 'Cash',
            subtotal REAL DEFAULT 0.0,
            discount_amount REAL DEFAULT 0.0,
            tax_amount REAL DEFAULT 0.0,
            total REAL DEFAULT 0.0,
            amount_tendered REAL DEFAULT 0.0,
            change_due REAL DEFAULT 0.0,
            status TEXT DEFAULT 'completed',
            notes TEXT,
            FOREIGN KEY(customer_id) REFERENCES customers(id)
        )
    ''')

    # Order items
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            batch_id INTEGER,
            qty INTEGER DEFAULT 1,
            unit_price REAL DEFAULT 0.0,
            discount_pct REAL DEFAULT 0.0,
            line_total REAL DEFAULT 0.0,
            FOREIGN KEY(order_id) REFERENCES orders(id),
            FOREIGN KEY(product_id) REFERENCES products(id),
            FOREIGN KEY(batch_id) REFERENCES batches(id)
        )
    ''')

    # Expenses table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            category TEXT,
            description TEXT,
            amount REAL DEFAULT 0.0,
            created_by TEXT
        )
    ''')

    # Suppliers table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS suppliers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            contact_person TEXT,
            phone TEXT,
            email TEXT,
            address TEXT,
            notes TEXT,
            created_at TEXT
        )
    ''')

    # --- Default data ---
    cursor.execute("SELECT * FROM config WHERE key = 'businessName'")
    if not cursor.fetchone():
        cursor.execute("INSERT INTO config (key, val) VALUES ('businessName', 'My Store')")
        cursor.execute("INSERT INTO config (key, val) VALUES ('businessAddress', '123 Main Street')")
        cursor.execute("INSERT INTO config (key, val) VALUES ('businessPhone', '')")
        cursor.execute("INSERT INTO config (key, val) VALUES ('currency', '$')")
        cursor.execute("INSERT INTO config (key, val) VALUES ('currencyCode', 'USD')")
        cursor.execute("INSERT INTO config (key, val) VALUES ('taxRate', '0')")
        cursor.execute("INSERT INTO config (key, val) VALUES ('receiptFooter', 'Thank you for your purchase!')")
        cursor.execute("INSERT INTO config (key, val) VALUES ('orderNextId', '1')")
        cursor.execute("INSERT INTO config (key, val) VALUES ('loyaltyEnabled', 'false')")
        cursor.execute("INSERT INTO config (key, val) VALUES ('loyaltyRate', '1')")

    cursor.execute("SELECT * FROM users WHERE username = 'admin'")
    if not cursor.fetchone():
        now = datetime.now().isoformat()
        cursor.execute(
            "INSERT INTO users (username, password_hash, role, full_name, created_at) VALUES (?, ?, ?, ?, ?)",
            ('admin', hash_password('admin123'), 'admin', 'Administrator', now)
        )
        cursor.execute(
            "INSERT INTO users (username, password_hash, role, full_name, created_at) VALUES (?, ?, ?, ?, ?)",
            ('cashier', hash_password('cashier123'), 'cashier', 'Cashier', now)
        )

    # Default categories
    cursor.execute("SELECT COUNT(*) as cnt FROM categories")
    if cursor.fetchone()['cnt'] == 0:
        cats = [
            ('General', '#6366f1', 'box'),
            ('Electronics', '#f59e0b', 'cpu'),
            ('Clothing', '#ec4899', 'shirt'),
            ('Food & Beverages', '#10b981', 'coffee'),
            ('Health & Beauty', '#8b5cf6', 'heart'),
            ('Books & Stationery', '#3b82f6', 'book'),
            ('Sports & Outdoor', '#ef4444', 'activity'),
        ]
        cursor.executemany("INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)", cats)

    conn.commit()
    conn.close()

def run_migrations():
    init_db()

def create_backup():
    if not os.path.exists(DATABASE_PATH):
        return
    if not os.path.exists(BACKUPS_DIR):
        os.makedirs(BACKUPS_DIR)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = os.path.join(BACKUPS_DIR, f'pos_backup_{timestamp}.db')
    try:
        shutil.copy2(DATABASE_PATH, backup_path)
        backups = sorted(glob.glob(os.path.join(BACKUPS_DIR, 'pos_backup_*.db')))
        while len(backups) > 15:
            os.remove(backups.pop(0))
    except Exception as e:
        print(f"Warning: Backup error: {e}")
