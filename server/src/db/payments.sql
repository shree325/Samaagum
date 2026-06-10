DROP TABLE IF EXISTS payments CASCADE;

CREATE TABLE payments (

    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL,

    booking_id                UUID        NOT NULL,

    method                    VARCHAR(50)  NOT NULL,
    gateway_order_id          VARCHAR(255),
    gateway_payment_id        VARCHAR(255),

    -- Money (multi-currency: minor units + ISO 4217)
    amount_minor              BIGINT       NOT NULL,
    currency                  CHAR(3)      NOT NULL,

    status                    VARCHAR(50)  DEFAULT 'pending',

    -- Proof for cash/offline
    proof_asset_id            UUID,

    -- Collection details
    collected_at              TIMESTAMPTZ,
    received_by_user_id       UUID,

    -- Gateway raw response
    provider_payload          JSONB,

    -- Optimistic concurrency
    modification_num          INTEGER      DEFAULT 0,

    -- System columns
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID
);

-- Row-Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON payments
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_payments_tenant       ON payments (tenant_id);
CREATE INDEX idx_payments_booking      ON payments (booking_id);
CREATE INDEX idx_payments_status       ON payments (status);
CREATE INDEX idx_payments_gateway_pid  ON payments (gateway_payment_id);