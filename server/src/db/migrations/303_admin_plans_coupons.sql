-- =====================================================================
-- Migration 303: Admin Subscription Plans & Admin Coupons
-- =====================================================================

CREATE TABLE admin_subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'individual' CHECK (category IN ('individual','team','enterprise')),
  plan_type TEXT NOT NULL DEFAULT 'monthly' CHECK (plan_type IN ('free','monthly','yearly','lifetime','custom')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  group_name TEXT,
  pricing JSONB NOT NULL DEFAULT '{}',
  features JSONB NOT NULL DEFAULT '[]',
  limits JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  trial JSONB,
  visibility JSONB NOT NULL DEFAULT '{}',
  rbac_role_id UUID REFERENCES admin_roles(id),
  rbac_position_id UUID REFERENCES admin_positions(id),
  rbac_auto_assign BOOLEAN NOT NULL DEFAULT false,
  tenant_id UUID REFERENCES tenants(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE admin_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent','fixed_cart','fixed_product')),
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  date_expires TIMESTAMPTZ,
  usage_count INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  free_shipping BOOLEAN NOT NULL DEFAULT false,
  usage_restrictions JSONB NOT NULL DEFAULT '{}',
  usage_limits JSONB NOT NULL DEFAULT '{}',
  email_settings JSONB NOT NULL DEFAULT '{}',
  applicable_plan_ids JSONB NOT NULL DEFAULT '[]',
  meta_data JSONB NOT NULL DEFAULT '[]',
  tenant_id UUID REFERENCES tenants(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (code, tenant_id)
);

CREATE INDEX idx_admin_plans_active ON admin_subscription_plans(is_active);
CREATE INDEX idx_admin_plans_tenant ON admin_subscription_plans(tenant_id);
CREATE INDEX idx_admin_coupons_code ON admin_coupons(code);
CREATE INDEX idx_admin_coupons_active ON admin_coupons(is_active, date_expires);
CREATE INDEX idx_admin_coupons_tenant ON admin_coupons(tenant_id);
