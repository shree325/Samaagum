-- =====================================================================
-- Samaagum  |  Table: roles
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS roles CASCADE;

CREATE TABLE roles (
  -- phase: MVP-0 | Named role definitions with capability JSONB
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key                   TEXT        UNIQUE NOT NULL,
  level                 role_level  NOT NULL,
  phase                 TEXT        NOT NULL DEFAULT 'MVP-0',
  reserved              BOOLEAN     NOT NULL DEFAULT false,
  baseline_capabilities JSONB       NOT NULL DEFAULT '[]'
);

COMMENT ON TABLE roles                     IS 'phase:MVP-0';
