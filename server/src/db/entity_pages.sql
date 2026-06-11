-- =====================================================================
-- Samaagum  |  Table: entity_pages
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS entity_pages CASCADE;

CREATE TABLE entity_pages (
  -- phase: MVP-1 | Public-facing landing page content for an entity
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID          NOT NULL REFERENCES tenants(id),
  owner_entity_id UUID          NOT NULL REFERENCES entities(id),
  content         JSONB,
  listed          listed_state  NOT NULL DEFAULT 'unlisted',
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

-- Row-Level Security
ALTER TABLE entity_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON entity_pages
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_entity_pages_updated ON entity_pages;
CREATE TRIGGER trg_entity_pages_updated
  BEFORE UPDATE ON entity_pages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE entity_pages              IS 'phase:MVP-1';
