-- =====================================================================
-- Samaagum  |  Table: affiliates
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS affiliates CASCADE;

CREATE TABLE affiliates (
  -- phase: Phase-1.5 | Registered affiliate (earns commission on referrals)
  id                          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID  NOT NULL REFERENCES tenants(id),
  user_id                     UUID  NOT NULL REFERENCES users(id),
  status                      TEXT  NOT NULL DEFAULT 'active',
  wallet_balance_amount_minor BIGINT,
  wallet_balance_currency     currency_code,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_affiliates_user_id ON affiliates (user_id);

-- Row-Level Security
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON affiliates
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_affiliates_updated ON affiliates;
CREATE TRIGGER trg_affiliates_updated
  BEFORE UPDATE ON affiliates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE affiliates                IS 'phase:Phase-1.5';
