-- =====================================================================
-- Samaagum  |  Table: referral_clicks
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS referral_clicks CASCADE;

CREATE TABLE referral_clicks (
  -- phase: Phase-1.5 | Tracks each click on a referral link
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID        NOT NULL REFERENCES tenants(id),
  referral_link_id      UUID        NOT NULL REFERENCES referral_links(id),
  clicked_at            timestamptz NOT NULL DEFAULT now(),
  ip_hash               TEXT,
  user_agent            TEXT,
  converted_booking_id  UUID        REFERENCES bookings(id)
);

-- Indexes
CREATE INDEX idx_referral_clicks_referral_link_id ON referral_clicks (referral_link_id);

-- Row-Level Security
ALTER TABLE referral_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON referral_clicks
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

COMMENT ON TABLE referral_clicks           IS 'phase:Phase-1.5';
