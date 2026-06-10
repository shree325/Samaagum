DROP TABLE IF EXISTS categories CASCADE;

CREATE TABLE categories (
    -- row_id: Primary key of the table (matches Siebel/CRM unique record identifier design).
    row_id                    UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    -- bu_id: Business Unit ID (used to isolate data by tenant/organization, matches multi-tenancy requirements).
    bu_id                     UUID         NOT NULL REFERENCES tenants(row_id) ON DELETE CASCADE,
    -- par_row_id: Parent Row ID (links this category record self-referentially to its parent category for tree structure).
    par_row_id                UUID         REFERENCES categories(row_id) ON DELETE SET NULL, 

    name                      VARCHAR(255) NOT NULL,
    slug                      VARCHAR(255) NOT NULL,

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

    CONSTRAINT uq_categories_bu_slug UNIQUE (bu_id, slug)
);

-- Row-Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON categories
    USING (bu_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_categories_bu_id      ON categories (bu_id);
CREATE INDEX idx_categories_par_row_id ON categories (par_row_id);
CREATE INDEX idx_categories_slug       ON categories (slug);
