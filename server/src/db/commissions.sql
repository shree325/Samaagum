DROP TABLE IF EXISTS commissions CASCADE;

CREATE TABLE commissions (

    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL,

    affiliate_id              UUID        NOT NULL,

    source_type               VARCHAR(50)  NOT NULL,
    source_id                 UUID         NOT NULL,

    -- Money (multi-currency: minor units + ISO 4217)
    amount_minor              BIGINT       NOT NULL,
    currency                  CHAR(3)      NOT NULL,

    state                     VARCHAR(50)  DEFAULT 'earned',

    earned_at                 TIMESTAMPTZ  DEFAULT now(),
    approved_at               TIMESTAMPTZ,
    paid_at                   TIMESTAMPTZ,

    -- System columns
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID
);

-- Row-Level Security
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON commissions
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_commissions_tenant    ON commissions (tenant_id);
CREATE INDEX idx_commissions_affiliate ON commissions (affiliate_id);
CREATE INDEX idx_commissions_state     ON commissions (state);
