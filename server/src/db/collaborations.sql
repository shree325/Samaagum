-- =====================================================================
-- Samaagum  |  Table: collaborations
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS collaborations CASCADE;

CREATE TABLE collaborations (
  -- phase: MVP-1 | Cross-entity collaboration node
  entity_id           UUID              PRIMARY KEY REFERENCES entities(id) ON DELETE CASCADE,
  -- primary_event_id FK deferred to after events table
  primary_event_id    UUID,
  state               collaboration_state NOT NULL DEFAULT 'invited'
);

COMMENT ON TABLE collaborations            IS 'phase:MVP-1';
