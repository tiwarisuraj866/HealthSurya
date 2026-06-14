-- Preview seed: 4 promoted doctors + 4 labs each for Jaunpur and Thane
-- Run via Supabase migration or: SELECT public.seed_preview_listings();

CREATE OR REPLACE FUNCTION public.seed_preview_listings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_owner UUID := 'c0ffee00-0000-4000-8000-000000000001';
  v_doc_owner UUID;
  i INT;
BEGIN
  -- Insert primary owner for labs
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) VALUES (
    v_owner,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'preview-seed@healthsurya.local',
    extensions.crypt('PreviewSeedOnly!', extensions.gen_salt('bf')),
    now(), now(), now(),
    '', '', '', ''
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, full_name, city)
  VALUES (v_owner, 'HealthSurya Preview', 'Jaunpur')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

  -- Create 8 distinct owners for the 8 doctors
  FOR i IN 1..8 LOOP
    v_doc_owner := ('c0ffee00-0000-4000-8000-00000000000' || i::text)::UUID;
    
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      v_doc_owner,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'preview-doctor-' || i::text || '@healthsurya.local',
      extensions.crypt('PreviewSeedOnly!', extensions.gen_salt('bf')),
      now(), now(), now(),
      '', '', '', ''
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, full_name, city)
    VALUES (v_doc_owner, 'Preview Doctor ' || i::text, CASE WHEN i <= 4 THEN 'Jaunpur' ELSE 'Thane' END)
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;
  END LOOP;

  -- Jaunpur doctors (4)
  INSERT INTO public.doctors (
    id, owner_id, slug, full_name, photo_url, qualification, specialization,
    experience_years, clinic_city, clinic_address, clinic_pincode, clinic_phone, whatsapp,
    verified, published, rating, total_reviews, premium_tier, promoted_priority
  ) VALUES
    ('a1000001-0001-4000-8000-000000000001', 'c0ffee00-0000-4000-8000-000000000001', 'dr-rajesh-sharma-jaunpur', 'Dr. Rajesh Sharma',
     'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop',
     'MBBS, MD (Cardiology)', 'Cardiologist', 18, 'Jaunpur', 'Civil Lines, near District Hospital', '222002', '9876501001', '9876501001',
     true, true, 4.9, 32, 'gold', 100),
    ('a1000002-0001-4000-8000-000000000002', 'c0ffee00-0000-4000-8000-000000000002', 'dr-priya-mishra-jaunpur', 'Dr. Priya Mishra',
     'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop',
     'MBBS, MS (OBG)', 'Gynecologist', 12, 'Jaunpur', 'Line Bazar, Shitala Chowk', '222001', '9876501002', '9876501002',
     true, true, 4.8, 28, 'featured', 90),
    ('a1000003-0001-4000-8000-000000000003', 'c0ffee00-0000-4000-8000-000000000003', 'dr-amit-verma-jaunpur', 'Dr. Amit Verma',
     'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop',
     'MBBS, MS (Ortho)', 'Orthopedic Surgeon', 14, 'Jaunpur', 'Sadar Bazar', '222002', '9876501003', '9876501003',
     true, true, 4.7, 24, 'silver', 80),
    ('a1000004-0001-4000-8000-000000000004', 'c0ffee00-0000-4000-8000-000000000004', 'dr-sneha-singh-jaunpur', 'Dr. Sneha Singh',
     'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop',
     'MBBS, DCH', 'Pediatrician', 9, 'Jaunpur', 'Olandganj', '222001', '9876501004', '9876501004',
     true, true, 4.9, 36, 'gold', 85)
  ON CONFLICT (id) DO UPDATE SET
    premium_tier = EXCLUDED.premium_tier,
    promoted_priority = EXCLUDED.promoted_priority,
    published = true,
    rating = EXCLUDED.rating;

  -- Thane doctors (4)
  INSERT INTO public.doctors (
    id, owner_id, slug, full_name, photo_url, qualification, specialization,
    experience_years, clinic_city, clinic_address, clinic_pincode, clinic_phone, whatsapp,
    verified, published, rating, total_reviews, premium_tier, promoted_priority
  ) VALUES
    ('a2000001-0001-4000-8000-000000000001', 'c0ffee00-0000-4000-8000-000000000005', 'dr-karan-mehta-thane', 'Dr. Karan Mehta',
     'https://images.unsplash.com/photo-1537368910025-7002b00da64b?w=200&h=200&fit=crop',
     'MBBS, MD (Dermatology)', 'Dermatologist', 11, 'Thane', 'Ghodbunder Road, Hiranandani Estate', '400607', '9876502001', '9876502001',
     true, true, 4.8, 30, 'gold', 100),
    ('a2000002-0001-4000-8000-000000000002', 'c0ffee00-0000-4000-8000-000000000006', 'dr-ananya-patel-thane', 'Dr. Ananya Patel',
     'https://images.unsplash.com/photo-1651008376811-b90baee41c1f?w=200&h=200&fit=crop',
     'MBBS, MS (ENT)', 'ENT Specialist', 13, 'Thane', 'Viviana Mall, Eastern Express Highway', '400601', '9876502002', '9876502002',
     true, true, 4.9, 40, 'featured', 95),
    ('a2000003-0001-4000-8000-000000000003', 'c0ffee00-0000-4000-8000-000000000007', 'dr-rohit-desai-thane', 'Dr. Rohit Desai',
     'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=200&h=200&fit=crop',
     'MBBS', 'General Physician', 16, 'Thane', 'Kolshet Road, Manpada', '400607', '9876502003', '9876502003',
     true, true, 4.6, 22, 'silver', 75),
    ('a2000004-0001-4000-8000-000000000004', 'c0ffee00-0000-4000-8000-000000000008', 'dr-meera-joshi-thane', 'Dr. Meera Joshi',
     'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop',
     'MBBS, MD (Medicine)', 'Diabetologist', 10, 'Thane', 'Pokhran Road No. 2', '400610', '9876502004', '9876502004',
     true, true, 4.8, 26, 'gold', 88)
  ON CONFLICT (id) DO UPDATE SET
    premium_tier = EXCLUDED.premium_tier,
    promoted_priority = EXCLUDED.promoted_priority,
    published = true,
    rating = EXCLUDED.rating;

  -- Jaunpur labs (4)
  INSERT INTO public.labs (
    id, owner_id, name, description, address, city, pincode, phone, email, image_url,
    verified, rating, total_reviews, home_collection, premium_tier, promoted_priority
  ) VALUES
    ('b1000001-0001-4000-8000-000000000001', v_owner, 'Surya Diagnostic Centre', 'Full body checkups & pathology',
     'Civil Lines, Jaunpur', 'Jaunpur', '222002', '9876511001', 'surya@preview.local',
     'https://images.unsplash.com/photo-1579154204601-01588f351a67?w=400&h=200&fit=crop',
     true, 4.8, 48, true, 'gold', 100),
    ('b1000002-0001-4000-8000-000000000002', v_owner, 'Jaunpur Path Labs', 'NABL-style lab tests',
     'Line Bazar, Jaunpur', 'Jaunpur', '222001', '9876511002', 'path@preview.local',
     'https://images.unsplash.com/photo-1582719471137-c3967ffb1c42?w=400&h=200&fit=crop',
     true, 4.7, 35, true, 'featured', 90),
    ('b1000003-0001-4000-8000-000000000003', v_owner, 'MediScan Healthcare', 'Imaging & diagnostics',
     'Sadar Bazar, Jaunpur', 'Jaunpur', '222002', '9876511003', 'mediscan@preview.local',
     'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=200&fit=crop',
     true, 4.6, 29, true, 'silver', 80),
    ('b1000004-0001-4000-8000-000000000004', v_owner, 'Ayushman Lab & Diagnostics', 'Home collection available',
     'Olandganj, Jaunpur', 'Jaunpur', '222001', '9876511004', 'ayushman@preview.local',
     'https://images.unsplash.com/photo-1532187863486-abf9db3751a5?w=400&h=200&fit=crop',
     true, 4.9, 52, true, 'gold', 85)
  ON CONFLICT (id) DO UPDATE SET
    premium_tier = EXCLUDED.premium_tier,
    promoted_priority = EXCLUDED.promoted_priority,
    rating = EXCLUDED.rating;

  -- Thane labs (4)
  INSERT INTO public.labs (
    id, owner_id, name, description, address, city, pincode, phone, email, image_url,
    verified, rating, total_reviews, home_collection, premium_tier, promoted_priority
  ) VALUES
    ('b2000001-0001-4000-8000-000000000001', v_owner, 'Thane Precision Diagnostics', 'Advanced pathology',
     'Eastern Express Highway, Thane West', 'Thane', '400601', '9876521001', 'precision@preview.local',
     'https://images.unsplash.com/photo-1579154204601-01588f351a67?w=400&h=200&fit=crop',
     true, 4.9, 60, true, 'gold', 100),
    ('b2000002-0001-4000-8000-000000000002', v_owner, 'CityCare Pathology', 'Walk-in & home collection',
     'Ghodbunder Road, Thane', 'Thane', '400607', '9876521002', 'citycare@preview.local',
     'https://images.unsplash.com/photo-1582719471137-c3967ffb1c42?w=400&h=200&fit=crop',
     true, 4.7, 38, true, 'featured', 92),
    ('b2000003-0001-4000-8000-000000000003', v_owner, 'Om Sai Lab Collection', 'Same-day reports',
     'Pokhran Road, Thane', 'Thane', '400610', '9876521003', 'omsai@preview.local',
     'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=200&fit=crop',
     true, 4.8, 44, true, 'silver', 78),
    ('b2000004-0001-4000-8000-000000000004', v_owner, 'HealthFirst Thane', 'Preventive health packages',
     'Hiranandani Estate, Thane', 'Thane', '400601', '9876521004', 'healthfirst@preview.local',
     'https://images.unsplash.com/photo-1532187863486-abf9db3751a5?w=400&h=200&fit=crop',
     true, 4.6, 31, true, 'gold', 86)
  ON CONFLICT (id) DO UPDATE SET
    premium_tier = EXCLUDED.premium_tier,
    promoted_priority = EXCLUDED.promoted_priority,
    rating = EXCLUDED.rating;
END;
$$;

SELECT public.seed_preview_listings();
