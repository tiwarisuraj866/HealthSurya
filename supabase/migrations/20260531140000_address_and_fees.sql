-- Structured address + fees for medicine orders and lab bookings

ALTER TABLE public.medicine_orders
  ADD COLUMN IF NOT EXISTS address_details JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS distance_km NUMERIC(6,2);

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS address_details JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS collection_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS distance_km NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS payment_mode TEXT DEFAULT 'cod',
  ADD COLUMN IF NOT EXISTS refund_policy_accepted_at TIMESTAMPTZ;

COMMENT ON COLUMN public.bookings.collection_fee IS 'Home sample collection charge based on distance';
COMMENT ON COLUMN public.medicine_orders.distance_km IS 'Estimated delivery distance from dispatch hub';
