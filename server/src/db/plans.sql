-- =====================================================================
-- Samaagum  |  Table: plans
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS plans CASCADE;

CREATE TABLE plans (
  -- phase: MVP-0 | Platform subscription plan definitions
  id              UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  key             TEXT  UNIQUE NOT NULL,
  plan_type       TEXT  NOT NULL,
  version         INT   NOT NULL DEFAULT 1,
  entitlements    JSONB NOT NULL DEFAULT '{}',
  status          TEXT  NOT NULL DEFAULT 'active'
);

COMMENT ON TABLE plans                     IS 'phase:MVP-0';
