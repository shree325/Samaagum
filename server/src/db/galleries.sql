-- =====================================================================
-- Samaagum  |  Table: galleries
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS galleries CASCADE;

CREATE TABLE galleries (
  -- phase: MVP-0 | Photo gallery associated with an entity or event
  id              UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID              NOT NULL REFERENCES tenants(id),
  owner_entity_id UUID              NOT NULL REFERENCES entities(id),
  event_id        UUID              REFERENCES events(id),
  title           TEXT,
  visibility      visibility_level  NOT NULL DEFAULT 'public',
  created_at      timestamptz       NOT NULL DEFAULT now(),
  updated_at      timestamptz       NOT NULL DEFAULT now()
);

-- Row-Level Security
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON galleries
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_galleries_updated ON galleries;
CREATE TRIGGER trg_galleries_updated
  BEFORE UPDATE ON galleries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE galleries                 IS 'phase:MVP-0';
