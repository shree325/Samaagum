DROP TABLE IF EXISTS signals CASCADE;

CREATE TABLE signals (
    -- row_id: Primary key of the table (matches Siebel/CRM unique record identifier design).
    row_id                    UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    -- bu_id: Business Unit ID (used to isolate data by tenant/organization, matches multi-tenancy requirements).
    bu_id                     UUID         NOT NULL REFERENCES tenants(row_id) ON DELETE CASCADE,

    entity_type               VARCHAR(100) NOT NULL, -- 'event', 'community'
    entity_id                 UUID         NOT NULL,
    signal_type               VARCHAR(100) NOT NULL, -- 'attended', 'followed', 'purchased'
    signal_value              NUMERIC      NOT NULL DEFAULT 1.0,

    -- Siebel-style System Columns (Simplified / Immutable logs)
    -- created: Timestamp when the signal was registered (Siebel system field).
    created                   TIMESTAMPTZ  DEFAULT now(),
    -- created_by: User ID who generated the action (Siebel system auditing field).
    created_by                UUID,
    -- db_last_upd: System-level database write timestamp (used for replication tracking).
    db_last_upd               TIMESTAMPTZ  DEFAULT now(),
    -- db_last_upd_src: System/Source identifier of the database write operation.
    db_last_upd_src           VARCHAR(50)  DEFAULT 'App'
);

-- Row-Level Security
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON signals
    USING (bu_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_signals_bu_id    ON signals (bu_id);
CREATE INDEX idx_signals_entity   ON signals (entity_type, entity_id);
CREATE INDEX idx_signals_type     ON signals (signal_type);
