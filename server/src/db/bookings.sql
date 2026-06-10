DROP TABLE IF EXISTS bookings CASCADE;

CREATE TABLE bookings (

    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL,

    event_id                  UUID        NOT NULL,
    booker_user_id            UUID        NOT NULL,

    booking_reference         VARCHAR(50)  NOT NULL,

    status                    VARCHAR(50)  NOT NULL DEFAULT 'pending',
    payment_method            VARCHAR(50),
    hold_expires_at           TIMESTAMPTZ,

    -- Pricing breakdown (multi-currency: minor units + ISO 4217)
    subtotal_minor            BIGINT       NOT NULL DEFAULT 0,
    discount_minor            BIGINT       NOT NULL DEFAULT 0,
    tax_minor                 BIGINT       NOT NULL DEFAULT 0,
    total_minor               BIGINT       NOT NULL DEFAULT 0,
    currency                  CHAR(3)      NOT NULL,

    total_tickets             INTEGER      NOT NULL DEFAULT 1,

    source_channel            VARCHAR(50),
    notes                     TEXT,

    -- Extension / custom attributes
    x_data                    JSONB,

    -- Optimistic concurrency
    modification_num          INTEGER      DEFAULT 0,

    -- System columns
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID,

    CONSTRAINT uq_bookings_tenant_ref UNIQUE (tenant_id, booking_reference)
);

-- Row-Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON bookings
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_bookings_tenant       ON bookings (tenant_id);
CREATE INDEX idx_bookings_event        ON bookings (event_id);
CREATE INDEX idx_bookings_booker       ON bookings (booker_user_id);
CREATE INDEX idx_bookings_status       ON bookings (status);
CREATE INDEX idx_bookings_reference    ON bookings (booking_reference);