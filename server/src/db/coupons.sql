DROP TABLE IF EXISTS coupons CASCADE;

CREATE TABLE coupons (

    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL,

    event_id                  UUID,

    code                      VARCHAR(100) NOT NULL,
    description               TEXT,

    discount_type             VARCHAR(20)  NOT NULL,

    -- Money (multi-currency: minor units + ISO 4217)
    amount_minor              BIGINT,
    percent                   NUMERIC(5,2),
    min_order_minor           BIGINT       DEFAULT 0,
    currency                  CHAR(3),

    valid_from                TIMESTAMPTZ,
    valid_to                  TIMESTAMPTZ,

    max_total                 INTEGER,
    max_per_user              INTEGER      DEFAULT 1,
    usage_count               INTEGER      DEFAULT 0,

    stackable_with_early_bird BOOLEAN      DEFAULT FALSE,

    status                    VARCHAR(50)  DEFAULT 'active',

    -- System columns
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID,

    CONSTRAINT uq_coupons_tenant_code UNIQUE (tenant_id, code),
    CONSTRAINT chk_coupon_discount CHECK (
        (discount_type = 'fixed' AND amount_minor IS NOT NULL AND currency IS NOT NULL)
        OR
        (discount_type = 'percentage' AND percent IS NOT NULL)
    )
);

-- Row-Level Security
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON coupons
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_coupons_tenant  ON coupons (tenant_id);
CREATE INDEX idx_coupons_event   ON coupons (event_id);
CREATE INDEX idx_coupons_code    ON coupons (code);