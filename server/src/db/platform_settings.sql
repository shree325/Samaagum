-- =====================================================================
-- Samaagum  |  Table: platform_settings
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS platform_settings CASCADE;

CREATE TABLE platform_settings (
  -- phase: MVP-0 | Key/value config per tenant or platform-global
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_tenant_id UUID        REFERENCES tenants(id),
  key             TEXT        NOT NULL,
  value           JSONB       NOT NULL,
  updated_by      UUID        REFERENCES users(id),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope_tenant_id, key)
);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_platform_settings_updated ON platform_settings;
CREATE TRIGGER trg_platform_settings_updated
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE platform_settings         IS 'phase:MVP-0';
