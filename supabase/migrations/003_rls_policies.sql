-- ============================================================
-- WoH SaaS — Row Level Security (Multi-tenancy)
-- ============================================================

ALTER TABLE organizations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies              ENABLE ROW LEVEL SECURITY;
ALTER TABLE reporting_periods      ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE billings               ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections            ENABLE ROW LEVEL SECURITY;
ALTER TABLE costs                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_data_entries       ENABLE ROW LEVEL SECURITY;
ALTER TABLE municipalities         ENABLE ROW LEVEL SECURITY;

-- ── Helper: get org IDs for current user ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.user_org_ids()
RETURNS UUID[] LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT ARRAY(
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
$$;

-- ── Helper: get company IDs for current user ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.user_company_ids()
RETURNS UUID[] LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT ARRAY(
    SELECT c.id FROM companies c
    WHERE c.organization_id = ANY(public.user_org_ids())
  )
$$;

-- ── Policies ──────────────────────────────────────────────────────────────────

CREATE POLICY "users see their orgs"
  ON organizations FOR ALL USING (id = ANY(public.user_org_ids()));

CREATE POLICY "users see their org members"
  ON organization_members FOR ALL USING (organization_id = ANY(public.user_org_ids()));

CREATE POLICY "users see their companies"
  ON companies FOR ALL USING (organization_id = ANY(public.user_org_ids()));

CREATE POLICY "users see their periods"
  ON reporting_periods FOR ALL USING (company_id = ANY(public.user_company_ids()));

CREATE POLICY "users see their customers"
  ON customers FOR ALL USING (company_id = ANY(public.user_company_ids()));

CREATE POLICY "users see their suppliers"
  ON suppliers FOR ALL USING (company_id = ANY(public.user_company_ids()));

CREATE POLICY "users see their jobs"
  ON jobs FOR ALL USING (company_id = ANY(public.user_company_ids()));

CREATE POLICY "users see their change orders"
  ON change_orders FOR ALL USING (company_id = ANY(public.user_company_ids()));

CREATE POLICY "users see their billings"
  ON billings FOR ALL USING (company_id = ANY(public.user_company_ids()));

CREATE POLICY "users see their collections"
  ON collections FOR ALL USING (company_id = ANY(public.user_company_ids()));

CREATE POLICY "users see their costs"
  ON costs FOR ALL USING (company_id = ANY(public.user_company_ids()));

CREATE POLICY "users see their payments"
  ON payments FOR ALL USING (company_id = ANY(public.user_company_ids()));

CREATE POLICY "users see their job data entries"
  ON job_data_entries FOR ALL USING (company_id = ANY(public.user_company_ids()));

CREATE POLICY "municipalities are public"
  ON municipalities FOR SELECT USING (true);

-- ── Auto-create org on user signup ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_org_id UUID;
  org_name   TEXT;
BEGIN
  org_name := COALESCE(
    NEW.raw_user_meta_data->>'organization_name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.organizations (name, slug)
  VALUES (
    org_name,
    lower(regexp_replace(org_name, '[^a-zA-Z0-9]', '-', 'g'))
    || '-' || substr(gen_random_uuid()::text, 1, 6)
  )
  RETURNING id INTO new_org_id;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
