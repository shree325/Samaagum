-- =====================================================================
-- Migration 100: Communities, Collaborations & MVP-1 tables
-- Phase: MVP-1
-- =====================================================================

CREATE TABLE communities (
  entity_id UUID PRIMARY KEY REFERENCES entities(id),
  name TEXT NOT NULL,
  slug TEXT,
  is_sub_community BOOLEAN NOT NULL DEFAULT false,
  kyc_verified BOOLEAN NOT NULL DEFAULT false,
  listed listed_state NOT NULL DEFAULT 'unlisted'
);

-- collaborations.primary_event_id FK deferred to migration 900
CREATE TABLE collaborations (
  entity_id UUID PRIMARY KEY REFERENCES entities(id),
  primary_event_id UUID,
  state collaboration_state NOT NULL DEFAULT 'invited'
);

CREATE TABLE collaboration_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  collaboration_id UUID NOT NULL REFERENCES entities(id),
  member_entity_id UUID NOT NULL REFERENCES entities(id),
  state collaboration_state NOT NULL DEFAULT 'invited',
  is_founding BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE entity_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  owner_entity_id UUID NOT NULL REFERENCES entities(id),
  content JSONB,
  listed listed_state NOT NULL DEFAULT 'unlisted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE follows (
  user_id UUID NOT NULL REFERENCES users(id),
  entity_id UUID NOT NULL REFERENCES entities(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, entity_id)
);

-- waitlist_entries.hold_payment_id FK deferred to migration 900
CREATE TABLE waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  event_id UUID NOT NULL REFERENCES events(id),
  ticket_type_id UUID REFERENCES ticket_types(id),
  user_id UUID NOT NULL REFERENCES users(id),
  position INT,
  state waitlist_state NOT NULL DEFAULT 'queued',
  hold_payment_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  owner_entity_id UUID NOT NULL REFERENCES entities(id),
  status settlement_status NOT NULL DEFAULT 'eligible',
  amount_amount_minor BIGINT,
  amount_currency currency_code,
  scheduled_for TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE settlement_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id UUID NOT NULL REFERENCES settlements(id),
  journal_id UUID REFERENCES ledger_journals(id),
  amount_amount_minor BIGINT,
  amount_currency currency_code
);
