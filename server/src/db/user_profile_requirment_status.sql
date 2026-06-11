-- =====================================================================
-- Samaagum  |  Table: profile_requirement_status
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS profile_requirement_status CASCADE;

CREATE TABLE profile_requirement_status (
  -- phase: MVP-0 | Per-user status of each profile requirement
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requirement_id      UUID NOT NULL REFERENCES profile_requirements(id),
  status              requirement_status NOT NULL DEFAULT 'unsatisfied',
  satisfied_at        timestamptz,
  last_prompted_at    timestamptz,
  PRIMARY KEY (user_id, requirement_id)
);

COMMENT ON TABLE profile_requirement_status IS 'phase:MVP-0';
