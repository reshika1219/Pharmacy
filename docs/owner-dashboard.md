# Remote Owner Dashboard — PharmaCare

PharmaCare is designed to allow the pharmacy owner to securely monitor daily sales, profit metrics, operational costs, and cashier logs from anywhere in the world.

## Remote Access Metrics

The Owner Dashboard gathers live reporting data under the **Dashboard** and **Suppliers** tabs:

### 1. Today's Financials (Real-Time)
* **Gross Sales**: Sum of all active invoice totals today.
* **COGS (Cost of Goods Sold)**: Real cost spent on purchasing the specific batches sold today.
* **Gross Profit**: `Gross Sales - COGS`.
* **Expenses**: Logged operational expenditures logged today.
* **Net Profit**: `Gross Profit - Expenses`.

### 2. Payment Breakdown
* Segregated daily revenue tracking across payment methods:
  * **Cash**: In-register cash.
  * **Card**: POS swipe transactions.
  * **Online**: Digital transfers or mobile wallets.
  * **Credit**: Outstanding client debts.

### 3. Voids / Refunds Today
* Shows the count and total value of invoices voided by the owner today. Voiding restores stock levels immediately to batches.

### 4. Cashier Performance
* Shows a breakdown of how many invoices each cashier checked out today along with their total contribution to sales.

### 5. Supplier Payables Ledger
* Under the **Suppliers** tab, owners can review outstanding balances owed to medicine suppliers (e.g. `(qty_received * purchase_price) - amount_paid`) and log payments.

## Security Protection
All reporting backend endpoints (e.g., `/api/reports/dashboard`, `/api/expenses`, `/api/batches/<id>/pay`, `/api/sales/void`) are protected on the server. If a user without the `owner` role attempts to trigger these endpoints, the server rejects the request with a `403 Unauthorized` status code.
