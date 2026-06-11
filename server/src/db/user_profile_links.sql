-- =====================================================================
-- Samaagum  |  Table: profile_links
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS profile_links CASCADE;

CREATE TABLE profile_links (
  -- phase: MVP-0 | Social/portfolio links on a profile
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind        TEXT        NOT NULL,
  label       TEXT,
  value       TEXT,
  position    INT         NOT NULL DEFAULT 0,
  visibility  visibility_level NOT NULL DEFAULT 'public'
);

-- Row-Level Security
ALTER TABLE profile_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON profile_links
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

COMMENT ON TABLE profile_links             IS 'phase:MVP-0';
