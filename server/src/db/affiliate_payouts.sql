DROP TABLE IF EXISTS affiliate_payouts CASCADE;

CREATE TABLE affiliate_payouts (
    -- row_id: Primary key of the table (matches Siebel/CRM unique record identifier design).
    row_id                    UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    -- bu_id: Business Unit ID (used to isolate data by tenant/organization, matches multi-tenancy requirements).
    bu_id                     UUID         NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    -- par_row_id: Parent Row ID (links this payout transaction directly to its parent affiliate partner).
    par_row_id                UUID         NOT NULL REFERENCES affiliates(id) ON DELETE RESTRICT, 

    amount_minor              BIGINT       NOT NULL,
    currency                  CHAR(3)      NOT NULL DEFAULT 'INR',
    payout_method             VARCHAR(50)  NOT NULL, -- 'UPI', 'bank_transfer', etc.
    payout_details            JSONB,
    status                    VARCHAR(30)  DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    processed_at              TIMESTAMPTZ,
    -- x_data: JSONB extension block representing the extension columns X_columns* (allows dynamic fields without altering schema).
    x_data                    JSONB,

    -- Siebel-style System Columns
    -- created: Timestamp when the record was created (Siebel system field).
    created                   TIMESTAMPTZ  DEFAULT now(),
    -- created_by: User ID who created the record (Siebel system auditing field).
    created_by                UUID,
    -- last_upd: Timestamp when the record was last updated (Siebel system field).
    last_upd                  TIMESTAMPTZ  DEFAULT now(),
    -- last_upd_by: User ID who last updated the record (Siebel system auditing field).
    last_upd_by               UUID,
    -- modification_num: Record version count, incremented on every update (used for optimistic locking/concurrency control).
    modification_num          INTEGER      DEFAULT 0,
    -- conflict_id: Used for merge replication and conflict resolution (defaults to '0').
    conflict_id               VARCHAR(15)  DEFAULT '0',
    -- db_last_upd: System-level database write timestamp (used for replication tracking).
    db_last_upd               TIMESTAMPTZ  DEFAULT now(),
    -- db_last_upd_src: System/Source identifier of the database write operation.
    db_last_upd_src           VARCHAR(50)  DEFAULT 'App'
);

-- Row-Level Security
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON affiliate_payouts
    USING (bu_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_affiliate_payouts_bu_id      ON affiliate_payouts (bu_id);
CREATE INDEX idx_affiliate_payouts_par_row_id ON affiliate_payouts (par_row_id);
CREATE INDEX idx_affiliate_payouts_status     ON affiliate_payouts (status);
