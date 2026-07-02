import sqlite3
import os
import sys
from datetime import datetime, timedelta

# Append src folder to path for absolute imports
src_dir = os.path.dirname(os.path.abspath(__file__))
if src_dir not in sys.path:
    sys.path.append(src_dir)

from config import DATABASE_PATH

def seed_data():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    # Clear existing data to seed fresh
    cursor.execute("DELETE FROM sales_items")
    cursor.execute("DELETE FROM bills")
    cursor.execute("DELETE FROM batches")
    cursor.execute("DELETE FROM expenses")
    cursor.execute("DELETE FROM items")
    cursor.execute("DELETE FROM config WHERE key = 'billNextId'")

    # Seed Items
    items = [
        ("Amoxicillin 250mg", "Amoxicillin", "Antibiotic", "Capsule(s)", 50, "Store in a cool dry place"),
        ("Paracetamol 500mg", "Paracetamol", "Analgesic", "Tablet(s)", 100, "For pain and fever relief"),
        ("Metformin 500mg", "Metformin", "Antidiabetic", "Tablet(s)", 200, "Take with meals"),
        ("Atorvastatin 10mg", "Atorvastatin", "Cardiovascular", "Tablet(s)", 80, "Lipid-lowering agent")
    ]
    cursor.executemany('''
        INSERT INTO items (name, generic, category, unit, minStock, notes)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', items)
    
    # Get item IDs
    cursor.execute("SELECT id, name FROM items")
    item_map = {row[1]: row[0] for row in cursor.fetchall()}

    # Seed Batches (including billed + bonus quantities)
    today = datetime.now()
    batches = [
        # Amoxicillin - near expiry (expiring in 20 days)
        (item_map["Amoxicillin 250mg"], "AMX-001", (today + timedelta(days=20)).strftime("%Y-%m-%d"), 100, 100, 1.20, 2.50, "Global Pharma", (today - timedelta(days=10)).strftime("%Y-%m-%d"), "Paid", 120.0, 100, 0),
        # Paracetamol - ok stock (buy 100 get 10 free)
        (item_map["Paracetamol 500mg"], "PCT-102", (today + timedelta(days=365)).strftime("%Y-%m-%d"), 110, 80, 0.45, 1.00, "Apex Labs", (today - timedelta(days=5)).strftime("%Y-%m-%d"), "Pending", 0.0, 100, 10),
        # Metformin - low stock warning (stock remaining: 45, minStock: 200)
        (item_map["Metformin 500mg"], "MTF-043", (today + timedelta(days=500)).strftime("%Y-%m-%d"), 150, 45, 1.50, 3.00, "MediCare Ltd", (today - timedelta(days=15)).strftime("%Y-%m-%d"), "Paid", 225.0, 150, 0),
        # Atorvastatin - ok stock
        (item_map["Atorvastatin 10mg"], "ATV-882", (today + timedelta(days=730)).strftime("%Y-%m-%d"), 200, 180, 4.00, 8.00, "Global Pharma", (today - timedelta(days=2)).strftime("%Y-%m-%d"), "Pending", 300.0, 200, 0)
    ]
    cursor.executemany('''
        INSERT INTO batches (itemId, batch_number, expiry, qty_received, qty_remaining, purchase_price, sell_price, supplier, date_added, payment_status, amount_paid, qty_billed, qty_bonus)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', batches)

    # Seed Bills (Sales/Stock-outs)
    # Bill 1 - Cashier checkout yesterday
    yesterday_str = (today - timedelta(days=1)).strftime("%Y-%m-%d")
    cursor.execute('''
        INSERT INTO bills (id, billNumber, date, time, cashier, paymentMethod, discount, total, status)
        VALUES (1, 'BILL-0001', ?, '14:23:10', 'cashier', 'Cash', 5.0, 25.0, 'active')
    ''', (yesterday_str,))
    
    # Get Paracetamol batch ID
    cursor.execute("SELECT id FROM batches WHERE batch_number = 'PCT-102'")
    pct_batch_id = cursor.fetchone()[0]
    
    # Link sales items for BILL-0001 (sold 30 units of Paracetamol)
    cursor.execute('''
        INSERT INTO sales_items (billId, itemId, batchId, qty, price, total)
        VALUES (1, ?, ?, 30, 1.00, 30.0)
    ''', (item_map["Paracetamol 500mg"], pct_batch_id))

    # Bill 2 - Today's checkout by cashier
    today_str = today.strftime("%Y-%m-%d")
    cursor.execute('''
        INSERT INTO bills (id, billNumber, date, time, cashier, paymentMethod, discount, total, status)
        VALUES (2, 'BILL-0002', ?, '10:15:45', 'cashier', 'Card', 0.0, 160.0, 'active')
    ''', (today_str,))
    
    # Get Atorvastatin batch ID
    cursor.execute("SELECT id FROM batches WHERE batch_number = 'ATV-882'")
    atv_batch_id = cursor.fetchone()[0]
    
    cursor.execute('''
        INSERT INTO sales_items (billId, itemId, batchId, qty, price, total)
        VALUES (2, ?, ?, 20, 8.00, 160.0)
    ''', (item_map["Atorvastatin 10mg"], atv_batch_id))

    # Seed Expenses
    expenses = [
        (yesterday_str, "Utilities", 150.0, "Electricity bill"),
        (today_str, "Rent", 1000.0, "Monthly store rent")
    ]
    cursor.executemany('''
        INSERT INTO expenses (date, category, amount, notes)
        VALUES (?, ?, ?, ?)
    ''', expenses)

    # Next bill index setting
    cursor.execute("INSERT OR REPLACE INTO config (key, val) VALUES ('billNextId', '3')")

    conn.commit()
    conn.close()
    print("✅ Seeded realistic database elements successfully!")

if __name__ == "__main__":
    seed_data()
