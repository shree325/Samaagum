CREATE TABLE IF NOT EXISTS forum_comments (
    comment_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    post_id              UUID NOT NULL,
    author_user_id       UUID NOT NULL,

    body                 TEXT NOT NULL,
    status               forum_comment_status_enum NOT NULL DEFAULT 'visible',

    created_by_user_id   UUID NULL,
    updated_by_user_id   UUID NULL,
    modification_num     INTEGER NOT NULL DEFAULT 1,

    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_forum_comments_post
        FOREIGN KEY (post_id)
        REFERENCES forum_posts(post_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_forum_comments_author
        FOREIGN KEY (author_user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_forum_comments_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_forum_comments_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT chk_forum_comments_body_not_blank
        CHECK (btrim(body) <> '')
);

CREATE INDEX IF NOT EXISTS idx_forum_comments_post_id
    ON forum_comments(post_id);

CREATE INDEX IF NOT EXISTS idx_forum_comments_author_user_id
    ON forum_comments(author_user_id);

CREATE INDEX IF NOT EXISTS idx_forum_comments_status
    ON forum_comments(status);

CREATE INDEX IF NOT EXISTS idx_forum_comments_created_at
    ON forum_comments(created_at);

CREATE INDEX IF NOT EXISTS idx_forum_comments_created_by_user_id
    ON forum_comments(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_forum_comments_updated_by_user_id
    ON forum_comments(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_forum_comments_audit ON forum_comments;
CREATE TRIGGER trg_forum_comments_audit
BEFORE INSERT OR UPDATE ON forum_comments
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();
