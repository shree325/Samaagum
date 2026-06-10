CREATE TABLE IF NOT EXISTS roles (
    role_id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    key                     TEXT NOT NULL UNIQUE,
    name                    TEXT NOT NULL UNIQUE,
    level                   INTEGER NOT NULL DEFAULT 0,
    phase                   TEXT NULL,
    is_reserved             BOOLEAN NOT NULL DEFAULT FALSE,
    baseline_capabilities   JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_by_user_id      UUID NULL,
    updated_by_user_id      UUID NULL,
    modification_num        INTEGER NOT NULL DEFAULT 1,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_roles_key_not_blank
        CHECK (btrim(key) <> ''),

    CONSTRAINT chk_roles_name_not_blank
        CHECK (btrim(name) <> ''),

    CONSTRAINT chk_roles_level
        CHECK (level >= 0),

    CONSTRAINT fk_roles_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_roles_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

DROP TRIGGER IF EXISTS trg_roles_before_write ON roles;
CREATE TRIGGER trg_roles_before_write
BEFORE INSERT ON roles
FOR EACH ROW
EXECUTE FUNCTION fn_roles_before_write();

DROP TRIGGER IF EXISTS trg_roles_audit ON roles;
CREATE TRIGGER trg_roles_audit
BEFORE INSERT OR UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();
