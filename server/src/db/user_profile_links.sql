CREATE TABLE IF NOT EXISTS profile_links (
    link_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    profile_id          UUID NOT NULL,
    kind                profile_link_kind_enum NOT NULL,
    label               TEXT NOT NULL,
    value               TEXT NOT NULL,
    position            INTEGER NOT NULL DEFAULT 0,
    visibility          profile_link_visibility_enum NOT NULL DEFAULT 'public',

    created_by_user_id  UUID NULL,
    updated_by_user_id  UUID NULL,
    modification_num    INTEGER NOT NULL DEFAULT 1,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_profile_links_profile
        FOREIGN KEY (profile_id)
        REFERENCES profiles(user_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_profile_links_label_not_blank
        CHECK (btrim(label) <> ''),

    CONSTRAINT chk_profile_links_value_not_blank
        CHECK (btrim(value) <> ''),

    CONSTRAINT fk_profile_links_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_profile_links_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_profile_links_profile_id
    ON profile_links(profile_id);

CREATE INDEX IF NOT EXISTS idx_profile_links_kind
    ON profile_links(kind);

CREATE INDEX IF NOT EXISTS idx_profile_links_visibility
    ON profile_links(visibility);

CREATE INDEX IF NOT EXISTS idx_profile_links_position
    ON profile_links(position);

CREATE INDEX IF NOT EXISTS idx_profile_links_created_by_user_id
    ON profile_links(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_profile_links_updated_by_user_id
    ON profile_links(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_profile_links_audit ON profile_links;
CREATE TRIGGER trg_profile_links_audit
BEFORE INSERT OR UPDATE ON profile_links
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();
