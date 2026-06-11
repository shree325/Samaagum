-- =====================================================================
-- Samaagum  |  Table: user_badges
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS user_badges CASCADE;

CREATE TABLE user_badges (
  -- phase: Phase-2 | Badges awarded to users
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id    UUID        NOT NULL REFERENCES badges(id),
  awarded_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

COMMENT ON TABLE user_badges               IS 'phase:Phase-2';
