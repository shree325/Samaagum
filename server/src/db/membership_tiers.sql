-- =====================================================================
-- Samaagum  |  Table: membership_tiers
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS membership_tiers CASCADE;

CREATE TABLE membership_tiers (
  -- phase: Phase-1.5 | Paid tiers within a group/community
  id                  UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID  NOT NULL REFERENCES tenants(id),
  group_entity_id     UUID  NOT NULL REFERENCES entities(id),
  name                TEXT  NOT NULL,
  price_amount_minor  BIGINT,
  price_currency      currency_code,
  benefits            JSONB,
  status              TEXT  NOT NULL DEFAULT 'active'
);

-- Row-Level Security
ALTER TABLE membership_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON membership_tiers
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

COMMENT ON TABLE membership_tiers          IS 'phase:Phase-1.5';
