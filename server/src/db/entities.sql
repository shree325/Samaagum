-- =====================================================================
-- Samaagum  |  Table: entities
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS entities CASCADE;

CREATE TABLE entities (
  -- phase: MVP-0 | Unified entity graph node (org, community, group, user node, etc.)
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID          NOT NULL REFERENCES tenants(id),
  entity_type     entity_type   NOT NULL,
  -- parent_entity_id enables tree hierarchy (community ← org, sub-community ← community)
  parent_entity_id UUID         REFERENCES entities(id),
  -- user_id is set only when entity_type = 'user'
  user_id         UUID          REFERENCES users(id),
  status          entity_status NOT NULL DEFAULT 'active',
  visibility      visibility_level NOT NULL DEFAULT 'public',
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_entities_tenant_id ON entities (tenant_id);
CREATE INDEX idx_entities_parent_entity_id ON entities (parent_entity_id);
CREATE INDEX idx_entities_user_id ON entities (user_id);

-- Row-Level Security
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON entities
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_entities_updated ON entities;
CREATE TRIGGER trg_entities_updated
  BEFORE UPDATE ON entities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE entities                  IS 'phase:MVP-0';
