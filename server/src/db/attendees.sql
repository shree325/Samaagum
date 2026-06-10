DROP TABLE IF EXISTS attendees CASCADE;

CREATE TABLE attendees (

    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL,

    booking_id                UUID        NOT NULL,
    ticket_id                 UUID,
    user_id                   UUID,

    name                      VARCHAR(255) NOT NULL,
    email                     VARCHAR(255),
    gender                    VARCHAR(20),
    phone                     VARCHAR(20),
    dob                       DATE,

    claimed_at                TIMESTAMPTZ,
    checkin_status            VARCHAR(50)  DEFAULT 'not_checked_in',

    notes                     TEXT,

    -- System columns
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID
);

-- Row-Level Security
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON attendees
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_attendees_tenant    ON attendees (tenant_id);
CREATE INDEX idx_attendees_booking   ON attendees (booking_id);
CREATE INDEX idx_attendees_user      ON attendees (user_id);
CREATE INDEX idx_attendees_email     ON attendees (email);
