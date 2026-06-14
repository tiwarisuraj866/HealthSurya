-- Migration: V2.0 Enterprise Healthcare Platform Upgrade
-- Date: 2026-06-11

-- Drop existing tables to ensure they are created with the correct V2.0 Enterprise schema columns
DROP TABLE IF EXISTS public.doctor_profiles CASCADE;
DROP TABLE IF EXISTS public.lab_profiles CASCADE;
DROP TABLE IF EXISTS public.pharmacy_profiles CASCADE;
DROP TABLE IF EXISTS public.kyc_documents CASCADE;
DROP TABLE IF EXISTS public.verification_requests CASCADE;
DROP TABLE IF EXISTS public.tickets CASCADE;
DROP TABLE IF EXISTS public.ticket_messages CASCADE;
DROP TABLE IF EXISTS public.ai_conversations CASCADE;
DROP TABLE IF EXISTS public.profile_completion CASCADE;
DROP TABLE IF EXISTS public.trust_scores CASCADE;

-- 1. Modify profiles table to support optional Clerk User ID
ALTER TABLE public.profiles ALTER COLUMN clerk_user_id DROP NOT NULL;

-- 2. Create doctor_profiles table
CREATE TABLE IF NOT EXISTS public.doctor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  medical_registration_number TEXT,
  mbbs_certificate_url TEXT,
  md_ms_certificate_url TEXT,
  specialization_certificate_url TEXT,
  clinic_photos TEXT[] DEFAULT '{}',
  government_id_url TEXT,
  experience_years INT,
  specialization TEXT,
  clinic_name TEXT,
  clinic_address TEXT,
  clinic_city TEXT,
  clinic_pincode TEXT,
  consultation_fee NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for doctor_profiles
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage own doctor profile" ON public.doctor_profiles
  FOR ALL USING (profile_id IN (SELECT id FROM public.profiles WHERE clerk_user_id = auth.uid()::text OR id = auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE (clerk_user_id = auth.uid()::text OR id = auth.uid()) AND role IN ('admin', 'super_admin')));

-- 3. Create lab_profiles table
CREATE TABLE IF NOT EXISTS public.lab_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  lab_name TEXT,
  owner_name TEXT,
  lab_address TEXT,
  lab_city TEXT,
  lab_pincode TEXT,
  nabl_certificate_url TEXT,
  gst_certificate_url TEXT,
  lab_photos TEXT[] DEFAULT '{}',
  equipment_photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for lab_profiles
ALTER TABLE public.lab_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage own lab profile" ON public.lab_profiles
  FOR ALL USING (profile_id IN (SELECT id FROM public.profiles WHERE clerk_user_id = auth.uid()::text OR id = auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE (clerk_user_id = auth.uid()::text OR id = auth.uid()) AND role IN ('admin', 'super_admin')));

-- 4. Create pharmacy_profiles table
CREATE TABLE IF NOT EXISTS public.pharmacy_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  pharmacy_name TEXT,
  pharmacist_name TEXT,
  drug_license_url TEXT,
  gst_certificate_url TEXT,
  shop_photos TEXT[] DEFAULT '{}',
  registration_certificate_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for pharmacy_profiles
ALTER TABLE public.pharmacy_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage own pharmacy profile" ON public.pharmacy_profiles
  FOR ALL USING (profile_id IN (SELECT id FROM public.profiles WHERE clerk_user_id = auth.uid()::text OR id = auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE (clerk_user_id = auth.uid()::text OR id = auth.uid()) AND role IN ('admin', 'super_admin')));

-- 5. Create kyc_documents table
CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  extracted_data JSONB DEFAULT '{}'::jsonb,
  quality_score NUMERIC DEFAULT 100,
  duplicate_detected BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for kyc_documents
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage own kyc documents" ON public.kyc_documents
  FOR ALL USING (profile_id IN (SELECT id FROM public.profiles WHERE clerk_user_id = auth.uid()::text OR id = auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE (clerk_user_id = auth.uid()::text OR id = auth.uid()) AND role IN ('admin', 'super_admin')));

-- 6. Create verification_requests table
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'incomplete', 'pending', 'under_review', 'approved', 'rejected')),
  kyc_percentage INT NOT NULL DEFAULT 0,
  ai_risk_score INT DEFAULT 0,
  ai_recommendations TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for verification_requests
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage own verification requests" ON public.verification_requests
  FOR ALL USING (profile_id IN (SELECT id FROM public.profiles WHERE clerk_user_id = auth.uid()::text OR id = auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE (clerk_user_id = auth.uid()::text OR id = auth.uid()) AND role IN ('admin', 'super_admin')));

-- 7. Create tickets and ticket_messages tables
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'closed')),
  category TEXT NOT NULL CHECK (category IN ('appointment', 'lab_test', 'payment', 'verification', 'technical', 'general')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for tickets and messages
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage own tickets" ON public.tickets
  FOR ALL USING (creator_id IN (SELECT id FROM public.profiles WHERE clerk_user_id = auth.uid()::text OR id = auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE (clerk_user_id = auth.uid()::text OR id = auth.uid()) AND role IN ('admin', 'super_admin', 'support')));

CREATE POLICY "Allow users to manage messages on own tickets" ON public.ticket_messages
  FOR ALL USING (ticket_id IN (SELECT id FROM public.tickets WHERE creator_id IN (SELECT id FROM public.profiles WHERE clerk_user_id = auth.uid()::text OR id = auth.uid())) OR EXISTS (SELECT 1 FROM public.profiles WHERE (clerk_user_id = auth.uid()::text OR id = auth.uid()) AND role IN ('admin', 'super_admin', 'support')));

-- 8. Create ai_conversations table
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  context TEXT NOT NULL DEFAULT 'patient',
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for ai_conversations
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage own AI conversations" ON public.ai_conversations
  FOR ALL USING (profile_id IN (SELECT id FROM public.profiles WHERE clerk_user_id = auth.uid()::text OR id = auth.uid()));

-- 9. Create profile_completion table
CREATE TABLE IF NOT EXISTS public.profile_completion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  completion_percentage INT NOT NULL DEFAULT 0,
  missing_fields JSONB DEFAULT '[]'::jsonb,
  suggestions JSONB DEFAULT '[]'::jsonb,
  verification_readiness TEXT NOT NULL DEFAULT 'ineligible' CHECK (verification_readiness IN ('ineligible', 'eligible', 'priority')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for profile_completion
ALTER TABLE public.profile_completion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read own profile completion" ON public.profile_completion
  FOR SELECT USING (profile_id IN (SELECT id FROM public.profiles WHERE clerk_user_id = auth.uid()::text OR id = auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE (clerk_user_id = auth.uid()::text OR id = auth.uid()) AND role IN ('admin', 'super_admin')));

-- 10. Create trust_scores table
CREATE TABLE IF NOT EXISTS public.trust_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  score INT NOT NULL DEFAULT 50 CHECK (score >= 0 AND score <= 100),
  rating TEXT NOT NULL DEFAULT 'neutral' CHECK (rating IN ('poor', 'neutral', 'good', 'excellent')),
  factors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for trust_scores
ALTER TABLE public.trust_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read own trust score" ON public.trust_scores
  FOR SELECT USING (profile_id IN (SELECT id FROM public.profiles WHERE clerk_user_id = auth.uid()::text OR id = auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE (clerk_user_id = auth.uid()::text OR id = auth.uid()) AND role IN ('admin', 'super_admin')));

-- 11. Create trigger to sync auth.users with public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_supabase_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, full_name, role, verification_status, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
    CASE 
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'patient') IN ('patient', 'lab_staff', 'pharmacy_staff') THEN 'approved'::text
      ELSE 'pending'::text
    END,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = COALESCE(profiles.phone, EXCLUDED.phone),
    full_name = COALESCE(profiles.full_name, EXCLUDED.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync new auth.users
CREATE OR REPLACE TRIGGER on_supabase_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_supabase_user();
