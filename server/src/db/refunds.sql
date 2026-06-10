DROP TABLE IF EXISTS refunds CASCADE;

CREATE TABLE refunds (

    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL,

    payment_id                UUID        NOT NULL,
    line_item_id              UUID,
    approved_by               UUID,

    -- Money (multi-currency: minor units + ISO 4217)
    amount_minor              BIGINT       NOT NULL,
    currency                  CHAR(3)      NOT NULL,

    mode                      VARCHAR(50)  NOT NULL,
    status                    VARCHAR(50)  DEFAULT 'pending',
    is_partial                BOOLEAN      DEFAULT FALSE,

    reason                    TEXT,
    external_ref              VARCHAR(255),

    requested_at              TIMESTAMPTZ  DEFAULT now(),
    approved_at               TIMESTAMPTZ,
    processed_at              TIMESTAMPTZ,

    -- System columns
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID
);

-- Row-Level Security
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON refunds
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_refunds_tenant    ON refunds (tenant_id);
CREATE INDEX idx_refunds_payment   ON refunds (payment_id);
CREATE INDEX idx_refunds_status    ON refunds (status);