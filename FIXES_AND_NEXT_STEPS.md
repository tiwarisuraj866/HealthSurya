# HealthSurya — Fixes Applied & Launch Next Steps

_Last updated: 2026-06-14_

This document covers (1) what was changed in this pass, (2) the security issues
found and what you must still do, (3) the OTP/login fix and how to finish it in
the Clerk dashboard, and (4) a realistic pre-launch test plan.

---

## 1. Changes applied in this pass

| File | Change | Why |
|------|--------|-----|
| `src/app/register/page.tsx` | Added `<div id="clerk-captcha" />` to the sign-up form | **The OTP blocker.** Clerk's `signUp.create()` runs a bot-protection challenge (Cloudflare Turnstile). With no mount point it falls back to a managed widget that was failing — the `challenges.cloudflare.com … NaN` console errors — which blocked the verification email from ever being sent. |
| `src/app/api/webhooks/clerk/route.ts` | Role from `unsafe_metadata` is now clamped to an allowlist (`patient, doctor, lab, pharmacy, franchise`) | **Privilege escalation fix.** `unsafe_metadata` is fully client-controlled. Before this, a crafted sign-up could request `role: "admin"` and the webhook wrote it straight into the DB. |
| `src/middleware.ts` | Tester bypass (`?tester_key=…` → role cookie) now requires `ENABLE_TESTER_BYPASS=true`; off by default. Also fixed a `Response` type error. | **Auth bypass fix.** The bypass let any request assume any role (incl. admin) with no real login. It is now dead in production unless you explicitly turn it on in staging. |
| `src/app/api/tester/db-query/route.ts` | Endpoint returns 404 unless `ENABLE_TESTER_BYPASS=true` | **Critical.** This route runs arbitrary DB reads/writes with the service-role key (bypasses all row-level security). It must never be reachable in production. |

All four edited files pass `tsc --noEmit`.

> Note: `next.config.ts` has `typescript.ignoreBuildErrors: true` and
> `eslint.ignoreDuringBuilds: true`. That is why the pre-existing type error
> shipped. Consider turning these off and fixing what surfaces before launch —
> they currently let real bugs reach production silently.

---

## 2. Security — you must do these before going live

### 2a. Rotate the leaked secrets (do this first)
The `.env.local` you shared contained live values for:
- `CLERK_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `INTERNAL_API_SECRET`
- `CLERK_WEBHOOK_SECRET`

Treat all four as compromised. Rotate them now:
- **Clerk:** Dashboard → API Keys → roll the Secret Key; re-issue the webhook signing secret.
- **Supabase:** Project Settings → API → roll the `service_role` key.
- **Internal:** generate a new random `INTERNAL_API_SECRET` (`openssl rand -hex 32`).
- Update the new values in Vercel env settings (not in any committed file).

The clean zip I returned does **not** include `.env.local`. Use
`.env.local.example` as the template.

### 2b. Other findings worth fixing (not yet changed — your call)
- **Row-Level Security (RLS):** Confirm RLS is ON for every table in Supabase
  and that the anon key cannot read other users' data. The app uses the
  service-role key server-side, but the public anon key is in the browser.
- **`unsafe_metadata` role on partner sign-up:** partners (`doctor/lab/pharmacy/
  franchise`) still self-declare their role, but they land in
  `verification_status: "pending"` and middleware blocks partner routes until an
  admin approves them. That's acceptable, but confirm your admin approval flow
  actually verifies credentials (licences, GST, etc.) before approving.
- **DPDP Act (India, 2023):** You handle health data. Before launch you need a
  consent record (the app has `logConsentAudit` — good), a privacy policy,
  a grievance/Data Protection Officer contact, and a breach-response process.
  This is a legal requirement, not optional. Consult a lawyer.

---

## 3. Finishing the OTP / login fix in the Clerk dashboard

The code change fixes sign-up. For both sign-up and login email codes to
deliver, confirm these in the **Clerk dashboard** for the instance whose
publishable key you ship (`pk_test_…` = a *development* instance):

1. **User & Authentication → Email, Phone, Username**
   - Email address: **enabled** as an identifier.
   - Verification method: **Email verification code** must be ON (this is what
     `email_code` / `prepareFirstFactor` uses). If only "Email link" is on,
     login OTP will fail with "Email OTP not available".
2. **Attack protection → Bot protection:** Smart CAPTCHA can stay ON now that
   the `#clerk-captcha` element exists. If you still see Turnstile failures in
   local dev, add `localhost` to the allowed domains, or temporarily switch to
   "Invisible".
3. **Domains:** add `healthsurya.com` (and your Vercel preview domains) to the
   allowed/satellite domains so Clerk-js loads in production.
4. **Production instance:** `pk_test_…` is a dev key. For launch, create a
   **Production** instance in Clerk, set up the production DNS/CNAME records,
   and swap to the `pk_live_…` / `sk_live_…` keys in Vercel.

Quick local test after these:
```bash
npm install
npm run dev
# open http://localhost:3000/register, fill the form, submit.
# A 6-digit code should arrive by email within ~1 min (check spam).
```

---

## 4. Pre-launch test plan (run these yourself — I can't, without your creds)

I did **not** test live modules (no DB/Clerk/Razorpay/WhatsApp access here), so
"bug-free" is not something I can certify. Run this checklist against a staging
deploy:

**Auth**
- [ ] Register as patient → receive code → land on `/dashboard`.
- [ ] Register as doctor/lab/pharmacy → land on the matching `-setup` page,
      then `/verification-pending` until admin approves.
- [ ] Register as **franchise** → currently redirects to `/franchise-setup`,
      which **does not exist** (404). Either build that page or change the
      redirect in `register/page.tsx`.
- [ ] Login by email OTP and by password.
- [ ] Role mismatch (pick "Doctor", log in with a lab account) → blocked.
- [ ] Confirm `?role=admin` on `/register` does **not** create an admin
      (it should land you as a patient now).

**Middleware / access control**
- [ ] Visit `/admin` while logged out → redirect to `/login`.
- [ ] Visit `/admin` as a patient → `/unauthorized`.
- [ ] Confirm `/api/tester/db-query` returns 404 in production.

**Core flows**
- [ ] Doctor search + booking, lab booking, medicine cart → checkout.
- [ ] Razorpay create-order + verify webhook (use Razorpay test mode).
- [ ] KYC upload + admin approval.
- [ ] Clerk webhook fires on `user.created` and a `profiles` row appears.

**Build / deploy**
- [ ] `npm run build` succeeds.
- [ ] All required env vars set in Vercel (see `.env.local.example`).
- [ ] Sentry + PostHog DSNs set (or disabled) so they don't error.

---

## 5. If you want me to continue
I can next: build the missing `/franchise-setup` page, turn off
`ignoreBuildErrors` and fix what surfaces, add proper rate-limiting to the auth
routes, or review any specific module (payments, KYC, RLS policies) in depth.
Just point me at the part you want hardened.
