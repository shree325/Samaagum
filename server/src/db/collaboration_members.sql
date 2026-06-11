-- =====================================================================
-- Samaagum  |  Table: collaboration_members
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS collaboration_members CASCADE;

CREATE TABLE collaboration_members (
  -- phase: MVP-1 | Members of a collaboration
  id                  UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID              NOT NULL REFERENCES tenants(id),
  collaboration_id    UUID              NOT NULL REFERENCES entities(id),
  member_entity_id    UUID              NOT NULL REFERENCES entities(id),
  state               collaboration_state NOT NULL DEFAULT 'invited',
  is_founding         BOOLEAN           NOT NULL DEFAULT false
);

-- Row-Level Security
ALTER TABLE collaboration_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON collaboration_members
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

COMMENT ON TABLE collaboration_members     IS 'phase:MVP-1';
