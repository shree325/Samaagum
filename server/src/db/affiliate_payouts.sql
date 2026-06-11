-- =====================================================================
-- Samaagum  |  Table: affiliate_payouts
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS affiliate_payouts CASCADE;

CREATE TABLE affiliate_payouts (
  -- phase: Phase-1.5 | Payout disbursement to an affiliate
  id                    UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID  NOT NULL REFERENCES tenants(id),
  affiliate_id          UUID  NOT NULL REFERENCES affiliates(id),
  amount_amount_minor   BIGINT,
  amount_currency       currency_code,
  status                TEXT  NOT NULL DEFAULT 'requested',
  journal_id            UUID  REFERENCES ledger_journals(id),
  paid_at               timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Row-Level Security
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON affiliate_payouts
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_affiliate_payouts_updated ON affiliate_payouts;
CREATE TRIGGER trg_affiliate_payouts_updated
  BEFORE UPDATE ON affiliate_payouts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE affiliate_payouts         IS 'phase:Phase-1.5';
