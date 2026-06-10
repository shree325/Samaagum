DROP TABLE IF EXISTS event_categories CASCADE;

CREATE TABLE event_categories (

    id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id         UUID        NOT NULL,

    name              VARCHAR(100) NOT NULL,
    description       TEXT,
    icon_url          TEXT,

    status            VARCHAR(20)  DEFAULT 'active',
    display_order     INTEGER      DEFAULT 0,

    -- System columns
    created_at        TIMESTAMPTZ  DEFAULT now(),
    created_by        UUID,
    updated_at        TIMESTAMPTZ  DEFAULT now(),
    updated_by        UUID,

    CONSTRAINT uq_event_categories_tenant_name UNIQUE (tenant_id, name),
    CONSTRAINT chk_event_category_status CHECK (status IN ('active', 'inactive'))
);

-- Row-Level Security
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON event_categories
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_event_categories_tenant ON event_categories (tenant_id);