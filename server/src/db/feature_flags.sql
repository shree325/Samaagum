CREATE TABLE IF NOT EXISTS feature_flags (
    flag_key            TEXT NOT NULL,
    scope_entity_id     UUID NOT NULL,

    value               JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_by_user_id  UUID NULL,
    updated_by_user_id  UUID NULL,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_feature_flags
        PRIMARY KEY (flag_key, scope_entity_id),

    CONSTRAINT chk_feature_flags_key_not_blank
        CHECK (btrim(flag_key) <> ''),

    CONSTRAINT fk_feature_flags_scope_entity
        FOREIGN KEY (scope_entity_id)
        REFERENCES entities(entity_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_feature_flags_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_feature_flags_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_scope_entity_id
    ON feature_flags(scope_entity_id);

CREATE INDEX IF NOT EXISTS idx_feature_flags_flag_key
    ON feature_flags(flag_key);

CREATE INDEX IF NOT EXISTS idx_feature_flags_created_by_user_id
    ON feature_flags(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_feature_flags_updated_by_user_id
    ON feature_flags(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_feature_flags_audit ON feature_flags;
CREATE TRIGGER trg_feature_flags_audit
BEFORE INSERT OR UPDATE ON feature_flags
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();
