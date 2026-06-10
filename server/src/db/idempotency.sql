CREATE TABLE IF NOT EXISTS idempotency_keys (
    key                 TEXT PRIMARY KEY,

    scope               entity_visibility_scope_enum NOT NULL DEFAULT 'tenant',
    tenant_id           UUID NULL,
    scope_entity_id     UUID NULL,

    first_seen_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    response_hash       TEXT NULL,
    expires_at          TIMESTAMPTZ NULL,

    created_by_user_id  UUID NULL,
    updated_by_user_id  UUID NULL,
    modification_num    INTEGER NOT NULL DEFAULT 1,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_idempotency_keys_key_not_blank
        CHECK (btrim(key) <> ''),

    CONSTRAINT chk_idempotency_keys_expires_at
        CHECK (expires_at IS NULL OR expires_at >= first_seen_at),

    CONSTRAINT fk_idempotency_keys_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(tenant_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_idempotency_keys_scope_entity
        FOREIGN KEY (scope_entity_id)
        REFERENCES entities(entity_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_idempotency_keys_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_idempotency_keys_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_scope
    ON idempotency_keys(scope);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_tenant_id
    ON idempotency_keys(tenant_id);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_scope_entity_id
    ON idempotency_keys(scope_entity_id);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at
    ON idempotency_keys(expires_at);

DROP TRIGGER IF EXISTS trg_idempotency_keys_audit ON idempotency_keys;
CREATE TRIGGER trg_idempotency_keys_audit
BEFORE INSERT OR UPDATE ON idempotency_keys
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();
