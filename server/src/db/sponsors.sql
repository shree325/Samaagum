-- =====================================================================
-- Samaagum  |  Table: sponsors
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS sponsors CASCADE;

CREATE TABLE sponsors (
  -- phase: Phase-1.5 | Sponsor profile (company or individual)
  id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID  NOT NULL REFERENCES tenants(id),
  entity_id   UUID  REFERENCES entities(id),
  name        TEXT  NOT NULL,
  profile     JSONB,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Row-Level Security
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON sponsors
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_sponsors_updated ON sponsors;
CREATE TRIGGER trg_sponsors_updated
  BEFORE UPDATE ON sponsors
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE sponsors                  IS 'phase:Phase-1.5';
