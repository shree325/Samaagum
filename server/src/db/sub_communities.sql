DROP TABLE IF EXISTS sub_communities CASCADE;

CREATE TABLE sub_communities (

    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    -- tenant_id: References tenants(row_id) to isolate data by tenant.
    tenant_id                 UUID        NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,

    -- entity_id: Links to the base entity table in the registry.
    entity_id                 UUID        NOT NULL UNIQUE REFERENCES entities(row_id) ON DELETE CASCADE,
    -- community_entity_id: References the parent community entity.
    community_entity_id       UUID        NOT NULL REFERENCES entities(row_id) ON DELETE CASCADE,

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

    CONSTRAINT uq_sub_communities_tenant_slug UNIQUE (tenant_id, slug)
);

-- Row-Level Security
ALTER TABLE sub_communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON sub_communities
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_sub_communities_tenant     ON sub_communities (tenant_id);
CREATE INDEX idx_sub_communities_community  ON sub_communities (community_entity_id);
