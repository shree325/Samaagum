-- =====================================================================
-- Migration 007: Events & Ticketing
-- Phase: MVP-0
-- =====================================================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  hosted_by_entity_id UUID NOT NULL REFERENCES entities(id),
  parent_event_id UUID REFERENCES events(id),
  event_kind event_kind NOT NULL DEFAULT 'standalone',
  title TEXT NOT NULL,
  description TEXT,
  status event_status NOT NULL DEFAULT 'draft',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  venue_timezone TEXT,
  location_type location_type NOT NULL DEFAULT 'venue',
  venue JSONB,
  online_link TEXT,
  capacity_total INT,
  registration_mode registration_mode NOT NULL DEFAULT 'paid',
  approval_required BOOLEAN NOT NULL DEFAULT false,
  registration_form_id UUID REFERENCES forms(id),
  cash_enabled BOOLEAN NOT NULL DEFAULT false,
  financial_locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  event_id UUID NOT NULL REFERENCES events(id),
  name TEXT NOT NULL,
  description TEXT,
  price_amount_minor BIGINT,
  price_currency currency_code,
  capacity INT,
  max_per_booking INT,
  sale_start TIMESTAMPTZ,
  sale_end TIMESTAMPTZ,
  early_bird_price_amount_minor BIGINT,
  early_bird_price_currency currency_code,
  early_bird_ends_at TIMESTAMPTZ,
  visibility ticket_visibility NOT NULL DEFAULT 'public',
  eligibility JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE event_team_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  event_id UUID NOT NULL REFERENCES events(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role_id UUID NOT NULL REFERENCES roles(id),
  state assignment_state NOT NULL DEFAULT 'active',
  granted_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id, role_id)
);
