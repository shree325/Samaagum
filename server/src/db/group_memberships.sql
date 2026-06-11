-- =====================================================================
-- Samaagum  |  Table: group_memberships
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS group_memberships CASCADE;

CREATE TABLE group_memberships (
  -- phase: MVP-0 | User membership in a group
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID          NOT NULL REFERENCES tenants(id),
  group_id        UUID          NOT NULL REFERENCES entities(id),
  user_id         UUID          NOT NULL REFERENCES users(id),
  state           membership_state NOT NULL DEFAULT 'pending',
  -- form_response_id FK deferred to after form_responses table
  form_response_id UUID,
  joined_at       timestamptz,
  UNIQUE (group_id, user_id),
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_group_memberships_group_id ON group_memberships (group_id);
CREATE INDEX idx_group_memberships_user_id ON group_memberships (user_id);
CREATE INDEX idx_group_memberships_state ON group_memberships (state);

-- Row-Level Security
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON group_memberships
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_group_memberships_updated ON group_memberships;
CREATE TRIGGER trg_group_memberships_updated
  BEFORE UPDATE ON group_memberships
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE group_memberships         IS 'phase:MVP-0';
