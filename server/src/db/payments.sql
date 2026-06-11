-- =====================================================================
-- Samaagum  |  Table: payments
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS payments CASCADE;

CREATE TABLE payments (
  -- phase: MVP-0 | Payment transaction for a booking
  id                    UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID            NOT NULL REFERENCES tenants(id),
  booking_id            UUID            NOT NULL REFERENCES bookings(id),
  method                payment_method  NOT NULL,
  status                payment_status  NOT NULL DEFAULT 'initiated',
  gateway_order_id      TEXT,
  gateway_payment_id    TEXT,
  amount_amount_minor   BIGINT,
  amount_currency       currency_code,
  -- proof_asset_id FK deferred (after media_assets)
  proof_asset_id        UUID,
  UNIQUE (gateway_payment_id),
  created_at            timestamptz     NOT NULL DEFAULT now(),
  updated_at            timestamptz     NOT NULL DEFAULT now()
);


-- Deferred: enforce waitlist_entries.hold_payment_id (payments created after waitlist_entries)
ALTER TABLE waitlist_entries ADD CONSTRAINT fk_waitlist_payment FOREIGN KEY (hold_payment_id) REFERENCES payments(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_payments_booking_id ON payments (booking_id);
CREATE INDEX idx_payments_status ON payments (status);

-- Row-Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON payments
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_payments_updated ON payments;
CREATE TRIGGER trg_payments_updated
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE payments                  IS 'phase:MVP-0';
