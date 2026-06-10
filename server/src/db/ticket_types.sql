DROP TABLE IF EXISTS ticket_types CASCADE;

CREATE TABLE ticket_types (

    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL,

    event_id                  UUID        NOT NULL,

    name                      VARCHAR(255) NOT NULL,
    description               TEXT,

    -- Pricing (multi-currency: minor units + ISO 4217)
    price_minor               BIGINT       NOT NULL DEFAULT 0,
    currency                  CHAR(3)      NOT NULL,

    -- Inventory
    capacity                  INTEGER,
    quantity_sold             INTEGER      DEFAULT 0,
    max_per_booking            INTEGER,

    -- Sale window
    sale_start_at              TIMESTAMPTZ,
    sale_end_at                TIMESTAMPTZ,

    -- Early bird pricing
    early_bird_price_minor     BIGINT,
    early_bird_ends_at         TIMESTAMPTZ,

    -- Display
    visibility                 VARCHAR(50)  DEFAULT 'public',
    sort_order                 INTEGER      DEFAULT 0,
    is_active                  BOOLEAN      DEFAULT TRUE,
    status                     VARCHAR(50)  DEFAULT 'active',

    -- Forward-compatible membership rule
    membership_tier_id         UUID,

    -- Optimistic concurrency
    modification_num           INTEGER      DEFAULT 0,

    -- System columns
    created_at                 TIMESTAMPTZ  DEFAULT now(),
    created_by                 UUID,
    updated_at                 TIMESTAMPTZ  DEFAULT now(),
    updated_by                 UUID
);

-- Row-Level Security
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON ticket_types
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_ticket_types_tenant   ON ticket_types (tenant_id);
CREATE INDEX idx_ticket_types_event    ON ticket_types (event_id);