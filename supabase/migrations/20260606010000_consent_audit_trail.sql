-- Migration: Consent Audit Trail for DPDP Act 2023 Compliance
CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  terms_version TEXT NOT NULL,
  privacy_version TEXT NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  ip_address TEXT,
  device_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON public.user_consents(user_id);

-- Enable RLS
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- Users can view their own consent audit records, admins can view all
CREATE POLICY "Allow users to read own consents" ON public.user_consents
  FOR SELECT USING (
    user_id IN (SELECT id FROM public.profiles WHERE clerk_user_id = auth.uid()::text)
    OR EXISTS (SELECT 1 FROM public.profiles WHERE clerk_user_id = auth.uid()::text AND role IN ('admin', 'super_admin'))
  );

-- Authenticated users can insert their own consent records
CREATE POLICY "Allow users to insert own consents" ON public.user_consents
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM public.profiles WHERE clerk_user_id = auth.uid()::text)
  );

-- Consent records must never be updated or deleted by normal users
-- No UPDATE or DELETE policies are defined, keeping it immutable.
