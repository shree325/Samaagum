DROP TABLE IF EXISTS sponsorship_packages CASCADE;

CREATE TABLE sponsorship_packages (

    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL,

    event_id                  UUID        NOT NULL,

    title                     VARCHAR(255) NOT NULL,
    description               TEXT,
    display_rank              INTEGER      DEFAULT 0,

    -- Pricing (multi-currency: minor units + ISO 4217)
    price_minor               BIGINT       NOT NULL,
    currency                  CHAR(3)      NOT NULL,

    benefits                  JSONB,
    inventory                 INTEGER      DEFAULT 1,
    status                    VARCHAR(50)  DEFAULT 'active',
    creative_requirements     JSONB,

    -- System columns
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID
);

-- Row-Level Security
ALTER TABLE sponsorship_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON sponsorship_packages
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_sponsorship_packages_tenant ON sponsorship_packages (tenant_id);
CREATE INDEX idx_sponsorship_packages_event  ON sponsorship_packages (event_id);
