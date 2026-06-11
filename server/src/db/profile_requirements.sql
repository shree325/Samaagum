-- =====================================================================
-- Samaagum  |  Table: profile_requirements
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS profile_requirements CASCADE;

CREATE TABLE profile_requirements (
  -- phase: MVP-0 | Platform-defined completeness requirements (e.g. "add phone")
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_key       TEXT        NOT NULL,
  level               requirement_level NOT NULL,
  audience            TEXT        NOT NULL DEFAULT 'all_users',
  revalidate_after    INTERVAL,
  active              BOOLEAN     NOT NULL DEFAULT true
);

COMMENT ON TABLE profile_requirements      IS 'phase:MVP-0';
