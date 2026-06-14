-- Doctor mini-website: profiles, appointments, reviews, gallery, analytics

CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  photo_url TEXT,
  qualification TEXT,
  specialization TEXT,
  experience_years INTEGER,
  gender TEXT,
  about TEXT,
  consultation_fee NUMERIC(10,2),
  clinic_name TEXT,
  clinic_address TEXT,
  clinic_city TEXT NOT NULL DEFAULT 'Jaunpur',
  clinic_pincode TEXT,
  clinic_phone TEXT,
  whatsapp TEXT,
  map_embed_url TEXT,
  map_lat NUMERIC(10,7),
  map_lng NUMERIC(10,7),
  services TEXT[] NOT NULL DEFAULT '{}',
  open_time TEXT,
  close_time TEXT,
  timings_note TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  published BOOLEAN NOT NULL DEFAULT true,
  profile_views INTEGER NOT NULL DEFAULT 0,
  whatsapp_clicks INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(owner_id)
);

CREATE INDEX idx_doctors_slug ON public.doctors(slug);
CREATE INDEX idx_doctors_city ON public.doctors(clinic_city);
CREATE INDEX idx_doctors_specialization ON public.doctors(specialization);

CREATE TRIGGER trg_doctors_updated
  BEFORE UPDATE ON public.doctors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.doctor_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_doctor_gallery_doctor ON public.doctor_gallery(doctor_id);

CREATE TABLE public.doctor_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_name TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_doctor_reviews_doctor ON public.doctor_reviews(doctor_id);

CREATE TABLE public.doctor_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  symptoms TEXT,
  status public.appointment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_doctor_appointments_doctor ON public.doctor_appointments(doctor_id);
CREATE INDEX idx_doctor_appointments_status ON public.doctor_appointments(status);

CREATE TRIGGER trg_doctor_appointments_updated
  BEFORE UPDATE ON public.doctor_appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.doctor_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('profile_view', 'whatsapp_click', 'appointment_request')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_doctor_analytics_doctor ON public.doctor_analytics_events(doctor_id, created_at);

-- Slug helper
CREATE OR REPLACE FUNCTION public.make_doctor_slug(_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  base TEXT;
  candidate TEXT;
  n INT := 0;
BEGIN
  base := lower(trim(regexp_replace(coalesce(_name, 'doctor'), '[^a-zA-Z0-9]+', '-', 'g'), '-'));
  IF base = '' OR base IS NULL THEN base := 'doctor'; END IF;
  IF left(base, 3) <> 'dr-' THEN base := 'dr-' || base; END IF;
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.doctors WHERE slug = candidate) LOOP
    n := n + 1;
    candidate := base || '-' || n::text;
  END LOOP;
  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.doctors_set_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL OR trim(NEW.slug) = '' THEN
    NEW.slug := public.make_doctor_slug(NEW.full_name);
  ELSE
    NEW.slug := lower(trim(regexp_replace(NEW.slug, '[^a-z0-9-]+', '-', 'g'), '-'));
    IF left(NEW.slug, 3) <> 'dr-' THEN NEW.slug := 'dr-' || NEW.slug; END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_doctors_slug
  BEFORE INSERT OR UPDATE OF slug, full_name ON public.doctors
  FOR EACH ROW EXECUTE FUNCTION public.doctors_set_slug();

-- Recompute doctor rating from reviews
CREATE OR REPLACE FUNCTION public.recompute_doctor_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE doc UUID;
BEGIN
  doc := COALESCE(NEW.doctor_id, OLD.doctor_id);
  UPDATE public.doctors SET
    rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM public.doctor_reviews WHERE doctor_id = doc), 0),
    total_reviews = (SELECT COUNT(*) FROM public.doctor_reviews WHERE doctor_id = doc)
  WHERE id = doc;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_doctor_reviews_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.doctor_reviews
  FOR EACH ROW EXECUTE FUNCTION public.recompute_doctor_rating();

-- Track analytics (public + authenticated)
CREATE OR REPLACE FUNCTION public.track_doctor_event(_doctor_id UUID, _event_type TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _event_type NOT IN ('profile_view', 'whatsapp_click', 'appointment_request') THEN
    RAISE EXCEPTION 'Invalid event type';
  END IF;
  INSERT INTO public.doctor_analytics_events (doctor_id, event_type) VALUES (_doctor_id, _event_type);
  IF _event_type = 'profile_view' THEN
    UPDATE public.doctors SET profile_views = profile_views + 1 WHERE id = _doctor_id;
  ELSIF _event_type = 'whatsapp_click' THEN
    UPDATE public.doctors SET whatsapp_clicks = whatsapp_clicks + 1 WHERE id = _doctor_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_doctor_event(UUID, TEXT) TO anon, authenticated;

-- RLS
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY doctors_public_read ON public.doctors FOR SELECT
  USING (published = true OR auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY doctors_insert_owner ON public.doctors FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY doctors_update_owner ON public.doctors FOR UPDATE
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY doctors_delete_admin ON public.doctors FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY doctor_gallery_public_read ON public.doctor_gallery FOR SELECT USING (true);

CREATE POLICY doctor_gallery_owner_manage ON public.doctor_gallery FOR ALL
  USING (EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND (d.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND (d.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE POLICY doctor_reviews_public_read ON public.doctor_reviews FOR SELECT USING (true);

CREATE POLICY doctor_reviews_insert ON public.doctor_reviews FOR INSERT
  WITH CHECK (true);

CREATE POLICY doctor_appointments_public_insert ON public.doctor_appointments FOR INSERT
  WITH CHECK (true);

CREATE POLICY doctor_appointments_select ON public.doctor_appointments FOR SELECT
  USING (
    auth.uid() = patient_id
    OR EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY doctor_appointments_update_owner ON public.doctor_appointments FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY doctor_analytics_select_owner ON public.doctor_analytics_events FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

GRANT SELECT, INSERT, UPDATE ON public.doctors TO authenticated;
GRANT SELECT ON public.doctors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_gallery TO authenticated;
GRANT SELECT ON public.doctor_gallery TO anon;
GRANT SELECT, INSERT ON public.doctor_reviews TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.doctor_appointments TO authenticated, anon;
GRANT SELECT ON public.doctor_analytics_events TO authenticated;
