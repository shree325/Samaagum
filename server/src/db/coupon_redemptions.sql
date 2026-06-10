DROP TABLE IF EXISTS coupon_redemptions CASCADE;

CREATE TABLE coupon_redemptions (

    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL,

    coupon_id                 UUID        NOT NULL,
    booking_id                UUID        NOT NULL,
    line_item_id              UUID,
    user_id                   UUID,

    -- Money (multi-currency: minor units + ISO 4217)
    discount_applied_minor    BIGINT       NOT NULL,
    currency                  CHAR(3)      NOT NULL,

    redeemed_at               TIMESTAMPTZ  DEFAULT now(),
    source_channel            VARCHAR(50),
    status                    VARCHAR(50)  DEFAULT 'applied',

    -- System columns
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID
);

-- Row-Level Security
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON coupon_redemptions
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_coupon_redemptions_tenant  ON coupon_redemptions (tenant_id);
CREATE INDEX idx_coupon_redemptions_coupon  ON coupon_redemptions (coupon_id);
CREATE INDEX idx_coupon_redemptions_booking ON coupon_redemptions (booking_id);
CREATE INDEX idx_coupon_redemptions_user    ON coupon_redemptions (user_id);