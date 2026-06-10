DROP TABLE IF EXISTS communities CASCADE;

CREATE TABLE communities (

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

    CONSTRAINT uq_communities_tenant_slug UNIQUE (tenant_id, slug)
);

-- Row-Level Security
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON communities
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_communities_tenant    ON communities (tenant_id);
CREATE INDEX idx_communities_entity    ON communities (entity_id);
CREATE INDEX idx_communities_slug      ON communities (slug);
