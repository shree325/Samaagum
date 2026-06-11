-- =====================================================================
-- Migration 004: RBAC (Roles & Role Assignments)
-- Phase: MVP-0
-- =====================================================================

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  level role_level NOT NULL,
  phase TEXT NOT NULL DEFAULT 'MVP-0',
  reserved BOOLEAN NOT NULL DEFAULT false,
  baseline_capabilities JSONB NOT NULL DEFAULT '[]'
);

CREATE TABLE role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role_id UUID NOT NULL REFERENCES roles(id),
  scope_entity_id UUID REFERENCES entities(id),
  restrictions JSONB,
  granted_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role_id, scope_entity_id)
);
