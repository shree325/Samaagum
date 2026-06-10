DROP TABLE IF EXISTS orgs CASCADE;

CREATE TABLE orgs (

    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL,

    entity_id                 UUID        NOT NULL UNIQUE,

    legal_name                VARCHAR(255) NOT NULL,
    display_name              VARCHAR(255) NOT NULL,
    branding                  JSONB,

    support_email             VARCHAR(255),
    support_phone             VARCHAR(20),

    status                    VARCHAR(50)  DEFAULT 'active',
    owner_entity_id           UUID,

    -- Extension / custom attributes
    x_data                    JSONB,

    -- System columns
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID
);

-- Row-Level Security
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON orgs
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_orgs_tenant ON orgs (tenant_id);
CREATE INDEX idx_orgs_entity ON orgs (entity_id);
