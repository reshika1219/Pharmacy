# NexusPOS — Universal Point of Sale & Inventory Management System

**NexusPOS** is a modern, fast, and minimalist Point of Sale (POS) and Inventory Management System designed for **any type of retail business, store, boutique, cafe, electronics shop, grocery, or enterprise**.

Built with a sleek, dark-mode minimalist user interface, responsive touch & keyboard controls, and a lightweight Python/Flask SQLite backend with zero heavy setup required.

---

## 🌟 Key Features

### 💻 1. Fast Cashier Point of Sale Terminal (`/pos.html`)
* **Visual Product Catalog**: Category pill filters, instant search by title, SKU, or barcode scan.
* **Smart Shopping Cart**: Real-time price calculations, item quantity controls, inline discounts, and custom tax adjustments.
* **Customer Selection & CRM**: Choose walk-in or registered customers to track purchase histories.
* **Multi-Payment Processing**:
  - 💵 **Cash**: Quick denomination buttons ($10, $20, $50, $100, exact) with instant change calculation.
  - 💳 **Card / Terminal**: Credit and debit card workflows.
  - 📱 **Mobile / QR**: Digital wallet and QR code payments.
  - 📝 **Store Credit / Invoice**: On-account settlements.
* **Instant Thermal Receipt**: Clean thermal-style receipt popup with print support and complete tax breakdowns.

### 📦 2. Comprehensive Inventory Management
* **Catalog Management**: Add, edit, and organize products with SKU, category, units (`pcs`, `kg`, `liters`, `box`), barcodes, and minimum stock alerts.
* **Batch & Stock Intake**: Track cost price, selling price, supplier source, receiving dates, and batch references.
* **Low Stock Intelligence**: Automatic visual indicators and alerts for low or out-of-stock items.

### 👑 3. Admin & Store Control Panel (`/index.html`)
* **Real-time Analytics Dashboard**: Daily revenue, order counts, items sold, gross profits, low-stock warnings, and revenue trend charts.
* **Order History & Invoices**: Search past receipts, filter by cashier or payment mode, and reprint receipts at any time.
* **Customer Relationship Management (CRM)**: Manage customer records, phone numbers, and loyalty reward points.
* **Supplier Directory**: Keep track of vendors, representative contacts, and procurement notes.
* **Expense Management**: Log daily operational expenses (rent, utilities, salaries, supplies) with category classification.
* **User & Role Security**: Secure password hashing with separated roles for Administrators and Cashiers.
* **Store Settings & Localization**: Customize business name, receipt header/footer, currency symbol (`$`, `€`, `£`, `Rs.`), tax rate, and automatic database backups.

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.8+
- Flask (`pip install flask`)

### 1. Starting the Application
Inside the project root directory, launch using the script for your operating system:

* 🍎 **macOS / Linux**: Double-click or run:
  ```bash
  ./NexusPOS.command
  # or
  python3 backend/src/app.py
  ```
* 🪟 **Windows**: Double-click:
  ```cmd
  NexusPOS.bat
  ```

The server will automatically start on `http://localhost:8088` and open your default web browser.

---

## 🔑 Default Login Credentials

| Role | Username | Password | Default View |
|---|---|---|---|
| **Administrator** | `admin` | `admin123` | Full Admin Dashboard & Store Analytics (`index.html`) |
| **Cashier** | `cashier` | `cashier123` | Dedicated Fullscreen POS Terminal (`pos.html`) |

> *Note: Passwords and store information can be customized directly in the Settings panel.*

---

## 📂 Architecture

```
├── backend/
│   ├── pos.db                  # Local SQLite database (auto-created)
│   └── src/
│       ├── app.py              # Main application entry point & static server
│       ├── routes.py           # REST API endpoints for all business modules
│       ├── database.py         # Database schema, initialization & automated backups
│       ├── auth.py             # Password hashing & session token authentication
│       └── config.py           # Server port & database path configuration
├── frontend/
│   ├── login.html & .css       # Modern minimalist sign-in interface
│   ├── pos.html, .css, .js     # Cashier point-of-sale terminal
│   ├── index.html, style.css   # Owner & Admin workspace dashboard
│   └── app.js                  # Single-page dashboard application controller
├── NexusPOS.command            # macOS one-click launcher
├── NexusPOS.bat                # Windows one-click launcher
└── README.md
```

---

## 🎨 Design Philosophy
NexusPOS is built from the ground up to be ultra-clean, minimalist, responsive, and completely versatile for any retail establishment without being tied down to any specific industry.
