CREATE TABLE IF NOT EXISTS group_memberships (
    membership_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    group_id              UUID NOT NULL,
    user_id               UUID NOT NULL,

    state                 membership_state_enum NOT NULL DEFAULT 'pending',
    joined_at             TIMESTAMPTZ NULL,
    form_response_id      UUID NULL,
    invited_by_user_id    UUID NULL,
    accepted_by_user_id   UUID NULL,
    responded_at          TIMESTAMPTZ NULL,
    membership_end_at     TIMESTAMPTZ NULL,

    created_by_user_id    UUID NULL,
    updated_by_user_id    UUID NULL,
    modification_num      INTEGER NOT NULL DEFAULT 1,

    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_group_memberships_group
        FOREIGN KEY (group_id)
        REFERENCES groups(entity_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_group_memberships_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_group_memberships_invited_by
        FOREIGN KEY (invited_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_group_memberships_accepted_by
        FOREIGN KEY (accepted_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_group_memberships_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_group_memberships_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT uq_group_memberships
        UNIQUE (group_id, user_id),

    CONSTRAINT chk_group_memberships_membership_end_at
        CHECK (membership_end_at IS NULL OR joined_at IS NULL OR membership_end_at >= joined_at)
);

CREATE INDEX IF NOT EXISTS idx_group_memberships_group_id
    ON group_memberships(group_id);

CREATE INDEX IF NOT EXISTS idx_group_memberships_user_id
    ON group_memberships(user_id);

CREATE INDEX IF NOT EXISTS idx_group_memberships_state
    ON group_memberships(state);

CREATE INDEX IF NOT EXISTS idx_group_memberships_invited_by_user_id
    ON group_memberships(invited_by_user_id);

CREATE INDEX IF NOT EXISTS idx_group_memberships_accepted_by_user_id
    ON group_memberships(accepted_by_user_id);

CREATE INDEX IF NOT EXISTS idx_group_memberships_created_by_user_id
    ON group_memberships(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_group_memberships_updated_by_user_id
    ON group_memberships(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_group_memberships_audit ON group_memberships;
CREATE TRIGGER trg_group_memberships_audit
BEFORE INSERT OR UPDATE ON group_memberships
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();
