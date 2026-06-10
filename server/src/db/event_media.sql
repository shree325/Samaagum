DROP TABLE IF EXISTS event_media CASCADE;

CREATE TABLE event_media (

    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL,

    event_id                  UUID        NOT NULL,
    asset_id                  UUID        NOT NULL,

    media_type                VARCHAR(50)  NOT NULL DEFAULT 'image',
    caption                   TEXT,
    alt_text                  VARCHAR(500),

    sort_order                INTEGER      DEFAULT 0,
    visibility                VARCHAR(50)  DEFAULT 'public',
    is_primary                BOOLEAN      DEFAULT FALSE,

    -- System columns
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID
);

-- Row-Level Security
ALTER TABLE event_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON event_media
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_event_media_tenant  ON event_media (tenant_id);
CREATE INDEX idx_event_media_event   ON event_media (event_id);
