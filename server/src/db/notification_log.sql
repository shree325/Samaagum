DROP TABLE IF EXISTS notification_log CASCADE;

CREATE TABLE notification_log (
    -- row_id: Primary key of the table (matches Siebel/CRM unique record identifier design).
    row_id                    UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    -- bu_id: Business Unit ID (used to isolate data by tenant/organization, matches multi-tenancy requirements).
    bu_id                     UUID         NOT NULL REFERENCES tenants(row_id) ON DELETE CASCADE,

    user_id                   UUID         NOT NULL,
    notification_type         VARCHAR(100) NOT NULL, -- 'Ticket confirmation', 'Event reminder'
    channel                   VARCHAR(50)  NOT NULL, -- 'email', 'sms', 'push'
    status                    VARCHAR(50)  DEFAULT 'sent', -- 'sent', 'failed', 'pending'
    sent_at                   TIMESTAMPTZ  DEFAULT now(),

    -- Siebel-style System Columns (Simplified / Immutable logs)
    -- created: Timestamp when the notification was created/logged (Siebel system field).
    created                   TIMESTAMPTZ  DEFAULT now(),
    -- db_last_upd: System-level database write timestamp (used for replication tracking).
    db_last_upd               TIMESTAMPTZ  DEFAULT now(),
    -- db_last_upd_src: System/Source identifier of the database write operation.
    db_last_upd_src           VARCHAR(50)  DEFAULT 'App'
);

-- Row-Level Security
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON notification_log
    USING (bu_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_notification_log_bu_id   ON notification_log (bu_id);
CREATE INDEX idx_notification_log_user_id ON notification_log (user_id);
CREATE INDEX idx_notification_log_sent    ON notification_log (sent_at);
