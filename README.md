# 🐔 KodiKart — Live Native Hens. Direct from Farms.

> **మన నాటి కోళ్లు – మన నమ్మకం**  
> *Our Native Hens — Our Trust*

[![Deploy Status](https://img.shields.io/badge/Frontend-Cloudflare%20Pages-orange)](https://kodikart.pages.dev)
[![Backend](https://img.shields.io/badge/Backend-Render.com-blueviolet)](https://kodikart-api.onrender.com)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## About

**KodiKart** is a multi-vendor marketplace for buying and selling **live native Desi hens** directly from farms in **Telangana & Andhra Pradesh**. Farmers list their hen inventory; customers browse, book, pay a 20% advance online, and collect the hens in person using a secure handover OTP.

No middlemen. No cold storage. Farm-fresh, native breed hens — direct to your doorstep.

---

## User Roles

| Role | Description | Login Method |
|------|-------------|--------------|
| **Customer** | Browse farms, book & pay for hens | Email OTP |
| **Farm Owner** | List farm, add hen inventory, manage bookings | Email OTP |
| **Super Admin** | Verify farms, manage platform settings, view ledgers | Email OTP |

> **No passwords.** Authentication is entirely via 6-digit email OTP (via Resend.com). OTPs are bcrypt-hashed before storage — plaintext is never persisted.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite, React Router v6, TailwindCSS |
| **Backend** | Node.js 20 + Express 4 |
| **Database** | PostgreSQL 15 + Prisma ORM |
| **Payments** | PhonePe Business Payment Gateway |
| **Email** | Resend.com (OTP delivery) |
| **File Storage** | Cloudinary (hen & farm photos) |
| **Frontend Hosting** | Cloudflare Pages (Free) |
| **Backend Hosting** | Render.com (Free) |
| **Database Hosting** | Supabase Free (500 MB PostgreSQL) |

---

## Security Features

- **Email OTP authentication** — no passwords, no SMS dependency
- **Bcrypt OTP hashing** — plaintext OTP never stored in DB
- **JWT with role-based access control** — CUSTOMER / FARM_OWNER / ADMIN
- **PhonePe webhook signature verification** — SHA-256 HMAC, prevents fake payment callbacks
- **Atomic hen reservation** — DB transactions prevent double-booking
- **Max weight enforcement** — 2.5 kg hard cap enforced at both API and DB constraint levels
- **Handover OTP** — 6-digit code sent only to customer's email at pickup time
- **Rate limiting** — OTP requests: 5/15 min; API: 100/15 min; Handover: 3/hour
- **Security headers** — Helmet, CSP, HSTS, X-Frame-Options: DENY, nosniff
- **CORS** — strict allowlist (only frontend origin)
- **Security audit logs** — every OTP request, login, booking and payment is logged with IP + timestamp

---

## Local Development (Quick Start)

### Prerequisites
- Node.js 20+
- PostgreSQL 14+ (local) **or** a Supabase free project
- Git

### Steps

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/kodikart.git
cd kodikart

# 2. Backend setup
cd backend
cp .env.example .env          # fill in your values (see .env.example)
npm install
npx prisma db push            # push schema to your DB
node prisma/seed.js           # seed breeds, admin user, platform settings
npm start                     # starts on http://localhost:5000

# 3. Frontend setup (new terminal)
cd frontend
cp .env.example .env.local    # set VITE_API_URL=http://localhost:5000
npm install
npm run dev                   # starts on http://localhost:3000
```

Open **http://localhost:3000** — login with the seeded admin: `9000000000` / `admin@kodikart.in`

---

## Deployment (₹0)

> See **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** for the full step-by-step guide.

| Service | Purpose | Cost |
|---------|---------|------|
| Cloudflare Pages | Frontend hosting | ₹0 Free |
| Render.com | Backend API hosting | ₹0 Free |
| Supabase | PostgreSQL database | ₹0 Free (500 MB) |
| Cloudinary | Hen/farm image storage | ₹0 Free (25 credits/mo) |
| Resend.com | Email OTP delivery | ₹0 Free (3000/mo) |
| PhonePe Business | Payment gateway | ₹0 (transaction %) |
| GitHub | Source code + CI/CD | ₹0 Free |
| **Total** | | **₹0/month** |

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/request-otp` | Request a 6-digit OTP via email |
| POST | `/api/auth/verify-otp` | Verify OTP → returns JWT |
| GET | `/api/auth/me` | Get current user profile (auth required) |

### Farms
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/farms` | List verified farms (public) |
| GET | `/api/farms/:slug` | Farm detail + inventory (public) |
| POST | `/api/farms` | Create farm (FARM_OWNER) |
| PATCH | `/api/farms/:id` | Update farm info (FARM_OWNER) |

### Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/farms/:farmId/hens` | Add hen to inventory (FARM_OWNER) |
| GET | `/api/farms/:farmId/hens` | List available hens (public) |
| PATCH | `/api/hens/:henId` | Update hen (FARM_OWNER) |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings` | Create booking + reserve hens |
| GET | `/api/bookings/my` | My bookings (CUSTOMER) |
| GET | `/api/bookings/:id` | Booking detail |
| POST | `/api/bookings/:id/handover-otp` | Generate handover OTP (FARM_OWNER) |
| POST | `/api/bookings/:id/complete` | Complete handover with OTP (CUSTOMER) |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/initiate-advance/:bookingId` | Initiate 30% advance via PhonePe |
| POST | `/api/payments/phonepe-webhook` | PhonePe payment callback (webhook) |
| GET | `/api/payments/status/:transactionId` | Check payment status |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Platform stats (ADMIN) |
| PATCH | `/api/admin/farms/:id/verify` | Verify/unverify a farm (ADMIN) |
| GET | `/api/admin/settings` | Platform settings (ADMIN) |

---

## Important Limitations (Free Tier)

| Limitation | Detail | Workaround |
|-----------|--------|-----------|
| **Render cold start** | Backend sleeps after 15 min inactivity; first request takes ~30s | Use UptimeRobot (free) to ping `/api/health` every 10 min |
| **Supabase pause** | DB pauses after 7 days no activity | Same UptimeRobot ping keeps it alive |
| **No SMS OTP** | Email OTP only via Resend.com | Ensure customers use email at registration |
| **Distance calculation** | Haversine (straight-line km), not actual road distance | Acceptable for initial launch |
| **Cloudinary uploads** | 25 credits/month free | Optimize images before upload; upgrade if needed |
| **Resend email** | 3000 emails/month, 100/day | Sufficient for early-stage traffic |

---

## Project Structure

```
kodikart/
├── backend/
│   ├── src/
│   │   ├── app.js                  # Express app setup
│   │   ├── server.js               # HTTP server entry point
│   │   ├── controllers/            # Route handlers
│   │   ├── middleware/             # Auth, rate limiting, validation
│   │   ├── routes/                 # Express routers
│   │   └── utils/                 # OTP, email, commission helpers
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema (17 tables)
│   │   └── seed.js                 # Seed data
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   │   ├── _redirects              # Cloudflare Pages SPA routing
│   │   └── _headers               # Cloudflare Pages security headers
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── main.jsx
│   └── package.json
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions CI/CD
├── render.yaml                     # Render.com deployment config
├── .gitignore
├── README.md
└── DEPLOYMENT_GUIDE.md
```

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request against `main`

**Never commit** `.env` files, secrets, or database credentials.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

*Built with ❤️ for farmers and families of Telangana & Andhra Pradesh.*
