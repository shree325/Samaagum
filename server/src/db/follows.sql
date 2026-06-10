DROP TABLE IF EXISTS follows CASCADE;

CREATE TABLE follows (

    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL,

    user_id                   UUID        NOT NULL,
    entity_id                 UUID        NOT NULL,

    follow_state              VARCHAR(50)  DEFAULT 'active',
    muted                     BOOLEAN      DEFAULT FALSE,

    -- System columns
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID,

    CONSTRAINT uq_follows_user_entity UNIQUE (user_id, entity_id)
);

-- Row-Level Security
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON follows
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_follows_tenant   ON follows (tenant_id);
CREATE INDEX idx_follows_user     ON follows (user_id);
CREATE INDEX idx_follows_entity   ON follows (entity_id);
