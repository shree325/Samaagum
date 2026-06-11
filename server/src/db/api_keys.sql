-- =====================================================================
-- Samaagum  |  Table: api_keys
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS api_keys CASCADE;

CREATE TABLE api_keys (
  -- phase: Phase-2 | Hashed API key for an api_client
  id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID  NOT NULL REFERENCES api_clients(id) ON DELETE CASCADE,
  key_hash    TEXT  NOT NULL,
  scopes      JSONB,
  revoked_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE api_keys                  IS 'phase:Phase-2';
