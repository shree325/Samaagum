DROP TABLE IF EXISTS org_domains CASCADE;

CREATE TABLE org_domains (

    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL,

    org_entity_id             UUID        NOT NULL,

    domain_name               VARCHAR(255) NOT NULL,
    verification_status       VARCHAR(50)  DEFAULT 'pending',
    verified_at               TIMESTAMPTZ,
    is_primary                BOOLEAN      DEFAULT FALSE,
    dns_record                JSONB,

    -- System columns
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID,

    CONSTRAINT uq_org_domains_domain UNIQUE (domain_name)
);

-- Row-Level Security
ALTER TABLE org_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON org_domains
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_org_domains_tenant ON org_domains (tenant_id);
CREATE INDEX idx_org_domains_org    ON org_domains (org_entity_id);
CREATE INDEX idx_org_domains_domain ON org_domains (domain_name);
