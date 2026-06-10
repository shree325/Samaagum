CREATE TABLE IF NOT EXISTS gallery_media (
    media_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id            UUID NOT NULL,
    gallery_id           UUID NOT NULL,
    asset_id             UUID NOT NULL,
    visibility           visibility_enum NOT NULL DEFAULT 'private',

    created_by_user_id   UUID NULL,
    updated_by_user_id   UUID NULL,
    modification_num     INTEGER NOT NULL DEFAULT 1,

    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_gallery_media_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(tenant_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_gallery_media_gallery
        FOREIGN KEY (gallery_id)
        REFERENCES galleries(gallery_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_gallery_media_asset
        FOREIGN KEY (asset_id)
        REFERENCES media_assets(asset_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_gallery_media_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_gallery_media_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT uq_gallery_media_gallery_asset
        UNIQUE (gallery_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_gallery_media_tenant_id
    ON gallery_media(tenant_id);

CREATE INDEX IF NOT EXISTS idx_gallery_media_gallery_id
    ON gallery_media(gallery_id);

CREATE INDEX IF NOT EXISTS idx_gallery_media_asset_id
    ON gallery_media(asset_id);

CREATE INDEX IF NOT EXISTS idx_gallery_media_visibility
    ON gallery_media(visibility);

CREATE INDEX IF NOT EXISTS idx_gallery_media_created_by_user_id
    ON gallery_media(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_gallery_media_updated_by_user_id
    ON gallery_media(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_gallery_media_audit ON gallery_media;
CREATE TRIGGER trg_gallery_media_audit
BEFORE INSERT OR UPDATE ON gallery_media
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();
