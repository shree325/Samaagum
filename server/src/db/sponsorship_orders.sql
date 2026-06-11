-- =====================================================================
-- Samaagum  |  Table: sponsorship_orders
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS sponsorship_orders CASCADE;

CREATE TABLE sponsorship_orders (
  -- phase: Phase-1.5 | Sponsor purchasing a sponsorship package
  id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID  NOT NULL REFERENCES tenants(id),
  package_id  UUID  NOT NULL REFERENCES sponsorship_packages(id),
  sponsor_id  UUID  NOT NULL REFERENCES sponsors(id),
  status      TEXT  NOT NULL DEFAULT 'pending',
  journal_id  UUID  REFERENCES ledger_journals(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Row-Level Security
ALTER TABLE sponsorship_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON sponsorship_orders
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_sponsorship_orders_updated ON sponsorship_orders;
CREATE TRIGGER trg_sponsorship_orders_updated
  BEFORE UPDATE ON sponsorship_orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE sponsorship_orders        IS 'phase:Phase-1.5';
