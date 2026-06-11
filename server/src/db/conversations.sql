CREATE TABLE IF NOT EXISTS conversations (
    conversation_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    created_by_user_id   UUID NULL,
    event_id             UUID NULL,

    type                 conversation_type_enum NOT NULL DEFAULT 'direct',
    status               conversation_status_enum NOT NULL DEFAULT 'active',

    updated_by_user_id   UUID NULL,
    modification_num     INTEGER NOT NULL DEFAULT 1,

    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_conversations_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_conversations_event
        FOREIGN KEY (event_id)
        REFERENCES events(event_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_conversations_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_conversations_created_by_user_id
    ON conversations(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_conversations_event_id
    ON conversations(event_id);

CREATE INDEX IF NOT EXISTS idx_conversations_type
    ON conversations(type);

CREATE INDEX IF NOT EXISTS idx_conversations_status
    ON conversations(status);

DROP TRIGGER IF EXISTS trg_conversations_audit ON conversations;
CREATE TRIGGER trg_conversations_audit
BEFORE INSERT OR UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();
