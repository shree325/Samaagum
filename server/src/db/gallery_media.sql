-- =====================================================================
-- Samaagum  |  Table: gallery_media
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS gallery_media CASCADE;

CREATE TABLE gallery_media (
  -- phase: MVP-0 | Assets within a gallery
  id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id  UUID  NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  asset_id    UUID  NOT NULL REFERENCES media_assets(id),
  caption     TEXT,
  position    INT   NOT NULL DEFAULT 0
);

COMMENT ON TABLE gallery_media             IS 'phase:MVP-0';
