DROP TABLE IF EXISTS referral_clicks CASCADE;

CREATE TABLE referral_clicks (
    -- row_id: Primary key of the table (matches Siebel/CRM unique record identifier design).
    row_id                    UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    -- bu_id: Business Unit ID (used to isolate data by tenant/organization, matches multi-tenancy requirements).
    bu_id                     UUID         NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    -- par_row_id: Parent Row ID (links this click event directly to its parent referral link).
    par_row_id                UUID         NOT NULL REFERENCES referral_links(id) ON DELETE CASCADE, 

    ip_address                VARCHAR(45),
    user_agent                TEXT,
    device_type               VARCHAR(50),
    clicked_at                TIMESTAMPTZ  DEFAULT now(),

    -- Siebel-style System Columns (Simplified / Immutable logs)
    -- created: Timestamp when the click was logged (Siebel system field).
    created                   TIMESTAMPTZ  DEFAULT now(),
    -- created_by: User ID who triggered or recorded the action (Siebel system auditing field).
    created_by                UUID,
    -- db_last_upd: System-level database write timestamp (used for replication tracking).
    db_last_upd               TIMESTAMPTZ  DEFAULT now(),
    -- db_last_upd_src: System/Source identifier of the database write operation.
    db_last_upd_src           VARCHAR(50)  DEFAULT 'App'
);

-- Row-Level Security
ALTER TABLE referral_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON referral_clicks
    USING (bu_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_referral_clicks_bu_id      ON referral_clicks (bu_id);
CREATE INDEX idx_referral_clicks_par_row_id ON referral_clicks (par_row_id);
