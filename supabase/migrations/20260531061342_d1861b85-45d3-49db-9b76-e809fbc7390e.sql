
-- ============ ENUMS ============
CREATE TYPE public.partner_type AS ENUM ('doctor','laboratory','pharmacy','collection_center','franchise');
CREATE TYPE public.verification_status AS ENUM (
  'draft','submitted','ai_in_progress','manual_review','approved','rejected','suspended','expired'
);
CREATE TYPE public.verification_doc_type AS ENUM (
  'aadhaar','pan','passport','medical_registration','drug_license','nabl_certificate','lab_registration','business_registration','other'
);

-- ============ partner_verifications ============
CREATE TABLE public.partner_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL,
  partner_type public.partner_type NOT NULL,
  status public.verification_status NOT NULL DEFAULT 'draft',
  verification_score NUMERIC(5,2) DEFAULT 0,
  risk_breakdown JSONB DEFAULT '{}'::jsonb,
  full_name TEXT,
  registration_number TEXT,
  authority_name TEXT,
  issue_date DATE,
  expiry_date DATE,
  address TEXT,
  ai_summary TEXT,
  reviewer_id UUID,
  reviewer_remarks TEXT,
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pv_partner ON public.partner_verifications(partner_id);
CREATE INDEX idx_pv_status ON public.partner_verifications(status);
CREATE INDEX idx_pv_expiry ON public.partner_verifications(expiry_date);

GRANT SELECT, INSERT, UPDATE ON public.partner_verifications TO authenticated;
GRANT ALL ON public.partner_verifications TO service_role;
ALTER TABLE public.partner_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY pv_select ON public.partner_verifications FOR SELECT TO authenticated
  USING (auth.uid() = partner_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY pv_insert ON public.partner_verifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = partner_id);
CREATE POLICY pv_update_self_draft ON public.partner_verifications FOR UPDATE TO authenticated
  USING ((auth.uid() = partner_id AND status IN ('draft','rejected')) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK ((auth.uid() = partner_id AND status IN ('draft','rejected','submitted')) OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER pv_updated_at BEFORE UPDATE ON public.partner_verifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ verification_documents ============
CREATE TABLE public.verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL REFERENCES public.partner_verifications(id) ON DELETE CASCADE,
  document_type public.verification_doc_type NOT NULL,
  file_url TEXT NOT NULL,
  extracted_data JSONB DEFAULT '{}'::jsonb,
  ai_score NUMERIC(5,2) DEFAULT 0,
  flags JSONB DEFAULT '[]'::jsonb,
  classified_as TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vd_ver ON public.verification_documents(verification_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.verification_documents TO authenticated;
GRANT ALL ON public.verification_documents TO service_role;
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY vd_select ON public.verification_documents FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.partner_verifications p
    WHERE p.id = verification_id AND (p.partner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY vd_insert ON public.verification_documents FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.partner_verifications p
    WHERE p.id = verification_id AND p.partner_id = auth.uid() AND p.status IN ('draft','rejected')));
CREATE POLICY vd_delete ON public.verification_documents FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.partner_verifications p
    WHERE p.id = verification_id AND p.partner_id = auth.uid() AND p.status IN ('draft','rejected')));
CREATE POLICY vd_update_admin ON public.verification_documents FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- ============ verification_logs ============
CREATE TABLE public.verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL REFERENCES public.partner_verifications(id) ON DELETE CASCADE,
  actor_id UUID,
  action TEXT NOT NULL,
  remarks TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vl_ver ON public.verification_logs(verification_id);

GRANT SELECT, INSERT ON public.verification_logs TO authenticated;
GRANT ALL ON public.verification_logs TO service_role;
ALTER TABLE public.verification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY vl_select ON public.verification_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.partner_verifications p
    WHERE p.id = verification_id AND (p.partner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY vl_insert ON public.verification_logs FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- ============ notifications ============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  kind TEXT NOT NULL DEFAULT 'info',
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_user ON public.notifications(user_id, read_at);

GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notif_select ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY notif_update_own ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY notif_insert_self_or_admin ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- ============ Storage bucket ============
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-docs','verification-docs', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "verdocs_owner_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='verification-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "verdocs_admin_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='verification-docs' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "verdocs_owner_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='verification-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "verdocs_owner_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id='verification-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============ Decision RPC ============
CREATE OR REPLACE FUNCTION public.decide_verification(
  _verification_id UUID,
  _decision TEXT,           -- 'approved' | 'rejected' | 'suspended' | 'manual_review'
  _remarks TEXT DEFAULT NULL
) RETURNS public.partner_verifications
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid UUID := auth.uid();
  _row public.partner_verifications;
  _new_status public.verification_status;
BEGIN
  IF NOT public.has_role(_uid,'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  IF _decision NOT IN ('approved','rejected','suspended','manual_review') THEN
    RAISE EXCEPTION 'Invalid decision';
  END IF;
  _new_status := _decision::public.verification_status;

  UPDATE public.partner_verifications
    SET status = _new_status,
        reviewer_id = _uid,
        reviewer_remarks = _remarks,
        verified_at = CASE WHEN _new_status='approved' THEN now() ELSE verified_at END,
        rejected_at = CASE WHEN _new_status='rejected' THEN now() ELSE rejected_at END,
        suspended_at = CASE WHEN _new_status='suspended' THEN now() ELSE suspended_at END,
        updated_at = now()
    WHERE id = _verification_id
    RETURNING * INTO _row;

  INSERT INTO public.verification_logs(verification_id, actor_id, action, remarks)
    VALUES (_verification_id, _uid, 'decision:'||_decision, _remarks);

  INSERT INTO public.notifications(user_id, title, body, kind, link)
    VALUES (_row.partner_id,
      'Verification ' || _decision,
      COALESCE(_remarks, 'Your partner verification was ' || _decision || '.'),
      CASE _decision WHEN 'approved' THEN 'success' WHEN 'rejected' THEN 'error' ELSE 'info' END,
      '/verify');

  RETURN _row;
END $$;

GRANT EXECUTE ON FUNCTION public.decide_verification(UUID,TEXT,TEXT) TO authenticated;

-- ============ Submit RPC ============
CREATE OR REPLACE FUNCTION public.submit_verification(_verification_id UUID)
RETURNS public.partner_verifications
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _row public.partner_verifications;
BEGIN
  UPDATE public.partner_verifications
    SET status='submitted', submitted_at=now(), updated_at=now()
    WHERE id=_verification_id AND partner_id=auth.uid() AND status IN ('draft','rejected')
    RETURNING * INTO _row;
  IF _row.id IS NULL THEN RAISE EXCEPTION 'Cannot submit'; END IF;
  INSERT INTO public.verification_logs(verification_id, actor_id, action)
    VALUES (_verification_id, auth.uid(), 'submitted');
  RETURN _row;
END $$;
GRANT EXECUTE ON FUNCTION public.submit_verification(UUID) TO authenticated;

-- ============ Expiry sweep (call daily via cron) ============
CREATE OR REPLACE FUNCTION public.flag_expiring_verifications()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _r RECORD; _count INT := 0;
BEGIN
  -- Suspend expired
  FOR _r IN SELECT * FROM public.partner_verifications
    WHERE status='approved' AND expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE LOOP
    UPDATE public.partner_verifications SET status='expired', updated_at=now() WHERE id=_r.id;
    INSERT INTO public.notifications(user_id,title,body,kind,link)
      VALUES (_r.partner_id,'Verification expired','Your documents have expired. Please re-upload.','error','/verify');
    _count := _count + 1;
  END LOOP;
  -- Remind 90/30/7 days out
  FOR _r IN SELECT * FROM public.partner_verifications
    WHERE status='approved' AND expiry_date IS NOT NULL
      AND expiry_date - CURRENT_DATE IN (90,30,7) LOOP
    INSERT INTO public.notifications(user_id,title,body,kind,link)
      VALUES (_r.partner_id,'Document expiring soon',
        'Your verification expires on '||_r.expiry_date||'. Please renew.','warning','/verify');
    _count := _count + 1;
  END LOOP;
  RETURN _count;
END $$;
GRANT EXECUTE ON FUNCTION public.flag_expiring_verifications() TO authenticated;
