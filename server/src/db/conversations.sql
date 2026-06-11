-- =====================================================================
-- Samaagum  |  Table: conversations
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS conversations CASCADE;

CREATE TABLE conversations (
  -- phase: MVP-0 | DM thread or organizer inbox thread
  id          UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID                NOT NULL REFERENCES tenants(id),
  type        conversation_type   NOT NULL DEFAULT 'dm',
  event_id    UUID                REFERENCES events(id),
  created_by  UUID                REFERENCES users(id),
  created_at  timestamptz         NOT NULL DEFAULT now(),
  updated_at  timestamptz         NOT NULL DEFAULT now()
);

-- Row-Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON conversations
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_conversations_updated ON conversations;
CREATE TRIGGER trg_conversations_updated
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE conversations             IS 'phase:MVP-0';
