DROP TABLE IF EXISTS ledger_journals CASCADE;

CREATE TABLE ledger_journals (

    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL,

    journal_type              VARCHAR(50)  NOT NULL,
    source_type               VARCHAR(50)  NOT NULL,
    source_id                 UUID         NOT NULL,

    narration                 TEXT,
    posted_at                 TIMESTAMPTZ  DEFAULT now(),

    -- Reversal support (immutable journals — corrections via reversal only)
    reversal_of_journal_id    UUID        REFERENCES ledger_journals(id),

    status                    VARCHAR(20)  DEFAULT 'posted',

    -- Optimistic concurrency
    modification_num          INTEGER      DEFAULT 0,

    -- System columns
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID,

    CONSTRAINT chk_journal_status CHECK (status IN ('draft', 'posted', 'reversed'))
);

-- Row-Level Security
ALTER TABLE ledger_journals ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON ledger_journals
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_ledger_journals_tenant  ON ledger_journals (tenant_id);
CREATE INDEX idx_ledger_journals_source  ON ledger_journals (source_type, source_id);
CREATE INDEX idx_ledger_journals_status  ON ledger_journals (status);