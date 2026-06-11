-- =====================================================================
-- Samaagum  |  Table: badges
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS badges CASCADE;

CREATE TABLE badges (
  -- phase: Phase-2 | Platform-level achievement badge definitions
  id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT  UNIQUE NOT NULL,
  name        TEXT  NOT NULL,
  criteria    JSONB
);

COMMENT ON TABLE badges                    IS 'phase:Phase-2';
