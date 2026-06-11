-- =====================================================================
-- Migration 300: Phase-2 Provisional (specs may evolve)
-- Phase: Phase-2
-- =====================================================================

CREATE TABLE marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  group_entity_id UUID NOT NULL REFERENCES entities(id),
  seller_user_id UUID NOT NULL REFERENCES users(id),
  state listing_state NOT NULL DEFAULT 'draft',
  asking_price_amount_minor BIGINT,
  asking_price_currency currency_code,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE marketplace_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id),
  bidder_user_id UUID NOT NULL REFERENCES users(id),
  bid_amount_minor BIGINT,
  bid_currency currency_code,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  criteria JSONB
);

CREATE TABLE user_badges (
  user_id UUID NOT NULL REFERENCES users(id),
  badge_id UUID NOT NULL REFERENCES badges(id),
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE TABLE api_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  owner_entity_id UUID REFERENCES entities(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES api_clients(id),
  key_hash TEXT NOT NULL,
  scopes JSONB,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE outbound_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES api_clients(id),
  url TEXT NOT NULL,
  event_types JSONB,
  secret TEXT,
  active BOOLEAN NOT NULL DEFAULT true
);
