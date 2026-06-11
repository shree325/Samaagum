-- =====================================================================
-- Samaagum  |  Table: idempotency_keys
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS idempotency_keys CASCADE;

CREATE TABLE idempotency_keys (
  -- phase: MVP-0 | Prevents duplicate payment/action processing
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id),
  scope           TEXT        NOT NULL,
  key             TEXT        NOT NULL,
  response_hash   TEXT,
  first_seen_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope, key)
);

-- Row-Level Security
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON idempotency_keys
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

COMMENT ON TABLE idempotency_keys          IS 'phase:MVP-0';
