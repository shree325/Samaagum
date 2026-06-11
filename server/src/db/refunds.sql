-- =====================================================================
-- Samaagum  |  Table: refunds
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS refunds CASCADE;

CREATE TABLE refunds (
  -- phase: MVP-0 | Refund request and tracking for a payment
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID          NOT NULL REFERENCES tenants(id),
  payment_id            UUID          NOT NULL REFERENCES payments(id),
  line_item_id          UUID          REFERENCES booking_line_items(id),
  amount_amount_minor   BIGINT,
  amount_currency       currency_code,
  mode                  refund_mode   NOT NULL DEFAULT 'gateway',
  status                refund_status NOT NULL DEFAULT 'requested',
  reason                TEXT,
  maker_user_id         UUID          REFERENCES users(id),
  checker_user_id       UUID          REFERENCES users(id),
  created_at            timestamptz   NOT NULL DEFAULT now(),
  updated_at            timestamptz   NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_refunds_payment_id ON refunds (payment_id);

-- Row-Level Security
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON refunds
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_refunds_updated ON refunds;
CREATE TRIGGER trg_refunds_updated
  BEFORE UPDATE ON refunds
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE refunds                   IS 'phase:MVP-0';
