DROP TABLE IF EXISTS tickets CASCADE;

CREATE TABLE tickets (

    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL,

    booking_id                UUID        NOT NULL,
    line_item_id              UUID        NOT NULL,
    attendee_id               UUID,

    -- Denormalized attendee data for fast entry/claim flows
    attendee_name             VARCHAR(255) NOT NULL,
    attendee_email            VARCHAR(255),
    attendee_gender           VARCHAR(20),

    -- Credential
    ticket_number             VARCHAR(100) NOT NULL,
    qr_token                  VARCHAR(255) NOT NULL,

    status                    VARCHAR(50)  DEFAULT 'issued',

    -- Claim
    claimed_by_user_id        UUID,
    issued_at                 TIMESTAMPTZ  DEFAULT now(),
    revoked_at                TIMESTAMPTZ,

    -- Extras
    transferable              BOOLEAN      DEFAULT TRUE,
    seat_number               VARCHAR(50),

    -- Optimistic concurrency
    modification_num          INTEGER      DEFAULT 0,

    -- System columns
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID,

    CONSTRAINT uq_tickets_tenant_number UNIQUE (tenant_id, ticket_number),
    CONSTRAINT uq_tickets_tenant_qr     UNIQUE (tenant_id, qr_token)
);

-- Row-Level Security
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tickets
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_tickets_tenant      ON tickets (tenant_id);
CREATE INDEX idx_tickets_booking     ON tickets (booking_id);
CREATE INDEX idx_tickets_line_item   ON tickets (line_item_id);
CREATE INDEX idx_tickets_qr          ON tickets (qr_token);
CREATE INDEX idx_tickets_status      ON tickets (status);
CREATE INDEX idx_tickets_claimed_by  ON tickets (claimed_by_user_id);