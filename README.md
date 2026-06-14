# HealthSurya

Healthcare super app for patients, labs, doctors, and partners — **https://healthsurya.com**

Tech Stack: **Next.js 15 (Turbopack)**, **React 19**, **Supabase**, **Clerk**, **Tailwind CSS 4**, **Sentry**, **PostHog**.

---

## 1. Local Development

1. Install [Node.js 20+](https://nodejs.org/).
2. Copy the environment template and configure your keys:
   - Duplicate `.env.local` (or configure it if already present).
   - Enter your Supabase and Clerk configuration keys.
3. Install dependencies and run the development server:

   ```bash
   npm install
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 2. Environment Variables Checklist

Configure these in `.env.local` for local development, or in your deployment dashboard (e.g. Vercel Environment Variables) for production.

### Public Client-Side (Prefix with `NEXT_PUBLIC_`)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (e.g. `https://rmwhktervlgrslcgxyvk.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous public key (safe for browser) |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (e.g. `https://healthsurya.com`) |
| `NEXT_PUBLIC_PREVIEW_LISTINGS` | Enable preview mock listing data (`true` or `false`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk authentication publishable key |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN URL for client-side monitoring |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog API Key for product analytics tracking |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog Host (default: `https://us.i.posthog.com`) |

### Private Server-Side (Never expose to browser)

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin API key — bypasses Row Level Security (RLS) |
| `CLERK_SECRET_KEY` | Clerk server-side secret API key |
| `CLERK_WEBHOOK_SECRET` | Secret key used to verify incoming Clerk webhooks |
| `RAZORPAY_KEY_ID` | Razorpay API key ID for payments |
| `RAZORPAY_KEY_SECRET` | Razorpay API key secret for payments |
| `RAZORPAY_WEBHOOK_SECRET` | Secret key used to verify Razorpay webhooks |
| `META_WHATSAPP_TOKEN` | Meta Developer Token for WhatsApp business cloud API |
| `META_WHATSAPP_PHONE_NUMBER_ID` | Meta Phone Number ID for sending WhatsApp messages |
| `AI_VERIFICATION_API_KEY` | Document verification AI secret key |
| `AI_VERIFICATION_API_URL` | OpenAI-compatible endpoint for document verification AI |
| `SENTRY_AUTH_TOKEN` | Auth token used by the Sentry CLI to upload source maps during Vercel builds |

---

## 3. Demo Users (Staging & Local Dev Only)

> [!WARNING]
> Do not use these passwords in production. Delete or rotate these test accounts before go-live.

### Login Credentials

#### Patients
| Name         | Email                         | Password    | User ID                                  |
| ------------ | ----------------------------- | ----------- | ---------------------------------------- |
| Rahul Sharma | rahul.patient@healthsurya.com | Patient@123 | `b1000001-0001-4000-8000-000000000001` |
| Priya Verma  | priya.patient@healthsurya.com | Patient@123 | `b1000002-0001-4000-8000-000000000002` |
| Amit Singh   | amit.patient@healthsurya.com  | Patient@123 | `b1000003-0001-4000-8000-000000000003` |

#### Doctors
| Name             | Email                       | Password   | User ID                                  |
| ---------------- | --------------------------- | ---------- | ---------------------------------------- |
| Dr. Rajesh Gupta | rajesh.doctor@healthsurya.com | Doctor@123 | `c1000001-0001-4000-8000-000000000001` |
| Dr. Neha Kapoor  | neha.doctor@healthsurya.com  | Doctor@123 | `c1000002-0001-4000-8000-000000000002` |
| Dr. Vikram Mehta | vikram.doctor@healthsurya.com | Doctor@123 | `c1000003-0001-4000-8000-000000000003` |

#### Lab Partners
| Name                 | Email                     | Password | User ID                                  |
| -------------------- | ------------------------- | -------- | ---------------------------------------- |
| PathCare Diagnostics | pathcare.lab@healthsurya.com | Lab@123  | `d1000001-0001-4000-8000-000000000001` |
| MedLife Labs         | medlife.lab@healthsurya.com  | Lab@123  | `d1000002-0001-4000-8000-000000000002` |
| City Diagnostics     | city.lab@healthsurya.com     | Lab@123  | `d1000003-0001-4000-8000-000000000003` |

#### Couriers
| Name             | Email                           | Password    | User ID                                  |
| ---------------- | ------------------------------- | ----------- | ---------------------------------------- |
| Ravi Delivery    | ravi.courier@healthsurya.com    | Courier@123 | `e1000001-0001-4000-8000-000000000001` |
| Express Pickup   | express.courier@healthsurya.com | Courier@123 | `e1000002-0001-4000-8000-000000000002` |
| Health Logistics | logistics.courier@healthsurya.com | Courier@123 | `e1000003-0001-4000-8000-000000000003` |

#### Admins (use `admin` role in database)
| Name             | Email                   | Password   | User ID                                  |
| ---------------- | ----------------------- | ---------- | ---------------------------------------- |
| Suraj Tiwari     | admin@healthsurya.com   | Admin@123  | `f1000001-0001-4000-8000-000000000001` |
| Operations Admin | operations@healthsurya.com | Ops@123    | `f1000002-0001-4000-8000-000000000002` |
| Support Admin    | support@healthsurya.com | Support@123 | `f1000003-0001-4000-8000-000000000003` |

---

## 4. Production Deployment Guide

Deploy HealthSurya using the following target architecture mapping:

### 1. Frontend & Backend API (Vercel)
Next.js server-side pages and API routes compile automatically to Vercel Serverless Functions.
1. Connect your Github repository to [Vercel](https://vercel.com).
2. Set **Framework Preset** to `Next.js`.
3. Add the required client-side and server-side variables under the **Environment Variables** tab.
4. Push to production branch to build and launch.

### 2. Database & Storage (Supabase)
1. In the Supabase project dashboard, run the SQL migrations from the `supabase/migrations/` folder.
2. Confirm that **Row Level Security (RLS)** is enabled on all tables.
3. In **Storage**, create a private bucket named `verifications`. Create an RLS policy allowing authenticated profile owners to insert documents, and profile owners/admins to read them.
4. Copy the Supabase Project URL (`SUPABASE_URL`) and Anon Key (`SUPABASE_ANON_KEY`) to Vercel environment variables.

### 3. Authentication (Clerk)
1. Go to the [Clerk Dashboard](https://clerk.com) and create a production application.
2. In Clerk, go to **User & Organization → Metadata** to create custom JWT template claims. Ensure `role`, `verification_status`, and `is_active` fields are mapped to custom session tokens.
3. Configure the webhook destination `/api/webhooks/clerk` in Clerk for the `user.created`, `user.updated`, and `user.deleted` events. Copy the generated Webhook Secret (`CLERK_WEBHOOK_SECRET`) to Vercel.

### 4. Payments (Razorpay)
1. Register on the [Razorpay Dashboard](https://razorpay.com).
2. Generate API Keys (`RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`) and paste them in Vercel settings.
3. Configure webhooks on Razorpay and point the URL to `/api/webhooks/razorpay`. Add the signature verification secret (`RAZORPAY_WEBHOOK_SECRET`) to Vercel.

### 5. WhatsApp Alerts (Meta WhatsApp API)
1. Set up a developer account on [Meta Developers](https://developers.facebook.com) and link your WhatsApp Business Profile.
2. Generate a permanent System User Access Token (`META_WHATSAPP_TOKEN`) and find your phone number ID (`META_WHATSAPP_PHONE_NUMBER_ID`).
3. Add both variables to Vercel to allow sending automated alerts when test bookings or orders are placed.

### 6. Error Monitoring (Sentry)
Sentry will track error boundary logs and backend function crashes.
1. Create a project in [Sentry](https://sentry.io).
2. Retrieve the `SENTRY_DSN` and set it as `NEXT_PUBLIC_SENTRY_DSN` on Vercel.
3. Generate a `SENTRY_AUTH_TOKEN` from Sentry User Settings and add it to Vercel to allow automated source map uploads during builds.

### 7. Product Analytics (PostHog)
PostHog tracks pageviews and patient click events to understand UX dropoffs.
1. Log in to [PostHog](https://posthog.com) and create a project.
2. Copy the API Key and host URL, setting them on Vercel as `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`.

---

## 5. Pre-Launch QA Checklist
- [ ] Verify homepage showcase lists doctors and labs without hydration mismatch.
- [ ] Confirm patient, doctor, and lab signup flow via Clerk.
- [ ] Test the lab test booking flow.
- [ ] Test the doctor mini-website appointments scheduling flow.
- [ ] Verify the admin panel verification page (`/admin/verifications`) operates correctly.
- [ ] Confirm all legal and compliance pages are present (`/legal/*`).
- [ ] Ensure HTTPS is enforced across the production domain.
