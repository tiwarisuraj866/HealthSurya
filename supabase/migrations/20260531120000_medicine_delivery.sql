-- Medicine delivery module (PharmEasy-style catalog + Zomato-style tracking)

CREATE TYPE public.medicine_order_status AS ENUM (
  'pending',
  'confirmed',
  'packing',
  'picked_up',
  'out_for_delivery',
  'nearby',
  'delivered',
  'cancelled'
);

CREATE TYPE public.payment_mode AS ENUM ('cod', 'prepaid', 'wallet');

CREATE TABLE public.pharmacies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  pincode TEXT NOT NULL,
  phone TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  express_delivery BOOLEAN NOT NULL DEFAULT true,
  min_order_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 49,
  rating NUMERIC(2,1) NOT NULL DEFAULT 4.5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pharmacies_city ON public.pharmacies(city);
CREATE INDEX idx_pharmacies_pincode ON public.pharmacies(pincode);
CREATE TRIGGER trg_pharmacies_updated BEFORE UPDATE ON public.pharmacies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  manufacturer TEXT,
  pack_size TEXT,
  requires_prescription BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_medicines_category ON public.medicines(category);
CREATE INDEX idx_medicines_name ON public.medicines(name);

CREATE TABLE public.pharmacy_medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  price NUMERIC(10,2) NOT NULL,
  mrp NUMERIC(10,2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 100,
  express_delivery BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(pharmacy_id, medicine_id)
);
CREATE INDEX idx_pharmacy_medicines_med ON public.pharmacy_medicines(medicine_id);

CREATE TABLE public.medicine_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL DEFAULT '',
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id),
  status public.medicine_order_status NOT NULL DEFAULT 'pending',
  delivery_address TEXT NOT NULL,
  pincode TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT NOT NULL,
  notes TEXT,
  prescription_url TEXT,
  payment_mode public.payment_mode NOT NULL DEFAULT 'cod',
  subtotal NUMERIC(10,2) NOT NULL,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  eta_minutes INTEGER,
  rider_name TEXT,
  rider_phone TEXT,
  rider_lat NUMERIC(10,6),
  rider_lng NUMERIC(10,6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_medicine_orders_number ON public.medicine_orders(order_number);
CREATE UNIQUE INDEX idx_medicine_orders_number_unique ON public.medicine_orders(order_number) WHERE order_number <> '';
CREATE INDEX idx_medicine_orders_status ON public.medicine_orders(status);
CREATE TRIGGER trg_medicine_orders_updated BEFORE UPDATE ON public.medicine_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.medicine_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.medicine_orders(id) ON DELETE CASCADE,
  medicine_id UUID REFERENCES public.medicines(id),
  medicine_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_moi_order ON public.medicine_order_items(order_id);

CREATE TABLE public.order_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.medicine_orders(id) ON DELETE CASCADE,
  status public.medicine_order_status NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ote_order ON public.order_tracking_events(order_id, created_at);

-- Auto order number + tracking on insert/update
CREATE OR REPLACE FUNCTION public.gen_order_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'HS' || to_char(now(), 'YYMMDD') || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_order_number BEFORE INSERT ON public.medicine_orders
  FOR EACH ROW EXECUTE FUNCTION public.gen_order_number();

CREATE OR REPLACE FUNCTION public.log_order_tracking()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  t_title TEXT;
  t_desc TEXT;
BEGIN
  IF TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status THEN
    t_title := CASE NEW.status
      WHEN 'pending' THEN 'Order placed'
      WHEN 'confirmed' THEN 'Pharmacy confirmed'
      WHEN 'packing' THEN 'Being packed'
      WHEN 'picked_up' THEN 'Picked up'
      WHEN 'out_for_delivery' THEN 'Out for delivery'
      WHEN 'nearby' THEN 'Rider is nearby'
      WHEN 'delivered' THEN 'Delivered'
      WHEN 'cancelled' THEN 'Cancelled'
      ELSE NEW.status::text
    END;
    t_desc := CASE NEW.status
      WHEN 'pending' THEN 'We received your order.'
      WHEN 'confirmed' THEN 'HealthSurya pharmacy accepted your order.'
      WHEN 'packing' THEN 'Your medicines are being packed with care.'
      WHEN 'picked_up' THEN 'Delivery partner picked up your order.'
      WHEN 'out_for_delivery' THEN 'On the way to your address.'
      WHEN 'nearby' THEN 'Almost there! Please keep your phone handy.'
      WHEN 'delivered' THEN 'Order delivered successfully.'
      WHEN 'cancelled' THEN 'This order was cancelled.'
      ELSE NULL
    END;
    INSERT INTO public.order_tracking_events (order_id, status, title, description)
    VALUES (NEW.id, NEW.status, t_title, t_desc);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_order_tracking AFTER INSERT OR UPDATE OF status ON public.medicine_orders
  FOR EACH ROW EXECUTE FUNCTION public.log_order_tracking();

-- RLS
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tracking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY pharmacies_public_read ON public.pharmacies FOR SELECT USING (true);
CREATE POLICY pharmacies_owner_manage ON public.pharmacies FOR ALL
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY medicines_public_read ON public.medicines FOR SELECT USING (true);
CREATE POLICY medicines_admin_manage ON public.medicines FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY pm_public_read ON public.pharmacy_medicines FOR SELECT USING (true);
CREATE POLICY pm_owner_manage ON public.pharmacy_medicines FOR ALL
  USING (EXISTS (SELECT 1 FROM public.pharmacies p WHERE p.id = pharmacy_id AND (p.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pharmacies p WHERE p.id = pharmacy_id AND (p.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE POLICY mo_patient_select ON public.medicine_orders FOR SELECT
  USING (auth.uid() = patient_id
    OR EXISTS (SELECT 1 FROM public.pharmacies p WHERE p.id = pharmacy_id AND p.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'courier'));
CREATE POLICY mo_patient_insert ON public.medicine_orders FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY mo_update ON public.medicine_orders FOR UPDATE
  USING (auth.uid() = patient_id
    OR EXISTS (SELECT 1 FROM public.pharmacies p WHERE p.id = pharmacy_id AND p.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'courier'));

CREATE POLICY moi_select ON public.medicine_order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.medicine_orders o WHERE o.id = order_id AND (
    o.patient_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.pharmacies p WHERE p.id = o.pharmacy_id AND p.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'courier')
  )));
CREATE POLICY moi_insert ON public.medicine_order_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.medicine_orders o WHERE o.id = order_id AND o.patient_id = auth.uid()));

CREATE POLICY ote_select ON public.order_tracking_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.medicine_orders o WHERE o.id = order_id AND (
    o.patient_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.pharmacies p WHERE p.id = o.pharmacy_id AND p.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'courier')
  )));

GRANT SELECT ON public.pharmacies, public.medicines, public.pharmacy_medicines TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.medicine_orders TO authenticated;
GRANT SELECT, INSERT ON public.medicine_order_items TO authenticated;
GRANT SELECT ON public.order_tracking_events TO authenticated;

-- Demo pharmacy + catalog seed
INSERT INTO public.pharmacies (id, name, address, city, pincode, phone, verified, express_delivery, delivery_fee)
VALUES (
  'a0000000-0000-4000-8000-000000000001',
  'HealthSurya Express Pharmacy',
  '12 MG Road, Andheri East',
  'Mumbai',
  '400001',
  '1800-123-4567',
  true,
  true,
  29
) ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.medicines LIMIT 1) THEN
    INSERT INTO public.medicines (name, slug, category, description, manufacturer, pack_size, requires_prescription) VALUES
      ('Paracetamol 650mg', 'paracetamol-650', 'Pain Relief', 'Fast fever & pain relief', 'HealthSurya Generics', '15 tablets', false),
      ('Cetirizine 10mg', 'cetirizine-10', 'Allergy', 'Anti-allergy tablet', 'Cipla', '10 tablets', false),
      ('Azithromycin 500mg', 'azithromycin-500', 'Antibiotics', 'Prescription antibiotic', 'Sun Pharma', '3 tablets', true),
      ('Metformin 500mg', 'metformin-500', 'Diabetes', 'Blood sugar management', 'USV', '20 tablets', true),
      ('Vitamin D3 60K', 'vitamin-d3-60k', 'Vitamins', 'Weekly vitamin D supplement', 'HealthSurya Wellness', '4 capsules', false),
      ('ORS Powder', 'ors-powder', 'Digestive Care', 'Oral rehydration salts', 'FDC', '1 sachet', false),
      ('Dolo 650', 'dolo-650', 'Pain Relief', 'Trusted paracetamol brand', 'Micro Labs', '15 tablets', false),
      ('Telma 40', 'telma-40', 'Heart Care', 'Blood pressure management', 'Glenmark', '15 tablets', true),
      ('Zincovit Tablet', 'zincovit', 'Vitamins', 'Multivitamin with minerals', 'Apex', '15 tablets', false),
      ('Vicks Vaporub', 'vicks-vaporub', 'Personal Care', 'Cold relief balm', 'P&G', '50ml', false),
      ('Dettol Antiseptic', 'dettol', 'Personal Care', 'Antiseptic liquid', 'Reckitt', '550ml', false),
      ('Accu-Chek Strips', 'accu-chek-strips', 'Diabetes', 'Glucose test strips', 'Roche', '50 strips', false);

    INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, mrp, stock, express_delivery)
    SELECT 'a0000000-0000-4000-8000-000000000001', m.id,
      CASE m.slug
        WHEN 'paracetamol-650' THEN 28 WHEN 'cetirizine-10' THEN 35 WHEN 'azithromycin-500' THEN 89
        WHEN 'metformin-500' THEN 42 WHEN 'vitamin-d3-60k' THEN 120 WHEN 'ors-powder' THEN 22
        WHEN 'dolo-650' THEN 32 WHEN 'telma-40' THEN 145 WHEN 'zincovit' THEN 165
        WHEN 'vicks-vaporub' THEN 95 WHEN 'dettol' THEN 110 WHEN 'accu-chek-strips' THEN 890
        ELSE 99
      END,
      CASE m.slug
        WHEN 'paracetamol-650' THEN 40 WHEN 'cetirizine-10' THEN 55 WHEN 'azithromycin-500' THEN 120
        WHEN 'metformin-500' THEN 58 WHEN 'vitamin-d3-60k' THEN 180 WHEN 'ors-powder' THEN 30
        WHEN 'dolo-650' THEN 45 WHEN 'telma-40' THEN 195 WHEN 'zincovit' THEN 220
        WHEN 'vicks-vaporub' THEN 130 WHEN 'dettol' THEN 145 WHEN 'accu-chek-strips' THEN 1100
        ELSE 120
      END,
      200, true
    FROM public.medicines m;
  END IF;
END $$;
