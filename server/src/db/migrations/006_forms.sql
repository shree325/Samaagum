-- =====================================================================
-- Migration 006: Form Builder (shared)
-- Phase: MVP-0
-- =====================================================================

CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  owner_entity_id UUID NOT NULL REFERENCES entities(id),
  purpose form_purpose NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id),
  field_type form_field_type NOT NULL,
  label TEXT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT false,
  options JSONB,
  conditions JSONB,
  field_scope TEXT NOT NULL DEFAULT 'booking',
  position INT NOT NULL DEFAULT 0
);

CREATE TABLE form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  form_id UUID NOT NULL REFERENCES forms(id),
  respondent_user_id UUID REFERENCES users(id),
  context_ref UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE form_response_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES form_responses(id),
  field_id UUID NOT NULL REFERENCES form_fields(id),
  value JSONB
);
