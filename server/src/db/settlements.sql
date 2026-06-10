DROP TABLE IF EXISTS settlements CASCADE;

CREATE TABLE settlements (

    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL,

    owner_entity_id           UUID        NOT NULL,

    period_start              TIMESTAMPTZ  NOT NULL,
    period_end                TIMESTAMPTZ  NOT NULL,

    -- Money breakdown (multi-currency: minor units + ISO 4217)
    gross_minor               BIGINT       NOT NULL DEFAULT 0,
    fees_minor                BIGINT       NOT NULL DEFAULT 0,
    refunds_minor             BIGINT       NOT NULL DEFAULT 0,
    net_minor                 BIGINT       NOT NULL DEFAULT 0,
    currency                  CHAR(3)      NOT NULL,

    status                    VARCHAR(50)  DEFAULT 'pending',
    reconciled_at             TIMESTAMPTZ,
    payout_reference          VARCHAR(255),

    -- System columns
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID
);

-- Row-Level Security
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON settlements
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_settlements_tenant  ON settlements (tenant_id);
CREATE INDEX idx_settlements_owner   ON settlements (owner_entity_id);
CREATE INDEX idx_settlements_status  ON settlements (status);
CREATE INDEX idx_settlements_period  ON settlements (period_start, period_end);
