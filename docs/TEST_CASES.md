# System Test Cases & Academic Verification Report

**Project:** Le Petit Gourmet — Restaurant Management System  
**Test Environment:** Windows, Node.js v20.18.0, MySQL 10.11 / MariaDB, Prisma ORM 5.22, React 18 / Vite  
**Test Suite Coverage:** All 13 Core Modules (Authentication, Dashboard, Menu, Tables, Reservations, Orders, Kitchen, Billing, Customers, Employees, Inventory, Reports, Settings).

---

## 1. Test Summary
| Total Test Cases | Passed | Failed | Blocked | Execution Status |
| :---: | :---: | :---: | :---: | :---: |
| **20** | **20** | **0** | **0** | **100% Passed** |

---

## 2. Detailed Test Case Specifications

### TC-01: Authentication with Valid Credentials
- **Module:** Authentication & Security
- **Objective:** Verify user can authenticate with valid credentials and receive a JWT.
- **Preconditions:** User `admin` exists with hashed password in MySQL.
- **Test Steps:**
  1. Send `POST /api/auth/login` with `{"login": "admin", "password": "admin123"}`.
- **Expected Result:** HTTP 200 OK, `success: true`, signed JWT token returned, user profile returned.
- **Actual Result:** HTTP 200 OK, valid JWT token generated, user role `ADMIN` returned.
- **Status:** **PASS**

---

### TC-02: Authentication Failure on Invalid Password
- **Module:** Authentication & Security
- **Objective:** Verify access is blocked when an incorrect password is supplied.
- **Preconditions:** User `admin` exists in database.
- **Test Steps:**
  1. Send `POST /api/auth/login` with `{"login": "admin", "password": "wrongpassword"}`.
- **Expected Result:** HTTP 401 Unauthorized, `success: false`, error message indicating invalid credentials.
- **Actual Result:** HTTP 401 Unauthorized, `"Invalid credentials. Incorrect password."`
- **Status:** **PASS**

---

### TC-03: Protected Route Authorization (RBAC)
- **Module:** Role-Based Access Control
- **Objective:** Ensure unauthenticated requests cannot access protected endpoints.
- **Preconditions:** None.
- **Test Steps:**
  1. Send `GET /api/tables` without `Authorization: Bearer <token>` header.
- **Expected Result:** HTTP 401 Unauthorized, rejection of request.
- **Actual Result:** HTTP 401 Unauthorized, `"Authentication required. No token provided."`
- **Status:** **PASS**

---

### TC-04: Role Permission Guard
- **Module:** Role-Based Access Control
- **Objective:** Verify non-admin role (e.g. Waiter) is blocked from administrative actions.
- **Preconditions:** User authenticated as role `WAITER`.
- **Test Steps:**
  1. Send `DELETE /api/employees/1` with Waiter JWT.
- **Expected Result:** HTTP 403 Forbidden, access denied.
- **Actual Result:** HTTP 403 Forbidden, `"Forbidden: Access requires one of these roles: ADMIN"`
- **Status:** **PASS**

---

### TC-05: Real-Time Dashboard Aggregation
- **Module:** Admin Dashboard
- **Objective:** Verify dashboard computes total revenue, available tables, and low stock count from MySQL.
- **Preconditions:** Database seeded with active orders, payments, tables, and ingredients.
- **Test Steps:**
  1. Send authenticated `GET /api/dashboard/stats`.
- **Expected Result:** HTTP 200 OK, JSON containing `totalRevenue`, `totalOrders`, `availableTables`, `lowStockCount`.
- **Actual Result:** HTTP 200 OK, real values calculated live (`totalRevenue: 2488.48`, `tables: 10`, `lowStock: 3`).
- **Status:** **PASS**

---

### TC-06: Menu Item Addition & Availability Toggle
- **Module:** Menu Management
- **Objective:** Verify addition of a new dish and instant toggling of availability.
- **Preconditions:** Authenticated as Admin or Chef.
- **Test Steps:**
  1. Send `POST /api/menu/items` with name, category, price, prep time, veg flag.
  2. Send `PATCH /api/menu/items/:id/toggle-availability`.
- **Expected Result:** Dish created in MySQL; availability toggles from `true` to `false`.
- **Actual Result:** Dish created with ID; status toggles cleanly.
- **Status:** **PASS**

---

### TC-07: Table Status Transition on Order Creation
- **Module:** Table & Order Management
- **Objective:** Verify creating a Dine-In food order for a table marks it `OCCUPIED`.
- **Preconditions:** Table T-02 is currently `AVAILABLE`.
- **Test Steps:**
  1. Send `POST /api/orders` specifying `tableId = 2` and menu dishes.
  2. Send `GET /api/tables` and check status of table T-02.
- **Expected Result:** Order created; table T-02 status changes to `OCCUPIED`.
- **Actual Result:** Order created (`ORD-2026-6483536`); table T-02 status updated to `OCCUPIED`.
- **Status:** **PASS**

---

### TC-08: Conflict-Free Reservation Prevention
- **Module:** Reservation Management
- **Objective:** Verify system prevents double-booking the same table for identical date and slot.
- **Preconditions:** Table T-05 is booked for today at `19:00 - 21:00`.
- **Test Steps:**
  1. Submit a second reservation for Table T-05 on the exact same date and `19:00 - 21:00` slot.
- **Expected Result:** HTTP 409 Conflict, descriptive error rejecting the duplicate booking.
- **Actual Result:** HTTP 409 Conflict, `"Conflict: Table T-05 is already booked for 19:00 - 21:00 on this date."`
- **Status:** **PASS**

---

### TC-09: Kitchen Order Display & Item Status Advance
- **Module:** Kitchen Display System (KDS)
- **Objective:** Ensure incoming orders display in KDS and individual dishes can be advanced to READY.
- **Preconditions:** Active pending orders in database.
- **Test Steps:**
  1. Send `GET /api/kitchen/orders`.
  2. Advance item status via `PATCH /api/kitchen/items/:id/status` to `READY`.
- **Expected Result:** Active orders returned with elapsed minutes; item updated to `READY`.
- **Actual Result:** Orders returned with computed `elapsedMinutes`; item updated to `READY`.
- **Status:** **PASS**

---

### TC-10: POS Invoice Generation & Tax Calculation
- **Module:** Billing & Invoicing
- **Objective:** Verify subtotal, default tax rate (5%), and discount calculation.
- **Preconditions:** Order with subtotal $77.00.
- **Test Steps:**
  1. Send `POST /api/billing/generate` with `orderId` and `discountAmount = 5.00`.
- **Expected Result:** Invoice generated with `subtotal = 77.00`, `taxAmount = 3.85`, `totalAmount = 75.85`.
- **Actual Result:** Invoice `INV-2026-6552630` generated with exact mathematical totals.
- **Status:** **PASS**

---

### TC-11: Multi-Tender Payment & Table Release Automation
- **Module:** Billing & Payments
- **Objective:** Verify recording payment marks order SERVED, invoice PAID, and frees up table.
- **Preconditions:** Unpaid invoice with table occupied.
- **Test Steps:**
  1. Send `POST /api/billing/payments` with `paymentMethod: "CARD"`.
  2. Query table status in database.
- **Expected Result:** Payment record created; invoice `PAID`; order `SERVED`; table returns to `AVAILABLE`.
- **Actual Result:** Payment recorded; table T-02 status returned to `AVAILABLE`.
- **Status:** **PASS**

---

### TC-12: Thermal Receipt Print Formatting
- **Module:** Billing & POS
- **Objective:** Verify formatted invoice includes restaurant info and triggers print preview.
- **Preconditions:** Invoice exists.
- **Test Steps:**
  1. Open bill in Print Bill modal in UI.
  2. Verify receipt contains business header, itemized breakdown, tax amount, and footer.
- **Expected Result:** Component renders clean monospace receipt formatted for print media.
- **Actual Result:** Clean printable receipt rendered with `@media print` isolation.
- **Status:** **PASS**

---

### TC-13: Customer Directory & Order History Tracking
- **Module:** Customer CRM
- **Objective:** Ensure customer profile associates past meals and loyalty reward points.
- **Preconditions:** Customer exists in database.
- **Test Steps:**
  1. Send `GET /api/customers/:id`.
- **Expected Result:** Returns customer profile along with arrays of orders and reservations.
- **Actual Result:** Returns customer details, loyalty points, past order items, and booking records.
- **Status:** **PASS**

---

### TC-14: Employee Account Deactivation
- **Module:** Employee Management
- **Objective:** Verify toggling account status terminates access immediately.
- **Preconditions:** Active employee with user account.
- **Test Steps:**
  1. Send `PATCH /api/employees/:id/toggle-status`.
  2. Attempt login with the deactivated employee account.
- **Expected Result:** Employee status becomes `TERMINATED`; user account login blocked.
- **Actual Result:** Status changed to `TERMINATED`; subsequent login blocked with HTTP 403.
- **Status:** **PASS**

---

### TC-15: Automated Stock Inventory Update
- **Module:** Inventory Management
- **Objective:** Ensure stock transaction automatically adjusts ingredient currentStock balance.
- **Preconditions:** Beef stock balance is 24.5 kg.
- **Test Steps:**
  1. Send `POST /api/inventory/transactions` with `type: "PURCHASE"`, `quantity: 10`.
  2. Query `GET /api/inventory/ingredients` for ingredient #1.
- **Expected Result:** Stock balance increments from 24.5 kg to 34.5 kg.
- **Actual Result:** Balance verified in MySQL as 34.5 kg.
- **Status:** **PASS**

---

### TC-16: Low Stock Alert Trigger
- **Module:** Inventory Management
- **Objective:** Verify ingredients below threshold are identified as low stock.
- **Preconditions:** Ingredients with stock $\le$ minThreshold (e.g. Burrata 12 pcs $\le$ 15 minThreshold).
- **Test Steps:**
  1. Send `GET /api/inventory/ingredients?lowStock=true`.
- **Expected Result:** Returns all ingredients where `currentStock <= minThreshold`.
- **Actual Result:** Returns 3 low-stock items; UI displays flashing warning alert.
- **Status:** **PASS**

---

### TC-17: Popular Items Report Ranking
- **Module:** Reports & Analytics
- **Objective:** Verify top selling dishes are sorted by volume and revenue.
- **Preconditions:** Orders completed with order items.
- **Test Steps:**
  1. Send `GET /api/reports/popular-items`.
- **Expected Result:** Returns grouped items ranked by quantity descending.
- **Actual Result:** Popular dishes returned with correct sales count and total revenue.
- **Status:** **PASS**

---

### TC-18: CSV Export Download
- **Module:** Reports & Analytics
- **Objective:** Ensure system generates a compliant downloadable CSV of all orders.
- **Preconditions:** Authenticated as Admin or Manager.
- **Test Steps:**
  1. Send `GET /api/reports/export-csv`.
- **Expected Result:** HTTP 200 OK, `Content-Type: text/csv`, valid CSV header and rows.
- **Actual Result:** Valid CSV streamed with headers: Order ID, Order Number, Date, Status, Total, Payment.
- **Status:** **PASS**

---

### TC-19: Restaurant Settings Persistence
- **Module:** System Settings
- **Objective:** Ensure business profile and tax rate changes persist to MySQL and update globally.
- **Preconditions:** Authenticated as Admin.
- **Test Steps:**
  1. Send `PUT /api/settings` with updated restaurant name and tax rate.
  2. Send `GET /api/settings` to verify persistence.
- **Expected Result:** Updated values saved in `restaurant_settings` table.
- **Actual Result:** Values verified and dynamically reflected on receipts and navbar.
- **Status:** **PASS**

---

### TC-20: Full-Stack Static Production Serving
- **Module:** System Deployment
- **Objective:** Verify the Node/Express backend serves the built React SPA on `/`.
- **Preconditions:** Frontend bundled into `frontend/dist`.
- **Test Steps:**
  1. Send `GET /` to `http://localhost:5000/`.
- **Expected Result:** HTTP 200 OK, `index.html` delivered with bundled assets.
- **Actual Result:** HTTP 200 OK, SPA rendered cleanly on port 5000.
- **Status:** **PASS**
