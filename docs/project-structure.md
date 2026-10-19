# Project Structure — NexusPOS

NexusPOS is structured as a modular, standalone Point of Sale and Inventory Management system designed for any business.

```text
pharmacy-inventory/
├── backend/
│   ├── pos.db                   # Local SQLite operational database
│   ├── backups/                 # Automatic rolling database snapshots (retains last 15)
│   └── src/
│       ├── app.py               # Main Flask server entry point & network broadcaster
│       ├── auth.py              # PBKDF2-HMAC-SHA256 password security & route guards
│       ├── config.py            # Port, paths, and secret configuration
│       ├── database.py          # Relational tables, schema migrations, and default datasets
│       └── routes.py            # Comprehensive RESTful API routes (Products, Orders, Customers, Suppliers, Expenses, Settings)
├── frontend/
│   ├── app.js                   # Single-Page Admin Dashboard state controller
│   ├── index.html               # Main Admin & Owner Dashboard
│   ├── login.css                # Polished glassmorphism styles for sign-in screen
│   ├── login.html               # Role-aware authentication page
│   ├── pos.css                  # High-contrast, tactile terminal styles for cashiers
│   ├── pos.html                 # Dedicated cashier billing interface
│   ├── pos.js                   # Fast cart logic, barcode search & checkout calculations
│   └── style.css                # Dark-mode minimalist dashboard styling tokens & components
├── docs/                        # Architecture & documentation
├── NexusPOS.bat                 # Windows one-click launcher
├── NexusPOS.command             # macOS executable launcher
└── README.md                    # System manual & quickstart instructions
```

---

### Key Architectural Highlights
* **Zero Configuration**: Starts directly with Python's built-in SQLite engine — no external database server or installation hurdles.
* **Separation of Concerns**: Cashiers operate inside a dedicated, distraction-free POS screen (`pos.html`), while store managers and owners work within the full administrative dashboard (`index.html`).
* **Modular REST API**: All frontend operations communicate with a standardized JSON API, making mobile apps or barcode scanner integrations effortless.
