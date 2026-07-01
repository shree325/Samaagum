-- =====================================================================
-- Migration 304: Subscription Orders table
-- =====================================================================

CREATE TABLE subscription_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id),
  tenant_id UUID REFERENCES tenants(id),
  status TEXT NOT NULL DEFAULT 'pending',
  plan_id UUID NOT NULL REFERENCES admin_subscription_plans(id),
  plan_type TEXT NOT NULL,
  shipping_address JSONB NOT NULL DEFAULT '{}',
  billing_address JSONB NOT NULL DEFAULT '{}',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  taxes JSONB NOT NULL DEFAULT '[]',
  coupon_code TEXT,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL,
  payment_method_title TEXT NOT NULL,
  payment_transaction_id TEXT,
  payment_intent_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_paid_date TIMESTAMPTZ,
  payment_gateway_response JSONB NOT NULL DEFAULT '{}',
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  subscription_status TEXT NOT NULL DEFAULT 'pending',
  customer_note TEXT,
  admin_notes JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sub_orders_user ON subscription_orders(user_id);
CREATE INDEX idx_sub_orders_tenant ON subscription_orders(tenant_id);
CREATE INDEX idx_sub_orders_status ON subscription_orders(status);
