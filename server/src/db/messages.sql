CREATE TABLE IF NOT EXISTS messages (
    message_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    conversation_id      UUID NOT NULL,
    sender_user_id       UUID NOT NULL,

    body                 TEXT NOT NULL,
    deleted_at           TIMESTAMPTZ NULL,

    created_by_user_id   UUID NULL,
    updated_by_user_id   UUID NULL,
    modification_num     INTEGER NOT NULL DEFAULT 1,

    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_messages_conversation
        FOREIGN KEY (conversation_id)
        REFERENCES conversations(conversation_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_messages_sender
        FOREIGN KEY (sender_user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_messages_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_messages_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT chk_messages_body_not_blank
        CHECK (btrim(body) <> ''),

    CONSTRAINT chk_messages_deleted_at
        CHECK (deleted_at IS NULL OR deleted_at >= created_at)
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
    ON messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender_user_id
    ON messages(sender_user_id);

CREATE INDEX IF NOT EXISTS idx_messages_created_at
    ON messages(created_at);

CREATE INDEX IF NOT EXISTS idx_messages_deleted_at
    ON messages(deleted_at);

CREATE INDEX IF NOT EXISTS idx_messages_created_by_user_id
    ON messages(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_messages_updated_by_user_id
    ON messages(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_messages_audit ON messages;
CREATE TRIGGER trg_messages_audit
BEFORE INSERT OR UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();
