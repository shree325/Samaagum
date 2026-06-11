DROP TABLE IF EXISTS idempotency_keys CASCADE;

CREATE TABLE idempotency_keys (
    -- row_id: Primary key of the table (matches Siebel/CRM unique record identifier design).
    row_id                    UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    -- bu_id: Business Unit ID (used to isolate data by tenant/organization, matches multi-tenancy requirements).
    bu_id                     UUID         NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,

    idempotency_key           VARCHAR(255) NOT NULL,
    request_hash              TEXT         NOT NULL,
    response_data             JSONB,
    expires_at                TIMESTAMPTZ  NOT NULL,

    -- Siebel-style System Columns (Simplified / Immutable logs)
    -- created: Timestamp when the idempotency record was created (Siebel system field).
    created                   TIMESTAMPTZ  DEFAULT now(),
    -- db_last_upd: System-level database write timestamp (used for replication tracking).
    db_last_upd               TIMESTAMPTZ  DEFAULT now(),
    -- db_last_upd_src: System/Source identifier of the database write operation.
    db_last_upd_src           VARCHAR(50)  DEFAULT 'App',

    CONSTRAINT uq_idempotency_keys_bu_key UNIQUE (bu_id, idempotency_key)
);

-- Row-Level Security
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON idempotency_keys
    USING (bu_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_idempotency_keys_bu_id ON idempotency_keys (bu_id);
CREATE INDEX idx_idempotency_keys_key   ON idempotency_keys (idempotency_key);
CREATE INDEX idx_idempotency_keys_exp   ON idempotency_keys (expires_at);
