DROP TABLE IF EXISTS collaborations CASCADE;

CREATE TABLE collaborations (

    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL,

    entity_id                 UUID        NOT NULL UNIQUE,

    name                      VARCHAR(255) NOT NULL,
    slug                      VARCHAR(255) NOT NULL,
    description               TEXT,
    cover_asset_id            UUID,

    visibility                VARCHAR(50)  DEFAULT 'public',
    status                    VARCHAR(50)  DEFAULT 'active',
    member_count              INTEGER      DEFAULT 0,

    -- Extension / custom attributes
    x_data                    JSONB,

    -- System columns
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID,

    CONSTRAINT uq_collaborations_tenant_slug UNIQUE (tenant_id, slug)
);

-- Row-Level Security
ALTER TABLE collaborations ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON collaborations
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_collaborations_tenant ON collaborations (tenant_id);
CREATE INDEX idx_collaborations_entity ON collaborations (entity_id);
CREATE INDEX idx_collaborations_slug   ON collaborations (slug);
