-- =====================================================================
-- Samaagum  |  Table: messages
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS messages CASCADE;

CREATE TABLE messages (
  -- phase: MVP-0 | Individual message within a conversation
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID        NOT NULL REFERENCES tenants(id),
  conversation_id   UUID        NOT NULL REFERENCES conversations(id),
  sender_user_id    UUID        NOT NULL REFERENCES users(id),
  body              TEXT,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_messages_conversation_id ON messages (conversation_id);

-- Row-Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON messages
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

COMMENT ON TABLE messages                  IS 'phase:MVP-0';
