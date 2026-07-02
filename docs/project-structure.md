# Project Structure — PharmaCare

PharmaCare is structured as a clean, modular single-branch pharmacy management application.

```
pharmacy-inventory/
├── backend/
│   ├── src/
│   │   ├── __init__.py
│   │   ├── app.py           # Main server initialization and static serving
│   │   ├── config.py        # Port, secret tokens, and paths setup
│   │   ├── database.py      # SQLite connection, initialization, and auto-migrations
│   │   ├── auth.py          # Secure password hashing and role validation middlewares
│   │   └── routes.py        # REST API endpoints for login, catalog, sales, expenses, and dashboard reports
│   └── backups/             # Auto-rotating database backups (.db)
├── frontend/
│   ├── login.html           # Authentication portal
│   ├── login.css
│   ├── cashier.html         # Cashier POS workspace
│   ├── cashier.css
│   ├── cashier.js           # Client POS controller querying REST routes
│   ├── index.html           # Owner Portal dashboard UI
│   ├── style.css
│   └── app.js               # Owner dashboard controller handling sync, expenses, and suppliers
├── docs/                    # Technical guides and documentations
│   ├── project-structure.md
│   ├── features.md
│   └── owner-dashboard.md
├── README.md                # System user manual
├── PharmaCare.bat           # Windows application launcher
└── PharmaCare.command       # macOS application launcher
```

## Backend Organization
* **Modular Codebase**: Split from the legacy monolithic `server.py` to ensure that configuration, auth logic, database operations, and HTTP routes are managed independently.
* **Database Isolation**: The database (`pharmacy.db`) and backup directories are localized within the `backend/` folder to separate concerns.

## Frontend Organization
* **No Server-Side Templates**: Frontend files are served as static files from the `frontend/` folder, interacting with the backend purely through secure AJAX `fetch` calls.
