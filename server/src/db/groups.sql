DROP TABLE IF EXISTS groups CASCADE;

CREATE TABLE groups (
    -- row_id: Primary key of the table (matches Siebel/CRM unique record identifier design).
    row_id                    UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    -- bu_id: Business Unit ID (used to isolate data by tenant/organization, matches multi-tenancy requirements).
    bu_id                     UUID         NOT NULL REFERENCES tenants(row_id) ON DELETE CASCADE,
    -- entity_id: Relates the group back to its matching base entity record in the super-type registry table.
    entity_id                 UUID         NOT NULL UNIQUE REFERENCES entities(row_id) ON DELETE CASCADE,
    -- par_row_id: Parent Row ID (links this group to its parent entity, such as the parent community or organization).
    par_row_id                UUID         REFERENCES entities(row_id) ON DELETE CASCADE, 

    name                      VARCHAR(255) NOT NULL,
    description               TEXT,
    status                    VARCHAR(50)  DEFAULT 'active',
    -- pr_dept_ou_id: Primary Department or Organization Unit (used for division-level permissions/routing).
    pr_dept_ou_id             UUID,
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
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON groups
    USING (bu_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_groups_bu_id      ON groups (bu_id);
CREATE INDEX idx_groups_entity_id  ON groups (entity_id);
CREATE INDEX idx_groups_par_row_id ON groups (par_row_id);
