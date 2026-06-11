-- =====================================================================
-- Samaagum  |  Table: bundle_items
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS bundle_items CASCADE;

CREATE TABLE bundle_items (
  -- phase: Phase-1.5 | Individual ticket type lines within a bundle
  id              UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id       UUID  NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
  ticket_type_id  UUID  NOT NULL REFERENCES ticket_types(id),
  quantity        INT   NOT NULL DEFAULT 1
);

COMMENT ON TABLE bundle_items              IS 'phase:Phase-1.5';
