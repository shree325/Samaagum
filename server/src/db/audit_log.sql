CREATE TABLE IF NOT EXISTS audit_log (
    audit_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id           UUID NULL,
    actor_user_id       UUID NULL,

    action              audit_action_enum NOT NULL,
    target_table        TEXT NOT NULL,
    target_entity_id    UUID NULL,

    before_json         JSONB NOT NULL DEFAULT '{}'::jsonb,
    after_json          JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_by_user_id  UUID NULL,
    updated_by_user_id  UUID NULL,
    modification_num    INTEGER NOT NULL DEFAULT 1,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_audit_log_target_table_not_blank
        CHECK (btrim(target_table) <> ''),

    CONSTRAINT fk_audit_log_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(tenant_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_audit_log_actor_user
        FOREIGN KEY (actor_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_audit_log_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_audit_log_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_id
    ON audit_log(tenant_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor_user_id
    ON audit_log(actor_user_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_action
    ON audit_log(action);

CREATE INDEX IF NOT EXISTS idx_audit_log_target_table
    ON audit_log(target_table);

CREATE INDEX IF NOT EXISTS idx_audit_log_target_entity_id
    ON audit_log(target_entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at
    ON audit_log(created_at);

DROP TRIGGER IF EXISTS trg_audit_log_audit ON audit_log;
CREATE TRIGGER trg_audit_log_audit
BEFORE INSERT OR UPDATE ON audit_log
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();
