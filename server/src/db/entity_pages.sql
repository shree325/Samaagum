DROP TABLE IF EXISTS entity_pages CASCADE;

CREATE TABLE entity_pages (

    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL,

    owner_entity_id           UUID        NOT NULL,

    page_type                 VARCHAR(50)  NOT NULL DEFAULT 'about',
    slug                      VARCHAR(255) NOT NULL,
    title                     VARCHAR(255) NOT NULL,
    content_blocks            JSONB,

    listed                    BOOLEAN      DEFAULT TRUE,
    status                    VARCHAR(50)  DEFAULT 'draft',
    published_at              TIMESTAMPTZ,

    -- System columns
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID,

    CONSTRAINT uq_entity_pages_owner_slug UNIQUE (owner_entity_id, slug)
);

-- Row-Level Security
ALTER TABLE entity_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON entity_pages
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_entity_pages_tenant ON entity_pages (tenant_id);
CREATE INDEX idx_entity_pages_owner  ON entity_pages (owner_entity_id);
CREATE INDEX idx_entity_pages_slug   ON entity_pages (slug);
