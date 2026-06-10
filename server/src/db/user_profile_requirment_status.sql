CREATE TABLE IF NOT EXISTS profile_requirement_status (
    status_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id             UUID NOT NULL,
    requirement_id      UUID NOT NULL,

    satisfied_at        TIMESTAMPTZ NULL,
    last_prompted_at     TIMESTAMPTZ NULL,
    status              profile_requirement_status_enum NOT NULL DEFAULT 'pending',

    created_by_user_id  UUID NULL,
    updated_by_user_id  UUID NULL,
    modification_num    INTEGER NOT NULL DEFAULT 1,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_profile_requirement_status_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_profile_requirement_status_requirement
        FOREIGN KEY (requirement_id)
        REFERENCES profile_requirements(requirement_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_profile_requirement_status
        UNIQUE (user_id, requirement_id),

    CONSTRAINT fk_profile_requirement_status_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_profile_requirement_status_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_profile_requirement_status_user_id
    ON profile_requirement_status(user_id);

CREATE INDEX IF NOT EXISTS idx_profile_requirement_status_requirement_id
    ON profile_requirement_status(requirement_id);

CREATE INDEX IF NOT EXISTS idx_profile_requirement_status_status
    ON profile_requirement_status(status);

CREATE INDEX IF NOT EXISTS idx_profile_requirement_status_created_by_user_id
    ON profile_requirement_status(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_profile_requirement_status_updated_by_user_id
    ON profile_requirement_status(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_profile_requirement_status_audit ON profile_requirement_status;
CREATE TRIGGER trg_profile_requirement_status_audit
BEFORE INSERT OR UPDATE ON profile_requirement_status
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();