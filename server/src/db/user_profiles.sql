-- =====================================================================
-- Samaagum  |  Table: profiles
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
  -- phase: MVP-0 | Extended user profile (1-to-1 with users)
  user_id             UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  tenant_id           UUID        NOT NULL REFERENCES tenants(id),
  display_name        TEXT,
  bio                 TEXT,
  -- photo_asset_id / cover_asset_id FK added in deferred section below (after media_assets)
  photo_asset_id      UUID,
  cover_asset_id      UUID,
  preferred_location  TEXT,
  location_lat        DOUBLE PRECISION,
  location_lng        DOUBLE PRECISION,
  template_key        TEXT,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Row-Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON profiles
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_profiles_updated ON profiles;
CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE profiles                  IS 'phase:MVP-0';
