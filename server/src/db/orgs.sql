-- =====================================================================
-- Samaagum  |  Table: orgs
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS orgs CASCADE;

CREATE TABLE orgs (
  -- phase: Phase-1.5 | Organisation subtype; entity_id FK enforces 1-to-1
  entity_id       UUID PRIMARY KEY REFERENCES entities(id) ON DELETE CASCADE,
  legal_name      TEXT,
  branding        JSONB,
  primary_domain  TEXT
);

COMMENT ON TABLE orgs                      IS 'phase:Phase-1.5';
