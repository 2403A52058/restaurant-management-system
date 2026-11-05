# Project Abstract & Objectives

**Course/Project:** Software Engineering and System Design (Academic Capstone Project)  
**Project Title:** Le Petit Gourmet — Enterprise Restaurant Management & Point-of-Sale System  
**Architecture:** 3-Tier Client-Server Architecture (React/Vite SPA + Node.js/Express REST API + MySQL/Prisma ORM)  

---

## 1. Project Abstract
Traditional restaurant administration frequently relies on disparate, manual, or poorly integrated mechanisms for handling table seatings, food preparation communication, billing calculations, and raw ingredient stock tracking. This fragmented workflow often causes order discrepancies, table turnover delays, billing inaccuracies, food waste due to untracked inventory, and impaired customer satisfaction.

The **Le Petit Gourmet Restaurant Management System** is a unified, full-stack, enterprise-grade web application engineered to digitize and synchronize front-of-house and back-of-house dining operations. Built with a React.js and Tailwind CSS responsive interface, an Express.js modular RESTful backend, and a normalized MySQL relational database managed via Prisma ORM, the platform integrates thirteen core modules: Role-Based Authentication, Real-Time Executive Dashboard, Menu & Dietary Management, Table Seating Visualizer, Conflict-Free Reservations, Multi-Item Order Processing, Kitchen Display System (KDS), POS Billing with Multi-Tender Payments (Cash, Card, UPI) and Thermal Receipt Generation, Customer CRM with Loyalty Points, Employee Roster & Role Security, Ingredient Inventory with Automated Low-Stock Reorder Triggers, and Sales Analytics with CSV Export.

---

## 2. Problem Statement
Hospitality and dining establishments encounter several acute operational challenges:
1. **Communication Lag Between Floor & Kitchen:** Handwritten food tickets result in lost orders, legibility errors, lack of preparation time tracking, and uncoordinated dish delivery.
2. **Reservation Overbooking & Table Conflicts:** Manual paper registers fail to prevent overlapping guest bookings for identical table slots, leading to customer disputes and seated capacity inefficiencies.
3. **Inefficient Checkout & Invoicing:** Manual calculation of sales tax (GST/VAT), discretionary discounts, and split payment methods prolongs checkout lines and introduces computational human errors.
4. **Untracked Pantry Inventory:** Failure to correlate meals sold with ingredient consumption leads to unexpected stock-outs of critical raw materials or spoilage from over-purchasing.
5. **Absence of Centralized Analytical Insights:** Restaurant managers lack real-time visibility into day-over-day revenue velocity, dish popularity rankings, and employee shifts, hindering data-driven menu pricing and resource allocation.

---

## 3. Project Objectives
The primary objectives of this software engineering project are:

### Primary Architectural Objectives:
- **Modular 3-Tier Decoupled Architecture:** Build an independently scalable React frontend communicating via typed RESTful JSON APIs with an Express.js backend.
- **Relational Data Integrity:** Design a 3NF normalized MySQL database with 15 interconnected tables using foreign key constraints, unique indexes, and referential actions (CASCADE, SET NULL, RESTRICT).
- **Secure Role-Based Access Control (RBAC):** Implement stateless JWT authentication with bcrypt salted password hashing and granular route middleware guarding ADMIN, MANAGER, CHEF, WAITER, and CASHIER privileges.

### Primary Functional Objectives:
1. **Real-time Kitchen Display System (KDS):** Enable line cooks to view prioritized incoming orders, track elapsed preparation minutes, mark individual dishes as ready, and expedite food delivery.
2. **Conflict-Free Reservation Engine:** Enforce database queries that mathematically prevent duplicate or overlapping bookings for any table on identical dates and time windows.
3. **Automated Order-to-Payment Lifecycle:** Automate table status state machines (`AVAILABLE` $\to$ `OCCUPIED` upon order placement, and `OCCUPIED` $\to$ `AVAILABLE` upon invoice settlement).
4. **Dynamic POS Billing & Receipts:** Generate itemized tax receipts with configurable tax rates (e.g., 5% GST), record multi-tender payments, and format thermal printable bills.
5. **Inventory Automation & Low-Stock Alerts:** Track unit costs and stock levels across raw materials, automatically updating quantities during purchases and highlighting ingredients dropping below safety thresholds.
6. **Executive Business Intelligence:** Provide dynamic data visualizations (Recharts) for sales velocities, category revenue shares, and one-click CSV report exports.
