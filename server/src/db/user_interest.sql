CREATE TABLE IF NOT EXISTS user_interests (
    user_id             UUID NOT NULL,
    category_id         UUID NOT NULL,

    priority            INTEGER NOT NULL DEFAULT 0,

    created_by_user_id  UUID NULL,
    updated_by_user_id  UUID NULL,
    modification_num    INTEGER NOT NULL DEFAULT 1,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_user_interests
        PRIMARY KEY (user_id, category_id),

    CONSTRAINT fk_user_interests_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_user_interests_category
        FOREIGN KEY (category_id)
        REFERENCES categories(category_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_user_interests_priority
        CHECK (priority >= 0),

    CONSTRAINT fk_user_interests_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_user_interests_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_user_interests_category_id
    ON user_interests(category_id);

CREATE INDEX IF NOT EXISTS idx_user_interests_priority
    ON user_interests(priority);

CREATE INDEX IF NOT EXISTS idx_user_interests_created_by_user_id
    ON user_interests(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_user_interests_updated_by_user_id
    ON user_interests(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_user_interests_audit ON user_interests;
CREATE TRIGGER trg_user_interests_audit
BEFORE INSERT OR UPDATE ON user_interests
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();
