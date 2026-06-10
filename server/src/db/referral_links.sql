DROP TABLE IF EXISTS referral_links CASCADE;

CREATE TABLE referral_links (

    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL,

    affiliate_id              UUID        NOT NULL,

    code                      VARCHAR(100) NOT NULL,
    destination_url           TEXT         NOT NULL,
    campaign_name             VARCHAR(255),

    clicked_count             INTEGER      DEFAULT 0,
    converted_count           INTEGER      DEFAULT 0,

    status                    VARCHAR(50)  DEFAULT 'active',
    expires_at                TIMESTAMPTZ,

    -- System columns
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID,

    CONSTRAINT uq_referral_links_tenant_code UNIQUE (tenant_id, code)
);

-- Row-Level Security
ALTER TABLE referral_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON referral_links
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_referral_links_tenant    ON referral_links (tenant_id);
CREATE INDEX idx_referral_links_affiliate ON referral_links (affiliate_id);
CREATE INDEX idx_referral_links_code      ON referral_links (code);
