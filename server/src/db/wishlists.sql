DROP TABLE IF EXISTS wishlists CASCADE;

CREATE TABLE wishlists (

    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL,

    user_id                   UUID        NOT NULL,
    event_id                  UUID        NOT NULL,

    alert_opt_in              BOOLEAN      DEFAULT FALSE,
    source                    VARCHAR(50),

    -- System columns
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID,

    CONSTRAINT uq_wishlists_user_event UNIQUE (user_id, event_id)
);

-- Row-Level Security
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON wishlists
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_wishlists_tenant ON wishlists (tenant_id);
CREATE INDEX idx_wishlists_user   ON wishlists (user_id);
CREATE INDEX idx_wishlists_event  ON wishlists (event_id);
