-- =====================================================================
-- Samaagum  |  Table: groups
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS groups CASCADE;

CREATE TABLE groups (
  -- phase: MVP-0 | Private/managed group subtype
  entity_id       UUID        PRIMARY KEY REFERENCES entities(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  slug            TEXT,
  description     TEXT,
  category        TEXT,
  icon            TEXT,
  cover           TEXT,
  banner          TEXT,
  join_mode       join_mode   NOT NULL DEFAULT 'open',
  -- join_form_id FK deferred to after forms table
  join_form_id    UUID,
  listed          listed_state NOT NULL DEFAULT 'unlisted',
  settings        JSONB        DEFAULT '{}'
);

COMMENT ON TABLE groups                    IS 'phase:MVP-0';
