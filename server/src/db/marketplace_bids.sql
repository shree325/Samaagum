-- =====================================================================
-- Samaagum  |  Table: marketplace_bids
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS marketplace_bids CASCADE;

CREATE TABLE marketplace_bids (
  -- phase: Phase-2 | Bid placed on a marketplace listing
  id                UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID  NOT NULL REFERENCES tenants(id),
  listing_id        UUID  NOT NULL REFERENCES marketplace_listings(id),
  bidder_user_id    UUID  NOT NULL REFERENCES users(id),
  bid_amount_minor  BIGINT,
  bid_currency      currency_code,
  status            TEXT  NOT NULL DEFAULT 'open',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Row-Level Security
ALTER TABLE marketplace_bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON marketplace_bids
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_marketplace_bids_updated ON marketplace_bids;
CREATE TRIGGER trg_marketplace_bids_updated
  BEFORE UPDATE ON marketplace_bids
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE marketplace_bids          IS 'phase:Phase-2';
