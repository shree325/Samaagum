-- =====================================================================
-- Migration 200: Phase-1.5 Commercial
-- Phase: Phase-1.5
-- =====================================================================

CREATE TABLE orgs (
  entity_id UUID PRIMARY KEY REFERENCES entities(id),
  legal_name TEXT,
  branding JSONB,
  primary_domain TEXT
);

CREATE TABLE membership_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  group_entity_id UUID NOT NULL REFERENCES entities(id),
  name TEXT NOT NULL,
  price_amount_minor BIGINT,
  price_currency currency_code,
  benefits JSONB,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE membership_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  tier_id UUID NOT NULL REFERENCES membership_tiers(id),
  user_id UUID NOT NULL REFERENCES users(id),
  state subscription_state NOT NULL DEFAULT 'active',
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  parent_event_id UUID NOT NULL REFERENCES events(id),
  name TEXT NOT NULL,
  price_amount_minor BIGINT,
  price_currency currency_code,
  max_bundles INT,
  max_per_booking INT
);

CREATE TABLE bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES bundles(id),
  ticket_type_id UUID NOT NULL REFERENCES ticket_types(id),
  quantity INT NOT NULL DEFAULT 1
);

CREATE TABLE addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  event_id UUID NOT NULL REFERENCES events(id),
  name TEXT NOT NULL,
  price_amount_minor BIGINT,
  price_currency currency_code,
  inventory INT,
  level TEXT NOT NULL DEFAULT 'attendee'
);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  author_user_id UUID NOT NULL REFERENCES users(id),
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  body TEXT,
  status review_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  review_id UUID REFERENCES reviews(id),
  author_user_id UUID NOT NULL REFERENCES users(id),
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  dimension TEXT NOT NULL DEFAULT 'overall',
  score SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5)
);

CREATE TABLE affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'active',
  wallet_balance_amount_minor BIGINT,
  wallet_balance_currency currency_code,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE referral_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id),
  event_id UUID REFERENCES events(id),
  code TEXT UNIQUE NOT NULL,
  commission_rule JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE referral_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  referral_link_id UUID NOT NULL REFERENCES referral_links(id),
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_hash TEXT,
  user_agent TEXT,
  converted_booking_id UUID REFERENCES bookings(id)
);

CREATE TABLE affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id),
  referral_link_id UUID REFERENCES referral_links(id),
  booking_id UUID REFERENCES bookings(id),
  amount_amount_minor BIGINT,
  amount_currency currency_code,
  status TEXT NOT NULL DEFAULT 'accrued',
  journal_id UUID REFERENCES ledger_journals(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id),
  amount_amount_minor BIGINT,
  amount_currency currency_code,
  status TEXT NOT NULL DEFAULT 'requested',
  journal_id UUID REFERENCES ledger_journals(id),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  entity_id UUID REFERENCES entities(id),
  name TEXT NOT NULL,
  profile JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sponsorship_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  event_id UUID NOT NULL REFERENCES events(id),
  name TEXT NOT NULL,
  price_amount_minor BIGINT,
  price_currency currency_code,
  assets JSONB
);

CREATE TABLE sponsorship_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  package_id UUID NOT NULL REFERENCES sponsorship_packages(id),
  sponsor_id UUID NOT NULL REFERENCES sponsors(id),
  status TEXT NOT NULL DEFAULT 'pending',
  journal_id UUID REFERENCES ledger_journals(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE takeover_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  group_entity_id UUID NOT NULL REFERENCES entities(id),
  buyer_user_id UUID NOT NULL REFERENCES users(id),
  state takeover_state NOT NULL DEFAULT 'requested',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
