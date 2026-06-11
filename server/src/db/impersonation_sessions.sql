-- =====================================================================
-- Samaagum  |  Table: impersonation_sessions
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS impersonation_sessions CASCADE;

CREATE TABLE impersonation_sessions (
  -- phase: MVP-0 | Admin impersonating a user for support (audited)
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id),
  admin_user_id   UUID        NOT NULL REFERENCES users(id),
  target_user_id  UUID        NOT NULL REFERENCES users(id),
  reason          TEXT,
  read_only       BOOLEAN     NOT NULL DEFAULT true,
  started_at      timestamptz NOT NULL DEFAULT now(),
  ended_at        timestamptz
);

-- Row-Level Security
ALTER TABLE impersonation_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON impersonation_sessions
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

COMMENT ON TABLE impersonation_sessions    IS 'phase:MVP-0';
