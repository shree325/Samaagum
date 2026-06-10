CREATE TABLE IF NOT EXISTS connections (
    connection_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    requester_user_id    UUID NOT NULL,
    addressee_user_id    UUID NOT NULL,

    state                connection_state_enum NOT NULL DEFAULT 'pending',
    accepted_at          TIMESTAMPTZ NULL,

    created_by_user_id   UUID NULL,
    updated_by_user_id   UUID NULL,
    modification_num     INTEGER NOT NULL DEFAULT 1,

    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_connections_requester
        FOREIGN KEY (requester_user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_connections_addressee
        FOREIGN KEY (addressee_user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_connections_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_connections_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT chk_connections_users_different
        CHECK (requester_user_id <> addressee_user_id),

    CONSTRAINT chk_connections_accepted_at
        CHECK (accepted_at IS NULL OR accepted_at >= created_at),

    CONSTRAINT uq_connections_pair
        UNIQUE (requester_user_id, addressee_user_id)
);

CREATE INDEX IF NOT EXISTS idx_connections_requester_user_id
    ON connections(requester_user_id);

CREATE INDEX IF NOT EXISTS idx_connections_addressee_user_id
    ON connections(addressee_user_id);

CREATE INDEX IF NOT EXISTS idx_connections_state
    ON connections(state);

CREATE INDEX IF NOT EXISTS idx_connections_created_by_user_id
    ON connections(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_connections_updated_by_user_id
    ON connections(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_connections_audit ON connections;
CREATE TRIGGER trg_connections_audit
BEFORE INSERT OR UPDATE ON connections
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();