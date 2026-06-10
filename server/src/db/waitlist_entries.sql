DROP TABLE IF EXISTS waitlist_entries CASCADE;

CREATE TABLE waitlist_entries (

    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL,

    event_id                  UUID        NOT NULL,
    ticket_type_id            UUID,
    user_id                   UUID,

    position                  INTEGER,
    state                     VARCHAR(50)  DEFAULT 'waiting',

    -- Hold support
    hold_payment_id           UUID,
    hold_expires_at           TIMESTAMPTZ,

    requested_at              TIMESTAMPTZ  DEFAULT now(),
    released_at               TIMESTAMPTZ,

    notes                     TEXT,

    -- Optimistic concurrency
    modification_num          INTEGER      DEFAULT 0,

    -- System columns
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID
);

-- Row-Level Security
ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON waitlist_entries
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_waitlist_tenant       ON waitlist_entries (tenant_id);
CREATE INDEX idx_waitlist_event        ON waitlist_entries (event_id);
CREATE INDEX idx_waitlist_user         ON waitlist_entries (user_id);
CREATE INDEX idx_waitlist_state        ON waitlist_entries (state);