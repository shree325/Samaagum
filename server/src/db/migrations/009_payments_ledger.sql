-- =====================================================================
-- Migration 009: Payments & Ledger
-- Phase: MVP-0
-- =====================================================================

-- payments.proof_asset_id FK deferred to migration 900
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  method payment_method NOT NULL,
  status payment_status NOT NULL DEFAULT 'initiated',
  gateway_order_id TEXT,
  gateway_payment_id TEXT,
  amount_amount_minor BIGINT,
  amount_currency currency_code,
  proof_asset_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (gateway_payment_id)
);

CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  payment_id UUID NOT NULL REFERENCES payments(id),
  line_item_id UUID REFERENCES booking_line_items(id),
  amount_amount_minor BIGINT,
  amount_currency currency_code,
  mode refund_mode NOT NULL DEFAULT 'gateway',
  status refund_status NOT NULL DEFAULT 'requested',
  reason TEXT,
  maker_user_id UUID REFERENCES users(id),
  checker_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ledger_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  key TEXT NOT NULL,
  owner_entity_id UUID REFERENCES entities(id),
  UNIQUE (tenant_id, key, owner_entity_id)
);

CREATE TABLE ledger_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  journal_type TEXT NOT NULL,
  source_type TEXT,
  source_id UUID,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ledger_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES ledger_journals(id),
  account_id UUID NOT NULL REFERENCES ledger_accounts(id),
  debit_minor BIGINT NOT NULL DEFAULT 0,
  credit_minor BIGINT NOT NULL DEFAULT 0,
  currency currency_code NOT NULL
);

CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  event_id UUID NOT NULL REFERENCES events(id),
  code TEXT NOT NULL,
  discount_type coupon_discount NOT NULL,
  discount_amount_minor BIGINT,
  discount_currency currency_code,
  discount_percent NUMERIC(5,2),
  valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ,
  max_total INT,
  max_per_user INT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, code)
);

CREATE TABLE coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  coupon_id UUID NOT NULL REFERENCES coupons(id),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  line_item_id UUID REFERENCES booking_line_items(id),
  user_id UUID NOT NULL REFERENCES users(id),
  discount_applied_amount_minor BIGINT,
  discount_applied_currency currency_code
);
