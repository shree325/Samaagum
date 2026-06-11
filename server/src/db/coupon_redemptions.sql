-- =====================================================================
-- Samaagum  |  Table: coupon_redemptions
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS coupon_redemptions CASCADE;

CREATE TABLE coupon_redemptions (
  -- phase: MVP-0 | Tracks which bookings redeemed which coupons
  id                          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID  NOT NULL REFERENCES tenants(id),
  coupon_id                   UUID  NOT NULL REFERENCES coupons(id),
  booking_id                  UUID  NOT NULL REFERENCES bookings(id),
  line_item_id                UUID  REFERENCES booking_line_items(id),
  user_id                     UUID  NOT NULL REFERENCES users(id),
  discount_applied_amount_minor BIGINT,
  discount_applied_currency   currency_code
);

-- Indexes
CREATE INDEX idx_coupon_redemptions_coupon_id ON coupon_redemptions (coupon_id);
CREATE INDEX idx_coupon_redemptions_booking_id ON coupon_redemptions (booking_id);

-- Row-Level Security
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON coupon_redemptions
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

COMMENT ON TABLE coupon_redemptions        IS 'phase:MVP-0';
