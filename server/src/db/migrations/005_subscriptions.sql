-- =====================================================================
-- Migration 005: Subscriptions & Entitlements
-- Phase: MVP-0
-- =====================================================================

CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  plan_type TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  entitlements JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  plan_id UUID NOT NULL REFERENCES plans(id),
  owner_entity_id UUID NOT NULL REFERENCES entities(id),
  state subscription_state NOT NULL DEFAULT 'active',
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_to TIMESTAMPTZ,
  grace_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key TEXT NOT NULL,
  scope_entity_id UUID REFERENCES entities(id),
  value JSONB NOT NULL,
  UNIQUE (flag_key, scope_entity_id)
);
