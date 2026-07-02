# System Features — PharmaCare

PharmaCare is custom-tailored for single-branch pharmacy workflows.

## Completed Features

### 1. Role-Based Authentication
* Secure PBKDF2/SHA256 password hashing.
* Explicit user roles: `owner` (full system control, financials, setting) and `cashier` (read-only medicine search and sales checkout).

### 2. POS Billing Terminal
* Fast medicine searching (by brand or generic name).
* Barcode-ready text input selector.
* Cart management with subtotal, discount inputs, and final total calculator.
* Multi-mode checkout payments: Cash, Card, Online (mobile wallet/transfer), and Credit (patient tab).
* Immediate receipt printing layout.

### 3. Inventory & Supply Chain Management
* Catalog CRUD operations.
* **FEFO (First Expired, First Out) Batch Control**: Stock is logged as distinct batches (expiry dates, purchase costs, suppliers). Checkout automatically decrements quantity from the nearest-expiring batch first.
* Near-expiry alerts (highlighting batches expiring within 90 days).
* Low-stock warnings (triggering when current stock falls below item-specific `minStock`).

### 4. Accounting & Expenses
* Log operational costs (Rent, Salaries, Utilities) in the **Expenses** tab.
* Dashboard reporting calculating Sales, COGS, Gross Profit, Expenses, and Net Profit (Profit = Sales - COGS - Expenses).

### 5. Supplier Payables
* Log outstanding balances for each batch of incoming medicines.
* Record partial or full payments to suppliers to clear ledger balances.

## Future Recommendations / Roadmaps
* **Sales Returns**: A dedicated checkout return handler to adjust item balances.
* **Cashier Shift Balancing**: Shift logouts matching physical drawer cash count.
