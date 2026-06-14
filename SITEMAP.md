# HealthSurya — Site Map

45 page routes + 19 API routes. `[param]` = dynamic segment. 🔒 = protected by
middleware (auth + role required).

## Public
- `/` — home
- `/about`, `/contact`, `/services`
- `/doctors` → `/doctors/[slug]`
- `/labs` → `/labs/[labId]` → `/labs/[labId]/whitelabel`
- `/medicine` → `/medicine/[medicineId]`
- `/legal` → `/legal/[policyId]`

## Auth
- `/login`, `/register`, `/verify`, `/sso-callback`
- `/unauthorized`, `/suspended`, `/verification-pending`

## Patient (signed in)
- 🔒 `/dashboard` → `/dashboard/crm`, `/dashboard/reports`,
  `/dashboard/support` → `/dashboard/support/[id]`
- `/profile`, `/wallet`, `/notifications`, `/kyc`
- `/bookings`
- `/medicine-cart` → `/medicine-checkout`
- `/orders` → `/orders/[orderId]`

## Partner portals
- 🔒 `/doctor-setup`, `/doctor-manage` _(role: doctor)_
- 🔒 `/lab`, `/lab-setup`, `/lab-manage` _(role: lab)_
- 🔒 `/pharmacy`, `/pharmacy-setup` _(role: pharmacy)_
- ⚠️ `/franchise-setup` is referenced on franchise sign-up but **no page exists** — 404.

## Admin / staff 🔒
- `/admin/users`, `/admin/kyc`, `/admin/verifications`
- `/support` _(role: support/admin)_
- Middleware also reserves `/finance`, `/marketing`, `/operations` (no pages yet)

## API routes
**Webhooks:** `/api/webhooks/clerk`, `/api/webhooks/razorpay`, `/api/webhooks/whatsapp`
**Auth/profile:** `/api/consent`, `/api/kyc`
**Commerce:** `/api/payments/create-order`, `/api/payments/verify`,
`/api/bookings/[bookingId]/report`
**Support:** `/api/tickets` → `/api/tickets/[ticketId]`, `/api/notifications`
**Admin:** `/api/admin/users`, `/api/admin/kyc`
**AI:** `/api/ai/assistant`, `/api/ai/ocr`
**Comms:** `/api/whatsapp/send`
**Misc:** `/api/upload`, `/api/health`
**Tester (now 404 unless `ENABLE_TESTER_BYPASS=true`):** `/api/tester/db-query`
