-- =====================================================================
-- Migration 003: Entity Registry & Hierarchy
-- Phase: MVP-0
-- =====================================================================

CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  entity_type entity_type NOT NULL,
  parent_entity_id UUID REFERENCES entities(id),
  user_id UUID REFERENCES users(id),
  status entity_status NOT NULL DEFAULT 'active',
  visibility visibility_level NOT NULL DEFAULT 'public',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- groups.join_form_id FK deferred to migration 900
CREATE TABLE groups (
  entity_id UUID PRIMARY KEY REFERENCES entities(id),
  name TEXT NOT NULL,
  slug TEXT,
  join_mode join_mode NOT NULL DEFAULT 'open',
  join_form_id UUID,
  listed listed_state NOT NULL DEFAULT 'unlisted'
);

-- group_memberships.form_response_id FK deferred to migration 900
CREATE TABLE group_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  group_id UUID NOT NULL REFERENCES entities(id),
  user_id UUID NOT NULL REFERENCES users(id),
  state membership_state NOT NULL DEFAULT 'pending',
  form_response_id UUID,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);
