-- =====================================================================
-- Samaagum  |  Table: ledger_journals
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS ledger_journals CASCADE;

CREATE TABLE ledger_journals (
  -- phase: MVP-0 | A set of double-entry ledger lines representing one financial event
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id),
  journal_type    TEXT        NOT NULL,
  source_type     TEXT,
  source_id       UUID,
  posted_at       timestamptz NOT NULL DEFAULT now()
);

-- Row-Level Security
ALTER TABLE ledger_journals ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON ledger_journals
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

COMMENT ON TABLE ledger_journals           IS 'phase:MVP-0';
