-- =====================================================================
-- Samaagum  |  Table: addons
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS addons CASCADE;

CREATE TABLE addons (
  -- phase: Phase-1.5 | Optional add-on purchases per event (e.g. t-shirt, meal)
  id                    UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID  NOT NULL REFERENCES tenants(id),
  event_id              UUID  NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name                  TEXT  NOT NULL,
  price_amount_minor    BIGINT,
  price_currency        currency_code,
  inventory             INT,
  -- level: 'attendee' (per ticket) or 'booking' (per order)
  level                 TEXT  NOT NULL DEFAULT 'attendee'
);

-- Row-Level Security
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON addons
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

COMMENT ON TABLE addons                    IS 'phase:Phase-1.5';
