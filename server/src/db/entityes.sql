CREATE TABLE IF NOT EXISTS entities (
    entity_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id           UUID NOT NULL,
    parent_entity_id    UUID NULL,

    entity_type         entity_type_enum NOT NULL,
    status              entity_status_enum NOT NULL DEFAULT 'active',
    visibility          visibility_enum NOT NULL DEFAULT 'private',

    metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_by_user_id  UUID NULL,
    updated_by_user_id  UUID NULL,
    modification_num    INTEGER NOT NULL DEFAULT 1,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_entities_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(tenant_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_entities_parent
        FOREIGN KEY (parent_entity_id)
        REFERENCES entities(entity_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_entities_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_entities_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_entities_tenant_id
    ON entities(tenant_id);

CREATE INDEX IF NOT EXISTS idx_entities_parent_entity_id
    ON entities(parent_entity_id);

CREATE INDEX IF NOT EXISTS idx_entities_entity_type
    ON entities(entity_type);

CREATE INDEX IF NOT EXISTS idx_entities_status
    ON entities(status);

CREATE INDEX IF NOT EXISTS idx_entities_visibility
    ON entities(visibility);

CREATE INDEX IF NOT EXISTS idx_entities_created_by_user_id
    ON entities(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_entities_updated_by_user_id
    ON entities(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_entities_audit ON entities;
CREATE TRIGGER trg_entities_audit
BEFORE INSERT OR UPDATE ON entities
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();
