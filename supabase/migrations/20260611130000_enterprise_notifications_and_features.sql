-- Migration: V2.0 Notifications and Feature Tables
-- Date: 2026-06-11

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('verification', 'booking', 'ticket', 'system')),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage own notifications" ON public.notifications
  FOR ALL USING (profile_id IN (SELECT id FROM public.profiles WHERE clerk_user_id = auth.uid()::text OR id = auth.uid()));

-- 2. Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admins to read audit logs" ON public.audit_logs
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE (clerk_user_id = auth.uid()::text OR id = auth.uid()) AND role IN ('admin', 'super_admin')));

-- 3. Create lab_branding table
CREATE TABLE IF NOT EXISTS public.lab_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE UNIQUE,
  primary_color TEXT DEFAULT '#0f766e',
  logo_url TEXT,
  banner_url TEXT,
  custom_title TEXT,
  slug TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for lab_branding
ALTER TABLE public.lab_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of lab_branding" ON public.lab_branding
  FOR SELECT USING (true);

CREATE POLICY "Allow lab owners to manage branding" ON public.lab_branding
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.labs l 
      WHERE l.id = lab_id 
      AND (l.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- Grant privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT ON public.notifications TO anon;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lab_branding TO authenticated;
GRANT SELECT ON public.lab_branding TO anon;

-- 4. Alter doctors table to support mini-website customization
ALTER TABLE public.doctors 
  ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT 'teal',
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT;

-- 5. Create verification_logs table
CREATE TABLE IF NOT EXISTS public.verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL REFERENCES public.verification_requests(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for verification_logs
ALTER TABLE public.verification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read own verification logs" ON public.verification_logs
  FOR SELECT USING (
    verification_id IN (
      SELECT id FROM public.verification_requests 
      WHERE profile_id IN (SELECT id FROM public.profiles WHERE clerk_user_id = auth.uid()::text OR id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE (clerk_user_id = auth.uid()::text OR id = auth.uid()) 
      AND role IN ('admin', 'super_admin')
    )
  );

GRANT SELECT, INSERT ON public.verification_logs TO authenticated;


