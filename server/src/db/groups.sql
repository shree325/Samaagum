CREATE TABLE IF NOT EXISTS groups (
    entity_id           UUID PRIMARY KEY,

    name                VARCHAR(150) NOT NULL,
    slug                TEXT NOT NULL UNIQUE,
    description         TEXT NULL,

    scope               TEXT NOT NULL DEFAULT 'private',
    cover_asset_id      UUID NULL,

    join_mode           join_mode_enum NOT NULL DEFAULT 'approval_required',
    join_form_id        UUID NULL,
    listed              BOOLEAN NOT NULL DEFAULT TRUE,
    subtype             group_subtype_enum NOT NULL DEFAULT 'community',

    created_by_user_id  UUID NULL,
    updated_by_user_id  UUID NULL,
    modification_num    INTEGER NOT NULL DEFAULT 1,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_groups_entity
        FOREIGN KEY (entity_id)
        REFERENCES entities(entity_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_groups_cover_asset
        FOREIGN KEY (cover_asset_id)
        REFERENCES media_assets(asset_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_groups_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_groups_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT chk_groups_name_not_blank
        CHECK (btrim(name) <> ''),

    CONSTRAINT chk_groups_slug_not_blank
        CHECK (btrim(slug) <> '')
);

CREATE INDEX IF NOT EXISTS idx_groups_slug
    ON groups(slug);

CREATE INDEX IF NOT EXISTS idx_groups_scope
    ON groups(scope);

CREATE INDEX IF NOT EXISTS idx_groups_cover_asset_id
    ON groups(cover_asset_id);

CREATE INDEX IF NOT EXISTS idx_groups_created_by_user_id
    ON groups(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_groups_updated_by_user_id
    ON groups(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_groups_audit ON groups;
CREATE TRIGGER trg_groups_audit
BEFORE INSERT OR UPDATE ON groups
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();

DROP TRIGGER IF EXISTS trg_groups_entity_type ON groups;
CREATE TRIGGER trg_groups_entity_type
BEFORE INSERT OR UPDATE ON groups
FOR EACH ROW
EXECUTE FUNCTION fn_assert_entity_type('group');

