# PharmaCare — Pharmacy Inventory & POS Billing System

PharmaCare is a clean, modern, and highly secure local management system designed to coordinate pharmacy inventories and counters. It splits operations into two distinct workflows: a robust admin control panel for the **Owner** and a fraud-proof point-of-sale (POS) cart system for the **Cashier**.

---

## 📂 Reorganized Project Structure

PharmaCare has been restructured to separate frontend static assets and backend Python logic:

* **`backend/src/`**: Modular server Python files (`app.py`, `routes.py`, `database.py`, `auth.py`, `config.py`).
* **`frontend/`**: Vanilla HTML/CSS/JS files served statically by the Flask server.
* **`docs/`**: Setup guidelines, features checklist, and remote dashboard documentation.
* **`PharmaCare.bat` / `PharmaCare.command`**: Cross-platform startup launchers.

---

## 🌟 Key Features

* **🔒 Role-Based Security**: Owner access vs. Cashier access, hashed passwords, secure REST API.
* **💻 Cashier POS Billing Panel**: Live search, real-time stock checks, custom invoice-level discounts, multiple payment modes (**Cash, Card, Online, Credit**).
* **👑 Owner Admin Dashboard**: Product catalog, FEFO stock-in batch intake, critical stock/expiry alerts, business expense tracking, supplier payables ledger.
* **🌐 Remote Access**: The owner can log in securely from another country to check real-time P&L summaries, cashier performance, payment breakdowns, and recent invoices.

---

## 🚀 Quick Start Guide

### Starting PharmaCare

Inside the `pharmacy-inventory` folder, double-click the launcher corresponding to your operating system:

* 🍎 **macOS**: Double-click **`PharmaCare.command`**
* 🪟 **Windows**: Double-click **`PharmaCare.bat`**

The server will launch and automatically open the login page in your default browser at `http://localhost:8088`.

### Default Login Credentials

| Role | Username | Password | Access Level |
|---|---|---|---|
| **Owner** | `owner` | `owner123` | Full Admin |
| **Cashier** | `cashier` | `cashier123` | Billing POS Only |
