CREATE TABLE IF NOT EXISTS galleries (
    gallery_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id           UUID NOT NULL,
    owner_entity_id     UUID NOT NULL,

    name                VARCHAR(150) NOT NULL,
    description         JSONB NULL,

    visibility          visibility_enum NOT NULL DEFAULT 'private',

    created_by_user_id  UUID NULL,
    updated_by_user_id  UUID NULL,
    modification_num    INTEGER NOT NULL DEFAULT 1,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_galleries_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(tenant_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_galleries_owner_entity
        FOREIGN KEY (owner_entity_id)
        REFERENCES entities(entity_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_galleries_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_galleries_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT chk_galleries_name_not_blank
        CHECK (btrim(name) <> '')
);

CREATE INDEX IF NOT EXISTS idx_galleries_tenant_id
    ON galleries(tenant_id);

CREATE INDEX IF NOT EXISTS idx_galleries_owner_entity_id
    ON galleries(owner_entity_id);

CREATE INDEX IF NOT EXISTS idx_galleries_visibility
    ON galleries(visibility);

DROP TRIGGER IF EXISTS trg_galleries_audit ON galleries;
CREATE TRIGGER trg_galleries_audit
BEFORE INSERT OR UPDATE ON galleries
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();
