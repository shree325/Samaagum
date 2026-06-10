CREATE TABLE IF NOT EXISTS categories (
    category_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    parent_id           UUID NULL,
    slug                TEXT NOT NULL UNIQUE,
    name                VARCHAR(150) NOT NULL,
    status              category_status_enum NOT NULL DEFAULT 'active',

    created_by_user_id  UUID NULL,
    updated_by_user_id  UUID NULL,
    modification_num    INTEGER NOT NULL DEFAULT 1,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_categories_slug_not_blank
        CHECK (btrim(slug) <> ''),

    CONSTRAINT chk_categories_name_not_blank
        CHECK (btrim(name) <> ''),

    CONSTRAINT fk_categories_parent
        FOREIGN KEY (parent_id)
        REFERENCES categories(category_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_categories_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_categories_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_categories_parent_id
    ON categories(parent_id);

CREATE INDEX IF NOT EXISTS idx_categories_status
    ON categories(status);

CREATE INDEX IF NOT EXISTS idx_categories_created_by_user_id
    ON categories(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_categories_updated_by_user_id
    ON categories(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_categories_audit ON categories;
CREATE TRIGGER trg_categories_audit
BEFORE INSERT OR UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();
