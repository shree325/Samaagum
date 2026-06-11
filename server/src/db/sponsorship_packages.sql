-- =====================================================================
-- Samaagum  |  Table: sponsorship_packages
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS sponsorship_packages CASCADE;

CREATE TABLE sponsorship_packages (
  -- phase: Phase-1.5 | Defined sponsorship tier for an event
  id                    UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID  NOT NULL REFERENCES tenants(id),
  event_id              UUID  NOT NULL REFERENCES events(id),
  name                  TEXT  NOT NULL,
  price_amount_minor    BIGINT,
  price_currency        currency_code,
  assets                JSONB
);

-- Row-Level Security
ALTER TABLE sponsorship_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON sponsorship_packages
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

COMMENT ON TABLE sponsorship_packages      IS 'phase:Phase-1.5';
