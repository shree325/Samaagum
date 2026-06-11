DROP TABLE IF EXISTS ml_feature_store CASCADE;

CREATE TABLE ml_feature_store (
    -- row_id: Primary key of the table (matches Siebel/CRM unique record identifier design).
    row_id                    UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    -- bu_id: Business Unit ID (used to isolate data by tenant/organization, matches multi-tenancy requirements).
    bu_id                     UUID         NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,

    entity_type               VARCHAR(50)  NOT NULL, -- 'user', 'entity', 'event'
    entity_id                 UUID         NOT NULL,
    feature_name              VARCHAR(255) NOT NULL,
    feature_value             JSONB        NOT NULL,

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
    db_last_upd_src           VARCHAR(50)  DEFAULT 'App',

    CONSTRAINT uq_ml_feature_store_entity_feature UNIQUE (entity_type, entity_id, feature_name)
);

-- Row-Level Security
ALTER TABLE ml_feature_store ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON ml_feature_store
    USING (bu_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_ml_feature_store_bu_id   ON ml_feature_store (bu_id);
CREATE INDEX idx_ml_feature_store_entity ON ml_feature_store (entity_type, entity_id);
