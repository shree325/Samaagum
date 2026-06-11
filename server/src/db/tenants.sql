-- =====================================================================
-- Samaagum  |  Table: tenants
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS tenants CASCADE;

CREATE TABLE tenants (
  -- phase: MVP-0 | Root table: no tenant_id FK (bootstrap record)
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT        UNIQUE NOT NULL,
  name            TEXT        NOT NULL,
  status          entity_status NOT NULL DEFAULT 'active',
  -- Default currency used for all money columns when no override is set
  default_currency currency_code NOT NULL DEFAULT 'INR',
  default_locale  TEXT        NOT NULL DEFAULT 'en',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Note: tenants is the root/bootstrap table; Row-Level Security is managed at application level only.

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_tenants_updated ON tenants;
CREATE TRIGGER trg_tenants_updated
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE tenants                   IS 'phase:MVP-0';
