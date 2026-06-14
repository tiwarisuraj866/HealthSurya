# 🚀 HealthSurya — Complete Launch Guide
### Version 1.4 | Stack: Next.js + Vercel + Supabase + Clerk + Razorpay + Meta WhatsApp

---

## 📋 Table of Contents
1. [What Was Fixed & Added](#1-what-was-fixed--added)
2. [Accounts You Need to Create](#2-accounts-you-need-to-create)
3. [Step-by-Step Setup](#3-step-by-step-setup)
4. [Environment Variables](#4-environment-variables)
5. [Database Setup (Supabase)](#5-database-setup-supabase)
6. [Razorpay Payment Setup](#6-razorpay-payment-setup)
7. [Meta WhatsApp API Setup](#7-meta-whatsapp-api-setup)
8. [Clerk Authentication Setup](#8-clerk-authentication-setup)
9. [Deploy to Vercel](#9-deploy-to-vercel)
10. [Post-Launch Checklist](#10-post-launch-checklist)

---

## 1. What Was Fixed & Added

### 🔒 Security Fixes
- **Content Security Policy updated** to include Razorpay checkout, Meta Graph API, PostHog, and Sentry
- All API routes already use server-side auth (`auth()` from Clerk) — no API keys exposed to browser

### 💳 Razorpay Payments (NEW — 3 files added)
| File | Purpose |
|------|---------|
| `src/app/api/payments/create-order/route.ts` | Creates Razorpay order (backend only) |
| `src/app/api/payments/verify/route.ts` | Verifies payment signature after checkout |
| `src/app/api/webhooks/razorpay/route.ts` | Handles Razorpay webhook events |

### 📱 Meta WhatsApp API (NEW — 2 files added)
| File | Purpose |
|------|---------|
| `src/app/api/whatsapp/send/route.ts` | Sends WhatsApp template messages (server-only) |
| `src/app/api/webhooks/whatsapp/route.ts` | Receives inbound messages and status updates |

### 🏥 Health Check (NEW)
| File | Purpose |
|------|---------|
| `src/app/api/health/route.ts` | `/api/health` endpoint for uptime monitoring |

### 🛡️ Rate Limiting (NEW)
| File | Purpose |
|------|---------|
| `src/lib/rate-limit.ts` | In-memory rate limiter utility for API routes |

### 📄 Configuration Files (NEW)
| File | Purpose |
|------|---------|
| `.env.local.example` | Complete template with all variables documented |

---

## 2. Accounts You Need to Create

Open each link and create a free account:

| Service | Link | What you get |
|---------|------|-------------|
| **Supabase** | https://supabase.com | PostgreSQL database + file storage |
| **Clerk** | https://clerk.com | User authentication |
| **Razorpay** | https://razorpay.com | Payment gateway (India) |
| **Meta for Developers** | https://developers.facebook.com | WhatsApp Business API |
| **Vercel** | https://vercel.com | Free hosting |
| **Sentry** | https://sentry.io | Error monitoring (free tier) |
| **PostHog** | https://posthog.com | Analytics (free tier) |

---

## 3. Step-by-Step Setup

### Step 1 — Install dependencies

```bash
cd Healthsurya_v1.4
npm install
```

### Step 2 — Create environment file

```bash
cp .env.local.example .env.local
```
Then open `.env.local` and fill in each value (see Section 4).

### Step 3 — Set up Supabase database

1. Go to https://supabase.com → New Project
2. Choose region: **Mumbai (ap-south-1)** (closest to India)
3. Note your **Project URL** and **API keys** from Settings → API
4. Run all SQL migrations (see Section 5)

### Step 4 — Set up Clerk

1. Go to https://clerk.com → Create Application
2. Choose: **Email + Phone + Google** sign-in
3. Copy your API keys to `.env.local`
4. Set up JWT template (see Section 8)
5. Set up webhook (see Section 8)

### Step 5 — Set up Razorpay

1. Go to https://razorpay.com → Create Account (requires business PAN/GST)
2. Get API keys from Settings → API Keys
3. Set up webhook (see Section 6)

### Step 6 — Set up Meta WhatsApp

1. Go to https://developers.facebook.com
2. Create App → Business type
3. Add WhatsApp product (see Section 7)

### Step 7 — Deploy to Vercel

See Section 9.

---

## 4. Environment Variables

Copy all these to your `.env.local` file AND to Vercel dashboard:

```env
# Site URL
NEXT_PUBLIC_SITE_URL=https://healthsurya.com

# Supabase (from Supabase Dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  ← NEVER expose this to frontend!

# Clerk (from Clerk Dashboard → API Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

# Razorpay (from Razorpay Dashboard → Settings → API Keys)
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...           ← NEVER expose this to frontend!
RAZORPAY_WEBHOOK_SECRET=...

# Meta WhatsApp (from developers.facebook.com)
META_WHATSAPP_PHONE_NUMBER_ID=...
META_WHATSAPP_ACCESS_TOKEN=EAA... ← NEVER expose this to frontend!
META_WHATSAPP_VERIFY_TOKEN=...    ← Make this any random string
META_APP_SECRET=...

# Sentry (from sentry.io → Project Settings → DSN)
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=sntrys_...

# PostHog (from app.posthog.com → Project Settings)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Internal secret (generate with: openssl rand -hex 32)
INTERNAL_API_SECRET=abc123...

# Preview/demo data toggle
NEXT_PUBLIC_PREVIEW_LISTINGS=false
```

---

## 5. Database Setup (Supabase)

### Run Migrations

Go to **Supabase Dashboard → SQL Editor** and run each migration file in order:

1. `supabase/migrations/20260526063040_*.sql`
2. `supabase/migrations/20260526063100_*.sql`
3. `supabase/migrations/20260531061342_*.sql`
4. `supabase/migrations/20260531120000_medicine_delivery.sql`
5. `supabase/migrations/20260531140000_address_and_fees.sql`
6. `supabase/migrations/20260531160000_doctor_mini_website.sql`
7. `supabase/migrations/20260531180000_premium_listings.sql`
8. `supabase/migrations/20260531200000_preview_seed_jaunpur_thane.sql`
9. `supabase/migrations/20260601120000_demo_role_users.sql`
10. `supabase/migrations/20260606000000_clerk_auth_and_user_mgmt.sql`
11. `supabase/migrations/20260606010000_consent_audit_trail.sql`
12. `supabase/migrations/20260608120000_add_browser_country_consent.sql`
13. `supabase/migrations/20260608130000_add_availability_to_doctors_and_labs.sql`

**Run them in this exact order. Do not skip any.**

### Add Payment Columns

Run this SQL in Supabase SQL Editor after all migrations:

```sql
-- Add Razorpay payment fields to medicine orders and bookings
ALTER TABLE medicine_orders
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
```

### Create Storage Bucket

In Supabase Dashboard → Storage → New Bucket:
- Name: `verifications`
- Public: **No** (private bucket)
- File size limit: 10MB
- Allowed MIME types: `application/pdf, image/jpeg, image/png`

---

## 6. Razorpay Payment Setup

### Get API Keys
1. Login to https://razorpay.com/dashboard
2. Settings → API Keys → Generate Test Key
3. Copy **Key ID** and **Key Secret** to `.env.local`

### Set Up Webhook
1. Razorpay Dashboard → Webhooks → Add New Webhook
2. **Webhook URL:** `https://healthsurya.com/api/webhooks/razorpay`
3. **Secret:** Create a random string and add to `.env.local` as `RAZORPAY_WEBHOOK_SECRET`
4. **Active Events:** Select:
   - `payment.captured`
   - `payment.failed`
   - `refund.processed`

### How Payments Work in the App
When a patient clicks "Pay Online":
1. Frontend calls `POST /api/payments/create-order` → gets `order_id` from backend
2. Razorpay checkout opens in browser (uses `order_id`)
3. Patient pays → Razorpay returns `payment_id` and `signature`
4. Frontend calls `POST /api/payments/verify` → backend verifies signature → marks order as paid
5. Razorpay also sends webhook to `/api/webhooks/razorpay` as backup

### Switch to Live Mode
When ready to accept real payments:
1. Complete Razorpay KYC (business documents required)
2. Replace test keys with live keys in Vercel environment variables

---

## 7. Meta WhatsApp API Setup

### Step 1 — Create Meta App
1. Go to https://developers.facebook.com
2. My Apps → Create App → **Business**
3. App name: "HealthSurya"
4. Add Product → **WhatsApp**

### Step 2 — Get Your Phone Number
1. WhatsApp → Getting Started
2. You get a free test number (valid for development)
3. For production: WhatsApp → Phone Numbers → Add Production Number
4. Copy **Phone Number ID** to `.env.local`

### Step 3 — Get Access Token
1. WhatsApp → Getting Started → Temporary access token (for testing)
2. For production: Create a **System User** and generate a permanent token:
   - Business Manager → Settings → System Users → Add
   - Assign role: Employee
   - Generate Token → Select your app → Give WhatsApp permissions
3. Copy token to `.env.local` as `META_WHATSAPP_ACCESS_TOKEN`

### Step 4 — Set Up Webhook
1. WhatsApp → Configuration → Webhook
2. **Callback URL:** `https://healthsurya.com/api/webhooks/whatsapp`
3. **Verify Token:** Any random string (same as `META_WHATSAPP_VERIFY_TOKEN` in `.env.local`)
4. Subscribe to: `messages`

### Step 5 — Create Message Templates
1. WhatsApp → Message Templates → Create Template
2. Category: **Transactional**
3. Create templates for:
   - `order_confirmation` — "Your order {{1}} has been placed..."
   - `booking_confirmation` — "Your lab test booking {{1}} is confirmed..."
   - `appointment_reminder` — "Reminder: Your appointment with {{1}} is on {{2}}..."

**Note:** Templates must be approved by Meta (usually 1-2 hours).

### How WhatsApp Works in the App
- Only backend (`/api/whatsapp/send`) sends messages — never frontend
- Admin or server actions call this route with `x-internal-secret` header
- Inbound messages are handled at `/api/webhooks/whatsapp`

---

## 8. Clerk Authentication Setup

### Step 1 — Create Clerk App
1. Go to https://clerk.com → Create Application
2. Application Name: "HealthSurya"
3. Sign-in methods: Enable **Email**, **Phone**, **Google**

### Step 2 — Get API Keys
1. API Keys → Copy **Publishable Key** and **Secret Key**

### Step 3 — Set Up JWT Template (IMPORTANT!)
This allows the app to read user role from JWT token (used in middleware):

1. Clerk Dashboard → JWT Templates → New Template
2. Template name: **default**
3. Add this claim:
```json
{
  "metadata": "{{user.public_metadata}}"
}
```
4. Save template

### Step 4 — Set Up Webhook
1. Webhooks → Add Endpoint
2. **URL:** `https://healthsurya.com/api/webhooks/clerk`
3. **Events:** Subscribe to: `user.created`, `user.updated`, `user.deleted`
4. Copy **Signing Secret** to `.env.local` as `CLERK_WEBHOOK_SECRET`

### Step 5 — Configure Redirect URLs
In Clerk Dashboard → Paths:
- Sign-in URL: `/login`
- Sign-up URL: `/register`
- After sign-in: `/dashboard`
- After sign-up: `/dashboard`

---

## 9. Deploy to Vercel

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "HealthSurya v1.4 launch ready"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/healthsurya.git
git push -u origin main
```

### Step 2 — Import to Vercel
1. Go to https://vercel.com → Add New Project
2. Import your GitHub repository
3. Framework: **Next.js** (auto-detected)
4. Root Directory: Leave blank (or `Healthsurya_v1.4` if needed)
5. Click **Deploy** (will fail — you need to add env vars first)

### Step 3 — Add Environment Variables
1. Vercel Project → Settings → Environment Variables
2. Add ALL variables from your `.env.local` file
3. Set environment: **Production** (and Preview if you want)

### Step 4 — Redeploy
1. Vercel Project → Deployments → Redeploy latest

### Step 5 — Set Custom Domain
1. Vercel Project → Settings → Domains
2. Add `healthsurya.com`
3. Update your DNS (see Vercel instructions — usually takes 5-30 minutes)

---

## 10. Post-Launch Checklist

### Before Going Live

- [ ] All 13 database migrations run successfully
- [ ] Payment columns added to medicine_orders and bookings tables
- [ ] Supabase `verifications` storage bucket created (private)
- [ ] Clerk JWT template set up with metadata claim
- [ ] Clerk webhook pointing to production URL
- [ ] Razorpay webhook pointing to production URL
- [ ] Meta WhatsApp webhook verified
- [ ] All environment variables set in Vercel
- [ ] Test a full signup → login flow
- [ ] Test a doctor/lab registration (verification pending flow)
- [ ] Test admin approval in `/admin/verifications`
- [ ] Test medicine order with COD payment
- [ ] Test Razorpay test payment (use test card: 4111 1111 1111 1111)
- [ ] Check Sentry receives a test error
- [ ] Check PostHog receives page views
- [ ] Verify `/api/health` returns `{ "status": "healthy" }`

### After Going Live

- [ ] Set up UptimeRobot (free) to monitor `/api/health` every 5 minutes
  - URL: https://uptimerobot.com
- [ ] Set up Sentry alerts for new errors
- [ ] Switch Razorpay from test to live keys (after KYC)
- [ ] Request Meta template approval for production WhatsApp number
- [ ] Set `NEXT_PUBLIC_PREVIEW_LISTINGS=false` in production

---

## 🆘 Common Problems & Solutions

### "Supabase not configured" error
→ Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in Vercel

### "Clerk webhook failed" 
→ In Clerk Dashboard, make sure the webhook URL is `https://yourdomain.com/api/webhooks/clerk` (exact match, no trailing slash)

### "Payment gateway not configured"
→ Check that `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are set in Vercel environment variables

### WhatsApp messages not sending
→ Make sure your Meta WhatsApp template is **approved** before using it. New templates take 1-2 hours.

### Build fails on Vercel
→ The `next.config.ts` already has `ignoreBuildErrors: true` so TypeScript errors won't block deployment. Check the build log for missing environment variables.

### User created in Clerk but not in Supabase profiles
→ The Clerk webhook creates the profile. Check Clerk Dashboard → Webhooks → Recent Deliveries for errors.

---

## 📞 Architecture Summary

```
Browser/App
    │
    ├─→ Next.js Frontend (Vercel)
    │       │
    │       ├─→ /api/payments/create-order  → Razorpay API
    │       ├─→ /api/payments/verify        → Signature check
    │       ├─→ /api/whatsapp/send          → Meta Graph API
    │       ├─→ /api/upload                 → Supabase Storage
    │       ├─→ /api/consent                → Supabase DB
    │       ├─→ /api/admin/users            → Clerk + Supabase
    │       └─→ /api/webhooks/
    │               ├─→ /clerk             ← Clerk events
    │               ├─→ /razorpay          ← Payment events
    │               └─→ /whatsapp          ← Inbound messages
    │
    ├─→ Supabase PostgreSQL (database)
    ├─→ Supabase Storage (file uploads)
    ├─→ Clerk (authentication)
    └─→ Sentry + PostHog (monitoring)
```

---

*HealthSurya v1.4 — Launch Guide generated June 2026*
