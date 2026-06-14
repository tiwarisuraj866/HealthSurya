-- Migration: Add browser and country fields to user_consents for DPDP Compliance
ALTER TABLE public.user_consents
ADD COLUMN IF NOT EXISTS browser TEXT,
ADD COLUMN IF NOT EXISTS country TEXT;
