# KodiKart Deployment Guide — ₹0 Total Cost

> Deploy the entire KodiKart marketplace for free using Cloudflare Pages, Render.com, Supabase, Resend.com, and Cloudinary.

---

## Prerequisites — Accounts to Create (All Free)

| Service | Sign-Up URL | Purpose |
|---------|------------|---------|
| GitHub | github.com | Source code + CI/CD |
| Supabase | supabase.com | PostgreSQL database |
| Render.com | render.com | Backend API hosting |
| Cloudflare | cloudflare.com | Frontend hosting |
| Resend.com | resend.com | Email OTP delivery |
| Cloudinary | cloudinary.com | Hen & farm photo storage |
| PhonePe Business | business.phonepe.com | ✅ You already have this |

---

## Step 1: GitHub Repository Setup

```bash
# In your project root (sesd/ folder)
git init
git add .
git commit -m "Initial KodiKart commit"
```

1. Go to **github.com/new**
2. Repository name: `kodikart`
3. Visibility: **Private** (recommended — your code contains business logic)
4. Click **Create repository**

```bash
git remote add origin https://github.com/YOUR_USERNAME/kodikart.git
git branch -M main
git push -u origin main
```

> [!IMPORTANT]
> Never commit `.env` files. The `.gitignore` already excludes them, but double-check with `git status` before every push.

---

## Step 2: Supabase Database Setup (Free PostgreSQL)

1. Go to **supabase.com** → **New Project**
2. Fill in:
   - **Project name:** `kodikart`
   - **Database password:** Create a strong password → **save it somewhere safe**
   - **Region:** `ap-south-1` (Mumbai — lowest latency for India)
3. Click **Create new project** and wait ~2 minutes for initialization
4. In the left sidebar: **Settings → Database → Connection string → URI**
5. Copy the connection string — it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

> [!NOTE]
> Replace `[YOUR-PASSWORD]` with the password you set in step 2. Keep this string secret — it gives full DB access.

---

## Step 3: Run Database Schema & Seed Data

Do this **once from your local machine** (before deploying to Render):

```bash
cd backend

# 1. Set DATABASE_URL in your local .env
# Edit backend/.env and set:
#   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# 2. Push the Prisma schema to Supabase
npx prisma db push

# 3. Seed the database (breeds, admin user, platform settings)
node prisma/seed.js
```

Expected output from seed:
```
✓ Seeded 8 native hen breeds
✓ Created admin user: admin@kodikart.in (phone: 9000000000)
✓ Created platform settings
✓ Database ready!
```

> [!WARNING]
> `npx prisma db push` will create all 17 tables in Supabase. Run it only once. If you re-run seed.js it may try to insert duplicate data — that's fine, it uses upsert.

---

## Step 4: Resend.com Email Setup

1. Go to **resend.com** → **Sign Up** (no credit card required)
2. After sign-up, go to **API Keys → Create API Key**
3. Name it `kodikart-production`, permission: **Full access**
4. Copy the key (starts with `re_...`) — you won't see it again
5. **Domain setup** (optional but recommended for production):
   - Domains → Add Domain → enter `kodikart.in` (or your domain)
   - Add the DNS records Resend shows you to your domain's DNS settings
   - Without a custom domain, Resend sends from `onboarding@resend.dev` (fine for testing)

---

## Step 5: Cloudinary Setup (Photo Storage)

1. Go to **cloudinary.com** → **Sign Up Free**
2. After sign-up, go to **Dashboard**
3. Note down your:
   - **Cloud name**
   - **API Key**
   - **API Secret**
4. Go to **Settings → Upload → Upload presets** → Add upload preset
   - Preset name: `kodikart_hens`
   - Signing Mode: **Signed**
   - Folder: `kodikart/`

---

## Step 6: Render.com Backend Deployment

> [!NOTE]
> Render auto-deploys from GitHub on every push to `main`. You only need to set this up once.

1. Go to **render.com** → **New → Web Service**
2. Click **Connect a repository** → authorize GitHub → select your `kodikart` repo
3. Configure the service:
   | Setting | Value |
   |---------|-------|
   | **Name** | `kodikart-api` |
   | **Root Directory** | `backend` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install && npx prisma generate` |
   | **Start Command** | `npm start` |
   | **Plan** | `Free` |
4. Scroll down to **Environment Variables** → add ALL of these:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `JWT_SECRET` | *(generate below)* |
   | `DATABASE_URL` | *(Supabase connection string from Step 2)* |
   | `RESEND_API_KEY` | *(from Resend dashboard)* |
   | `FROM_EMAIL` | `KodiKart <noreply@kodikart.in>` |
   | `PHONEPE_MERCHANT_ID` | *(from PhonePe Business dashboard)* |
   | `PHONEPE_SALT_KEY` | *(from PhonePe Business API credentials)* |
   | `PHONEPE_SALT_INDEX` | `1` |
   | `PHONEPE_ENV` | `production` |
   | `CLOUDINARY_CLOUD_NAME` | *(from Cloudinary dashboard)* |
   | `CLOUDINARY_API_KEY` | *(from Cloudinary dashboard)* |
   | `CLOUDINARY_API_SECRET` | *(from Cloudinary dashboard)* |
   | `FRONTEND_URL` | `https://kodikart.pages.dev` |
   | `BACKEND_URL` | `https://kodikart-api.onrender.com` |
   | `PORT` | `5000` |

**Generate JWT_SECRET:**
```bash
# On Linux/Mac:
openssl rand -hex 32

# On Windows (PowerShell):
[System.Web.Security.Membership]::GeneratePassword(64, 10)
# OR use: https://generate-secret.vercel.app/32
```

5. Click **Create Web Service** → deployment starts automatically
6. Wait 3–5 minutes for the first build
7. Test your backend: visit `https://kodikart-api.onrender.com/api/health`
   - Expected: `{"status":"ok","timestamp":"...","environment":"production"}`

---

## Step 7: Cloudflare Pages Frontend Deployment

> [!NOTE]
> Cloudflare Pages auto-deploys from GitHub on every push to `main`. Set up once, deploy forever.

1. Go to **dash.cloudflare.com** → **Workers & Pages** → **Create** → **Pages**
2. Click **Connect to Git** → authorize GitHub → select your `kodikart` repo
3. Configure the build:
   | Setting | Value |
   |---------|-------|
   | **Framework preset** | `Vite` |
   | **Build command** | `cd frontend && npm install && npm run build` |
   | **Build output directory** | `frontend/dist` |
4. Under **Environment variables (production)** → add:
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://kodikart-api.onrender.com` |
5. Click **Save and Deploy**
6. Wait 2–3 minutes for the first build
7. Your site is live at: **https://kodikart.pages.dev**
   - Cloudflare gives you a free `.pages.dev` subdomain
   - You can also add a custom domain (e.g. `kodikart.in`) in Pages → Custom Domains

> [!TIP]
> The `frontend/public/_redirects` file ensures React Router works correctly. If you see 404 on page refresh, verify that file exists in your repo.

---

## Step 8: PhonePe Business Configuration

1. Login to **business.phonepe.com**
2. Go to **Developer Settings → API Credentials**
3. Copy:
   - **Merchant ID** (starts with `M...`)
   - **Salt Key**
   - **Salt Index** (usually `1`)
4. Add these to your Render.com environment variables (Step 6, table above)
5. Configure the webhook URL in PhonePe dashboard:
   - Webhook URL: `https://kodikart-api.onrender.com/api/payments/phonepe-webhook`
   - PhonePe will POST payment status updates to this URL

> [!IMPORTANT]
> The webhook signature is verified server-side using SHA-256 HMAC. Never skip this — it prevents fake payment callbacks that could release hens without actual payment.

---

## Step 9: UptimeRobot — Keep Free Tier Alive (Strongly Recommended)

Render.com free tier **spins down** after 15 minutes of inactivity. The first request after sleep takes ~30 seconds (cold start). Supabase free tier **pauses** after 7 days of no activity.

**Fix both with one free monitor:**

1. Go to **uptimerobot.com** → Sign Up Free
2. **Add New Monitor:**
   - Monitor Type: `HTTP(s)`
   - Friendly Name: `KodiKart API Keepalive`
   - URL: `https://kodikart-api.onrender.com/api/health`
   - Monitoring Interval: `Every 10 minutes`
3. Click **Create Monitor**

This single ping every 10 minutes:
- ✅ Keeps Render.com awake (prevents cold starts)
- ✅ Keeps Supabase active (prevents DB pause)
- ✅ Gives you uptime monitoring + email alerts if your API goes down

---

## Step 10: First Login & Admin Setup

Admin credentials (created by `seed.js`):

| Field | Value |
|-------|-------|
| Phone | `9000000000` |
| Email | `admin@kodikart.in` |
| Role | Admin |

1. Open **https://kodikart.pages.dev/login**
2. Enter phone `9000000000` and email `admin@kodikart.in`
3. Check `admin@kodikart.in` inbox for the OTP email
4. Enter the 6-digit OTP → you're logged in as Super Admin

> [!CAUTION]
> Change the admin email immediately after first login to your real email address. The seed email `admin@kodikart.in` is public in this repo.

---

## Step 11: Google Search Console — SEO (Optional)

1. Go to **search.google.com/search-console** → Add Property
2. URL prefix: `https://kodikart.pages.dev`
3. Verify ownership via:
   - **HTML meta tag**: add to `frontend/index.html` → push to GitHub → auto-deploys
   - **DNS**: add TXT record in your Cloudflare dashboard
4. Submit sitemap: `https://kodikart.pages.dev/sitemap.xml`

> [!NOTE]
> Google indexing typically takes 1–4 weeks for a new site. It cannot be forced or rushed.

---

## Security Checklist Before Launch

Go through this list before announcing KodiKart to users:

- [ ] `JWT_SECRET` is at least 32 random characters (`openssl rand -hex 32`)
- [ ] `DATABASE_URL` is NOT committed to GitHub (check `git log --all -p | grep DATABASE_URL`)
- [ ] PhonePe Salt Key is NOT committed to GitHub
- [ ] Resend API key is NOT committed to GitHub
- [ ] Admin email/phone changed from seed defaults in production
- [ ] PhonePe webhook URL configured in PhonePe Business dashboard
- [ ] `NODE_ENV=production` on Render.com
- [ ] HTTPS enforced everywhere (Cloudflare and Render both provide free TLS automatically)
- [ ] UptimeRobot monitor is active and sending alerts to your email
- [ ] Supabase row-level security (RLS) reviewed if you enable direct client access

---

## Troubleshooting

### API returns 404 / Cannot connect
- Check Render.com dashboard → Logs tab for errors
- Verify all environment variables are set (NODE_ENV, DATABASE_URL, JWT_SECRET)
- Test health check: `curl https://kodikart-api.onrender.com/api/health`

### Frontend shows blank page / 404 on refresh
- Verify `frontend/public/_redirects` exists and contains `/*    /index.html   200`
- In Cloudflare Pages dashboard → check build logs for errors

### OTP emails not arriving
- Check Resend dashboard → Logs for delivery status
- Verify `RESEND_API_KEY` is set correctly on Render.com
- Check spam folder
- For production: verify your domain on Resend for better deliverability

### PhonePe payment fails
- Verify `PHONEPE_MERCHANT_ID`, `PHONEPE_SALT_KEY`, `PHONEPE_ENV=production` on Render
- Check that webhook URL is registered in PhonePe Business dashboard
- Check Render logs for signature verification errors

### Database connection errors
- Verify Supabase project is not paused (check Supabase dashboard)
- Ensure `DATABASE_URL` on Render includes `?pgbouncer=true&connection_limit=1` for Supabase pooling if needed
- Supabase connection string format: `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres`

### Prisma migration errors on Render build
- The `buildCommand` uses `npx prisma generate` (not `db push`) — this is intentional
- Schema changes must be applied from your local machine via `npx prisma db push`
- Never run `prisma migrate` in production build commands

---

## Cost Summary

| Service | Free Tier Limits | Overage Cost |
|---------|-----------------|-------------|
| Cloudflare Pages | Unlimited requests, 500 builds/month | Upgrade only if >500 builds/month |
| Render.com | 750 hours/month (1 service = always on) | $7/month for always-on |
| Supabase | 500 MB DB, 2 GB bandwidth | $25/month Pro |
| Cloudinary | 25 credits/month (~25 uploads) | $89/month Plus |
| Resend.com | 3,000 emails/month, 100/day | $20/month Pro |
| GitHub | Unlimited public, private repos | Free |
| **Total** | **₹0/month** | Scales with usage |

---

*For questions or issues, check the GitHub Issues tab or the README.*
