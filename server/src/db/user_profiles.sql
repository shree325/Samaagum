CREATE TABLE IF NOT EXISTS profiles (
    user_id             UUID PRIMARY KEY,
    
    tenant_id           UUID NOT NULL,
    display_name        VARCHAR(150) NOT NULL,
    bio                 TEXT NULL,
    preferred_location  TEXT NULL,
    photo_asset_id      UUID NULL,
    cover_asset_id      UUID NULL,
    template_key        TEXT NULL DEFAULT 'default',
    website             TEXT NULL,

    created_by_user_id  UUID NULL,
    updated_by_user_id  UUID NULL,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_profiles_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_profiles_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(tenant_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_profiles_photo_asset
        FOREIGN KEY (photo_asset_id)
        REFERENCES media_assets(asset_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_profiles_cover_asset
        FOREIGN KEY (cover_asset_id)
        REFERENCES media_assets(asset_id)
        ON DELETE SET NULL,

    CONSTRAINT chk_profiles_display_name_not_blank
        CHECK (btrim(display_name) <> ''),

    CONSTRAINT fk_profiles_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_profiles_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id
    ON profiles(tenant_id);

CREATE INDEX IF NOT EXISTS idx_profiles_display_name
    ON profiles(display_name);

CREATE INDEX IF NOT EXISTS idx_profiles_photo_asset_id
    ON profiles(photo_asset_id);

CREATE INDEX IF NOT EXISTS idx_profiles_cover_asset_id
    ON profiles(cover_asset_id);

CREATE INDEX IF NOT EXISTS idx_profiles_created_by_user_id
    ON profiles(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_updated_by_user_id
    ON profiles(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_profiles_audit ON profiles;
CREATE TRIGGER trg_profiles_audit
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();
