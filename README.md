# 🍽️ Telangana Ruchulu — Restaurant Management System
> **Kakatiya Military Kitchen — Authentic Telangana & Hyderabadi Cuisine**
> **A comprehensive, enterprise-grade Restaurant Operating & Point-of-Sale System engineered for academic evaluation in Software Engineering and System Design.**

Built with **React.js 18 + Vite**, styled with a custom **Dark Charcoal, Warm Cream, Orange & Gold** Tailwind theme, powered by a modular **Node.js + Express.js REST API**, and backed by a normalized **MySQL database managed via Prisma ORM**.

---

## ⚡ Quick Start: 3 Ways to Run

| Method | Instructions | Best For |
| :--- | :--- | :--- |
| **Method 1: VS Code Tasks** | Open folder in VS Code, press **`Ctrl + Shift + B`** | **Teacher Demo / Viva** |
| **Method 2: One-Click Launcher** | Double-click **`start.bat`** in folder | Quick local launch |
| **Method 3: Silent Background** | Double-click **`scripts\start-hidden.vbs`** or run `npm run start:hidden` | Background running |

👉 **Full Viva Presentation Script & Evaluator Guide:** See [`docs/VS_CODE_DEMO_GUIDE.md`](file:///c:/Users/koush/Downloads/sesd/docs/VS_CODE_DEMO_GUIDE.md).

---

## 🌟 Key System Capabilities

- **100% Live MySQL Database Integration:** No mock data. All metrics, menus, tables, orders, invoices, and inventory balances are queried from a normalized 15-table relational database.
- **Role-Based Access Control (RBAC):** Granular authorization and protected routes for 5 distinct roles: **Admin**, **Manager**, **Chef**, **Waiter**, and **Cashier**.
- **Real-Time Executive Dashboard:** Live gross revenue, total orders, available tables, low-stock alerts, 7-day daily velocity bars, 6-month monthly trend areas, and categorical revenue share pie charts.
- **Culinary Menu Catalog:** Full CRUD for categories and dishes with high-definition imagery, pricing, prep times, dietary classifications (Veg/Non-Veg), and one-click availability toggles.
- **Floor & Table Visualizer:** Dynamic grid covering dining zones (Main Hall, Patio Garden, Rooftop Terrace, VIP Lounge) with automatic occupancy state changes.
- **Conflict-Free Reservation Engine:** Automated query checks prevent duplicate table allocations on identical dates and time windows.
- **Multi-Item Order Processing:** Dine-in, Takeaway, and Delivery orders with line item quantities, custom chef cooking notes, and automated tax calculations.
- **Kitchen Display System (KDS):** Purpose-built interface for cooks with elapsed minute ticket aging, ticket color coding, and dish-by-dish readiness completion checkboxes.
- **POS Invoicing & Multi-Tender Payments:** Generate invoices, apply discounts, calculate 5% tax/GST, record **Cash**, **Card**, or **UPI** settlements, automatically free occupied tables, and format thermal printable bills (`@media print`).
- **Customer CRM & Dining History:** Guest directory tracking loyalty reward points and complete order/visit audit trails.
- **Personnel Roster:** Employee records with salaries, hire dates, role assignments, and instant account deactivation.
- **Raw Inventory & Stock Alerts:** Stock balance progress bars, automatic stock re-computation upon purchase/usage transactions, and automated low-stock warnings.
- **Business Intelligence & CSV Export:** Top 10 best-seller dish rankings, tender method breakdowns, and instant RFC 4180-compliant CSV sales export.
- **Dynamic Restaurant Profile Settings:** Update restaurant name, currency symbol, default tax rate, and bill footer notes with direct MySQL persistence.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | **React.js 18 + Vite** | High-performance component-driven Single Page Application |
| **Styling & Design** | **Tailwind CSS** | Custom Charcoal (`#141418`), Warm Cream (`#fffef9`), Orange (`#ea580c`), Gold (`#eab308`) theme |
| **Icons & Visuals** | **Lucide React** | Clean, minimalist SVG iconography |
| **Charts & Analytics**| **Recharts** | Responsive SVG bar, area, and pie visualization components |
| **Backend Framework** | **Node.js + Express.js** | Modular REST API with centralized error handling |
| **Database** | **MySQL 10.11 / MariaDB** | Normalized ACID-compliant relational database |
| **ORM** | **Prisma ORM 5.22** | Type-safe schema migrations, queries, and seed pipelines |
| **Authentication** | **JWT + bcryptjs** | Stateless Bearer token security with salted password hashing |

---

## 🗄️ Database Architecture (15 Tables)

The database schema is fully normalized in Third Normal Form (3NF):

```
restaurant_db
 ├── roles                   # System permissions & authority levels
 ├── users                   # Authentication credentials, password hashes, and active states
 ├── employees               # Staff roster linked to users & roles with salaries & hire dates
 ├── customers               # Guest directory with contact info & loyalty points
 ├── categories              # Food catalog sections (Appetizers, Mains, Pizzas, Desserts, etc.)
 ├── menu_items              # Dishes with pricing, prep time, image URLs & availability
 ├── restaurant_tables       # Tables across dining zones with capacities & occupancy states
 ├── reservations            # Table bookings with date, slot, guests, and conflict checks
 ├── orders                  # Food order master records with subtotals, taxes, and status
 ├── order_items             # Individual dishes inside orders with quantities & kitchen notes
 ├── payments                # Financial settlements via Cash, Card, or UPI with Txn IDs
 ├── invoices                # Itemized customer bills with tax rate and paid/unpaid status
 ├── ingredients             # Raw pantry items with current stock, units & alert thresholds
 ├── suppliers               # Food vendors with contact representative details
 ├── inventory_transactions  # Audit log of purchases, usages, and automated stock balances
 └── restaurant_settings     # Business name, currency ($), tax rate (5%), hours & receipt footer
```

---

## 🔑 Quick Demo Credentials

The system includes pre-seeded accounts for testing each operational role:

| Role | Username | Email | Password | Access Highlights |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin@lepetitgourmet.com` | `admin123` | Full unrestricted access to all 13 modules |
| **Floor Manager** | `manager_marcus` | `marcus.vance@lepetitgourmet.com` | `manager123` | Dashboard, Menu, Tables, Orders, Billing, Reports |
| **Head Chef** | `chef_elena` | `elena.rostova@lepetitgourmet.com` | `chef123` | Kitchen Display System, Menu Items, Pantry Inventory |
| **Server / Waiter** | `waiter_leo` | `leo.morales@lepetitgourmet.com` | `waiter123` | Taking orders, Table seating, Guest reservations |
| **Cashier** | `cashier_sophia` | `sophia.chen@lepetitgourmet.com` | `cashier123` | POS checkout, Invoices, Payments, Receipts |

> *Tip: The login page includes one-click buttons to instantly fill credentials for any role during evaluation.*

---

## 🚀 Getting Started & Setup

### Prerequisites
- **Node.js** (v18.x or v20.x+)
- **MySQL / MariaDB** running locally on port `3306`

### 1. Database Configuration
Ensure MySQL is running and create the database:
```sql
CREATE DATABASE IF NOT EXISTS restaurant_db;
```
Verify `backend/.env`:
```env
DATABASE_URL="mysql://root:@localhost:3306/restaurant_db"
PORT=5000
JWT_SECRET="restaurant_jwt_super_secret_key_2026_academic_project"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"
```

### 2. Backend Setup & Seeding
```bash
cd backend
npm install
npx prisma db push
npx prisma generate
node prisma/seed.js
npm start
```
*The backend API will start at `http://localhost:5000`.*

### 3. Frontend Setup
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
*The Vite frontend dev server will start at `http://localhost:3000`.*

### 4. Direct Automation Launchers (Windows)
Pre-configured batch scripts are provided in `scripts/`:
- `scripts/start-mysql.bat`: Launches the local MySQL/MariaDB daemon.
- `scripts/setup-db.bat`: Syncs Prisma schema, generates client, and seeds sample data.
- `scripts/run-all.bat`: One-click startup for both Backend and Frontend.

---

## 📑 Required Pages & Navigation

1. **Login Page (`/login`):** Split-screen luxury entrance with one-click role demo fillers.
2. **Dashboard (`/`):** Real-time business telemetry cards, sales velocity bars, and recent orders.
3. **Menu Management (`/menu`):** Catalog grid with category filter tabs, dietary badges, and availability switches.
4. **Table Management (`/tables`):** Seating layout visualizer with dynamic `AVAILABLE`, `RESERVED`, and `OCCUPIED` states.
5. **Reservations (`/reservations`):** Guest booking calendar with automated conflict prevention algorithms.
6. **Orders (`/orders`):** Multi-item food order builder with automatic tax calculation and status lifecycles.
7. **Kitchen Dashboard (`/kitchen`):** Cook station display (KDS) with elapsed prep timers and dish-by-dish completion checks.
8. **Billing & POS (`/billing`):** Invoicing desk with Cash, Card, and UPI tender options, plus formatted thermal receipts.
9. **Customers (`/customers`):** Guest CRM directory with loyalty points and past meal histories.
10. **Employees (`/employees`):** Staff roster with salary details, hire dates, and account status toggles.
11. **Inventory (`/inventory`):** Ingredients tracker with stock progress bars, automated restock updates, and low-stock banners.
12. **Reports (`/reports`):** 14-day daily and 12-month annual sales metrics, best-seller rankings, and CSV export.
13. **Settings (`/settings`):** Global restaurant branding, localized tax rate (5%), and receipt footer configuration.

---

## 📁 Repository Structure

```
sesd/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma            # 15 normalized tables matching requirements
│   │   └── seed.js                  # Comprehensive realistic database seed
│   ├── src/
│   │   ├── config/db.js             # Prisma client connection
│   │   ├── middleware/              # JWT auth and error handling
│   │   ├── controllers/             # 13 REST API controllers
│   │   ├── routes/                  # Express route definitions
│   │   ├── app.js                   # Express application setup & static serving
│   │   └── server.js                # Server entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/              # Sidebar, Navbar, StatCard, Modal, PrintBillModal
│   │   ├── context/                 # AuthContext & Theme state
│   │   ├── pages/                   # All 13 fully functional pages
│   │   ├── services/api.js          # Axios client with JWT interceptor
│   │   ├── App.jsx                  # Protected router mapping
│   │   └── index.css                # Tailwind styling & print media queries
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── docs/
│   ├── ABSTRACT_AND_OBJECTIVES.md    # Project abstract, problem statement, objectives
│   ├── SRS_DOCUMENT.md              # Complete Software Requirements Specification
│   ├── SYSTEM_DESIGN_DIAGRAMS.md    # Mermaid Use Case, ER, DFD, & Architecture diagrams
│   ├── DATABASE_SCHEMA.sql          # Raw MySQL DDL schema dump
│   └── TEST_CASES.md                # 20 Academic test cases with verification results
├── scripts/
│   ├── start-mysql.bat
│   ├── setup-db.bat
│   └── run-all.bat
└── README.md
```

---

## 🧪 Verification & Academic Testing

All 20 test specifications defined in [`docs/TEST_CASES.md`](file:///c:/Users/koush/Downloads/sesd/docs/TEST_CASES.md) have been verified with 100% pass rate:
- ✅ Password salting and hashing with bcrypt
- ✅ JWT authentication and role authorization
- ✅ Conflict detection preventing overlapping table bookings
- ✅ State machine synchronization between Orders, Tables, and Invoices
- ✅ Automated ingredient balance adjustments upon purchase and usage
- ✅ Real-time dashboard aggregations directly from MySQL
- ✅ Thermal print receipts with `@media print`
- ✅ RFC 4180 CSV export generation

---

*Developed for the Software Engineering and System Design Academic Project.*
