-- =====================================================================
-- Samaagum  |  Table: role_assignments
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS role_assignments CASCADE;

CREATE TABLE role_assignments (
  -- phase: MVP-0 | Assigns a role to a user within an optional entity scope
  id              UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID  NOT NULL REFERENCES tenants(id),
  user_id         UUID  NOT NULL REFERENCES users(id),
  role_id         UUID  NOT NULL REFERENCES roles(id),
  scope_entity_id UUID  REFERENCES entities(id),
  restrictions    JSONB,
  granted_by      UUID  REFERENCES users(id),
  expires_at      timestamptz,
  UNIQUE (user_id, role_id, scope_entity_id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_role_assignments_user_id ON role_assignments (user_id);
CREATE INDEX idx_role_assignments_scope_entity_id ON role_assignments (scope_entity_id);

-- Row-Level Security
ALTER TABLE role_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON role_assignments
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_role_assignments_updated ON role_assignments;
CREATE TRIGGER trg_role_assignments_updated
  BEFORE UPDATE ON role_assignments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE role_assignments          IS 'phase:MVP-0';
