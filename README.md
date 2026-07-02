# PharmaCare — Pharmacy Inventory & POS Billing System

PharmaCare is a clean, modern, and highly secure local management system designed to coordinate pharmacy inventories and counters. It splits operations into two distinct workflows: a robust admin control panel for the **Owner** and a fraud-proof point-of-sale (POS) cart system for the **Cashier**.

---

## 🌟 Key Features

### 🔒 Role-Based Security & Anti-Fraud Model
* **Separate Logins**: Custom interface redirection depending on the logged-in role.
* **Cashier Restrictions**: Cashiers only have access to the billing console (`cashier.html`). They cannot access or modify database tables, view reports, or adjust catalog values.
* **Automatic Stock Deduction**: Cashiers cannot alter medicine stock numbers manually. Stock is only deducted when a bill is printed.
* **Immutability**: Once a bill is printed, cashiers cannot cancel or reverse it. Only the Owner can void bills to restore stock.

### 💻 Cashier POS Billing Panel
* **Live Search**: Instant product suggestions based on brand names, generic names, or categories.
* **Real-Time Stock Checks**: Visual warnings for low stock items and automatic block on items out of stock.
* **Interactive Cart**: Quantity increments limited strictly by current real-time stock levels.
* **Payment Selector**: Record payment type (Cash, Card, or Credit).
* **Formatted Receipts**: Formats a printable receipt matching paper-rolls with receipt number, cashier name, date/time, list of medicines, subtotal, and contact info.

### 👑 Owner Admin Dashboard
* **Product Catalog**: Full CRUD control to add, edit, or delete items, specify units, categories, purchase/sell prices, and threshold limits.
* **Stock Intake**: Log incoming supply batches with supplier details, batch codes, cost price, and expiry dates.
* **Critical Alerts**: Real-time warnings highlighting expired/expiring batches and low-stock items.
* **Sales History & Auditing**: A complete ledger tracking all printed bills.
* **Void Logic**: Owner can select any active bill and "Void" it. This marks the bill as VOID and automatically adds the items back to active stock.
* **Pharmacy Profile Configuration**: Update pharmacy name, address, phone number, and change passwords directly from Settings.

---

## 📂 Project Structure

```
pharmacy-inventory/
├── README.md             # This guide
├── pharmacy.db           # Local SQLite database (generated, not committed)
├── server.py             # Local HTTP server, persistence, and auth APIs
├── login.html            # Role login screen
├── login.css             # Glassmorphism styling for login
├── cashier.html          # Cashier POS Interface
├── cashier.css           # Styling for POS Layout & Receipt Print
├── cashier.js            # Cashier interface controller
├── index.html            # Owner Panel Dashboard & Inventory
├── app.js                # Owner Dashboard Logic
└── style.css             # Owner Dashboard styling
```

---

## 🚀 Quick Start Guide

### 1. Starting PharmaCare (No technical knowledge needed!)

Inside the `pharmacy-inventory` folder, double-click the launcher corresponding to your operating system:

* 🍎 **macOS**: Double-click **`PharmaCare.command`**
  *(First time only: Right-click → **Open** → click **Open** in the warning dialog).*
* 🪟 **Windows**: Double-click **`PharmaCare.bat`**
  *(First time only: If Windows SmartScreen appears, click **More info** → **Run anyway**).*

The server will launch, print connectivity details, and automatically open the login page in your default browser.

> 💡 **To Stop the Server**: Just close the Terminal / Command Prompt window running in the background.

---

## 🌐 Local Network POS Setup (Multi-Device)

PharmaCare supports multiple billing devices on your local network (e.g. cashiers on separate PCs or tablets):

1. Double-click the launcher on the host computer.
2. The black terminal window will print connectivity details showing a local network IP:
   `👉 Other Devices: http://192.168.x.x:8088/login.html`
3. Connect your other devices (phones, tablets, cashiers' computers) to the same Wi-Fi network.
4. Open the web browser on those devices and navigate to that `http://192.168.x.x:8088/login.html` URL.

---

## 🗄️ Database & Automated Backups

* **Active Database**: Stored in a robust, transactionally secure SQLite database file named **`pharmacy.db`** in the project folder.
* **Auto-Backups**: Every time an action is saved (e.g. items added, cart checked out, settings updated), the server automatically creates a timestamped copy in the **`backups/`** folder.
* **Backup Rotation**: The server keeps the last **10 backups** and automatically deletes older ones to save disk space.


### 2. Default Login Credentials

| Role | Username | Password | Access Level |
|---|---|---|---|
| **Owner** | `owner` | `owner123` | Full Admin |
| **Cashier** | `cashier` | `cashier123` | Billing POS Only |

*Note: Passwords can be changed by the Owner at any time in the settings panel.*

---

## 📝 Workflow Guide

### Cashier Billing Flow
1. Log in using `cashier` credentials.
2. In the left panel, type a medicine name to search the catalog.
3. Click the card or the `+` button to add the item to the bill.
4. Adjust quantities in the cart on the right.
5. Select the payment method (Cash / Card / Credit).
6. Click **Print Bill & Save**.
7. The browser print modal will open. Print or save the PDF receipt.
8. The cart will automatically clear, stock levels will decrement, and the bill number (e.g. `BILL-0001`) will increment.

### Owner Void Flow
If a cashier makes a mistake (wrong quantities added or customer returns items):
1. Owner logs into the admin panel.
2. Click on the **Sales History** tab in the sidebar.
3. Locate the incorrect bill number.
4. Click the **Void** button next to it.
5. Confirm the action. The receipt status updates to `VOID`, and the items from that bill are automatically returned to the inventory.
