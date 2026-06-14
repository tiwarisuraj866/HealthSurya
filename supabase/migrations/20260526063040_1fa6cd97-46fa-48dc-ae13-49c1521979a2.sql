
-- Roles enum + table
CREATE TYPE public.app_role AS ENUM ('patient', 'doctor', 'lab', 'courier', 'admin');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- Auto-create profile + default patient role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.raw_user_meta_data->>'phone', ''));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'patient'));
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Generic updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Labs
CREATE TABLE public.labs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  pincode TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  image_url TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  open_time TEXT,
  close_time TEXT,
  home_collection BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_labs_city ON public.labs(city);
CREATE INDEX idx_labs_pincode ON public.labs(pincode);
CREATE TRIGGER trg_labs_updated BEFORE UPDATE ON public.labs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Tests catalog
CREATE TABLE public.tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  price NUMERIC(10,2) NOT NULL,
  available BOOLEAN NOT NULL DEFAULT true,
  home_collection BOOLEAN NOT NULL DEFAULT false,
  turnaround_hours INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lab_id, test_id)
);
CREATE INDEX idx_lab_tests_test ON public.lab_tests(test_id);
CREATE INDEX idx_lab_tests_lab ON public.lab_tests(lab_id);

-- Bookings
CREATE TYPE public.booking_status AS ENUM ('pending','confirmed','sample_collected','processing','completed','cancelled');

CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lab_id UUID NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES public.tests(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  status public.booking_status NOT NULL DEFAULT 'pending',
  home_collection BOOLEAN NOT NULL DEFAULT false,
  address TEXT,
  notes TEXT,
  price NUMERIC(10,2) NOT NULL,
  report_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bookings_patient ON public.bookings(patient_id);
CREATE INDEX idx_bookings_lab ON public.bookings(lab_id);
CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lab_id UUID NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(patient_id, lab_id)
);

-- Auto recompute lab rating
CREATE OR REPLACE FUNCTION public.recompute_lab_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE lab UUID;
BEGIN
  lab := COALESCE(NEW.lab_id, OLD.lab_id);
  UPDATE public.labs SET
    rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM public.reviews WHERE lab_id = lab), 0),
    total_reviews = (SELECT COUNT(*) FROM public.reviews WHERE lab_id = lab)
  WHERE id = lab;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_reviews_rating AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.recompute_lab_rating();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- user_roles
CREATE POLICY "roles_select_own_or_admin" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "roles_admin_manage" ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Labs - public read, owner manage, admin manage
CREATE POLICY "labs_public_read" ON public.labs FOR SELECT USING (true);
CREATE POLICY "labs_insert_owner" ON public.labs FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "labs_update_owner_or_admin" ON public.labs FOR UPDATE
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "labs_delete_admin" ON public.labs FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Tests - public read, admin manage
CREATE POLICY "tests_public_read" ON public.tests FOR SELECT USING (true);
CREATE POLICY "tests_admin_manage" ON public.tests FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- lab_tests - public read, lab owner manage
CREATE POLICY "lab_tests_public_read" ON public.lab_tests FOR SELECT USING (true);
CREATE POLICY "lab_tests_owner_manage" ON public.lab_tests FOR ALL
  USING (EXISTS (SELECT 1 FROM public.labs l WHERE l.id = lab_id AND (l.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.labs l WHERE l.id = lab_id AND (l.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

-- Bookings
CREATE POLICY "bookings_patient_select" ON public.bookings FOR SELECT
  USING (auth.uid() = patient_id
         OR EXISTS (SELECT 1 FROM public.labs l WHERE l.id = lab_id AND l.owner_id = auth.uid())
         OR public.has_role(auth.uid(), 'admin')
         OR public.has_role(auth.uid(), 'courier'));
CREATE POLICY "bookings_patient_insert" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "bookings_update" ON public.bookings FOR UPDATE
  USING (auth.uid() = patient_id
         OR EXISTS (SELECT 1 FROM public.labs l WHERE l.id = lab_id AND l.owner_id = auth.uid())
         OR public.has_role(auth.uid(), 'admin')
         OR public.has_role(auth.uid(), 'courier'));

-- Reviews
CREATE POLICY "reviews_public_read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_patient_insert" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "reviews_patient_update" ON public.reviews FOR UPDATE USING (auth.uid() = patient_id);
CREATE POLICY "reviews_patient_delete" ON public.reviews FOR DELETE USING (auth.uid() = patient_id OR public.has_role(auth.uid(), 'admin'));
