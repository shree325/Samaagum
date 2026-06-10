DROP TABLE IF EXISTS ledger_lines CASCADE;

CREATE TABLE ledger_lines (

    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL,

    journal_id                UUID        NOT NULL,
    account_id                UUID        NOT NULL,

    line_no                   INTEGER      NOT NULL,

    -- Money (multi-currency: minor units + ISO 4217)
    debit_minor               BIGINT       DEFAULT 0,
    credit_minor              BIGINT       DEFAULT 0,
    currency                  CHAR(3)      NOT NULL,

    memo                      TEXT,

    -- System columns
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID,

    CONSTRAINT chk_ledger_line_amounts CHECK (
        (debit_minor > 0 AND credit_minor = 0)
        OR
        (credit_minor > 0 AND debit_minor = 0)
    )
);

-- Row-Level Security
ALTER TABLE ledger_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON ledger_lines
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_ledger_lines_tenant   ON ledger_lines (tenant_id);
CREATE INDEX idx_ledger_lines_journal  ON ledger_lines (journal_id);
CREATE INDEX idx_ledger_lines_account  ON ledger_lines (account_id);