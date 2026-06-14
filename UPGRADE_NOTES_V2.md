# HealthSurya V2.0 — Upgrade Notes

Version: 2.0 (additive upgrade over V1.5 — no existing feature removed)
Date: 12 June 2026

---

## 1. What's New in V2.0

### Smart KYC & Verification Engine
- **/kyc** — KYC & Verification Centre for every role (patient / doctor / lab / pharmacy)
  - Progress bar + percentage calculation (role-specific weighted items)
  - Statuses: Draft → Incomplete → Pending Verification → Under Review → Approved / Rejected
  - **80% completion = eligible for review · 100% = priority review**
  - No optional document is ever mandatory; save-as-draft is automatic
  - Upload via file picker, drag & drop, or camera capture
  - AI OCR (`/api/ai/ocr`): extracts name / DOB / gender / registration number,
    auto-fills profile, checks document quality, detects duplicates (file hash)
- Trust Score system (completion + AI authenticity + verification bonus)

### Admin Verification Dashboard
- **/admin/kyc** — priority-first queue, KYC %, missing documents,
  AI risk score + recommendations, document viewer, approve / reject with notes,
  full audit trail (audit_logs + verification_logs)
- Admin can manually approve any profile (override allowed)

### AI Support Assistant
- Floating HealthSurya Assistant on every page (signed-in users)
- Role-aware help (patient / doctor / lab / pharmacy / admin) + FAQs
- Escalation flow: **AI Agent → Support Ticket → Admin**

### Ticket Management
- **/support** — create, track and chat on tickets
- Categories: Appointment, Lab Test, Payment, Verification, Technical, General
- Statuses: Open, Pending, Resolved, Closed (user reply re-opens resolved tickets)

### Notification Centre
- Header bell with unread badge + dropdown
- **/notifications** — full history, mark read / mark all read
- Channels live: In-App + Email (branded templates). Future-ready: SMS, WhatsApp
- Branded email templates: welcome, account created, verification submitted /
  approved / rejected, appointment & lab booking confirmation, ticket created / resolved
  (sent via Resend when `RESEND_API_KEY` is set; logged otherwise)

### Dashboard Widgets
- Profile Completion card: %, verification readiness, trust grade,
  highest-impact next step suggestion

### Authentication
- Email OTP login/signup (existing) preserved
- **"Mobile OTP Login - Coming Soon"** shown on login & register screens
  (architecture + `auth_methods` table ready for Mobile/WhatsApp OTP, Google, Apple)
- Clerk remains integrated; database prepared for Supabase Auth
  (`profiles.supabase_user_id`, `auth_provider`, RLS owner policies)

---

## 2. Bug Fixes in This Release

### Role-based login restriction (reported issue)
Previously, selecting "Doctor" on the login screen but signing in with a Lab
(or any other) account silently logged the user into the wrong portal.

Fixed:
- **Login (email OTP / password):** after Clerk sign-in, the account's
  registered role is compared with the selected role. On mismatch the session
  is signed out with a clear error: *"Role mismatch: this account is registered
  as … Please select the correct role and sign in again."*
- **Google OAuth:** selected role is stored before the redirect and enforced
  on `/sso-callback` the same way.
- Staff equivalence handled (lab_staff → lab, pharmacy_staff → pharmacy);
  admin/operations roles may sign in via any door.
- Already-signed-in users visiting /login are not logged out (enforcement only
  applies to fresh sign-in attempts).

### Page-level role guards
- New reusable `<RoleGuard allow={[...]}>` component.
- Applied to previously unguarded pages: `/pharmacy`, `/admin/users`.
  (Existing guards on /doctor-manage, /lab kept as-is.)

### Demo/mock database engine (local preview mode)
- Composite `onConflict` upserts ("profile_id,doc_key") — KYC documents no
  longer overwrite each other in preview mode.
- Chainable `update().eq().eq() / .in() / .neq()` support.
- `in()` / `neq()` filters and `profiles:profile_id` join on selects.
- Auto-incrementing ticket numbers; V2 tables registered (kyc_documents,
  verification_requests, tickets, ticket_messages, notifications, audit_logs,
  profile_completion, trust_scores, ai_conversations, …).

---

## 3. Database

New migration (run in Supabase SQL editor or `supabase db push`):

```
supabase/migrations/20260611000000_v2_kyc_tickets_notifications_ai.sql
```

Adds: auth_methods, doctor_profiles, lab_profiles, pharmacy_profiles,
kyc_documents, verification_requests, verification_logs, profile_completion,
trust_scores, tickets, ticket_messages, notifications, ai_conversations,
audit_logs — plus profile columns (supabase_user_id, auth_provider,
profile_photo_url, dob, gender), updated_at triggers, and RLS owner policies.
All statements are `IF NOT EXISTS` / additive — safe to run on existing data.

---

## 4. New Environment Variables (optional)

| Variable            | Purpose                                              |
|---------------------|------------------------------------------------------|
| `ANTHROPIC_API_KEY` | AI OCR + document quality (preferred provider)       |
| `AI_MODEL`          | Override AI model id (optional)                      |
| `RESEND_API_KEY`    | Transactional email delivery (Resend)                |
| `EMAIL_FROM`        | From address, e.g. `HealthSurya <noreply@...>`       |

Without these keys the platform still runs: OCR degrades gracefully and
emails are logged instead of sent.

---

## 5. New Routes Summary

Pages: `/kyc`, `/support`, `/notifications`, `/admin/kyc`
APIs:  `/api/kyc`, `/api/admin/kyc`, `/api/tickets`, `/api/tickets/[id]`,
       `/api/notifications`, `/api/ai/assistant`, `/api/ai/ocr`

## 6. Build Status

- `npm run build` — ✅ passes (Next.js 15.5, Turbopack, 63 pages)
- End-to-end verified in preview mode: KYC 0→95% → submit → admin queue →
  approve → notification + trust score update; ticket create/chat/status;
  AI assistant FAQ + ticket escalation; notification read/mark-all.
- Note for Linux/Vercel builds: native binaries `lightningcss-linux-x64-gnu`
  and `@tailwindcss/oxide-linux-x64-gnu` are included; Vercel installs them
  automatically from the lockfile.
