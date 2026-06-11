-- =====================================================================
-- Samaagum  |  Table: user_consents
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS user_consents CASCADE;

CREATE TABLE user_consents (
  -- phase: MVP-0 | GDPR / T&C consent audit trail
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id),
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type    TEXT        NOT NULL,
  version         TEXT        NOT NULL,
  granted_at      timestamptz NOT NULL DEFAULT now()
);

-- Row-Level Security
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON user_consents
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

COMMENT ON TABLE user_consents             IS 'phase:MVP-0';
