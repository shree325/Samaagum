-- =====================================================================
-- Samaagum  |  Table: categories
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS categories CASCADE;

CREATE TABLE categories (
  -- phase: MVP-0 | Interest / event category taxonomy (self-referencing tree)
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id   UUID REFERENCES categories(id),
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  kind        TEXT
);

COMMENT ON TABLE categories                IS 'phase:MVP-0';
