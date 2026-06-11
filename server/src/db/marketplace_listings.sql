-- =====================================================================
-- Samaagum  |  Table: marketplace_listings
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS marketplace_listings CASCADE;

CREATE TABLE marketplace_listings (
  -- phase: Phase-2 | Group/community marketplace listing (buy/sell groups)
  id                        UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID          NOT NULL REFERENCES tenants(id),
  group_entity_id           UUID          NOT NULL REFERENCES entities(id),
  seller_user_id            UUID          NOT NULL REFERENCES users(id),
  state                     listing_state NOT NULL DEFAULT 'draft',
  asking_price_amount_minor BIGINT,
  asking_price_currency     currency_code,
  created_at                timestamptz   NOT NULL DEFAULT now(),
  updated_at                timestamptz   NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_marketplace_listings_state ON marketplace_listings (state);

-- Row-Level Security
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON marketplace_listings
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_marketplace_listings_updated ON marketplace_listings;
CREATE TRIGGER trg_marketplace_listings_updated
  BEFORE UPDATE ON marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE marketplace_listings      IS 'phase:Phase-2';
