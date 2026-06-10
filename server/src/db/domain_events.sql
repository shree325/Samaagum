DROP TABLE IF EXISTS domain_events CASCADE;

CREATE TABLE domain_events (
    -- row_id: Primary key of the table (matches Siebel/CRM unique record identifier design).
    row_id                    UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    -- bu_id: Business Unit ID (used to isolate data by tenant/organization, matches multi-tenancy requirements).
    bu_id                     UUID         NOT NULL REFERENCES tenants(row_id) ON DELETE CASCADE,

    aggregate_type            VARCHAR(100) NOT NULL, -- 'booking', 'ticket', etc.
    aggregate_id              UUID         NOT NULL,
    event_type                VARCHAR(100) NOT NULL, -- 'Booking Created', 'Ticket Checked In'
    payload                   JSONB        NOT NULL,
    occurred_at               TIMESTAMPTZ  DEFAULT now(),

    -- Siebel-style System Columns (Simplified / Immutable logs)
    -- created: Timestamp when the event record was logged (Siebel system field).
    created                   TIMESTAMPTZ  DEFAULT now(),
    -- created_by: User ID who triggered the event (Siebel system auditing field).
    created_by                UUID,
    -- db_last_upd: System-level database write timestamp (used for replication tracking).
    db_last_upd               TIMESTAMPTZ  DEFAULT now(),
    -- db_last_upd_src: System/Source identifier of the database write operation.
    db_last_upd_src           VARCHAR(50)  DEFAULT 'App'
);

-- Row-Level Security
ALTER TABLE domain_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON domain_events
    USING (bu_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_domain_events_bu_id      ON domain_events (bu_id);
CREATE INDEX idx_domain_events_aggregate  ON domain_events (aggregate_type, aggregate_id);
CREATE INDEX idx_domain_events_type       ON domain_events (event_type);
CREATE INDEX idx_domain_events_occurred   ON domain_events (occurred_at);
