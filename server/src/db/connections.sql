-- =====================================================================
-- Samaagum  |  Table: connections
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS connections CASCADE;

CREATE TABLE connections (
  -- phase: MVP-0 | Bilateral connection request between two users
  id                  UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID              NOT NULL REFERENCES tenants(id),
  requester_user_id   UUID              NOT NULL REFERENCES users(id),
  addressee_user_id   UUID              NOT NULL REFERENCES users(id),
  state               connection_state  NOT NULL DEFAULT 'requested',
  UNIQUE (requester_user_id, addressee_user_id),
  created_at          timestamptz       NOT NULL DEFAULT now(),
  updated_at          timestamptz       NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_connections_addressee_user_id ON connections (addressee_user_id);

-- Row-Level Security
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON connections
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_connections_updated ON connections;
CREATE TRIGGER trg_connections_updated
  BEFORE UPDATE ON connections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE connections               IS 'phase:MVP-0';
