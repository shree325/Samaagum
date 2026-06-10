CREATE TABLE IF NOT EXISTS profile_requirements (
    requirement_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    attribute_key       TEXT NOT NULL UNIQUE,
    audience            profile_requirement_audience_enum NOT NULL DEFAULT 'all',
    level               INTEGER NOT NULL DEFAULT 0,
    revalidate_after    INTERVAL NULL,
    validation_rule     JSONB NOT NULL DEFAULT '{}'::jsonb,
    active              BOOLEAN NOT NULL DEFAULT TRUE,
    description         TEXT NULL,

    created_by_user_id  UUID NULL,
    updated_by_user_id  UUID NULL,
    modification_num    INTEGER NOT NULL DEFAULT 1,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_profile_requirements_attribute_key_not_blank
        CHECK (btrim(attribute_key) <> ''),

    CONSTRAINT chk_profile_requirements_level
        CHECK (level >= 0),

    CONSTRAINT fk_profile_requirements_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_profile_requirements_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_profile_requirements_audience
    ON profile_requirements(audience);

CREATE INDEX IF NOT EXISTS idx_profile_requirements_level
    ON profile_requirements(level);

CREATE INDEX IF NOT EXISTS idx_profile_requirements_active
    ON profile_requirements(active);

CREATE INDEX IF NOT EXISTS idx_profile_requirements_created_by_user_id
    ON profile_requirements(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_profile_requirements_updated_by_user_id
    ON profile_requirements(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_profile_requirements_audit ON profile_requirements;
CREATE TRIGGER trg_profile_requirements_audit
BEFORE INSERT OR UPDATE ON profile_requirements
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();
