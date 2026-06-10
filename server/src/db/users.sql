CREATE TABLE IF NOT EXISTS users (
    user_id             UUID PRIMARY KEY,

    primary_email       TEXT NOT NULL,
    password_hash       TEXT NULL,

    locale              TEXT NULL,
    preferred_language  TEXT NULL,

    state               user_state_enum NOT NULL DEFAULT 'pending',
    activated_at        TIMESTAMPTZ NULL,

    phone_number        TEXT NULL,
    created_by_user_id  UUID NULL,
    updated_by_user_id  UUID NULL,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_users_entity
        FOREIGN KEY (user_id)
        REFERENCES entities(entity_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_users_primary_email
        UNIQUE (primary_email),

    CONSTRAINT uq_users_phone_number
        UNIQUE (phone_number),

    CONSTRAINT chk_users_email_not_blank
        CHECK (btrim(primary_email) <> ''),

    CONSTRAINT fk_users_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_users_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_users_state
    ON users(state);

CREATE INDEX IF NOT EXISTS idx_users_primary_email
    ON users(primary_email);

CREATE INDEX IF NOT EXISTS idx_users_phone_number
    ON users(phone_number);

CREATE INDEX IF NOT EXISTS idx_users_created_by_user_id
    ON users(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_users_updated_by_user_id
    ON users(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_users_audit ON users;
CREATE TRIGGER trg_users_audit
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();

DROP TRIGGER IF EXISTS trg_users_entity_type ON users;
CREATE TRIGGER trg_users_entity_type
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION fn_assert_entity_type('user');
