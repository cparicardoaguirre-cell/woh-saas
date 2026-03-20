-- ============================================================
-- WoH SaaS — Initial Schema
-- Multi-tenant construction contractor financial reporting
-- ============================================================

-- ── Extensions ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Organizations (CPA firms / tenants) ──────────────────────────────────────
CREATE TABLE organizations (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT    NOT NULL,
  slug        TEXT    UNIQUE NOT NULL,
  plan        TEXT    DEFAULT 'pro',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Organization Members ──────────────────────────────────────────────────────
CREATE TABLE organization_members (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'member', -- owner | admin | member
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- ── Companies (construction companies — each org manages multiple) ────────────
CREATE TABLE companies (
  id              UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT    NOT NULL,
  is_proprietorship BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Reporting Periods per company ─────────────────────────────────────────────
CREATE TABLE reporting_periods (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id  UUID    NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  period_date DATE    NOT NULL,
  qty_months  INTEGER DEFAULT 12,
  is_current  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, period_date)
);

-- ── Puerto Rico Municipalities ────────────────────────────────────────────────
CREATE TABLE municipalities (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE
);

INSERT INTO municipalities (name) VALUES
  ('Adjuntas'),('Aguada'),('Aguadilla'),('Aguas Buenas'),('Aibonito'),
  ('Añasco'),('Arecibo'),('Arroyo'),('Barceloneta'),('Barranquitas'),
  ('Bayamón'),('Cabo Rojo'),('Caguas'),('Camuy'),('Canóvanas'),
  ('Carolina'),('Cataño'),('Cayey'),('Ceiba'),('Ciales'),
  ('Cidra'),('Coamo'),('Comerío'),('Corozal'),('Culebra'),
  ('Dorado'),('Fajardo'),('Florida'),('Guánica'),('Guayama'),
  ('Guayanilla'),('Guaynabo'),('Gurabo'),('Hatillo'),('Hormigueros'),
  ('Humacao'),('Isabela'),('Jayuya'),('Juana Díaz'),('Juncos'),
  ('Lajas'),('Lares'),('Las Marías'),('Las Piedras'),('Loíza'),
  ('Luquillo'),('Manatí'),('Maricao'),('Maunabo'),('Mayagüez'),
  ('Moca'),('Morovis'),('Naguabo'),('Naranjito'),('Orocovis'),
  ('Patillas'),('Peñuelas'),('Ponce'),('Quebradillas'),('Rincón'),
  ('Río Grande'),('Sabana Grande'),('Salinas'),('San Germán'),('San Juan'),
  ('San Lorenzo'),('San Sebastián'),('Santa Isabel'),('Toa Alta'),('Toa Baja'),
  ('Trujillo Alto'),('Utuado'),('Vega Alta'),('Vega Baja'),('Vieques'),
  ('Villalba'),('Yabucoa'),('Yauco');

-- ── Customers / Owners ────────────────────────────────────────────────────────
CREATE TABLE customers (
  id              UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id      UUID    NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            TEXT    NOT NULL,
  phone           TEXT,
  address1        TEXT,
  address2        TEXT,
  city            TEXT,
  state           TEXT,
  zip             TEXT,
  email           TEXT,
  contact_name    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Suppliers ─────────────────────────────────────────────────────────────────
CREATE TABLE suppliers (
  id              UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id      UUID    NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            TEXT    NOT NULL,
  phone           TEXT,
  address1        TEXT,
  address2        TEXT,
  city            TEXT,
  state           TEXT,
  zip             TEXT,
  email           TEXT,
  contact_name    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Jobs / Projects ───────────────────────────────────────────────────────────
CREATE TABLE jobs (
  id                      UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id              UUID    NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  job_number              INTEGER NOT NULL,
  description             TEXT    NOT NULL,
  owner_id                UUID    REFERENCES customers(id),
  customer_id             UUID    REFERENCES customers(id),
  contract_date           DATE,
  completed_date          DATE,
  retainage_pct           NUMERIC(6,4) DEFAULT 0,
  automatic_retainage     BOOLEAN DEFAULT FALSE,
  municipality_id         INTEGER REFERENCES municipalities(id),
  original_contract_amount NUMERIC(15,2) DEFAULT 0,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, job_number)
);

-- ── Change Orders ─────────────────────────────────────────────────────────────
CREATE TABLE change_orders (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id  UUID    NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  job_id      UUID    NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  co_number   INTEGER NOT NULL,
  date        DATE    NOT NULL,
  approved    BOOLEAN DEFAULT FALSE,
  amount      NUMERIC(15,2) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, co_number)
);

-- ── Billings ─────────────────────────────────────────────────────────────────
CREATE TABLE billings (
  id              UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id      UUID    NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  job_id          UUID    NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  customer_id     UUID    REFERENCES customers(id),
  bill_number     INTEGER NOT NULL,
  date            DATE    NOT NULL,
  description     TEXT,
  type            TEXT,
  qty             NUMERIC(15,4),
  price           NUMERIC(15,2),
  amount          NUMERIC(15,2) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Collections (AR Payments) ─────────────────────────────────────────────────
CREATE TABLE collections (
  id              UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id      UUID    NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id     UUID    REFERENCES customers(id),
  job_id          UUID    NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  billing_id      UUID    REFERENCES billings(id),
  payment_date    DATE    NOT NULL,
  reference       TEXT,
  payment_method  TEXT,
  amount          NUMERIC(15,2) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Costs (AP Transactions) ───────────────────────────────────────────────────
CREATE TABLE costs (
  id              UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id      UUID    NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  job_id          UUID    NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  supplier_id     UUID    REFERENCES suppliers(id),
  invoice_number  TEXT,
  date            DATE    NOT NULL,
  type            TEXT,
  qty             NUMERIC(15,4),
  price           NUMERIC(15,2),
  amount          NUMERIC(15,2) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Payments (AP Disbursements) ───────────────────────────────────────────────
CREATE TABLE payments (
  id              UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id      UUID    NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  job_id          UUID    NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  supplier_id     UUID    REFERENCES suppliers(id),
  invoice_number  TEXT,
  payment_date    DATE    NOT NULL,
  payment_method  TEXT,
  type            TEXT,
  amount          NUMERIC(15,2) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Job Data Entries (manual inputs per job per period) ───────────────────────
CREATE TABLE job_data_entries (
  id                      UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id              UUID    NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  job_id                  UUID    NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  data_period             DATE    NOT NULL,
  status                  TEXT    NOT NULL DEFAULT 'In Progress',
    -- In Progress | Completed | Paused | Inactive | Out of Report
  pct_of_desired_cost     NUMERIC(6,4),   -- optional: target cost %
  desired_cost_to_complete NUMERIC(15,2), -- optional: manual CTC override
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, data_period)
);
