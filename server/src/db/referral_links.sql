-- =====================================================================
-- Samaagum  |  Table: referral_links
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS referral_links CASCADE;

CREATE TABLE referral_links (
  -- phase: Phase-1.5 | Unique referral link per affiliate per event
  id              UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID  NOT NULL REFERENCES tenants(id),
  affiliate_id    UUID  NOT NULL REFERENCES affiliates(id),
  event_id        UUID  REFERENCES events(id),
  code            TEXT  UNIQUE NOT NULL,
  commission_rule JSONB,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_referral_links_affiliate_id ON referral_links (affiliate_id);

-- Row-Level Security
ALTER TABLE referral_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON referral_links
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_referral_links_updated ON referral_links;
CREATE TRIGGER trg_referral_links_updated
  BEFORE UPDATE ON referral_links
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE referral_links            IS 'phase:Phase-1.5';
