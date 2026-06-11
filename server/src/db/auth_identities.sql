-- =====================================================================
-- Samaagum  |  Table: auth_identities
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS auth_identities CASCADE;

CREATE TABLE auth_identities (
  -- phase: MVP-0 | OAuth / password identity providers
  id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID  NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider    TEXT  NOT NULL,
  provider_uid TEXT NOT NULL,
  UNIQUE (provider, provider_uid),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Row-Level Security
ALTER TABLE auth_identities ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON auth_identities
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_auth_identities_updated ON auth_identities;
CREATE TRIGGER trg_auth_identities_updated
  BEFORE UPDATE ON auth_identities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE auth_identities           IS 'phase:MVP-0';
