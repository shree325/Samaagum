-- =====================================================================
-- Migration 302: Admin RBAC (Responsibilities, Positions, Admin Roles)
-- =====================================================================

CREATE TABLE admin_responsibilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'dashboard','trading','portfolio','options','futures',
    'fii_dii','screeners','research','pair_trading','reports',
    'account','admin','team'
  )),
  route_path TEXT NOT NULL,
  component_name TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'Circle',
  is_active BOOLEAN NOT NULL DEFAULT true,
  required_features JSONB NOT NULL DEFAULT '[]',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE admin_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  hierarchy_level INT NOT NULL CHECK (hierarchy_level BETWEEN 1 AND 1000),
  data_access_level TEXT NOT NULL CHECK (data_access_level IN (
    'individual','team','department','regional','organization'
  )),
  custom_conditions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  data_access_limits JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  tenant_id UUID REFERENCES tenants(id),
  is_system_role BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  hierarchy_level INT NOT NULL DEFAULT 100 CHECK (hierarchy_level BETWEEN 1 AND 1000),
  responsibility_ids JSONB NOT NULL DEFAULT '[]',
  default_position_id UUID REFERENCES admin_positions(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name, tenant_id)
);

CREATE INDEX idx_admin_responsibilities_category ON admin_responsibilities(category, sort_order);
CREATE INDEX idx_admin_responsibilities_active ON admin_responsibilities(is_active);
CREATE INDEX idx_admin_positions_hierarchy ON admin_positions(hierarchy_level);
CREATE INDEX idx_admin_roles_tenant ON admin_roles(tenant_id, is_active);
CREATE INDEX idx_admin_roles_hierarchy ON admin_roles(hierarchy_level);
