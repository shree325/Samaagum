DROP TABLE IF EXISTS audit_log CASCADE;

CREATE TABLE audit_log (
    -- row_id: Primary key of the table (matches Siebel/CRM unique record identifier design).
    row_id                    UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    -- bu_id: Business Unit ID (used to isolate data by tenant/organization, matches multi-tenancy requirements).
    bu_id                     UUID         NOT NULL REFERENCES tenants(row_id) ON DELETE CASCADE,

    actor_id                  UUID         NOT NULL, -- User performing the action
    action                    VARCHAR(255) NOT NULL, -- 'role_changed', 'deleted', 'refunded'
    resource_type             VARCHAR(100) NOT NULL,
    resource_id               UUID         NOT NULL,
    metadata                  JSONB,

    -- Siebel-style System Columns (Simplified / Immutable logs)
    -- created: Timestamp when the audit entry was written (Siebel system field).
    created                   TIMESTAMPTZ  DEFAULT now(),
    -- db_last_upd: System-level database write timestamp (used for replication tracking).
    db_last_upd               TIMESTAMPTZ  DEFAULT now(),
    -- db_last_upd_src: System/Source identifier of the database write operation.
    db_last_upd_src           VARCHAR(50)  DEFAULT 'App'
);

-- Row-Level Security
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON audit_log
    USING (bu_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_audit_log_bu_id    ON audit_log (bu_id);
CREATE INDEX idx_audit_log_actor   ON audit_log (actor_id);
CREATE INDEX idx_audit_log_resource ON audit_log (resource_type, resource_id);
CREATE INDEX idx_audit_log_created  ON audit_log (created);
