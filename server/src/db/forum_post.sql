CREATE TABLE IF NOT EXISTS forum_posts (
    post_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    author_user_id       UUID NOT NULL,
    scope_type           forum_scope_type_enum NOT NULL,
    scope_id             UUID NULL,

    title                TEXT NOT NULL,
    body                 TEXT NOT NULL,
    pinned               BOOLEAN NOT NULL DEFAULT FALSE,
    status               forum_post_status_enum NOT NULL DEFAULT 'draft',

    created_by_user_id   UUID NULL,
    updated_by_user_id   UUID NULL,
    modification_num     INTEGER NOT NULL DEFAULT 1,

    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_forum_posts_author
        FOREIGN KEY (author_user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_forum_posts_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_forum_posts_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT chk_forum_posts_title_not_blank
        CHECK (btrim(title) <> ''),

    CONSTRAINT chk_forum_posts_body_not_blank
        CHECK (btrim(body) <> '')
);

CREATE INDEX IF NOT EXISTS idx_forum_posts_author_user_id
    ON forum_posts(author_user_id);

CREATE INDEX IF NOT EXISTS idx_forum_posts_scope
    ON forum_posts(scope_type, scope_id);

CREATE INDEX IF NOT EXISTS idx_forum_posts_status
    ON forum_posts(status);

CREATE INDEX IF NOT EXISTS idx_forum_posts_pinned
    ON forum_posts(pinned);

CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at
    ON forum_posts(created_at);

CREATE INDEX IF NOT EXISTS idx_forum_posts_created_by_user_id
    ON forum_posts(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_forum_posts_updated_by_user_id
    ON forum_posts(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_forum_posts_audit ON forum_posts;
CREATE TRIGGER trg_forum_posts_audit
BEFORE INSERT OR UPDATE ON forum_posts
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();

DROP TRIGGER IF EXISTS trg_forum_posts_scope ON forum_posts;
CREATE TRIGGER trg_forum_posts_scope
BEFORE INSERT OR UPDATE ON forum_posts
FOR EACH ROW
EXECUTE FUNCTION fn_validate_forum_scope();
