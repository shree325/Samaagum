CREATE TABLE IF NOT EXISTS conversation_participants (
    participant_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    conversation_id      UUID NOT NULL,
    user_id              UUID NOT NULL,

    role                 conversation_participant_role_enum NOT NULL DEFAULT 'member',
    last_read_at         TIMESTAMPTZ NULL,

    created_by_user_id   UUID NULL,
    updated_by_user_id   UUID NULL,
    modification_num     INTEGER NOT NULL DEFAULT 1,

    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_conversation_participants_conversation
        FOREIGN KEY (conversation_id)
        REFERENCES conversations(conversation_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_conversation_participants_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_conversation_participants_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_conversation_participants_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT uq_conversation_participants
        UNIQUE (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id
    ON conversation_participants(conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id
    ON conversation_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_role
    ON conversation_participants(role);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_created_by_user_id
    ON conversation_participants(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_updated_by_user_id
    ON conversation_participants(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_conversation_participants_audit ON conversation_participants;
CREATE TRIGGER trg_conversation_participants_audit
BEFORE INSERT OR UPDATE ON conversation_participants
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();
