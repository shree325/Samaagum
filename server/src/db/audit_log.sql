-- =====================================================================
-- Samaagum  |  Table: audit_log
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS audit_log CASCADE;

CREATE TABLE audit_log (
  -- phase: MVP-0 | Immutable record of user/system actions
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id),
  actor_user_id   UUID,
  action          TEXT        NOT NULL,
  target_type     TEXT,
  target_id       UUID,
  before          JSONB,
  after           JSONB,
  occurred_at     timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_audit_log_target_id ON audit_log (target_id);
CREATE INDEX idx_audit_log_actor_user_id ON audit_log (actor_user_id);

-- Row-Level Security
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON audit_log
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

COMMENT ON TABLE audit_log                 IS 'phase:MVP-0';
