-- Migration: Clerk Authentication and Role-Based User Management

-- Alter existing profiles table to support Clerk
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN (
  'patient', 'doctor', 'lab', 'pharmacy', 'franchise',
  'lab_staff', 'pharmacy_staff', 'support', 'finance',
  'marketing', 'operations', 'admin', 'super_admin'
));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_status TEXT CHECK (verification_status IN (
  'pending', 'under_review', 'approved', 'rejected', 'suspended'
));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN;

-- Update existing profiles to have clerk_user_id = id::text and set other defaults
UPDATE public.profiles SET clerk_user_id = id::text WHERE clerk_user_id IS NULL;
UPDATE public.profiles SET role = 'patient' WHERE role IS NULL;
UPDATE public.profiles SET verification_status = 'approved' WHERE verification_status IS NULL;
UPDATE public.profiles SET is_active = true WHERE is_active IS NULL;

-- Make them NOT NULL and UNIQUE/DEFAULT
ALTER TABLE public.profiles ALTER COLUMN clerk_user_id SET NOT NULL;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_clerk_user_id_key UNIQUE (clerk_user_id);
ALTER TABLE public.profiles ALTER COLUMN role SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'patient';
ALTER TABLE public.profiles ALTER COLUMN verification_status SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN verification_status SET DEFAULT 'approved';
ALTER TABLE public.profiles ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN is_active SET DEFAULT true;


-- Index for clerk user lookup
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_user_id ON public.profiles(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Create doctor verification info
CREATE TABLE IF NOT EXISTS public.doctor_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  registration_number TEXT NOT NULL,
  government_id_url TEXT NOT NULL,
  registration_cert_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doctor_verifications_profile_id ON public.doctor_verifications(profile_id);

-- Create lab verification info
CREATE TABLE IF NOT EXISTS public.lab_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lab_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  identity_proof_url TEXT NOT NULL,
  registration_cert_url TEXT NOT NULL,
  nabl_cert_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lab_verifications_profile_id ON public.lab_verifications(profile_id);

-- Create pharmacy verification info
CREATE TABLE IF NOT EXISTS public.pharmacy_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pharmacy_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  identity_proof_url TEXT NOT NULL,
  drug_license_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_verifications_profile_id ON public.pharmacy_verifications(profile_id);

-- Create staff members table
CREATE TABLE IF NOT EXISTS public.staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_partner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  clerk_user_id TEXT UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('lab_staff', 'pharmacy_staff')),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_members_parent ON public.staff_members(parent_partner_id);
CREATE INDEX IF NOT EXISTS idx_staff_members_clerk_id ON public.staff_members(clerk_user_id);

-- Create audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
-- Profiles: Users can read and update their own profile; admins have full access
CREATE POLICY "Allow users to read own profile" ON public.profiles
  FOR SELECT USING (clerk_user_id = auth.uid()::text OR role IN ('admin', 'super_admin'));

CREATE POLICY "Allow users to update own profile" ON public.profiles
  FOR UPDATE USING (clerk_user_id = auth.uid()::text);

-- Admins can manage all profiles
CREATE POLICY "Admins have full access on profiles" ON public.profiles
  FOR ALL USING (role IN ('admin', 'super_admin'));

-- Verifications: Owners and Admins can view/update
CREATE POLICY "Allow owners to read own doctor verification" ON public.doctor_verifications
  FOR SELECT USING (profile_id IN (SELECT id FROM public.profiles WHERE clerk_user_id = auth.uid()::text) OR EXISTS (SELECT 1 FROM public.profiles WHERE clerk_user_id = auth.uid()::text AND role IN ('admin', 'super_admin')));

-- Staff: Parent organization can select/insert/update
CREATE POLICY "Allow parent organization to manage staff" ON public.staff_members
  FOR ALL USING (parent_partner_id IN (SELECT id FROM public.profiles WHERE clerk_user_id = auth.uid()::text));

-- Audit Logs: Admins only
CREATE POLICY "Allow admins to read audit logs" ON public.audit_logs
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE clerk_user_id = auth.uid()::text AND role IN ('admin', 'super_admin')));
