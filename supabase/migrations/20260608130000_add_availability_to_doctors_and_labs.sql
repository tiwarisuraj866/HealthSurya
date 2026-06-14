-- Migration: Add availability columns to doctors and labs
ALTER TABLE public.doctors
ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.labs
ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT true;
