DROP TABLE IF EXISTS booking_line_items CASCADE;

CREATE TABLE booking_line_items (

    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL,

    booking_id                UUID        NOT NULL,
    ticket_type_id            UUID        NOT NULL,

    quantity                  INTEGER      NOT NULL CHECK (quantity > 0),

    -- Pricing (multi-currency: minor units + ISO 4217)
    unit_price_minor          BIGINT       NOT NULL,
    currency                  CHAR(3)      NOT NULL,
    discount_minor            BIGINT       DEFAULT 0,
    tax_minor                 BIGINT       DEFAULT 0,
    total_minor               BIGINT       NOT NULL,

    line_status               VARCHAR(50)  DEFAULT 'active',
    attendee_capture_mode     VARCHAR(50)  DEFAULT 'per_ticket',

    -- System columns
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID
);

-- Row-Level Security
ALTER TABLE booking_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON booking_line_items
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_bline_tenant      ON booking_line_items (tenant_id);
CREATE INDEX idx_bline_booking     ON booking_line_items (booking_id);
CREATE INDEX idx_bline_ticket_type ON booking_line_items (ticket_type_id);