-- =====================================================================
-- Samaagum  |  Table: feature_flags
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS feature_flags CASCADE;

CREATE TABLE feature_flags (
  -- phase: MVP-0 | Per-entity or global feature toggle overrides
  id              UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key        TEXT  NOT NULL,
  scope_entity_id UUID  REFERENCES entities(id),
  value           JSONB NOT NULL,
  UNIQUE (flag_key, scope_entity_id)
);

COMMENT ON TABLE feature_flags             IS 'phase:MVP-0';
