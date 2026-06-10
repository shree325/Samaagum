CREATE TABLE IF NOT EXISTS role_assignments (
    assignment_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id               UUID NOT NULL,
    role_id               UUID NOT NULL,
    scope_entity_id       UUID NOT NULL,
    granted_by_user_id    UUID NULL,

    expires_at            TIMESTAMPTZ NULL,

    created_by_user_id    UUID NULL,
    updated_by_user_id    UUID NULL,
    modification_num      INTEGER NOT NULL DEFAULT 1,

    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_role_assignments_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_role_assignments_role
        FOREIGN KEY (role_id)
        REFERENCES roles(role_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_role_assignments_scope_entity
        FOREIGN KEY (scope_entity_id)
        REFERENCES entities(entity_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_role_assignments_granted_by
        FOREIGN KEY (granted_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_role_assignments_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_role_assignments_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT uq_role_assignments
        UNIQUE (user_id, role_id, scope_entity_id),

    CONSTRAINT chk_role_assignments_expires_at
        CHECK (expires_at IS NULL OR expires_at >= created_at)
);

CREATE INDEX IF NOT EXISTS idx_role_assignments_user_id
    ON role_assignments(user_id);

CREATE INDEX IF NOT EXISTS idx_role_assignments_role_id
    ON role_assignments(role_id);

CREATE INDEX IF NOT EXISTS idx_role_assignments_scope_entity_id
    ON role_assignments(scope_entity_id);

CREATE INDEX IF NOT EXISTS idx_role_assignments_granted_by_user_id
    ON role_assignments(granted_by_user_id);

CREATE INDEX IF NOT EXISTS idx_role_assignments_created_by_user_id
    ON role_assignments(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_role_assignments_updated_by_user_id
    ON role_assignments(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_role_assignments_audit ON role_assignments;
CREATE TRIGGER trg_role_assignments_audit
BEFORE INSERT OR UPDATE ON role_assignments
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();
