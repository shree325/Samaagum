DROP TABLE IF EXISTS impersonation_sessions CASCADE;

CREATE TABLE impersonation_sessions (
    -- row_id: Primary key of the table (matches Siebel/CRM unique record identifier design).
    row_id                    UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    -- bu_id: Business Unit ID (used to isolate data by tenant/organization, matches multi-tenancy requirements).
    bu_id                     UUID         NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,

    admin_user_id             UUID         NOT NULL, -- Admin executing support
    target_user_id            UUID         NOT NULL, -- User being impersonated
    started_at                TIMESTAMPTZ  DEFAULT now(),
    ended_at                  TIMESTAMPTZ,
    reason                    TEXT         NOT NULL,

    -- Siebel-style System Columns (Simplified / Immutable logs)
    -- created: Timestamp when the impersonation record was logged (Siebel system field).
    created                   TIMESTAMPTZ  DEFAULT now(),
    -- created_by: User ID who started or recorded the impersonation (Siebel system auditing field).
    created_by                UUID,
    -- db_last_upd: System-level database write timestamp (used for replication tracking).
    db_last_upd               TIMESTAMPTZ  DEFAULT now(),
    -- db_last_upd_src: System/Source identifier of the database write operation.
    db_last_upd_src           VARCHAR(50)  DEFAULT 'App'
);

-- Row-Level Security
ALTER TABLE impersonation_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON impersonation_sessions
    USING (bu_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_impersonation_sessions_bu_id    ON impersonation_sessions (bu_id);
CREATE INDEX idx_impersonation_sessions_admin    ON impersonation_sessions (admin_user_id);
CREATE INDEX idx_impersonation_sessions_target   ON impersonation_sessions (target_user_id);
