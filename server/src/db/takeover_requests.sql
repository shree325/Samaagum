-- =====================================================================
-- Samaagum  |  Table: takeover_requests
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS takeover_requests CASCADE;

CREATE TABLE takeover_requests (
  -- phase: Phase-1.5 | Request to buy/transfer ownership of a group
  id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID            NOT NULL REFERENCES tenants(id),
  group_entity_id UUID            NOT NULL REFERENCES entities(id),
  buyer_user_id   UUID            NOT NULL REFERENCES users(id),
  state           takeover_state  NOT NULL DEFAULT 'requested',
  created_at      timestamptz     NOT NULL DEFAULT now(),
  updated_at      timestamptz     NOT NULL DEFAULT now()
);

-- Row-Level Security
ALTER TABLE takeover_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON takeover_requests
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_takeover_requests_updated ON takeover_requests;
CREATE TRIGGER trg_takeover_requests_updated
  BEFORE UPDATE ON takeover_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE takeover_requests         IS 'phase:Phase-1.5';
