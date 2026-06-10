CREATE TABLE IF NOT EXISTS tenants (
    tenant_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    slug                TEXT NOT NULL UNIQUE,
    name                VARCHAR(150) NOT NULL,
    status              entity_status_enum NOT NULL DEFAULT 'active',

    created_by_user_id  UUID NULL,
    updated_by_user_id  UUID NULL,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_tenants_slug_not_blank
        CHECK (btrim(slug) <> ''),

    CONSTRAINT chk_tenants_name_not_blank
        CHECK (btrim(name) <> ''),

    CONSTRAINT fk_tenants_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_tenants_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tenants_status
    ON tenants(status);

CREATE INDEX IF NOT EXISTS idx_tenants_created_by_user_id
    ON tenants(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_tenants_updated_by_user_id
    ON tenants(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_tenants_audit ON tenants;
CREATE TRIGGER trg_tenants_audit
BEFORE INSERT OR UPDATE ON tenants
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();
