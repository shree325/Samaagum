-- =====================================================================
-- Samaagum  |  Table: user_interests
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS user_interests CASCADE;

CREATE TABLE user_interests (
  -- phase: MVP-0 | Many-to-many: user ↔ category
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id),
  PRIMARY KEY (user_id, category_id)
);

COMMENT ON TABLE user_interests            IS 'phase:MVP-0';
