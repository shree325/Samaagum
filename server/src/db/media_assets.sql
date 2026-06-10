CREATE TABLE IF NOT EXISTS media_assets (
    asset_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id           UUID NOT NULL,
    owner_entity_id     UUID NOT NULL,
    storage_key         TEXT NOT NULL UNIQUE,
    mime                TEXT NOT NULL,
    visibility          visibility_enum NOT NULL DEFAULT 'private',

    file_name           TEXT NULL,
    size_bytes          BIGINT NULL,
    file_data           BYTEA NULL,
    metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_by_user_id  UUID NULL,
    updated_by_user_id  UUID NULL,
    modification_num    INTEGER NOT NULL DEFAULT 1,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_media_assets_storage_key_not_blank
        CHECK (btrim(storage_key) <> ''),

    CONSTRAINT chk_media_assets_mime_not_blank
        CHECK (btrim(mime) <> ''),

    CONSTRAINT chk_media_assets_size_bytes
        CHECK (size_bytes IS NULL OR size_bytes >= 0),

    CONSTRAINT fk_media_assets_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(tenant_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_media_assets_owner_entity
        FOREIGN KEY (owner_entity_id)
        REFERENCES entities(entity_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_media_assets_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_media_assets_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_media_assets_tenant_id
    ON media_assets(tenant_id);

CREATE INDEX IF NOT EXISTS idx_media_assets_owner_entity_id
    ON media_assets(owner_entity_id);

CREATE INDEX IF NOT EXISTS idx_media_assets_visibility
    ON media_assets(visibility);

CREATE INDEX IF NOT EXISTS idx_media_assets_created_by_user_id
    ON media_assets(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_media_assets_updated_by_user_id
    ON media_assets(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_media_assets_audit ON media_assets;
CREATE TRIGGER trg_media_assets_audit
BEFORE INSERT OR UPDATE ON media_assets
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();
