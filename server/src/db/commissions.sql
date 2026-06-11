-- =====================================================================
-- Samaagum  |  Table: affiliate_commissions
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS affiliate_commissions CASCADE;

CREATE TABLE affiliate_commissions (
  -- phase: Phase-1.5 | Commission accrued per booking via a referral link
  id                    UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID  NOT NULL REFERENCES tenants(id),
  affiliate_id          UUID  NOT NULL REFERENCES affiliates(id),
  referral_link_id      UUID  REFERENCES referral_links(id),
  booking_id            UUID  REFERENCES bookings(id),
  amount_amount_minor   BIGINT,
  amount_currency       currency_code,
  status                TEXT  NOT NULL DEFAULT 'accrued',
  journal_id            UUID  REFERENCES ledger_journals(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_affiliate_commissions_affiliate_id ON affiliate_commissions (affiliate_id);

-- Row-Level Security
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON affiliate_commissions
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_affiliate_commissions_updated ON affiliate_commissions;
CREATE TRIGGER trg_affiliate_commissions_updated
  BEFORE UPDATE ON affiliate_commissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE affiliate_commissions     IS 'phase:Phase-1.5';
