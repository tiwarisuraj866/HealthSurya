-- Database migration: Add doctor referrals, prescription verification, and commissions to bookings
-- Run this in Supabase SQL editor or CLI

-- 1. Add 'fnf' (Full & Final) value to booking_status enum
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'fnf';

-- 2. Add columns to public.bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS referred_doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referred_doctor_name TEXT,
  ADD COLUMN IF NOT EXISTS prescription_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(10, 2) DEFAULT 0.00;

-- 3. Create indices for faster referral lookups
CREATE INDEX IF NOT EXISTS idx_bookings_referred_doctor ON public.bookings(referred_doctor_id);

-- 4. Enable Row Level Security policy for Doctors to view their referred bookings
CREATE POLICY "bookings_doctor_select" ON public.bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.doctors d 
      WHERE d.id = referred_doctor_id 
      AND d.owner_id = auth.uid()
    )
  );
