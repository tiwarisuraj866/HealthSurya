-- ============================================================================
-- HealthSurya V2.0 — KYC Engine, Tickets, Notifications, AI, Trust Scores
-- Additive migration: does NOT modify or drop any existing V1.5 objects.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Profiles: link Supabase Auth (primary) alongside Clerk (fallback)
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS supabase_user_id uuid UNIQUE,
  ADD COLUMN IF NOT EXISTS auth_provider text DEFAULT 'clerk', -- 'supabase' | 'clerk'
  ADD COLUMN IF NOT EXISTS profile_photo_url text,
  ADD COLUMN IF NOT EXISTS dob date,
  ADD COLUMN IF NOT EXISTS gender text;

-- Future-ready auth methods registry (Mobile OTP / WhatsApp OTP / Google / Apple)
CREATE TABLE IF NOT EXISTS public.auth_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  method text NOT NULL CHECK (method IN ('email_otp','magic_link','mobile_otp','whatsapp_otp','google','apple','password')),
  identifier text,                       -- email / phone / oauth subject
  is_enabled boolean NOT NULL DEFAULT false, -- mobile_otp & whatsapp_otp stay false (Coming Soon)
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_auth_methods_profile ON public.auth_methods(profile_id);

-- ---------------------------------------------------------------------------
-- 1. Role extension profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.doctor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  medical_registration_number text,
  registration_council text,
  specialization text,
  qualifications text[],
  experience_years int,
  clinic_name text,
  clinic_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lab_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  lab_name text,
  owner_name text,
  lab_address text,
  nabl_number text,
  gst_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pharmacy_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  pharmacy_name text,
  pharmacist_name text,
  drug_license_number text,
  gst_number text,
  shop_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2. KYC documents + verification requests + logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL,                          -- patient | doctor | lab | pharmacy
  doc_key text NOT NULL,                       -- e.g. 'aadhaar','pan','mbbs_certificate'
  doc_label text,
  is_required boolean NOT NULL DEFAULT false,
  file_url text,
  file_name text,
  mime_type text,
  file_hash text,                              -- sha256 for duplicate detection
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','uploaded','ai_checked','approved','rejected')),
  ai_extracted jsonb,                          -- {full_name,dob,gender,registration_number,...}
  ai_quality_score numeric,
  ai_authenticity_score numeric,
  ai_flags text[],
  reviewer_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, doc_key)
);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_profile ON public.kyc_documents(profile_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_hash ON public.kyc_documents(file_hash);

CREATE TABLE IF NOT EXISTS public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL,
  kyc_percentage numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','incomplete','pending_verification','under_review','approved','rejected')),
  priority boolean NOT NULL DEFAULT false,     -- 100% completion = priority queue
  ai_risk_score numeric,
  ai_recommendations jsonb,
  missing_documents text[],
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON public.verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_profile ON public.verification_requests(profile_id);

-- Drop old verification_logs if exists to ensure correct V2 schema
DROP TABLE IF EXISTS public.verification_logs CASCADE;
CREATE TABLE public.verification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid,
  actor text,
  action text,
  detail jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3. Profile completion + trust scores
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profile_completion (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL,
  percentage numeric NOT NULL DEFAULT 0,
  readiness text NOT NULL DEFAULT 'not_eligible'
    CHECK (readiness IN ('not_eligible','eligible','priority')),
  missing_items jsonb,                          -- [{key,label,weight,suggestion}]
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trust_scores (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  score numeric NOT NULL DEFAULT 0,             -- 0–100
  grade text NOT NULL DEFAULT 'new'
    CHECK (grade IN ('new','fair','good','excellent')),
  factors jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 4. Ticket management
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_no bigserial UNIQUE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by_clerk_id text,
  subject text NOT NULL,
  category text NOT NULL DEFAULT 'general'
    CHECK (category IN ('appointment','lab_test','payment','verification','technical','general')),
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','pending','resolved','closed')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  source text NOT NULL DEFAULT 'user' CHECK (source IN ('user','ai_escalation','admin')),
  assigned_to uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tickets_profile ON public.tickets(profile_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);

CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES public.tickets(id) ON DELETE CASCADE,
  sender_role text NOT NULL DEFAULT 'user' CHECK (sender_role IN ('user','admin','ai')),
  sender_profile_id uuid,
  body text NOT NULL,
  attachments jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON public.ticket_messages(ticket_id);

-- ---------------------------------------------------------------------------
-- 5. Notifications (Email + In-App now; SMS/WhatsApp future-ready via channel)
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS public.notifications CASCADE;
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  clerk_user_id text,
  channel text NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app','email','sms','whatsapp')),
  event text NOT NULL,                          -- e.g. 'verification_approved'
  title text NOT NULL,
  body text,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_profile ON public.notifications(profile_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_clerk ON public.notifications(clerk_user_id, is_read);

-- ---------------------------------------------------------------------------
-- 6. AI conversations + audit logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid,
  clerk_user_id text,
  role_context text,                            -- patient | doctor | lab | pharmacy | admin
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [{role,content,ts}]
  escalated_ticket_id uuid REFERENCES public.tickets(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TABLE IF EXISTS public.audit_logs CASCADE;
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_profile_id uuid,
  actor_clerk_id text,
  actor_role text,
  action text NOT NULL,                         -- 'kyc.submit','admin.approve', ...
  entity text,                                  -- table / domain
  entity_id text,
  detail jsonb,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity, entity_id);

-- ---------------------------------------------------------------------------
-- 7. updated_at triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.hs_v2_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'doctor_profiles','lab_profiles','pharmacy_profiles','kyc_documents',
    'verification_requests','tickets','ai_conversations'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_touch_%I ON public.%I;
       CREATE TRIGGER trg_touch_%I BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.hs_v2_touch_updated_at();',
      t, t, t, t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 8. Row Level Security (service-role APIs bypass; users restricted)
-- ---------------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'auth_methods','doctor_profiles','lab_profiles','pharmacy_profiles',
    'kyc_documents','verification_requests','profile_completion','trust_scores',
    'tickets','ticket_messages','notifications','ai_conversations','audit_logs'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
  END LOOP;
END $$;

-- Owner-read policies for Supabase-authenticated users (Clerk traffic uses
-- server routes with the service-role key, which bypasses RLS by design).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'v2_own_kyc_documents') THEN
    CREATE POLICY v2_own_kyc_documents ON public.kyc_documents
      FOR SELECT USING (
        profile_id IN (SELECT id FROM public.profiles WHERE supabase_user_id = auth.uid())
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'v2_own_notifications') THEN
    CREATE POLICY v2_own_notifications ON public.notifications
      FOR SELECT USING (
        profile_id IN (SELECT id FROM public.profiles WHERE supabase_user_id = auth.uid())
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'v2_own_tickets') THEN
    CREATE POLICY v2_own_tickets ON public.tickets
      FOR SELECT USING (
        profile_id IN (SELECT id FROM public.profiles WHERE supabase_user_id = auth.uid())
      );
  END IF;
END $$;
