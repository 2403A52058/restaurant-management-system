# System Design Diagrams

This document provides formal architectural and behavioral diagrams modeled with standard Mermaid specification for the **Restaurant Management System**.

---

## 1. System Architecture Diagram
The architecture is structured across three decoupled tiers: Presentation Layer, Application Layer, and Database Layer.

```mermaid
flowchart TD
    subgraph Client["Client Tier (Browser)"]
        UI["React 18 + Vite SPA"]
        TW["Tailwind CSS UI Theme"]
        RC["Recharts & Lucide Icons"]
        CTX["Auth & Theme Context"]
    end

    subgraph Server["Application Tier (Node.js & Express)"]
        API["Express REST API (Port 5000)"]
        AUTH["JWT & bcrypt Authentication Middleware"]
        RBAC["Role-Based Access Control"]
        CTRL["Module Controllers"]
        VALID["Input Validation & Error Handler"]
    end

    subgraph Data["Data Tier (MySQL Relational DB)"]
        ORM["Prisma ORM Client"]
        MYSQL[("MySQL Database (Port 3306)")]
        T_USERS["users, roles, employees"]
        T_MENU["categories, menu_items"]
        T_ORDERS["tables, reservations, orders, order_items"]
        T_FINANCE["payments, invoices"]
        T_STOCK["ingredients, suppliers, inventory_transactions"]
    end

    UI --> |"HTTP / REST JSON (Axios)"| API
    API --> AUTH
    AUTH --> RBAC
    RBAC --> CTRL
    CTRL --> ORM
    ORM --> |"Connection Pool"| MYSQL
    MYSQL --> T_USERS
    MYSQL --> T_MENU
    MYSQL --> T_ORDERS
    MYSQL --> T_FINANCE
    MYSQL --> T_STOCK
```

---

## 2. Use Case Diagram
Illustrates primary user actors (Admin, Manager, Chef, Waiter, Cashier) interacting with core system capabilities.

```mermaid
flowchart LR
    Admin(["Administrator"])
    Manager(["Floor Manager"])
    Chef(["Chef / Cook"])
    Waiter(["Waiter / Server"])
    Cashier(["Cashier"])

    subgraph RMS["Restaurant Management System"]
        UC1(["Manage Users & Roles"])
        UC2(["View Executive Telemetry & Reports"])
        UC3(["Manage Menu & Categories"])
        UC4(["Allocate Tables & Status"])
        UC5(["Manage Reservations (Conflict-Free)"])
        UC6(["Create & Update Food Orders"])
        UC7(["Kitchen Display & Prep Tracking"])
        UC8(["Generate Invoices & Process Payments"])
        UC9(["Track Raw Inventory & Stock Alerts"])
        UC10(["Customer CRM & Order History"])
        UC11(["Export Sales CSV"])
    end

    Admin --> UC1
    Admin --> UC2
    Admin --> UC3
    Admin --> UC4
    Admin --> UC9
    Admin --> UC11

    Manager --> UC2
    Manager --> UC3
    Manager --> UC4
    Manager --> UC5
    Manager --> UC6
    Manager --> UC8
    Manager --> UC9
    Manager --> UC10

    Chef --> UC3
    Chef --> UC7
    Chef --> UC9

    Waiter --> UC4
    Waiter --> UC5
    Waiter --> UC6
    Waiter --> UC10

    Cashier --> UC6
    Cashier --> UC8
    Cashier --> UC10
```

---

## 3. Entity-Relationship (ER) Diagram
A complete, normalized relational data model depicting all 15 MySQL tables with primary keys, foreign keys, and relationships.

```mermaid
erDiagram
    ROLES ||--o{ USERS : "assigned to"
    ROLES ||--o{ EMPLOYEES : "categorizes"
    USERS ||--o| EMPLOYEES : "identifies"
    USERS ||--o{ INVOICES : "generates"

    CUSTOMERS ||--o{ RESERVATIONS : "books"
    CUSTOMERS ||--o{ ORDERS : "places"

    RESTAURANT_TABLES ||--o{ RESERVATIONS : "allocated to"
    RESTAURANT_TABLES ||--o{ ORDERS : "hosts"

    CATEGORIES ||--o{ MENU_ITEMS : "groups"

    ORDERS ||--|{ ORDER_ITEMS : "contains"
    MENU_ITEMS ||--o{ ORDER_ITEMS : "selected in"

    EMPLOYEES ||--o{ ORDERS : "attends"

    ORDERS ||--o| INVOICES : "billed via"
    ORDERS ||--o{ PAYMENTS : "settled with"

    INGREDIENTS ||--o{ INVENTORY_TRANSACTIONS : "modified by"
    SUPPLIERS ||--o{ INVENTORY_TRANSACTIONS : "fulfilled by"

    ROLES {
        int id PK
        varchar name UK
        varchar description
        text permissions
    }

    USERS {
        int id PK
        int role_id FK
        varchar username UK
        varchar email UK
        varchar password_hash
        boolean is_active
        datetime last_login
    }

    EMPLOYEES {
        int id PK
        int user_id FK
        int role_id FK
        varchar first_name
        varchar last_name
        varchar email UK
        varchar phone
        decimal salary
        datetime hire_date
        varchar status
    }

    CUSTOMERS {
        int id PK
        varchar name
        varchar email
        varchar phone
        varchar address
        int loyalty_points
    }

    CATEGORIES {
        int id PK
        varchar name UK
        varchar description
        text image_url
        boolean is_active
    }

    MENU_ITEMS {
        int id PK
        int category_id FK
        varchar name
        text description
        decimal price
        decimal cost_price
        text image_url
        boolean is_available
        int preparation_time
        boolean is_veg
    }

    RESTAURANT_TABLES {
        int id PK
        varchar table_number UK
        int seating_capacity
        varchar location
        varchar status
    }

    RESERVATIONS {
        int id PK
        int customer_id FK
        int table_id FK
        datetime reservation_date
        varchar time_slot
        int guest_count
        varchar status
        text special_requests
    }

    ORDERS {
        int id PK
        varchar order_number UK
        int table_id FK
        int customer_id FK
        int employee_id FK
        varchar order_type
        varchar status
        decimal subtotal
        decimal tax_amount
        decimal discount_amount
        decimal total_amount
        text notes
    }

    ORDER_ITEMS {
        int id PK
        int order_id FK
        int menu_item_id FK
        int quantity
        decimal unit_price
        decimal subtotal
        varchar notes
        varchar status
    }

    PAYMENTS {
        int id PK
        int order_id FK
        varchar payment_method
        decimal amount
        varchar status
        varchar transaction_id
        datetime paid_at
    }

    INVOICES {
        int id PK
        varchar invoice_number UK
        int order_id FK
        varchar customer_name
        varchar customer_phone
        decimal subtotal
        decimal tax_rate
        decimal tax_amount
        decimal discount_amount
        decimal total_amount
        varchar payment_status
        int generated_by FK
    }

    INGREDIENTS {
        int id PK
        varchar name UK
        varchar category
        decimal current_stock
        varchar unit
        decimal min_threshold
        decimal unit_cost
    }

    SUPPLIERS {
        int id PK
        varchar name
        varchar contact_person
        varchar email
        varchar phone
        varchar address
        varchar supplied_items
        boolean is_active
    }

    INVENTORY_TRANSACTIONS {
        int id PK
        int ingredient_id FK
        int supplier_id FK
        varchar type
        decimal quantity
        decimal unit_cost
        decimal total_cost
        text notes
        datetime created_at
    }
```

---

## 4. Data Flow Diagrams (DFD)

### 4.1 Level 0 Context Diagram
Depicts the high-level boundaries between external actors and the restaurant management core process.

```mermaid
flowchart TD
    Guest["Guest / Customer"]
    Staff["Front-of-House (Waiter / Cashier)"]
    Kitchen["Back-of-House (Chef)"]
    AdminActor["Manager / Administrator"]

    System(("0.0 Restaurant Management System"))

    Guest --> |"Reservation request, order choices, tender payment"| System
    System --> |"Booking confirmation, itemized bill receipt"| Guest

    Staff --> |"Table allocations, meal orders, billing settlements"| System
    System --> |"Table occupancy state, unpaid invoice details"| Staff

    System --> |"Real-time kitchen order tickets, order notes"| Kitchen
    Kitchen --> |"Dish preparation status updates (Prep/Ready)"| System

    AdminActor --> |"Menu additions, employee assignments, stock logs"| System
    System --> |"Executive dashboard telemetry, low-stock alerts, CSV"| AdminActor
```

### 4.2 Level 1 Detailed DFD
Details the internal data transformations across distinct subsystem processes and data stores.

```mermaid
flowchart TD
    subgraph Processes
        P1["1.0 User Authentication & Access Control"]
        P2["2.0 Table & Reservation Scheduling"]
        P3["3.0 Order Entry & Kitchen Dispatch"]
        P4["4.0 Point-of-Sale Billing & Settlement"]
        P5["5.0 Inventory Reordering & Stock Control"]
        P6["6.0 Analytics & Report Aggregation"]
    end

    subgraph DataStores[MySQL Relational Stores]
        D_USERS[("users & roles")]
        D_TABLES[("restaurant_tables & reservations")]
        D_MENU[("categories & menu_items")]
        D_ORDERS[("orders & order_items")]
        D_FINANCE[("invoices & payments")]
        D_INVENTORY[("ingredients & suppliers")]
    end

    P1 <--> D_USERS
    P2 <--> D_TABLES
    P3 <--> D_MENU
    P3 <--> D_ORDERS
    P3 --> |"Updates Table State"| D_TABLES
    P4 <--> D_FINANCE
    P4 --> |"Reads Order Total"| D_ORDERS
    P4 --> |"Frees Table to Available"| D_TABLES
    P5 <--> D_INVENTORY
    P6 --> |"Reads Sales Data"| D_FINANCE
    P6 --> |"Reads Order Stats"| D_ORDERS
```
