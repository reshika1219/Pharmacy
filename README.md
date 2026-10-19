# NexusPOS & PharmaCare — Cloud Remote Web Application

A modern, fast, mobile-first Point of Sale (POS) and universal inventory management web application. Designed for store owners and managers to **remotely monitor inventory and store operations from any phone, tablet, or laptop browser**.

Built with **Next.js 15+ (App Router)**, **TypeScript**, **Tailwind CSS**, and **Prisma ORM** with **PostgreSQL (Supabase / Neon)** compatibility.

---

## 🌟 Key Features

### 📱 1. Remote Multi-Device Web App (Phone & PC)
* **Mobile-First Responsive UI**: Touch-friendly bottom navigation bar for single-thumb operations on phones, expanding carts, and drawer navigation.
* **Desktop Command Center**: Full desktop sidebar with wide-screen inventory data tables, receipt viewers, and keyboard-friendly barcode scanning.
* **Universal Access**: Run on any browser without installing local desktop software or apps.

### 📊 2. Real-Time Operations & Inventory Dashboard
* **Live Operational KPIs**: Today's sales revenue, gross profits, total items sold, and daily operational expense tracking.
* **Inventory Intelligence**: Instant search across titles, SKU, and barcodes, category filters, and automatic low-stock / out-of-stock alert badges.
* **Direct Stock Intake**: Receive new shipments and batches with cost price, sell price, and supplier tracking.

### 🛒 3. Cashier Point of Sale Terminal (`/pos`)
* **Instant Touch Cart**: Real-time tax and discount calculations, item quantity controls, and customer CRM linking.
* **Multi-Payment Methods**: Cash with instant change calculator & denomination shortcuts ($10, $20, $50, $100, exact), credit/debit card, digital QR, and store credit.
* **Thermal Receipt Printing**: Printable 80mm thermal receipt modal with instant browser print integration.

### 👥 4. Store Operations & CRM
* **Customer CRM**: Manage customer contact profiles, total lifetime spending, and loyalty reward points.
* **Expense Management**: Log daily operational costs (utilities, rent, supplies, salaries) with net-profit calculation.
* **Store Settings**: Customize business name, receipt headers/footers, currency symbol, and tax rates.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
* **Node.js 18+** (Node 20+ or 22+ recommended)
* **npm**

### 2. Setup & Installation
```bash
# Clone the repository
git clone https://github.com/reshika1219/Pharmacy.git
cd Pharmacy

# Install dependencies
npm install

# Initialize database schema & seed initial demo data
npm run db:push
npm run db:seed
```

### 3. Launch Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🔑 Default Login Credentials

| Role | Username | Password | Destination |
|---|---|---|---|
| **Administrator** | `admin` | `admin123` | Store Operations & Inventory Dashboard (`/`) |
| **Cashier** | `cashier` | `cashier123` | Fullscreen POS Cashier Terminal (`/pos`) |

> *Quick one-tap login preset buttons are also available on the `/login` screen.*

---

## ☁️ Connecting to Cloud PostgreSQL (Supabase / Neon)

For remote cloud deployment (e.g., on Vercel, Railway, or Render) where the client can log in from anywhere:

1. Create a free project on **[Supabase](https://supabase.com)** or **[Neon](https://neon.tech)**.
2. In `prisma/schema.prisma`, update the datasource provider to PostgreSQL:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. In your `.env` file (or cloud environment settings):
   ```env
   DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require"
   ```
4. Push the schema to your cloud database:
   ```bash
   npm run db:push
   npm run db:seed
   ```

---

## 📂 Project Architecture

```
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
