# Software Requirements Specification (SRS)

## 1. Introduction
### 1.1 Purpose
This document specifies the software requirements for the **Restaurant Management System (Le Petit Gourmet)**, developed for the Software Engineering and System Design academic project. It details the functional, non-functional, database, and architectural specifications required to build, evaluate, and maintain the system.

### 1.2 Scope
The system is an enterprise web application that manages dining operations, table bookings, food orders, kitchen dispatching, customer relationship management, point-of-sale billing, staff rosters, inventory tracking, and managerial reporting.

### 1.3 Intended Audience
- Software Engineering Faculty & Project Examiners
- Academic Developers & System Architects
- Restaurant Operations Managers and Front-of-House / Back-of-House Staff

---

## 2. Overall Description
### 2.1 Product Perspective
The system operates on a 3-tier client-server paradigm:
1. **Presentation Layer:** Single Page Application (SPA) built using React.js 18, Vite, and Tailwind CSS.
2. **Application Layer:** Express.js REST API providing business logic, authentication filters, and request validation.
3. **Data Layer:** Normalized MySQL relational database accessed via the Prisma Object-Relational Mapper (ORM).

### 2.2 User Classes & Characteristics
| Role | Access Level | Description |
| :--- | :--- | :--- |
| **Admin** | Unrestricted (`ALL`) | Full administrative authority across settings, staff, finances, and catalog. |
| **Manager** | Operational Management | Oversees floor tables, reservations, orders, billing, and reports. |
| **Chef** | Kitchen & Inventory | Manages kitchen order tickets, dish readiness, and pantry stock levels. |
| **Waiter** | Front of House | Enters customer orders, table seatings, and guest reservations. |
| **Cashier** | Point-of-Sale Checkout | Generates invoices, applies discounts, records tender payments, prints receipts. |

---

## 3. Functional Requirements (FR)

### Module 1: Authentication & Authorization (FR-1)
- **FR-1.1:** The system shall authenticate users using username/email and password credentials.
- **FR-1.2:** The system shall securely hash all passwords using the `bcrypt` algorithm with a salt work factor $\ge 10$.
- **FR-1.3:** The system shall issue a signed JSON Web Token (JWT) upon successful authentication containing user identity and role claims.
- **FR-1.4:** The system shall protect private endpoints using middleware that verifies token validity and enforces role-based access control.

### Module 2: Admin Dashboard & Telemetry (FR-2)
- **FR-2.1:** The dashboard shall calculate and display aggregate gross revenue, orders count, total customers, available tables, and low-stock alerts.
- **FR-2.2:** The system shall render time-series bar charts showing daily sales for the past 7 days.
- **FR-2.3:** The system shall render area charts showing monthly sales trends for the past 6 months.
- **FR-2.4:** The system shall render categorical breakdown pie charts depicting revenue contributions per menu section.
- **FR-2.5:** The system shall stream the latest incoming and active food orders in real-time.

### Module 3: Menu & Catalog Management (FR-3)
- **FR-3.1:** The system shall support CRUD operations for food categories and menu items.
- **FR-3.2:** Each menu item shall store name, category ID, description, price, cost price, image URL, availability status, preparation time (mins), and vegetarian flag.
- **FR-3.3:** The system shall provide full-text searching and dynamic filtering by category and dietary classification.
- **FR-3.4:** Staff shall be able to toggle item availability (`Available` vs `Sold Out`) in a single click.

### Module 4: Table & Floor Layout Management (FR-4)
- **FR-4.1:** The system shall maintain restaurant tables with unique table numbers, seating capacities (2-12), dining locations (e.g., Main Hall, Patio, Rooftop, VIP), and statuses (`AVAILABLE`, `RESERVED`, `OCCUPIED`).
- **FR-4.2:** The floor visualizer shall display the active order number and party size for occupied tables.
- **FR-4.3:** Table status shall update dynamically based on order creation and invoice settlement.

### Module 5: Reservation Management (FR-5)
- **FR-5.1:** Staff shall record customer bookings with date, time slot, allocated table, guest party size, and special requests.
- **FR-5.2 (Conflict Prevention):** The system shall strictly prevent duplicate or overlapping reservations for the same table on the same date and time slot.
- **FR-5.3:** Staff shall transition reservation status between `PENDING`, `CONFIRMED`, `COMPLETED`, and `CANCELLED`.

### Module 6: Food Order Processing (FR-6)
- **FR-6.1:** Staff shall create orders associated with tables (Dine-in) or marked as Takeaway/Delivery.
- **FR-6.2:** An order shall accommodate multiple menu items with adjustable quantities and custom preparation notes (e.g., "Medium-rare", "Extra aioli").
- **FR-6.3:** The system shall automatically calculate subtotal, sales tax (5% GST), discounts, and gross amount.
- **FR-6.4:** Placing a dine-in order shall immediately transition the assigned table status to `OCCUPIED`.

### Module 7: Kitchen Display System - KDS (FR-7)
- **FR-7.1:** The KDS shall display active tickets in `PENDING`, `PREPARING`, and `READY` states.
- **FR-7.2:** Tickets shall display elapsed preparation minutes with color-coded ticket aging alerts.
- **FR-7.3:** Kitchen staff shall be able to toggle individual dish readiness checkboxes and advance ticket states.

### Module 8: Billing, POS & Payment Settlement (FR-8)
- **FR-8.1:** The system shall generate itemized invoices with unique identifiers (`INV-YYYY-XXXX`).
- **FR-8.2:** The system shall accept payments via `CASH`, `CARD`, and `UPI` tender methods.
- **FR-8.3:** Settling an invoice shall mark the order as `SERVED`, invoice as `PAID`, and release the associated table back to `AVAILABLE`.
- **FR-8.4:** The system shall format customer receipts optimized for thermal printers and standard paper printing (`@media print`).

### Module 9: Customer CRM & Loyalty Tracking (FR-9)
- **FR-9.1:** The system shall maintain customer profiles with phone numbers, emails, addresses, and loyalty points.
- **FR-9.2:** The system shall provide an audit drawer displaying complete past order and reservation histories per customer.

### Module 10: Personnel & Role Administration (FR-10)
- **FR-10.1:** Administrators shall manage employees, assign salaries, set hire dates, and allocate system roles.
- **FR-10.2:** Administrators shall toggle employee account status between `ACTIVE` and `TERMINATED`.

### Module 11: Inventory Control & Supplier Tracking (FR-11)
- **FR-11.1:** The system shall track raw ingredients with unit metrics (kg, g, l, pcs), unit costs, and current stock balances.
- **FR-11.2:** The system shall raise low-stock alert notifications whenever current stock drops $\le$ minimum threshold.
- **FR-11.3:** The system shall record purchase, usage, and spoilage inventory transactions and automatically compute new balance levels.

### Module 12: Business Intelligence & CSV Reporting (FR-12)
- **FR-12.1:** The system shall compute gross sales, order completion rates, and average ticket values.
- **FR-12.2:** The system shall generate a ranked list of top-selling dishes by volume and gross revenue.
- **FR-12.3:** The system shall generate and stream a RFC 4180-compliant downloadable CSV file of all transaction logs.

---

## 4. Non-Functional Requirements (NFR)

### 4.1 Security Requirements
- **NFR-1.1:** Passwords shall be salted and hashed using bcrypt before persistent storage in MySQL.
- **NFR-1.2:** All API endpoints processing financial or administrative data must enforce Bearer JWT verification.
- **NFR-1.3:** The system shall prevent SQL injection attacks through Prisma ORM parameterized query abstractions.

### 4.2 Performance Requirements
- **NFR-2.1:** Standard API responses for dashboard telemetry, menu items, and tables shall execute in $< 150\text{ ms}$ under local database conditions.
- **NFR-2.2:** The Single Page Application shall achieve a First Contentful Paint (FCP) of $< 1.0\text{ s}$.

### 4.3 Reliability & Data Integrity
- **NFR-3.1:** Database foreign keys must strictly maintain referential integrity with appropriate `ON DELETE` rules (CASCADE, RESTRICT, SET NULL).
- **NFR-3.2:** Financial payments and stock updates shall execute inside ACID-compliant database transactions (`prisma.$transaction`).

### 4.4 Usability & Aesthetics
- **NFR-4.1:** The user interface shall adhere to the defined palette: dark charcoal background (`#141418`), warm cream typography (`#fffef9`), deep orange accents (`#ea580c`), and warm gold accents (`#eab308`).
- **NFR-4.2:** The web interface shall be fully responsive across mobile, tablet, and desktop viewports.
