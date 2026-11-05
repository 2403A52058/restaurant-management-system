# 24/7 Free Cloud Deployment Guide
## Telangana Ruchulu — Restaurant Management System

This guide explains how to host your entire project on **100% Free Cloud Hosting** so that the website stays live **24 hours a day, 7 days a week, 365 days a year**, accessible from any mobile phone or laptop even when your own computer is **completely shut down**.

---

## 🏗️ Architecture in the Cloud

```
                                  [Any Web Browser / Mobile Phone / Examiner]
                                                      │
                                                      ▼
                      ┌───────────────────────────────────────────────────────────────┐
                      │                 RENDER.COM (FREE WEB SERVICE)                 │
                      │                                                               │
                      │  Frontend (React SPA) ─────────► Express REST API (/api/*)    │
                      │  https://telangana-ruchulu.onrender.com                       │
                      └───────────────────────────────┬───────────────────────────────┘
                                                      │
                                             Prisma ORM (Encrypted TLS)
                                                      │
                                                      ▼
                                       ┌─────────────────────────────┐
                                       │   TIDB CLOUD / AIVEN MYSQL  │
                                       │    Free 24/7 Cloud MySQL    │
                                       │    15 Relational Tables     │
                                       └─────────────────────────────┘
```

---

## ⚡ 3 Simple Steps to Deploy (Takes ~10 Minutes)

### Step 1: Push Your Code to GitHub (Free)

1. Open your browser and go to [github.com](https://github.com/) (Sign in or sign up).
2. Click the **`+`** icon in the top right > **New repository**.
3. Name the repository: `restaurant-management-system`.
4. Leave it **Public**, do NOT check "Add a README" (your project already has everything), and click **Create repository**.
5. Copy the repository URL (e.g., `https://github.com/YOUR_USERNAME/restaurant-management-system.git`).
6. In your VS Code terminal, run these 3 commands:
   ```powershell
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/restaurant-management-system.git
   git push -u origin main
   ```
   *(If prompted, sign in to your GitHub account).*

---

### Step 2: Create a Free 24/7 Cloud MySQL Database

We recommend **TiDB Cloud** (Free forever, MySQL-compatible, zero credit card needed):

1. Go to [tidbcloud.com](https://tidbcloud.com/) and click **Start for Free** (Sign in with Google or GitHub).
2. Click **Create Cluster** > Select **Serverless (Free)**.
3. Choose your region (e.g., `AWS / us-east-1` or `Singapore`) > Click **Create**.
4. In your TiDB dashboard, click **Connect**:
   - Choose **Prisma** or **General**.
   - Copy the connection string. It looks like:
     ```text
     mysql://username:password@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/restaurant_db?sslaccept=strict
     ```
5. In your local `backend/.env` file, temporarily update `DATABASE_URL` with this cloud connection string, then run this in VS Code terminal to initialize the tables and seed the 34 Telangana dishes:
   ```powershell
   cd backend
   npx prisma db push
   node prisma/seed.js
   cd ..
   ```
   *(All 15 tables, 34 dishes, admin accounts, and tables are now stored 24/7 in the cloud!)*

---

### Step 3: Deploy the Full-Stack Web App on Render.com (Free)

Render will build both your React frontend and Express backend, and host them together under a single live URL:

1. Go to [render.com](https://render.com/) and click **Get Started for Free** (Sign in with GitHub).
2. Click **New +** > Select **Web Service**.
3. Click **Connect repository** and select your `restaurant-management-system` repo.
4. Fill in the settings:
   - **Name:** `telangana-ruchulu` (or any name you like)
   - **Region:** Any (e.g., Singapore or Frankfurt)
   - **Branch:** `main`
   - **Root Directory:** *(leave blank)*
   - **Runtime:** `Node`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Plan:** `Free` ($0/month)
5. Scroll down to **Environment Variables** and add:
   - `DATABASE_URL`: *(Paste your TiDB Cloud MySQL connection string from Step 2)*
   - `JWT_SECRET`: `telangana_jwt_super_secret_key_2026`
   - `NODE_ENV`: `production`
6. Click **Create Web Service**.

Render will now:
- Install packages
- Generate Prisma Client
- Compile Vite React production assets into `frontend/dist`
- Start the server on port 10000

---

## 🏆 The Result

When the deployment finishes (takes ~3 minutes), Render will give you a permanent live public URL, for example:

```text
https://telangana-ruchulu.onrender.com
```

### What You Can Now Do:
* **Shut down your laptop completely and pack it in your bag.**
* Open `https://telangana-ruchulu.onrender.com` on your **mobile phone, tablet, or college computer**.
* Send the link via WhatsApp or email to your **teacher / "mam"** or external examiner.
* The website, menu items, table reservations, orders, and database will remain active **24 hours a day, 7 days a week, forever**!
