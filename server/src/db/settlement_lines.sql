-- =====================================================================
-- Samaagum  |  Table: settlement_lines
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS settlement_lines CASCADE;

CREATE TABLE settlement_lines (
  -- phase: MVP-1 | Individual journal line linked to a settlement
  id                    UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id         UUID  NOT NULL REFERENCES settlements(id),
  journal_id            UUID  REFERENCES ledger_journals(id),
  amount_amount_minor   BIGINT,
  amount_currency       currency_code
);

COMMENT ON TABLE settlement_lines          IS 'phase:MVP-1';
