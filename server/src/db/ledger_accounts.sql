DROP TABLE IF EXISTS ledger_accounts CASCADE;

CREATE TABLE ledger_accounts (

    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL,

    account_key               VARCHAR(100) NOT NULL,
    name                      VARCHAR(255) NOT NULL,
    account_type              VARCHAR(50)  NOT NULL,
    normal_balance            VARCHAR(10)  NOT NULL DEFAULT 'debit',

    owner_entity_id           UUID,
    parent_account_id         UUID        REFERENCES ledger_accounts(id),

    is_active                 BOOLEAN      DEFAULT TRUE,

    -- System columns
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID,

    CONSTRAINT uq_ledger_accounts_tenant_key UNIQUE (tenant_id, account_key),
    CONSTRAINT chk_normal_balance CHECK (normal_balance IN ('debit', 'credit'))
);

-- Row-Level Security
ALTER TABLE ledger_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON ledger_accounts
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_ledger_accounts_tenant  ON ledger_accounts (tenant_id);
CREATE INDEX idx_ledger_accounts_type    ON ledger_accounts (account_type);