-- Premium / promoted listings for homepage and search ranking

CREATE TYPE public.premium_tier AS ENUM ('free', 'silver', 'gold', 'featured');

ALTER TABLE public.doctors
  ADD COLUMN IF NOT EXISTS premium_tier public.premium_tier NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS promoted_priority INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.labs
  ADD COLUMN IF NOT EXISTS premium_tier public.premium_tier NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS promoted_priority INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_doctors_premium ON public.doctors(premium_tier, clinic_city) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_labs_premium ON public.labs(premium_tier, city);

COMMENT ON COLUMN public.doctors.premium_tier IS 'free=basic, silver=featured listing, gold=priority ranking';
COMMENT ON COLUMN public.labs.premium_tier IS 'free=basic, featured=promoted placement on homepage';
