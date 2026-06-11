-- =====================================================================
-- Samaagum  |  Table: communities
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS communities CASCADE;

CREATE TABLE communities (
  -- phase: MVP-1 | Community subtype; supports nested sub-communities via is_sub_community flag
  entity_id         UUID PRIMARY KEY REFERENCES entities(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  slug              TEXT,
  is_sub_community  BOOLEAN     NOT NULL DEFAULT false,
  kyc_verified      BOOLEAN     NOT NULL DEFAULT false,
  listed            listed_state NOT NULL DEFAULT 'unlisted'
);

COMMENT ON TABLE communities               IS 'phase:MVP-1';
