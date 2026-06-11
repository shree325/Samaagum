-- =====================================================================
-- Samaagum  |  Table: coupons
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS coupons CASCADE;

CREATE TABLE coupons (
  -- phase: MVP-0 | Discount coupon codes scoped to an event
  id                        UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID            NOT NULL REFERENCES tenants(id),
  event_id                  UUID            NOT NULL REFERENCES events(id),
  code                      TEXT            NOT NULL,
  discount_type             coupon_discount NOT NULL,
  discount_amount_minor     BIGINT,
  discount_currency         currency_code,
  discount_percent          NUMERIC(5,2),
  valid_from                timestamptz,
  valid_to                  timestamptz,
  max_total                 INT,
  max_per_user              INT,
  status                    TEXT            NOT NULL DEFAULT 'active',
  UNIQUE (event_id, code),
  created_at                timestamptz     NOT NULL DEFAULT now(),
  updated_at                timestamptz     NOT NULL DEFAULT now()
);

-- Row-Level Security
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON coupons
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_coupons_updated ON coupons;
CREATE TRIGGER trg_coupons_updated
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE coupons                   IS 'phase:MVP-0';
