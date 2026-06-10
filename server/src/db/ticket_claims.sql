DROP TABLE IF EXISTS ticket_claims CASCADE;

CREATE TABLE ticket_claims (

    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL,

    ticket_id                 UUID        NOT NULL,

    token                     VARCHAR(255) NOT NULL,
    expires_at                TIMESTAMPTZ  NOT NULL,

    claimed_at                TIMESTAMPTZ,
    claimed_user_id           UUID,
    otp_verified_at           TIMESTAMPTZ,

    attempt_count             INTEGER      DEFAULT 0,
    status                    VARCHAR(50)  DEFAULT 'pending',

    -- System columns
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID,

    CONSTRAINT uq_ticket_claims_tenant_token UNIQUE (tenant_id, token)
);

-- Row-Level Security
ALTER TABLE ticket_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON ticket_claims
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_ticket_claims_tenant  ON ticket_claims (tenant_id);
CREATE INDEX idx_ticket_claims_ticket  ON ticket_claims (ticket_id);
CREATE INDEX idx_ticket_claims_token   ON ticket_claims (token);
