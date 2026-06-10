DROP TABLE IF EXISTS sponsorship_orders CASCADE;

CREATE TABLE sponsorship_orders (

    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL,

    package_id                UUID        NOT NULL,
    sponsor_entity_id         UUID        NOT NULL,

    status                    VARCHAR(50)  DEFAULT 'pending',

    -- Money (multi-currency: minor units + ISO 4217)
    amount_minor              BIGINT       NOT NULL,
    currency                  CHAR(3)      NOT NULL,

    creative_asset_id         UUID,
    approved_by               UUID,
    activated_at              TIMESTAMPTZ,
    expires_at                TIMESTAMPTZ,

    -- System columns
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID
);

-- Row-Level Security
ALTER TABLE sponsorship_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON sponsorship_orders
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_sponsorship_orders_tenant   ON sponsorship_orders (tenant_id);
CREATE INDEX idx_sponsorship_orders_package  ON sponsorship_orders (package_id);
CREATE INDEX idx_sponsorship_orders_sponsor  ON sponsorship_orders (sponsor_entity_id);
