-- =====================================================================
-- Samaagum  |  Table: api_clients
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS api_clients CASCADE;

CREATE TABLE api_clients (
  -- phase: Phase-2 | Third-party API client registration
  id              UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID  NOT NULL REFERENCES tenants(id),
  owner_entity_id UUID  REFERENCES entities(id),
  name            TEXT  NOT NULL,
  status          TEXT  NOT NULL DEFAULT 'active',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Row-Level Security
ALTER TABLE api_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON api_clients
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_api_clients_updated ON api_clients;
CREATE TRIGGER trg_api_clients_updated
  BEFORE UPDATE ON api_clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE api_clients               IS 'phase:Phase-2';
