-- =====================================================================
-- Samaagum  |  Table: users
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  -- phase: MVP-0 | One row per human; also serves as the entity for the user graph node
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  primary_email       CITEXT,
  email_verified      BOOLEAN     NOT NULL DEFAULT false,
  state               user_state  NOT NULL DEFAULT 'provisional',
  locale              TEXT        NOT NULL DEFAULT 'en',
  preferred_currency  currency_code,
  gender              TEXT,
  dob                 DATE,
  phone_e164          TEXT,
  profile_completed   BOOLEAN     NOT NULL DEFAULT false,
  activated_at        timestamptz,
  deleted_at          timestamptz,
  UNIQUE (tenant_id, primary_email),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_users_tenant_id ON users (tenant_id);
CREATE INDEX idx_users_state ON users (state);

-- Row-Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_users_updated ON users;
CREATE TRIGGER trg_users_updated
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE users                     IS 'phase:MVP-0';
