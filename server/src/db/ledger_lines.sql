-- =====================================================================
-- Samaagum  |  Table: ledger_lines
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS ledger_lines CASCADE;

CREATE TABLE ledger_lines (
  -- phase: MVP-0 | Individual debit/credit line within a journal
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id  UUID          NOT NULL REFERENCES ledger_journals(id),
  account_id  UUID          NOT NULL REFERENCES ledger_accounts(id),
  debit_minor BIGINT        NOT NULL DEFAULT 0,
  credit_minor BIGINT       NOT NULL DEFAULT 0,
  currency    currency_code NOT NULL
);

-- Indexes
CREATE INDEX idx_ledger_lines_journal_id ON ledger_lines (journal_id);
CREATE INDEX idx_ledger_lines_account_id ON ledger_lines (account_id);

COMMENT ON TABLE ledger_lines              IS 'phase:MVP-0';
