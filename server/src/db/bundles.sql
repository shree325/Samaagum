-- =====================================================================
-- Samaagum  |  Table: bundles
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS bundles CASCADE;

CREATE TABLE bundles (
  -- phase: Phase-1.5 | Ticket bundle (buy multiple ticket types together at a package price)
  id                    UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID  NOT NULL REFERENCES tenants(id),
  parent_event_id       UUID  NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name                  TEXT  NOT NULL,
  price_amount_minor    BIGINT,
  price_currency        currency_code,
  max_bundles           INT,
  max_per_booking       INT
);

-- Row-Level Security
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON bundles
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

COMMENT ON TABLE bundles                   IS 'phase:Phase-1.5';
