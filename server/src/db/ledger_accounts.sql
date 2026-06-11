-- =====================================================================
-- Samaagum  |  Table: ledger_accounts
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS ledger_accounts CASCADE;

CREATE TABLE ledger_accounts (
  -- phase: MVP-0 | Chart of accounts entry (per entity or platform-wide)
  id              UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID  NOT NULL REFERENCES tenants(id),
  key             TEXT  NOT NULL,
  owner_entity_id UUID  REFERENCES entities(id),
  UNIQUE (tenant_id, key, owner_entity_id)
);

-- Row-Level Security
ALTER TABLE ledger_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON ledger_accounts
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

COMMENT ON TABLE ledger_accounts           IS 'phase:MVP-0';
