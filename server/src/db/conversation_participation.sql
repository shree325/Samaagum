-- =====================================================================
-- Samaagum  |  Table: conversation_participants
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS conversation_participants CASCADE;

CREATE TABLE conversation_participants (
  -- phase: MVP-0 | Users in a conversation (read receipt tracking)
  conversation_id UUID        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES users(id),
  role            TEXT        NOT NULL DEFAULT 'member',
  last_read_at    timestamptz,
  PRIMARY KEY (conversation_id, user_id)
);

COMMENT ON TABLE conversation_participants IS 'phase:MVP-0';
