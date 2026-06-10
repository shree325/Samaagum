DROP TABLE IF EXISTS tenants CASCADE;

CREATE TABLE tenants (
    -- row_id: Primary key of the table (matches Siebel/CRM unique record identifier design).
    row_id                    UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Business details
    name                      VARCHAR(255) NOT NULL,
    slug                      VARCHAR(255) NOT NULL UNIQUE,
    status                    VARCHAR(30)  DEFAULT 'active',

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
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tenants
    USING (row_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_tenants_slug ON tenants (slug);
