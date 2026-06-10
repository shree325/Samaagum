DROP TABLE IF EXISTS checkins CASCADE;

CREATE TABLE checkins (

    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL,

    ticket_id                 UUID        NOT NULL,
    staff_user_id             UUID,
    gate_id                   UUID,

    method                    VARCHAR(50)  DEFAULT 'qr_scan',
    occurred_at               TIMESTAMPTZ  DEFAULT now(),
    status                    VARCHAR(50)  DEFAULT 'successful',

    -- Duplicate-scan prevention
    duplicate_of_checkin_id   UUID,
    source_device_id          UUID,

    notes                     TEXT,

    -- System columns (INSERT-only log — no updated_at needed but kept for consistency)
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID
);

-- Row-Level Security
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON checkins
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_checkins_tenant     ON checkins (tenant_id);
CREATE INDEX idx_checkins_ticket     ON checkins (ticket_id);
CREATE INDEX idx_checkins_gate       ON checkins (gate_id);
CREATE INDEX idx_checkins_occurred   ON checkins (occurred_at);