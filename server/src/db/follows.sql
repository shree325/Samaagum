-- =====================================================================
-- Samaagum  |  Table: follows
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS follows CASCADE;

CREATE TABLE follows (
  -- phase: MVP-1 | User follows an entity (community, org, person)
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_id   UUID        NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  tenant_id   UUID        NOT NULL REFERENCES tenants(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, entity_id)
);

-- Indexes
CREATE INDEX idx_follows_entity_id ON follows (entity_id);

-- Row-Level Security
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON follows
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

COMMENT ON TABLE follows                   IS 'phase:MVP-1';
