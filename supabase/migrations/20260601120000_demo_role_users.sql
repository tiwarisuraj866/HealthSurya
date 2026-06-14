-- Demo role users for development / staging (email + password login).
-- Run: SELECT public.seed_demo_users();
-- Or: npm run seed:demo-users (recommended for hosted Supabase)

CREATE OR REPLACE FUNCTION public._upsert_demo_auth_user(
  p_id UUID,
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_role public.app_role,
  p_phone TEXT DEFAULT '',
  p_city TEXT DEFAULT 'Jaunpur'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_meta JSONB;
BEGIN
  v_meta := jsonb_build_object(
    'full_name', p_full_name,
    'role', p_role::text,
    'phone', COALESCE(p_phone, '')
  );

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) VALUES (
    p_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    lower(p_email),
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    v_meta,
    now(),
    now(),
    '', '', '', ''
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    email_confirmed_at = COALESCE(auth.users.email_confirmed_at, now()),
    updated_at = now();

  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    p_id,
    p_id,
    lower(p_email),
    jsonb_build_object(
      'sub', p_id::text,
      'email', lower(p_email),
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    now(),
    now(),
    now()
  )
  ON CONFLICT (provider, provider_id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    identity_data = EXCLUDED.identity_data,
    updated_at = now();

  INSERT INTO public.profiles (id, full_name, phone, city)
  VALUES (p_id, p_full_name, COALESCE(p_phone, ''), p_city)
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    city = EXCLUDED.city;

  DELETE FROM public.user_roles WHERE user_id = p_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (p_id, p_role);
END;
$$;

CREATE OR REPLACE FUNCTION public.seed_demo_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Patients
  PERFORM public._upsert_demo_auth_user('b1000001-0001-4000-8000-000000000001'::uuid, 'rahul.patient@healthsurya.com', 'Patient@123', 'Rahul Sharma', 'patient', '9876500101', 'Jaunpur');
  PERFORM public._upsert_demo_auth_user('b1000002-0001-4000-8000-000000000002'::uuid, 'priya.patient@healthsurya.com', 'Patient@123', 'Priya Verma', 'patient', '9876500102', 'Jaunpur');
  PERFORM public._upsert_demo_auth_user('b1000003-0001-4000-8000-000000000003'::uuid, 'amit.patient@healthsurya.com', 'Patient@123', 'Amit Singh', 'patient', '9876500103', 'Thane');

  -- Doctors
  PERFORM public._upsert_demo_auth_user('c1000001-0001-4000-8000-000000000001'::uuid, 'rajesh.doctor@healthsurya.com', 'Doctor@123', 'Dr. Rajesh Gupta', 'doctor', '9876500201', 'Jaunpur');
  PERFORM public._upsert_demo_auth_user('c1000002-0001-4000-8000-000000000002'::uuid, 'neha.doctor@healthsurya.com', 'Doctor@123', 'Dr. Neha Kapoor', 'doctor', '9876500202', 'Jaunpur');
  PERFORM public._upsert_demo_auth_user('c1000003-0001-4000-8000-000000000003'::uuid, 'vikram.doctor@healthsurya.com', 'Doctor@123', 'Dr. Vikram Mehta', 'doctor', '9876500203', 'Thane');

  -- Lab partners
  PERFORM public._upsert_demo_auth_user('d1000001-0001-4000-8000-000000000001'::uuid, 'pathcare.lab@healthsurya.com', 'Lab@123', 'PathCare Diagnostics', 'lab', '9876500301', 'Jaunpur');
  PERFORM public._upsert_demo_auth_user('d1000002-0001-4000-8000-000000000002'::uuid, 'medlife.lab@healthsurya.com', 'Lab@123', 'MedLife Labs', 'lab', '9876500302', 'Jaunpur');
  PERFORM public._upsert_demo_auth_user('d1000003-0001-4000-8000-000000000003'::uuid, 'city.lab@healthsurya.com', 'Lab@123', 'City Diagnostics', 'lab', '9876500303', 'Thane');

  -- Couriers
  PERFORM public._upsert_demo_auth_user('e1000001-0001-4000-8000-000000000001'::uuid, 'ravi.courier@healthsurya.com', 'Courier@123', 'Ravi Delivery', 'courier', '9876500401', 'Jaunpur');
  PERFORM public._upsert_demo_auth_user('e1000002-0001-4000-8000-000000000002'::uuid, 'express.courier@healthsurya.com', 'Courier@123', 'Express Pickup', 'courier', '9876500402', 'Thane');
  PERFORM public._upsert_demo_auth_user('e1000003-0001-4000-8000-000000000003'::uuid, 'logistics.courier@healthsurya.com', 'Courier@123', 'Health Logistics', 'courier', '9876500403', 'Jaunpur');

  -- Admins
  PERFORM public._upsert_demo_auth_user('f1000001-0001-4000-8000-000000000001'::uuid, 'admin@healthsurya.com', 'Admin@123', 'Suraj Tiwari', 'admin', '9876500501', 'Jaunpur');
  PERFORM public._upsert_demo_auth_user('f1000002-0001-4000-8000-000000000002'::uuid, 'operations@healthsurya.com', 'Ops@123', 'Operations Admin', 'admin', '9876500502', 'Jaunpur');
  PERFORM public._upsert_demo_auth_user('f1000003-0001-4000-8000-000000000003'::uuid, 'support@healthsurya.com', 'Support@123', 'Support Admin', 'admin', '9876500503', 'Jaunpur');
END;
$$;

COMMENT ON FUNCTION public.seed_demo_users() IS 'Dev/staging only: creates demo logins. Do not run in production.';
