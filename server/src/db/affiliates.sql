DROP TABLE IF EXISTS affiliates CASCADE;

CREATE TABLE affiliates (

    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL,

    owner_user_id             UUID,
    owner_entity_id           UUID,

    referral_code             VARCHAR(100) NOT NULL,
    status                    VARCHAR(50)  DEFAULT 'active',

    payout_method             VARCHAR(50),
    payout_details            JSONB,

    joined_at                 TIMESTAMPTZ  DEFAULT now(),

    -- Extension / custom attributes
    x_data                    JSONB,

    -- System columns
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID,

    CONSTRAINT uq_affiliates_tenant_code UNIQUE (tenant_id, referral_code)
);

-- Row-Level Security
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON affiliates
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_affiliates_tenant   ON affiliates (tenant_id);
CREATE INDEX idx_affiliates_code     ON affiliates (referral_code);
