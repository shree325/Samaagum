DROP TABLE IF EXISTS settlement_lines CASCADE;

CREATE TABLE settlement_lines (

    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL,

    settlement_id             UUID        NOT NULL,

    source_type               VARCHAR(50)  NOT NULL,
    source_id                 UUID         NOT NULL,
    journal_id                UUID,

    -- Money (multi-currency: minor units + ISO 4217)
    amount_minor              BIGINT       NOT NULL,
    currency                  CHAR(3)      NOT NULL,

    line_type                 VARCHAR(50)  NOT NULL,
    description               TEXT,

    -- System columns
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID
);

-- Row-Level Security
ALTER TABLE settlement_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON settlement_lines
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_settlement_lines_tenant     ON settlement_lines (tenant_id);
CREATE INDEX idx_settlement_lines_settlement ON settlement_lines (settlement_id);
CREATE INDEX idx_settlement_lines_source     ON settlement_lines (source_type, source_id);
