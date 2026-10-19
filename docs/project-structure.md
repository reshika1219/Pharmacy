# Project Structure — ExamplePOS

ExamplePOS is structured as a modern, full-stack Next.js web application designed for remote inventory management and point of sale operations.

```text
├── prisma/
│   ├── schema.prisma          # Database schema (PostgreSQL & SQLite compatible)
│   └── seed.ts                # Initial configuration, categories, and inventory seeder
├── src/
│   ├── app/
│   │   ├── api/               # Next.js Server REST API routes
│   │   │   ├── auth/          # Login, logout, session management
│   │   │   ├── batches/       # Stock intake & shipment batches
│   │   │   ├── categories/    # Product categories
│   │   │   ├── config/        # Store profile & settings
│   │   │   ├── customers/     # CRM & loyalty points
│   │   │   ├── dashboard/     # Real-time KPIs & operational analytics
│   │   │   ├── expenses/      # Operational expenses
│   │   │   ├── orders/        # POS checkout transactions & receipts
│   │   │   └── products/      # Inventory catalog & SKU management
│   │   ├── batches/           # Batch intake view
│   │   ├── customers/         # Customer CRM view
│   │   ├── expenses/          # Expense tracking view
│   │   ├── inventory/         # Full inventory catalog view
│   │   ├── login/             # Responsive authentication page
│   │   ├── orders/            # Order history & thermal receipt reprint
│   │   ├── pos/               # Cashier Point of Sale terminal
│   │   ├── settings/          # Business settings & localization
│   │   ├── globals.css        # Glassmorphic design system & print styles
│   │   ├── layout.tsx         # Root layout with responsive viewport tags
│   │   └── page.tsx           # Operations & Inventory Dashboard
│   ├── components/
│   │   └── Navigation.tsx     # Responsive desktop sidebar + mobile bottom tab bar
│   └── lib/
│       ├── auth.ts            # JWT sessions & bcrypt password verification
│       └── prisma.ts          # Singleton database client
├── package.json
└── README.md
```

---

### Key Architectural Highlights
* **Universal Remote Access**: Web application accessible from any mobile phone, tablet, or laptop browser.
* **Separation of Concerns**: Dedicated touch-friendly POS terminal for cashiers (`/pos`), alongside an executive operations & inventory control panel (`/`).
* **Cloud & Local Flexibility**: Works with local SQLite or cloud-hosted PostgreSQL (Supabase / Neon).
