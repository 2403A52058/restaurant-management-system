# Complete VS Code Demo & Viva Presentation Guide
## Telangana Ruchulu — Restaurant Management & System Design Project

This document provides a step-by-step walkthrough script for presenting your full-stack project in **Visual Studio Code** to your teacher / evaluator ("mam"), answering technical viva questions, demonstrating code execution, and explaining background/cloud execution.

---

## 📋 Table of Contents
1. [Pre-Presentation Checklist](#1-pre-presentation-checklist)
2. [Step-by-Step Code Execution in VS Code](#2-step-by-step-code-execution-in-vs-code)
3. [Teacher Presentation Script (5-10 Minute Viva Flow)](#3-teacher-presentation-script-5-10-minute-viva-flow)
4. [Key Code Files to Open and Highlight in VS Code](#4-key-code-files-to-open-and-highlight-in-vs-code)
5. [Live Browser Demonstration Walkthrough](#5-live-browser-demonstration-walkthrough)
6. [Running in the Background vs After Laptop Shutdown](#6-running-in-the-background-vs-after-laptop-shutdown)
7. [Common Viva Questions & Ready Answers](#7-common-viva-questions--ready-answers)

---

## 1. Pre-Presentation Checklist

Before calling your teacher / evaluator to your desk:
1. Ensure your laptop is plugged in or has adequate battery.
2. Ensure you have opened the project folder in VS Code:
   ```powershell
   code c:\Users\koush\Downloads\sesd
   ```
3. Have your browser ready with a tab for:
   - `http://localhost:3000`
4. Default Demo Login Credentials:
   - **Username:** `admin`
   - **Password:** `admin123`
   - **Role:** Administrator (Full Access)

---

## 2. Step-by-Step Code Execution in VS Code

You can start the system inside VS Code using either of these two methods:

### Method A: One-Key Shortcut (Recommended & Most Impressive)
1. Open the project folder in VS Code (`File > Open Folder > sesd`).
2. Press **`Ctrl + Shift + B`** (or go to top menu: `Terminal > Run Build Task...`).
3. Select **`▶ Run Entire Restaurant System (MySQL + Backend + Frontend)`**.
4. VS Code will automatically open 3 background terminal tabs and start:
   - Terminal 1: MySQL Server on port 3306
   - Terminal 2: Express Backend on port 5000
   - Terminal 3: React Vite Frontend on port 3000

---

### Method B: Manual Integrated Terminal Tabs (Best for Explaining the Architecture)
To show each individual service starting up to your teacher:

1. Open the integrated terminal in VS Code: Press **`Ctrl + \``** (or `Terminal > New Terminal`).
2. Split or create 3 terminal tabs using the `+` or split icon in the top right of the terminal panel:

#### Tab 1: MySQL Database Server
Rename tab to `MySQL` and run:
```powershell
npm run mysql
```
*Expected Output:*
```text
InnoDB: ready for connections.
Version: '10.11.8-MariaDB' port: 3306
```

#### Tab 2: Node.js / Express Backend REST API
Click `+` to open a second tab, rename to `Backend` and run:
```powershell
npm run backend
```
*Expected Output:*
```text
✅ Successfully connected to MySQL database via Prisma
🚀 Restaurant Management Server running on http://localhost:5000
📡 Environment: development
```

#### Tab 3: React.js / Vite Frontend
Click `+` to open a third tab, rename to `Frontend` and run:
```powershell
npm run frontend
```
*Expected Output:*
```text
  VITE v5.4.21  ready in 500 ms
  ➜  Local:   http://localhost:3000/
```

3. Open your browser to `http://localhost:3000`.

---

## 3. Teacher Presentation Script (5-10 Minute Viva Flow)

Follow this exact spoken flow when presenting to your teacher:

### Introduction (30 seconds)
> *"Good morning / afternoon Ma'am. For my Software Engineering and System Design project, I have designed and implemented a full-stack, enterprise-grade **Restaurant Management & Point-of-Sale (POS) System** called **Telangana Ruchulu — Kakatiya Military Kitchen**.*
>
> *The project follows a 3-tier decoupled architecture: a modern React Single Page Application on the frontend with Tailwind CSS and Recharts, an Express.js REST API with JWT authentication and bcrypt password hashing on the backend, and a fully normalized MySQL database managed with Prisma ORM."*

### System Design & Database Normalization (2 minutes)
> *"First, let me show the System Design and Database Architecture."*
- Open [`backend/prisma/schema.prisma`](file:///c:/Users/koush/Downloads/sesd/backend/prisma/schema.prisma) in VS Code:
  > *"We have designed 15 normalized relational tables covering users, roles, employees, customers, categories, menu items, tables, reservations, orders, order items, payments, invoices, ingredients, suppliers, and inventory transactions. All tables have primary keys, foreign keys with ON DELETE constraints, and appropriate indexes to prevent data anomalies."*
- Open [`docs/SYSTEM_DESIGN_DIAGRAMS.md`](file:///c:/Users/koush/Downloads/sesd/docs/SYSTEM_DESIGN_DIAGRAMS.md) and press `Ctrl + Shift + V` to show the preview:
  > *"Here are our System Architecture Diagram, Entity Relationship (ER) Diagram, Level-0 and Level-1 Data Flow Diagrams (DFD), and Use Case Diagrams."*

### Backend Architecture & Security (2 minutes)
> *"Moving to the backend implementation:"*
- Open [`backend/src/server.js`](file:///c:/Users/koush/Downloads/sesd/backend/src/server.js) and [`backend/src/app.js`](file:///c:/Users/koush/Downloads/sesd/backend/src/app.js):
  > *"The backend uses a modular Controller-Route-Service pattern. CORS, secure headers, and JSON body parsers are configured globally."*
- Open [`backend/src/middleware/auth.js`](file:///c:/Users/koush/Downloads/sesd/backend/src/middleware/auth.js):
  > *"For authentication and authorization, we use JSON Web Tokens (JWT) and Role-Based Access Control (RBAC). We have defined 5 distinct roles: Admin, Manager, Cashier, Waiter, and Kitchen Staff. Protected routes verify the token signature and enforce strict role boundaries."*
- Open [`backend/src/controllers/orderController.js`](file:///c:/Users/koush/Downloads/sesd/backend/src/controllers/orderController.js) and [`billingController.js`](file:///c:/Users/koush/Downloads/sesd/backend/src/controllers/billingController.js):
  > *"When an order is completed and billed, we wrap database updates inside Prisma transactions to maintain ACID properties: calculating 5% GST, generating the invoice, updating table availability, and updating inventory stock levels atomically."*

### Frontend UI & User Experience (1 minute)
> *"On the frontend side:"*
- Open [`frontend/src/App.jsx`](file:///c:/Users/koush/Downloads/sesd/frontend/src/App.jsx):
  > *"We built 13 distinct functional pages using React 18, React Router v6, Tailwind CSS, Lucide icons, and Recharts. We have implemented private route guards and an Axios interceptor that automatically attaches the Bearer token to all outgoing API calls."*

---

## 4. Key Code Files to Open and Highlight in VS Code

Keep these files bookmarked or open in your VS Code tabs:

| Component | File Path | What to Highlight to Mam |
| :--- | :--- | :--- |
| **Database Schema** | `backend/prisma/schema.prisma` | 15 relational tables, Foreign keys, Enums (`OrderStatus`, `PaymentMethod`, `TableStatus`) |
| **Database Seed** | `backend/prisma/seed.js` | 34 authentic Telangana/Hyderabadi dishes, initial tables, admin roles |
| **Auth Middleware** | `backend/src/middleware/auth.js` | JWT verification (`jwt.verify`) and `authorizeRoles(...)` |
| **Order Controller** | `backend/src/controllers/orderController.js` | Order creation, dynamic item quantity updates, status lifecycle (`PENDING` -> `PREPARING` -> `READY` -> `SERVED`) |
| **Billing Controller** | `backend/src/controllers/billingController.js` | Subtotal, 5% GST computation, payment record creation, invoice generation |
| **Dashboard Page** | `frontend/src/pages/Dashboard.jsx` | Recharts daily sales bar chart, monthly area chart, live KPI cards |
| **Menu Page** | `frontend/src/pages/MenuManagement.jsx` | Search, category filtering, availability toggles, CRUD modal |
| **Billing Page** | `frontend/src/pages/Billing.jsx` | Order settlement, thermal receipt modal with `@media print` |
| **Test Cases** | `docs/TEST_CASES.md` | 20 unit/integration test cases with expected vs actual results |

---

## 5. Live Browser Demonstration Walkthrough

Open `http://localhost:3000` in Google Chrome or Edge and perform this live test:

1. **Login Page**:
   - Enter `admin` / `admin123`.
   - Point out the dark charcoal luxury theme with orange/gold accents.
2. **Dashboard**:
   - Show the KPI cards: Total Revenue (₹), Total Orders, Active Customers, Available Tables.
   - Point out the interactive Recharts revenue charts.
3. **Menu Management**:
   - Show the authentic Telangana cuisine: **Hyderabadi Dum Biryani**, **Natu Kodi Pulusu**, **Sarva Pindi**, **Sakinalu**, **Talakaya Kura**, **Double Ka Meetha**, **Irani Chai**.
   - Show searching by name (type *"Biryani"*) and filtering by category (*Royal Biryanis*).
   - Demonstrate toggling availability (In Stock / Out of Stock).
4. **Table Management & Reservations**:
   - Show the 10 restaurant tables with real-time status badges (*Available*, *Occupied*, *Reserved*).
5. **Create an Order (POS Workflow)**:
   - Go to **Orders** > Click **"Create Order"**.
   - Select **Table 4 (Family Dining - 6 Seats)**.
   - Add **2x Hyderabadi Mutton Dum Biryani** (₹420 each) and **1x Telangana Natu Kodi Pulusu** (₹380).
   - Click **"Place Order"**. Total calculates dynamically in ₹ INR.
6. **Kitchen Display System (KDS)**:
   - Go to **Kitchen Dashboard**.
   - Show the newly placed order appearing in real-time.
   - Click **"Start Preparing"** (status changes to `PREPARING`).
   - Click **"Mark Ready"** (status changes to `READY`).
7. **Billing & Thermal Invoice Printing**:
   - Go to **Billing**.
   - Select the served order for Table 4.
   - Show the automatic tax breakdown: Subtotal, 5% CGST/SGST, and Total.
   - Choose payment method: **UPI** (or Cash / Card).
   - Click **"Complete Payment & Invoice"**.
   - Click **"Print Bill"** to show the authentic thermal receipt modal formatted for a POS slip printer.
8. **Reports & Analytics**:
   - Go to **Reports**.
   - Show the sales trend breakdown, top-selling dishes, and click **"Export CSV"** to demonstrate report generation.

---

## 6. Running in the Background vs After Laptop Shutdown

Students and teachers often ask: *"Can this run in the background, and can it run after the laptop is shut down?"*

Here is the exact technical explanation and how both scenarios are handled:

### Scenario 1: Running in the Background Locally on Windows
If you want the restaurant system to run silently in the background on your laptop **without keeping terminal windows open**:

- **To Start Silently:** Double-click [`scripts/start-hidden.vbs`](file:///c:/Users/koush/Downloads/sesd/scripts/start-hidden.vbs) or run:
  ```powershell
  npm run start:hidden
  ```
  *This uses Windows VBScript Host (`wscript.exe`) to run MySQL, Express, and Vite completely hidden in the background with 0 open windows.*
- **To Auto-Start on Laptop Boot:** Double-click [`scripts/setup-autostart.bat`](file:///c:/Users/koush/Downloads/sesd/scripts/setup-autostart.bat).
  *This registers a shortcut in Windows Startup (`shell:startup`). Whenever you power on your laptop or log into Windows, the system starts automatically in the background.*
- **To Stop All Background Services:** Double-click [`scripts/stop-all.bat`](file:///c:/Users/koush/Downloads/sesd/scripts/stop-all.bat) or run:
  ```powershell
  npm run stop
  ```

---

### Scenario 2: Running When the Laptop is Completely Powered Off (Shutdown)
> **Fundamental Computer Science Principle:**
> When a physical computer is **shut down (powered off)**, electricity is disconnected from the motherboard, the CPU stops executing clock cycles, and RAM is wiped. Therefore, **no local program can execute on a powered-off laptop**.

If your teacher or external examiner requires the website to be accessible **24/7 even when your laptop is turned off and packed in your bag**, the industry-standard solution is **Cloud Deployment**:

#### How to Deploy Free to the Cloud (Permanent 24/7 Access):
1. **Database (Cloud MySQL):**
   - Create a free cloud MySQL database on [Aiven.io](https://aiven.io/) or [Supabase](https://supabase.com/).
   - Copy the connection URI into `backend/.env`:
     ```env
     DATABASE_URL="mysql://avnadmin:password@mysql-project.aivencloud.com:12345/defaultdb?ssl-mode=REQUIRED"
     ```
   - Push schema and seed data:
     ```bash
     npx prisma db push
     node prisma/seed.js
     ```
2. **Backend API (Node.js on Render / Railway):**
   - Push your code to a GitHub repository.
   - Go to [Render.com](https://render.com/) > New Web Service > connect your repo > set root directory to `backend`.
   - Set Build Command: `npm install && npx prisma generate`
   - Set Start Command: `node src/server.js`
   - Render gives you a free live backend URL: e.g., `https://restaurant-api.onrender.com`.
3. **Frontend (Vercel / Netlify):**
   - Go to [Vercel.com](https://vercel.com/) > New Project > select `frontend`.
   - Set environment variable: `VITE_API_URL=https://restaurant-api.onrender.com/api`.
   - Click Deploy.
   - You receive a permanent public URL: e.g., `https://telangana-ruchulu.vercel.app`.

> *With Cloud Deployment, your project stays live 24/7, 365 days a year, accessible from any mobile phone, tablet, or external computer even when your laptop is turned off!*

---

## 7. Common Viva Questions & Ready Answers

**Q1: Why did you choose Prisma ORM over raw SQL queries?**
> *"Prisma provides type-safety, automatic migration tracking, schema declaration, and query optimization. It prevents SQL injection attacks through parameterized queries and simplifies relational join operations with clean JavaScript syntax."*

**Q2: How is user authentication secured?**
> *"We do not store plain-text passwords. Passwords are salted and hashed using bcrypt (10 rounds). On successful authentication, the server signs a JSON Web Token containing the user ID and role, which expires in 24 hours. The frontend passes this token in the `Authorization: Bearer <token>` HTTP header, which is validated by backend middleware."*

**Q3: How does the system handle concurrent reservations and prevent double bookings?**
> *"When a reservation is submitted, our reservation controller performs an overlapping interval check against the database: checking if the requested table has any active reservation where the time interval overlaps with the existing booking window (`booking_time ± duration`). If a conflict exists, the transaction is rejected with HTTP 409 Conflict."*

**Q4: How did you ensure database normalization?**
> *"The database is normalized to Third Normal Form (3NF). We separated order headers (`orders`) from individual line items (`order_items`), separated payment transactions (`payments`) from invoices (`invoices`), and eliminated transitive dependencies so that non-key attributes depend only on the primary key."*

**Q5: What design patterns did you use in this project?**
> *"We applied the **MVC / Layered Architecture** (Routes -> Middleware -> Controllers -> Models), the **Singleton Pattern** for the Prisma client database connection instance, and the **Observer / Reactive Pattern** in React using hooks (`useState`, `useEffect`) for state management."*
